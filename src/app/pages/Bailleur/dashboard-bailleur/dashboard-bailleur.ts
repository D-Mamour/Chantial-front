import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FinanceService } from '../../../services/finance.service';
import { IntelligenceService } from '../../../services/intelligence.service';
import { InteractionService } from '../../../services/interaction.service';
import { ProjetService } from '../../../services/projet.service';
import {
  Anomalie,
  Demande,
  Depense,
  Etape,
  Projet,
  Recommandation,
} from '../../../models/api.models';

type StatutTimeline = 'completed' | 'current' | 'pending';
interface EtapeTimeline extends Etape {
  number: number;
  progress: number;
  status: StatutTimeline;
}

/** Tableau de bord synthétique du bailleur. Toutes les valeurs viennent de l'API. */
@Component({
  selector: 'app-dashboard-bailleur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-bailleur.html',
})
export class DashboardBailleur implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly projetService = inject(ProjetService);
  private readonly financeService = inject(FinanceService);
  private readonly intelligenceService = inject(IntelligenceService);
  private readonly interactionService = inject(InteractionService);
  private readonly router = inject(Router);

  readonly utilisateur = this.auth.utilisateur;
  readonly chargement = signal(true);
  readonly erreur = signal('');
  readonly projet = signal<Projet | null>(null);
  readonly timeline = signal<EtapeTimeline[]>([]);
  readonly attentionPoints = signal<Anomalie[]>([]);
  readonly recommandations = signal<Recommandation[]>([]);
  readonly demandes = signal<Demande[]>([]);
  readonly depensesProjet = signal<Depense[]>([]);
  readonly progress = signal(0);
  readonly spent = signal(0);
  readonly today = new Date();

  readonly current = computed(
    () =>
      this.timeline().find((e) => e.status === 'current') ??
      this.timeline().find((e) => e.status === 'pending') ??
      this.timeline().at(-1) ??
      null,
  );
  readonly budget = computed(() => Number(this.projet()?.budget_previsionnel ?? 0));
  readonly remaining = computed(() => this.budget() - this.spent());
  readonly budgetPct = computed(() =>
    this.budget() ? Math.round((this.spent() / this.budget()) * 100) : 0,
  );
  readonly depensesEnAttente = computed(
    () => this.depensesProjet().filter((d) => d.statut === 'EN_ATTENTE').length,
  );
  readonly demandesOuvertes = computed(
    () => this.demandes().filter((d) => !['TRAITEE', 'FERMEE'].includes(d.statut)).length,
  );
  /** Indicateur de synthèse calculé uniquement à partir des données réelles du chantier. */
  readonly santeProjet = computed(() => {
    let score = 100;
    const consommation = this.budgetPct();
    if (consommation > 100) score -= 25;
    else if (consommation > this.progress() + 20) score -= 15;
    score -= Math.min(this.attentionPoints().length * 10, 30);
    score -= Math.min(this.depensesEnAttente() * 3, 15);
    return Math.max(0, score);
  });
  readonly coherence = computed(() => this.budgetPct() - this.progress());

  ngOnInit(): void {
    this.charger();
  }

  /** Charge chaque domaine indépendamment : une API secondaire en erreur ne bloque plus le dashboard. */
  charger(): void {
    this.chargement.set(true);
    this.erreur.set('');
    forkJoin({
      projets: this.projetService.projets().pipe(catchError(() => of([]))),
      etapes: this.projetService.etapes().pipe(catchError(() => of([]))),
      avancements: this.projetService.avancements().pipe(catchError(() => of([]))),
      depenses: this.financeService.depenses().pipe(catchError(() => of([]))),
      anomalies: this.intelligenceService.anomalies().pipe(catchError(() => of([]))),
      recommandations: this.intelligenceService.recommandations().pipe(catchError(() => of([]))),
      demandes: this.interactionService.demandes().pipe(catchError(() => of([]))),
    }).subscribe({
      next: (x) => {
        const projet = x.projets[0] ?? null;
        this.projet.set(projet);
        if (!projet) {
          this.chargement.set(false);
          return;
        }

        const etapes = x.etapes
          .filter((e) => e.projet === projet.id)
          .sort((a, b) => a.ordre - b.ordre);
        const progression = etapes.map((e, index) => {
          const dernier = x.avancements
            .filter((a) => a.etape === e.id)
            .sort((a, b) => b.date_declaration.localeCompare(a.date_declaration))[0];
          const pct = Number(dernier?.pourcentage ?? 0);
          return {
            ...e,
            number: index + 1,
            progress: pct,
            status: (pct >= 100 ? 'completed' : pct > 0 ? 'current' : 'pending') as StatutTimeline,
          };
        });
        this.timeline.set(progression);
        this.progress.set(
          progression.length
            ? Math.round(progression.reduce((s, e) => s + e.progress, 0) / progression.length)
            : 0,
        );

        const idsEtapes = new Set(etapes.map((e) => String(e.id)));
        const depenses = x.depenses.filter((d) =>
          idsEtapes.has(String((d as any).etape?.id ?? d.etape)),
        );
        this.depensesProjet.set(depenses);
        this.spent.set(depenses.reduce((s, d) => s + Number(d.montant), 0));
        this.attentionPoints.set(x.anomalies.filter((a) => a.projet === projet.id));
        this.recommandations.set(
          x.recommandations.filter((r) => r.projet === projet.id).slice(0, 3),
        );
        this.demandes.set(x.demandes.filter((d) => d.projet === projet.id));
        this.chargement.set(false);
      },
      error: () => {
        this.erreur.set('Impossible de charger le tableau de bord.');
        this.chargement.set(false);
      },
    });
  }

  fcfa(v: unknown): string {
    return `${Number(v ?? 0).toLocaleString('fr-FR')} FCFA`;
  }
  allerConstruction(): void {
    this.router.navigate(['/bailleur/construction']);
  }
  allerJustificatifs(): void {
    this.router.navigate(['/bailleur/controle']);
  }
  allerDemandes(): void {
    this.router.navigate(['/bailleur/construction'], { queryParams: { onglet: 'Historique' } });
  }
}
