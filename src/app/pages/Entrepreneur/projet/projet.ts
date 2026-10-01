import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { FinanceService } from '../../../services/finance.service';
import { ProjetService } from '../../../services/projet.service';
import { CreerProjet } from '../creer-projet/creer-projet';

/** Liste réactive des projets de l'entrepreneur. */
@Component({
  selector: 'app-mes-projets', standalone: true,
  imports: [CreerProjet, FormsModule],
  templateUrl: './projet.html', styleUrl: './projet.css'
})
export class ProjetComponent implements OnInit {
  private readonly projetService = inject(ProjetService);
  private readonly financeService = inject(FinanceService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);

  searchTerm = '';
  activeFilter = 'Tous';
  sortOrder = 'recent';
  CreerProjet = false;
  readonly filters = ['Tous', 'En cours', 'Terminés', 'En retard'];
  readonly erreur = signal('');
  readonly chargement = this.projetService.chargement;

  /** Vue calculée automatiquement à partir des signals du store. */
  readonly projects = computed(() => {
    const projets = this.projetService.projetsSignal();
    const etapes = this.projetService.etapesSignal();
    const avancements = this.projetService.avancementsSignal();
    const depenses = this.financeService.depensesSignal();
    const utilisateurs = this.authService.utilisateursSignal();
    const maintenant = new Date();
    return [...projets].map(p => {
      const pe = etapes.filter(e => this.idRelation((e as any).projet) === String(p.id));
      const pd = depenses.filter(d => pe.some(e => String(e.id) === this.idRelation((d as any).etape)));
      const spent = pd.reduce((s, d) => s + Number(d.montant || 0), 0);
      const progression = pe.length ? pe.reduce((s, e) => s + this.dernierPourcentage(e.id, avancements), 0) / pe.length : 0;
      const current = pe.find(e => this.dernierPourcentage(e.id, avancements) < 100);
      return {
        id: p.id, title: p.nom, location: p.localisation || '—', bailleur: this.nomBailleur(this.idRelation((p as any).bailleur), utilisateurs),
        status: this.statutEffectif(p, Math.round(progression), maintenant), progress: Math.round(progression),
        createdAt: p.date_creation, startAt: p.date_debut, endAt: p.date_fin_prevue,
        budget: this.fcfa(p.budget_previsionnel), expenses: this.fcfa(spent),
        remaining: this.fcfa(Number(p.budget_previsionnel || 0) - spent),
        stage: current?.nom || (pe.length ? 'Terminé' : 'Aucune étape'),
        endDate: this.date(p.date_fin_prevue), late: p.statut === 'EN_RETARD'
      };
    }).sort((a, b) => this.sortOrder === 'ancien' ? a.createdAt.localeCompare(b.createdAt) : this.sortOrder === 'nom' ? a.title.localeCompare(b.title) : b.createdAt.localeCompare(a.createdAt));
  });

  readonly totalBudget = computed(() => this.projetService.projetsSignal().reduce((s, p) => s + Number(p.budget_previsionnel || 0), 0));
  readonly totalExpenses = this.financeService.totalDepenses;
  readonly enCours = computed(() => this.projects().filter(p => p.status === 'En cours').length);
  readonly termines = computed(() => this.projects().filter(p => p.status === 'Terminé').length);

  ngOnInit(): void {
    // Les données sont chargées dès l'arrivée sur la page : aucun clic intermédiaire.
    forkJoin({ projets: this.projetService.chargerTout(), depenses: this.financeService.depenses(), utilisateurs: this.authService.utilisateurs() }).subscribe({
      error: err => this.erreur.set(err?.error?.detail || 'Impossible de charger les projets.')
    });
  }

  get projetsFiltres() {
    const q = this.searchTerm.trim().toLowerCase();
    return this.projects().filter(p => (!q || p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)) &&
      (this.activeFilter === 'Tous' || (this.activeFilter === 'En cours' && p.status === 'En cours') ||
       (this.activeFilter === 'Terminés' && p.status === 'Terminé') || (this.activeFilter === 'En retard' && p.status === 'En retard')));
  }

  nomUtilisateur(): string { const u = this.authService.utilisateur(); return u ? (`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email) : ''; }
  /** Ouvre explicitement le détail : évite les navigations silencieuses et protège l'identifiant. */
  voirProjet(id: string): void {
    if (!id) { this.erreur.set('Impossible d’ouvrir ce projet : identifiant manquant.'); return; }
    this.router.navigate(['/entrepreneur/detail', String(id)]).then(ok => {
      if (!ok) this.erreur.set('La page détail du projet n’a pas pu être ouverte.');
    });
  }
  ouvrirModalProjet(): void { this.CreerProjet = true; }
  fermerModalProjet(): void { this.CreerProjet = false; }
  projetCree(): void { this.CreerProjet = false; this.cdr.detectChanges(); /* le signal est déjà mis à jour par ProjetService */ }
  setFilter(f: string): void { this.activeFilter = f; }
  changerTri(event: Event): void { this.sortOrder = (event.target as HTMLSelectElement).value; }
  fcfa(v: unknown): string { return `${Number(v || 0).toLocaleString('fr-FR')} FCFA`; }
  date(v: string): string { return v ? new Intl.DateTimeFormat('fr-FR').format(new Date(v)) : '—'; }
  libelleStatut(s: string): string { return s === 'EN_RETARD' ? 'En retard' : s === 'TERMINE' ? 'Terminé' : s === 'EN_COURS' ? 'En cours' : 'Planifié'; }

  /** Normalise les relations renvoyées par DRF (UUID ou objet imbriqué). */
  private idRelation(value: unknown): string {
    if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) return String((value as any).id ?? '');
    return String(value ?? '');
  }

  private statutEffectif(p: any, progression: number, maintenant: Date): string {
    if (p.statut === 'TERMINE' || progression >= 100) return 'Terminé';
    if (p.statut === 'EN_RETARD') return 'En retard';
    const debut = p.date_debut ? new Date(`${p.date_debut}T00:00:00`) : null;
    const fin = p.date_fin_prevue ? new Date(`${p.date_fin_prevue}T23:59:59`) : null;
    if (fin && maintenant > fin) return 'En retard';
    if (p.statut === 'EN_COURS' || (debut && maintenant >= debut)) return 'En cours';
    return 'Planifié';
  }
  private nomBailleur(id: string, utilisateurs: any[]): string {
    const u = utilisateurs.find(x => x.id === id);
    return u ? (`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email) : 'Bailleur';
  }
  private dernierPourcentage(etapeId: string, avancements: any[]): number {
    const dernier = avancements.filter(a => this.idRelation((a as any).etape) === String(etapeId)).sort((a, b) => b.date_declaration.localeCompare(a.date_declaration))[0];
    return Number(dernier?.pourcentage || 0);
  }
}
