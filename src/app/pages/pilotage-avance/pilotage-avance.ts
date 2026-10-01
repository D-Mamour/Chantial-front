import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, finalize, forkJoin, of } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjetService } from '../../services/projet.service';
import { Avenant, IndicateursFinanciers, PreuveTerrain, Projet, SituationTravaux } from '../../models/api.models';

type OngletPilotage = 'avenants'|'situations'|'terrain'|'rapports';
type ActionConfirmation = 'approuver-avenant'|'rejeter-avenant'|'valider-situation'|'rejeter-situation'|'email'|'whatsapp';

/**
 * Espace de pilotage avancé de Chantial.
 * Les actions sensibles sont confirmées explicitement et toutes les saisies
 * numériques sont contrôlées avant leur envoi à l'API.
 */
@Component({selector:'app-pilotage-avance',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./pilotage-avance.html'})
export class PilotageAvanceComponent implements OnInit {
  readonly ps=inject(ProjetService); private readonly auth=inject(AuthService); private readonly cdr=inject(ChangeDetectorRef);
  readonly tabs:{id:OngletPilotage;label:string}[]=[{id:'avenants',label:'Avenants'},{id:'situations',label:'Situations de travaux'},{id:'terrain',label:'Journal terrain'},{id:'rapports',label:'Rapports'}];
  projets:Projet[]=[]; avenants:Avenant[]=[]; preuves:PreuveTerrain[]=[]; situations:SituationTravaux[]=[]; projetId=''; onglet:OngletPilotage='avenants';
  titre=''; motif=''; montant=0; impact=0; situationEtape=''; situationPct=0; situationMontant=0; situationCommentaire=''; document:File|null=null; photo:File|null=null; commentaire=''; latitude:number|null=null; longitude:number|null=null;
  chargement=signal(false); message=signal(''); erreur=signal('');
  /** Synthèse financière du projet sélectionné, affichée avant les opérations détaillées. */
  indicateurs=signal<IndicateursFinanciers|null>(null); chargementIndicateurs=signal(false);
  actionConfirmation:ActionConfirmation|null=null; cibleConfirmation:any=null; motifObligatoire=false; motifRejet='';
  // Les formulaires sont ouverts à la demande et se referment après un enregistrement réussi.
  formulaireAvenant=false; formulaireSituation=false; formulaireTerrain=false;
  get role(){return this.auth.utilisateur()?.role;} get entrepreneur(){return this.role==='ENTREPRENEUR';} get bailleur(){return this.role==='BAILLEUR';}

  ngOnInit(){
    this.chargerDonnees();
  }

  /**
   * Charge chaque ressource indépendamment : une API secondaire indisponible
   * ne doit jamais empêcher les projets et les autres données de s'afficher.
   */
  chargerDonnees(){
    this.chargement.set(true);
    this.erreur.set('');
    forkJoin({
      p:this.ps.projets().pipe(catchError(()=>of([] as Projet[]))),
      a:this.ps.avenants().pipe(catchError(()=>of([] as Avenant[]))),
      j:this.ps.journalChantier().pipe(catchError(()=>of([] as PreuveTerrain[]))),
      s:this.ps.situationsTravaux().pipe(catchError(()=>of([] as SituationTravaux[]))),
      e:this.ps.etapes().pipe(catchError(()=>of([])))
    }).pipe(finalize(()=>this.chargement.set(false))).subscribe(({p,a,j,s})=>{
      this.projets=p;
      this.avenants=a;
      this.preuves=j;
      this.situations=s;
      if(!this.projetId && p.length) this.projetId=p[0].id;
      if(this.projetId) this.chargerIndicateurs();
      if(!p.length) this.erreur.set('Aucun projet accessible pour ce compte.');
      // Force le rendu dès la fin des requêtes : aucun clic utilisateur n'est nécessaire.
      this.cdr.detectChanges();
    });
  }
  changerProjet(){this.situationEtape='';this.message.set('');this.erreur.set('');this.indicateurs.set(null);if(this.projetId)this.chargerIndicateurs();}
  chargerIndicateurs(){if(!this.projetId)return;this.chargementIndicateurs.set(true);this.ps.indicateursFinanciers(this.projetId).pipe(finalize(()=>this.chargementIndicateurs.set(false))).subscribe({next:v=>{this.indicateurs.set(v);this.cdr.detectChanges();},error:()=>{this.erreur.set('Les indicateurs financiers ne sont pas disponibles pour ce projet.');this.cdr.detectChanges();}});}
  projetSelectionne(){return this.projets.find(p=>String(p.id)===String(this.projetId));}
  nombre(v:unknown){const n=Number(v||0);return Number.isFinite(n)?n:0;}
  fcfa(v:unknown){return `${this.nombre(v).toLocaleString('fr-FR')} FCFA`;}
  niveauEcart(){const i=this.indicateurs();if(!i)return 'normal';const e=this.nombre(i.ecart_points);return this.estCritique()?'critique':e>=10?'attention':'normal';}
  estCritique(){const v=this.indicateurs()?.alerte_critique;return v===true||String(v).toLowerCase()==='true';}
  /** Normalise une relation DRF qui peut être un UUID ou un objet imbriqué. */
  private idRelation(v: unknown): string {
    if (v && typeof v === 'object' && 'id' in (v as Record<string, unknown>)) return String((v as Record<string, unknown>)['id'] ?? '');
    return String(v ?? '');
  }
  avenantsProjet(){return this.avenants.filter(a=>this.idRelation(a.projet)===String(this.projetId));}
  preuvesProjet(){return this.preuves.filter(p=>this.idRelation(p.projet)===String(this.projetId));}
  situationsProjet(){return this.situations.filter(x=>this.idRelation(x.projet)===String(this.projetId));}
  etapesProjet(){return this.ps.etapesSignal().filter(e=>this.idRelation(e.projet)===String(this.projetId));}

  /** Construit une URL exploitable pour un média renvoyé par Django. */
  urlMedia(url:string|null|undefined){
    if(!url) return '';
    if(/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
    const apiBase = location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:8000' : location.origin;
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  libelleStatut(s:string){return ({BROUILLON:'Brouillon',SOUMIS:'Soumis',SOUMISE:'Soumise',APPROUVE:'Approuvé',APPROUVEE:'Approuvée',REJETE:'Rejeté',REJETEE:'Rejetée',VALIDEE:'Validée'} as Record<string,string>)[s]||s;}

  creerSituation(){this.nettoyerMessages();if(!this.projetId||!this.situationEtape)return this.erreur.set('Sélectionnez un projet et une étape.');if(!Number.isFinite(+this.situationPct)||this.situationPct<0||this.situationPct>100)return this.erreur.set('L’avancement doit être compris entre 0 et 100 %.');if(!Number.isFinite(+this.situationMontant)||this.situationMontant<0)return this.erreur.set('Le montant ne peut pas être négatif.');this.chargement.set(true);this.ps.creerSituation({projet:this.projetId,etape:this.situationEtape,pourcentage:+this.situationPct,montant_situation:+this.situationMontant,commentaire:this.situationCommentaire.trim()}).pipe(finalize(()=>this.chargement.set(false))).subscribe({next:v=>{this.situations=[v,...this.situations];this.situationPct=0;this.situationMontant=0;this.situationCommentaire='';this.formulaireSituation=false;this.message.set('Situation de travaux soumise et horodatée.');this.chargerIndicateurs();this.cdr.detectChanges();},error:()=>{this.erreur.set('Impossible de soumettre la situation de travaux.');this.cdr.detectChanges();}});}
  fichierAvenant(e:Event){this.document=this.fichierValide(e,['application/pdf','image/png','image/jpeg']);}
  fichierTerrain(e:Event){this.photo=this.fichierValide(e,['image/png','image/jpeg','image/webp']);}
  private fichierValide(e:Event,types:string[]){const input=e.target as HTMLInputElement;const f=input.files?.[0]||null;if(!f)return null;if(f.size>10*1024*1024){this.erreur.set('Le fichier dépasse la taille maximale de 10 Mo.');input.value='';return null;}if(f.type&&!types.includes(f.type)){this.erreur.set('Format de fichier non autorisé.');input.value='';return null;}this.erreur.set('');return f;}
  creerAvenant(){this.nettoyerMessages();if(!this.projetId||!this.titre.trim()||!this.motif.trim())return this.erreur.set('Le projet, le titre et le motif sont obligatoires.');if(!Number.isFinite(+this.montant)||this.montant<0||!Number.isFinite(+this.impact)||this.impact<0)return this.erreur.set('Le montant et l’impact délai doivent être positifs ou nuls.');const f=new FormData();f.append('projet',this.projetId);f.append('titre',this.titre.trim());f.append('motif',this.motif.trim());f.append('montant',String(+this.montant));f.append('impact_delai_jours',String(+this.impact));if(this.document)f.append('document',this.document);this.chargement.set(true);this.ps.creerAvenant(f).pipe(finalize(()=>this.chargement.set(false))).subscribe({next:v=>{this.avenants=[v,...this.avenants];this.titre='';this.motif='';this.montant=0;this.impact=0;this.document=null;this.formulaireAvenant=false;this.message.set('Avenant enregistré. Vous pouvez maintenant le soumettre au bailleur.');this.cdr.detectChanges();},error:()=>{this.erreur.set('Impossible d’enregistrer l’avenant.');this.cdr.detectChanges();}});}
  soumettre(a:Avenant){this.chargement.set(true);this.ps.soumettreAvenant(a.id).pipe(finalize(()=>this.chargement.set(false))).subscribe({next:v=>{this.remplacer(v);this.message.set('Avenant transmis au bailleur.');},error:()=>this.erreur.set('Impossible de soumettre l’avenant.')});}
  remplacer(v:Avenant){this.avenants=this.avenants.map(a=>a.id===v.id?v:a);}
  utiliserPosition(){this.nettoyerMessages();if(!navigator.geolocation)return this.erreur.set('La géolocalisation n’est pas disponible sur cet appareil.');navigator.geolocation.getCurrentPosition(p=>{this.latitude=p.coords.latitude;this.longitude=p.coords.longitude;this.message.set('Position ajoutée à la preuve terrain.');},()=>this.erreur.set('Localisation refusée ou indisponible. Vous pouvez publier sans position.'),{enableHighAccuracy:true,timeout:10000});}
  ajouterPreuve(){this.nettoyerMessages();if(!this.photo||!this.projetId)return this.erreur.set('Sélectionnez un projet et une photo.');const f=new FormData();f.append('projet',this.projetId);f.append('fichier',this.photo);f.append('commentaire',this.commentaire.trim());if(this.latitude!==null)f.append('latitude',String(this.latitude));if(this.longitude!==null)f.append('longitude',String(this.longitude));f.append('date_capture',new Date().toISOString());this.chargement.set(true);this.ps.ajouterPreuveTerrain(f).pipe(finalize(()=>this.chargement.set(false))).subscribe({next:v=>{this.preuves=[v,...this.preuves];this.photo=null;this.commentaire='';this.latitude=null;this.longitude=null;this.formulaireTerrain=false;this.message.set('Preuve terrain horodatée et enregistrée.');this.cdr.detectChanges();},error:()=>{this.erreur.set('Impossible d’enregistrer la preuve terrain.');this.cdr.detectChanges();}});}
  telecharger(){this.nettoyerMessages();if(!this.projetId)return;this.chargement.set(true);this.ps.rapportPdf(this.projetId).pipe(finalize(()=>this.chargement.set(false))).subscribe({next:b=>{const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`rapport-chantial-${new Date().toISOString().slice(0,7)}.pdf`;a.click();URL.revokeObjectURL(u);this.message.set('Rapport PDF généré.');},error:()=>this.erreur.set('La génération du rapport a échoué.')});}
  diffuser(email=true,whatsapp=false){this.nettoyerMessages();if(!this.projetId)return;this.chargement.set(true);this.ps.diffuserRapport(this.projetId,{periode:new Date().toISOString().slice(0,7),email,whatsapp}).pipe(finalize(()=>this.chargement.set(false))).subscribe({next:()=>this.message.set(whatsapp?'Rapport envoyé par e-mail et diffusion WhatsApp demandée.':'Rapport envoyé par e-mail.'),error:()=>this.erreur.set('La diffusion a échoué. Vérifiez la configuration serveur.')});}

  demanderConfirmation(action:ActionConfirmation,cible:any,motif=false){this.actionConfirmation=action;this.cibleConfirmation=cible;this.motifObligatoire=motif;this.motifRejet='';}
  annulerConfirmation(){this.actionConfirmation=null;this.cibleConfirmation=null;this.motifObligatoire=false;this.motifRejet='';}
  fermerConfirmation(e:MouseEvent){if(e.target===e.currentTarget)this.annulerConfirmation();}
  texteConfirmation(){switch(this.actionConfirmation){case'approuver-avenant':return'Cet avenant sera approuvé et pourra modifier le budget de référence du projet.';case'rejeter-avenant':return'Indiquez le motif du rejet. Cette décision sera historisée.';case'valider-situation':return'Cette situation de travaux sera validée et historisée.';case'rejeter-situation':return'Indiquez le motif du rejet. Cette décision sera historisée.';case'email':return'Le rapport du mois sera généré puis envoyé par e-mail.';case'whatsapp':return'Le rapport sera envoyé par e-mail et une diffusion WhatsApp sera demandée.';default:return'';}}
  confirmerAction(){const action=this.actionConfirmation,cible=this.cibleConfirmation,motif=this.motifRejet.trim();if(!action)return;if(this.motifObligatoire&&!motif)return;this.annulerConfirmation();this.chargement.set(true);const fin=()=>this.chargement.set(false);if(action==='approuver-avenant')this.ps.approuverAvenant(cible.id).pipe(finalize(fin)).subscribe({next:v=>{this.remplacer(v);this.message.set('Avenant approuvé.');this.chargerIndicateurs();},error:()=>this.erreur.set('Impossible d’approuver l’avenant.')});else if(action==='rejeter-avenant')this.ps.rejeterAvenant(cible.id,motif).pipe(finalize(fin)).subscribe({next:v=>{this.remplacer(v);this.message.set('Avenant rejeté.');},error:()=>this.erreur.set('Impossible de rejeter l’avenant.')});else if(action==='valider-situation')this.ps.validerSituation(cible.id).pipe(finalize(fin)).subscribe({next:v=>{this.situations=this.situations.map(x=>x.id===v.id?v:x);this.message.set('Situation validée.');this.chargerIndicateurs();},error:()=>this.erreur.set('Impossible de valider la situation.')});else if(action==='rejeter-situation')this.ps.rejeterSituation(cible.id,motif).pipe(finalize(fin)).subscribe({next:v=>{this.situations=this.situations.map(x=>x.id===v.id?v:x);this.message.set('Situation rejetée.');},error:()=>this.erreur.set('Impossible de rejeter la situation.')});else{fin();this.diffuser(true,action==='whatsapp');}}
  private nettoyerMessages(){this.message.set('');this.erreur.set('');}
}
