import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { DocumentService } from '../../../services/document.service';
import { FinanceService } from '../../../services/finance.service';
import { IntelligenceService } from '../../../services/intelligence.service';
import { InteractionService } from '../../../services/interaction.service';
import { ProjetService } from '../../../services/projet.service';
import { DemandeModalComponent } from '../demande/demande';
import { Anomalie, Avancement, Demande, Depense, Etape, Historique, Projet } from '../../../models/api.models';

interface DepenseConstruction extends Depense {
  date: string; designation: string; amount: string; status: string; fichier: string; justificatifId: string;
}
interface ActiviteConstruction { icon: string; time: string; author: string; text: string; }

@Component({selector:'app-ma-construction',standalone:true,templateUrl:'./ma-construction.html',imports:[CommonModule,DemandeModalComponent]})
export class MaConstructionComponent implements OnInit {
  private readonly projetService=inject(ProjetService); private readonly financeService=inject(FinanceService);
  private readonly intelligenceService=inject(IntelligenceService); private readonly interactionService=inject(InteractionService);
  private readonly documentService=inject(DocumentService); private readonly router=inject(Router); private readonly route=inject(ActivatedRoute);

  readonly chargement = signal(true);
  readonly erreur = signal('');
  readonly projet = signal<Projet | null>(null);
  readonly etapes = signal<Etape[]>([]);
  readonly avancements = signal<Avancement[]>([]);
  readonly expenses = signal<DepenseConstruction[]>([]);
  readonly activities = signal<ActiviteConstruction[]>([]);
  readonly attentionPoints = signal<Anomalie[]>([]);
  readonly demandes = signal<Demande[]>([]);
  readonly justificatifs = signal<any[]>([]);
  readonly tabs=['Vue d’ensemble','Étapes & avancement','Dépenses','Justificatifs'];
  activeTab='Vue d’ensemble'; showRequestModal=false;
  readonly progress=computed(()=>{const es=this.etapes(); if(!es.length)return 0; return Math.round(es.reduce((s,e)=>{const a=this.avancements().filter(x=>x.etape===e.id).sort((a,b)=>String(b.date_declaration).localeCompare(String(a.date_declaration)))[0];return s+Number(a?.pourcentage||0)},0)/es.length)});
  readonly totalDepenses=computed(()=>this.expenses().reduce((s,d)=>s+Number(d.montant||0),0));
  readonly reste=computed(()=>Number(this.projet()?.budget_previsionnel||0)-this.totalDepenses());
  readonly budgetPct=computed(()=>Number(this.projet()?.budget_previsionnel||0)?Math.round(this.totalDepenses()/Number(this.projet()?.budget_previsionnel)*100):0);

  ngOnInit(){ const onglet=this.route.snapshot.queryParamMap.get('onglet'); if(onglet)this.activeTab=onglet; this.charger(); }
  charger(){
    this.chargement.set(true); this.erreur.set('');
    // Le projet est chargé en premier : une API secondaire ne peut plus masquer « Ma construction ».
    this.projetService.projets().pipe(switchMap(projets=>{
      const p=projets[0]??null; this.projet.set(p); if(!p)return of(null);
      return forkJoin({e:this.projetService.etapes().pipe(catchError(()=>of([]))),a:this.projetService.avancements().pipe(catchError(()=>of([]))),d:this.financeService.depenses().pipe(catchError(()=>of([]))),h:this.interactionService.historique().pipe(catchError(()=>of([]))),ano:this.intelligenceService.anomalies().pipe(catchError(()=>of([]))),dem:this.interactionService.demandes().pipe(catchError(()=>of([]))),just:this.documentService.justificatifs().pipe(catchError(()=>of([])))});
    })).subscribe({next:x=>{if(!x){this.chargement.set(false);return;} const p=this.projet(); if (!p) { this.chargement.set(false); return; } const es=x.e.filter(e=>String((e as any).projet?.id ?? e.projet)===String(p.id)).sort((a,b)=>a.ordre-b.ordre); this.etapes.set(es); this.avancements.set(x.a); this.justificatifs.set(x.just.filter((j:any)=>x.d.some((d:any)=>String(d.id)===String(j.depense?.id ?? j.depense))));
      const ids=new Set(es.map(e=>e.id)); this.expenses.set(x.d.filter(d=>ids.has((d as any).etape?.id ?? d.etape)).map(d=>{const j=x.just.find(j=>String((j as any).depense?.id ?? j.depense)===String(d.id));return {...d,date:d.date_depense,designation:d.libelle,amount:this.fcfa(d.montant),status:d.statut==='VALIDEE'?'Vérifié':d.statut==='REJETEE'?'Rejeté':'En attente',fichier:j?.fichier||'',justificatifId:j?.id||''}}));
      this.activities.set(x.h.filter(h=>!h.projet_id||h.projet_id===p.id).map(h=>({icon:'clipboard',time:h.date_action,author:'',text:h.description||h.action}))); this.attentionPoints.set(x.ano.filter(a=>String((a as any).projet?.id ?? a.projet)===String(p.id))); this.demandes.set(x.dem.filter(d=>String((d as any).projet?.id ?? d.projet)===String(p.id))); this.chargement.set(false);},error:err=>{this.erreur.set(err?.error?.detail||'Impossible de charger la construction associée à ce compte.');this.chargement.set(false);}});
  }
  avancementEtape(etapeId: string): number {
    const dernier = this.avancements().filter(a => String((a as any).etape?.id ?? a.etape) === String(etapeId)).sort((a,b) => String(b.date_declaration).localeCompare(String(a.date_declaration)))[0];
    return Math.min(100, Math.max(0, Number(dernier?.pourcentage || 0)));
  }
  fcfa(v: unknown): string { return `${Number(v ?? 0).toLocaleString('fr-FR')} FCFA`; }
  setActiveTab(tab: string): void { this.activeTab = tab; }
  getStatusClass(statut: string): string { return statut === 'Vérifié' ? 'bg-emerald-100 text-emerald-600' : statut === 'Rejeté' ? 'bg-red-100 text-red-500' : 'bg-amber-100 text-amber-600'; }
  ouvrirPilotage(): void { this.router.navigate(['/bailleur/pilotage-avance']); }
  ouvrirDemande(): void { this.showRequestModal = true; }
  fermerDemande(): void { this.showRequestModal = false; }
  demandeEnvoyee(): void { this.showRequestModal = false; this.charger(); }
  voirJustificatif(depense: DepenseConstruction): void { this.router.navigate(['/bailleur/controle'], { queryParams: { depense: depense.id } }); }
  telechargerJustificatif(depense: DepenseConstruction): void { if (depense.fichier) window.open(depense.fichier, '_blank', 'noopener,noreferrer'); }
}
