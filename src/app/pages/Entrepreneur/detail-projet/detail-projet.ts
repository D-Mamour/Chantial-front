import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProjetService } from '../../../services/projet.service';
import { FinanceService } from '../../../services/finance.service';
import { DocumentService } from '../../../services/document.service';
import { DeclarerAvancement } from '../declarer-avancement/declarer-avancement';
import { AjoutEtape } from '../ajout-etape/ajout-etape';

@Component({
  selector: 'app-detail-projet',
  standalone: true,
  imports: [CommonModule, DeclarerAvancement, AjoutEtape, RouterLink],
  templateUrl: './detail-projet.html',
  styleUrl: './detail-projet.css'
})
export class DetailProjetComponent implements OnInit {
  showProgressModal = false;
  showAddStepModal = false;
  projet: any = null;
  etapes: any[] = [];
  selectedEtape: any = null;
  ongletActif: 'avancement' | 'depenses' | 'justificatifs' | 'analyse' = 'avancement';
  depenses: any[] = [];
  justificatifs: any[] = [];
  montantDepense = 0;
  avancementGlobal = 0;
  chargement = true;
  erreur = '';
  message = '';
  actionEnCours = false;
  erreurAvancement = '';

  private projetId = '';

  constructor(
    private route: ActivatedRoute,
    private projetService: ProjetService,
    private financeService: FinanceService,
    private documentService: DocumentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // La route est la seule source de vérité pour l'identifiant du projet.
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.erreur = 'Identifiant du projet manquant.';
        this.chargement = false;
        return;
      }
      this.projetId = id;
      this.charger(id);
    });
  }

  /**
   * Affiche d'abord le projet déjà présent dans le store Angular, puis actualise
   * les données depuis l'API. Ainsi, le clic « Voir le projet » ouvre toujours
   * la page même si une API secondaire (dépenses, justificatifs...) échoue.
   */
  charger(idParam?: string | null): void {
    const id = idParam || this.projetId || this.route.snapshot.paramMap.get('id') || '';
    if (!id) {
      this.erreur = 'Identifiant du projet manquant.';
      this.chargement = false;
      return;
    }

    this.projetId = id;
    this.erreur = '';
    this.chargement = true;

    // Affichage immédiat du projet connu localement pour éviter un écran blanc.
    const local = this.projetService.projetsSignal().find(p => String(p.id) === String(id));
    if (local) this.projet = local;

    // Une seule synchronisation alimente ensuite TOUTE la page. Cela évite le
    // cas où le projet apparaît mais où les étapes/dépenses ne deviennent
    // visibles qu'après un clic ou une nouvelle détection de changement.
    forkJoin({
      p: this.projetService.projet(id).pipe(catchError(() => of(local ?? null))),
      e: this.projetService.etapes().pipe(catchError(() => of([] as any[]))),
      a: this.projetService.avancements().pipe(catchError(() => of([] as any[]))),
      d: this.financeService.depenses().pipe(catchError(() => of([] as any[]))),
      j: this.documentService.justificatifs().pipe(catchError(() => of([] as any[])))
    }).subscribe({
      next: x => {
        this.projet = x.p ?? this.projet;
        this.construireVue(id, x.e, x.a, x.d, x.j);
        this.chargement = false;
        if (!this.projet) this.erreur = 'Projet introuvable ou inaccessible.';
        this.cdr.detectChanges();
      },
      error: err => {
        this.chargement = false;
        this.erreur = this.messageErreurApi(err, 'Impossible de charger le détail du projet.');
        this.cdr.detectChanges();
      }
    });
  }

  /** Accepte aussi bien un tableau DRF qu'une réponse paginée { results: [] }. */
  private tableau<T = any>(reponse: any): T[] {
    if (Array.isArray(reponse)) return reponse;
    if (Array.isArray(reponse?.results)) return reponse.results;
    return [];
  }

  private construireVue(id: string, reponseEtapes: any, reponseAvancements: any, reponseDepenses: any, reponseJustificatifs: any): void {
    const etapes = this.tableau<any>(reponseEtapes);
    const avancements = this.tableau<any>(reponseAvancements);
    const depenses = this.tableau<any>(reponseDepenses);
    const justificatifs = this.tableau<any>(reponseJustificatifs);

    const es = etapes.filter(e => String(e.projet?.id ?? e.projet) === String(id));

    this.etapes = es.map(e => {
      const ds = depenses.filter(d => String(d.etape?.id ?? d.etape) === String(e.id));
      const av = avancements
        .filter(a => String(a.etape?.id ?? a.etape) === String(e.id))
        .sort((a, b) => String(b.date_declaration ?? '').localeCompare(String(a.date_declaration ?? '')))[0];
      const progress = Math.min(100, Math.max(0, Number(av?.pourcentage ?? 0)));
      return {
        ...e,
        dernierAvancement: av ?? null,
        depense: ds.reduce((sum, d) => sum + Math.max(0, Number(d.montant ?? 0)), 0),
        progress,
        statut: progress >= 100 ? 'Terminé' : progress > 0 ? 'En cours' : 'À venir'
      };
    });

    const idsEtapes = new Set(es.map(e => String(e.id)));
    this.depenses = depenses.filter(d => idsEtapes.has(String(d.etape?.id ?? d.etape)));
    const idsDepenses = new Set(this.depenses.map(d => String(d.id)));
    this.justificatifs = justificatifs.filter(j => idsDepenses.has(String(j.depense?.id ?? j.depense)));

    this.montantDepense = this.etapes.reduce((sum, e) => sum + Number(e.depense ?? 0), 0);
    this.avancementGlobal = this.etapes.length
      ? this.etapes.reduce((sum, e) => sum + Number(e.progress ?? 0), 0) / this.etapes.length
      : 0;
  }

  fcfa(v: any): string { return `${Number(v || 0).toLocaleString('fr-FR')} FCFA`; }
  consommation(): number { const b = Number(this.projet?.budget_previsionnel || 0); return b ? Math.max(0, this.montantDepense / b * 100) : 0; }
  resteBudget(): number { return Number(this.projet?.budget_previsionnel || 0) - this.montantDepense; }
  ecartPilotage(): number { return this.consommation() - this.avancementGlobal; }
  statutPilotage(): 'coherent' | 'surveillance' | 'prioritaire' { const e = Math.abs(this.ecartPilotage()); return e <= 10 ? 'coherent' : e <= 20 ? 'surveillance' : 'prioritaire'; }
  libellePilotage(): string { return this.statutPilotage() === 'coherent' ? 'Situation cohérente' : this.statutPilotage() === 'surveillance' ? 'À surveiller' : 'Vérification recommandée'; }
  libelleStatut(s: string): string { return ({ EN_ATTENTE: 'En attente', VALIDEE: 'Validée', REJETEE: 'Rejetée' } as Record<string, string>)[s] || s; }
  libelleStatutProjet(s: string): string { return ({ PLANIFIE: 'Planifié', EN_COURS: 'En cours', EN_RETARD: 'En retard', TERMINE: 'Terminé' } as Record<string, string>)[s] || s || 'Planifié'; }

  ouvrirDeclaration(etape?: any): void {
    this.selectedEtape = etape || null;
    this.erreurAvancement = '';
    this.showProgressModal = true;
  }
  fermerDeclaration(): void {
    if (this.actionEnCours) return;
    this.showProgressModal = false;
    this.selectedEtape = null;
    this.erreurAvancement = '';
  }
  avancementDeclare(data: any): void {
    const etape = data.etape || this.selectedEtape?.id;
    if (!etape || this.actionEnCours) return;
    this.erreur = ''; this.erreurAvancement = ''; this.message = ''; this.actionEnCours = true;
    this.projetService.creerAvancement({
      etape,
      pourcentage: Number(data.pourcentage),
      commentaire: String(data.commentaire || '').trim()
    }).subscribe({
      next: () => {
        this.showProgressModal = false;
        this.selectedEtape = null;
        this.message = 'Avancement enregistré avec succès.';
        this.actionEnCours = false;
        this.cdr.detectChanges();
        // Recharge explicitement l'historique : la nouvelle déclaration est alors
        // visible dans la ligne de l'étape sans nécessiter un rechargement manuel.
        this.charger(this.projetId);
      },
      error: err => {
        this.actionEnCours = false;
        this.erreurAvancement = this.messageErreurApi(err, "Impossible d'enregistrer l'avancement.");
        this.cdr.detectChanges();
      }
    });
  }

  private messageErreurApi(err: any, defaut: string): string {
    if (typeof err?.error?.detail === 'string') return err.error.detail;
    if (err?.error && typeof err.error === 'object') {
      const details = Object.entries(err.error).map(([champ, valeur]) => `${champ} : ${Array.isArray(valeur) ? valeur.join(' ') : valeur}`).join(' — ');
      if (details) return details;
    }
    return defaut;
  }

  ouvrirAjoutEtape(): void { this.showAddStepModal = true; }
  fermerAjoutEtape(): void { this.showAddStepModal = false; }
  onStepAdded(data: any): void {
    if (!this.projet) return;
    this.projetService.creerEtape({
      projet: this.projet.id,
      nom: data.nomEtape,
      description: data.description || '',
      ordre: data.ordre,
      budget_previsionnel: data.budget,
      date_debut_prevue: data.dateDebut,
      date_fin_prevue: data.dateFin
    }).subscribe({
      next: () => { this.showAddStepModal = false; this.message = 'Étape ajoutée avec succès.'; this.cdr.detectChanges(); this.charger(this.projetId); },
      error: err => { this.erreur = this.messageErreurApi(err, "Impossible d'ajouter l'étape."); }
    });
  }
}
