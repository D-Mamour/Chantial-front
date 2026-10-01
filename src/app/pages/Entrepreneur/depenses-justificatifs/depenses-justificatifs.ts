import { ChangeDetectorRef, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AjoutDepense } from '../ajout-depense/ajout-depense';
import { ProjetService } from '../../../services/projet.service';
import { FinanceService } from '../../../services/finance.service';
import { DocumentService } from '../../../services/document.service';
import { IntelligenceService } from '../../../services/intelligence.service';
import { AuthService } from '../../../services/auth.service';

/** Écran financier entièrement alimenté par les stores réactifs. */
@Component({ selector: 'app-depenses-justificatifs', standalone: true, imports: [FormsModule, AjoutDepense], templateUrl: './depenses-justificatifs.html' })
export class DepensesJustificatifs implements OnInit {
  private readonly projetService = inject(ProjetService);
  private readonly financeService = inject(FinanceService);
  private readonly documentService = inject(DocumentService);
  private readonly intelligenceService = inject(IntelligenceService);
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  searchTerm = '';
  selectedProject = 'Tous';
  selectedStatus = 'Tous';
  currentPage = 1;
  readonly pageSize = 10;
  showAddExpenseModal = false;
  readonly chargement = signal(false);
  readonly erreur = signal('');
  readonly message = signal('');
  readonly edition = signal<any | null>(null);
  readonly fichierDepense = signal<any | null>(null);
  readonly fichierJustificatif = signal<File | null>(null);
  /** État visuel de la chaîne automatique déclenchée après le dépôt. */
  readonly automatisationEnCours = signal(false);
  readonly automatisationTerminee = signal(false);

  readonly projects = this.projetService.projetsSignal;
  readonly total = computed(() => this.financeService.depensesSignal().reduce((s, d) => s + Number(d.montant || 0), 0));
  readonly totalJustificatifs = computed(() => this.documentService.justificatifsSignal().length);
  readonly justifiees = computed(() => this.financeService.depensesSignal().filter(d => d.statut === 'VALIDEE' && this.documentService.justificatifsSignal().some(j => this.idRelation((j as any).depense) === String(d.id))).length);
  readonly enAttente = computed(() => this.financeService.depensesSignal().filter(d => d.statut === 'EN_ATTENTE').length);
  readonly anomalies = computed(() => this.intelligenceService.anomaliesSignal().length);
  readonly pourcentageJustifies = computed(() => { const totalDepenses = this.financeService.depensesSignal().length; return totalDepenses ? Math.round(this.financeService.depensesSignal().filter(d => this.documentService.justificatifsSignal().some(j => String((j as any).depense?.id ?? j.depense) === String(d.id))).length / totalDepenses * 100) : 0; });

  readonly transactions = computed(() => {
    const projets = this.projetService.projetsSignal();
    const etapes = this.projetService.etapesSignal();
    const justificatifs = this.documentService.justificatifsSignal();
    return [...this.financeService.depensesSignal()].sort((a, b) => b.date_creation.localeCompare(a.date_creation)).map(depense => {
      const etape = etapes.find(e => String(e.id) === this.idRelation((depense as any).etape));
      const projet = projets.find(p => String(p.id) === this.idRelation((etape as any)?.projet));
      const justificatif = justificatifs.find(j => this.idRelation((j as any).depense) === String(depense.id));
      const hasJustificatif = !!justificatif;
      return {
        id: depense.id, project: projet?.nom || '—', projectId: projet?.id || '', step: etape?.nom || '—',
        label: depense.libelle, amount: this.fcfa(depense.montant), date: this.date(depense.date_depense),
        status: this.statut(depense.statut, hasJustificatif), justificatifId: justificatif?.id || '',
        raw: depense, hasJustificatif
      };
    });
  });

  ngOnInit(): void { this.charger(); }

  /** Normalise les relations DRF : UUID direct ou objet imbriqué { id: ... }. */
  private idRelation(value: unknown): string {
    if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
      return String((value as { id: unknown }).id ?? '');
    }
    return String(value ?? '');
  }

  charger(): void {
    this.chargement.set(true); this.erreur.set('');
    forkJoin({
      projets: this.projetService.chargerTout().pipe(catchError(() => of(null))), depenses: this.financeService.depenses().pipe(catchError(() => of([]))),
      justificatifs: this.documentService.justificatifs().pipe(catchError(() => of([]))), anomalies: this.intelligenceService.anomalies().pipe(catchError(() => of([])))
    }).subscribe({
      next: () => { this.chargement.set(false); if (this.currentPage > this.totalPages) this.currentPage = this.totalPages; },
      error: err => { this.chargement.set(false); this.erreur.set(err?.error?.detail || 'Impossible de charger les dépenses.'); }
    });
  }

  get toutesTransactionsFiltrees() {
    const q = this.searchTerm.toLowerCase().trim();
    return this.transactions().filter(t => (!q || t.project.toLowerCase().includes(q) || t.step.toLowerCase().includes(q) || t.label.toLowerCase().includes(q))
      && (this.selectedProject === 'Tous' || t.projectId === this.selectedProject)
      && (this.selectedStatus === 'Tous' || this.getStatusKey(t.status) === this.selectedStatus));
  }
  get filteredTransactions() { const debut = (this.currentPage - 1) * this.pageSize; return this.toutesTransactionsFiltrees.slice(debut, debut + this.pageSize); }
  get totalPages() { return Math.max(1, Math.ceil(this.toutesTransactionsFiltrees.length / this.pageSize)); }
  get nomUtilisateur() { return this.authService.nomComplet(); }

  statut(statut: string, has: boolean) { if (!has) return 'Non fourni'; return statut === 'VALIDEE' ? 'Validé' : statut === 'REJETEE' ? 'Rejeté' : 'En attente'; }
  getStatusKey(s: string) { return s === 'Validé' ? 'Valide' : s === 'En attente' ? 'Attente' : s === 'Rejeté' ? 'Rejete' : 'NonFourni'; }
  fcfa(v: unknown) { return `${Number(v || 0).toLocaleString('fr-FR')} FCFA`; }
  date(v: string) { return v ? new Intl.DateTimeFormat('fr-FR').format(new Date(v)) : '—'; }
  consult(transaction: any) { if (transaction.justificatifId) this.router.navigate(['/entrepreneur/controle'], { queryParams: { depense: transaction.id } }); else if (transaction.projectId) this.router.navigate(['/entrepreneur/detail', transaction.projectId]); }
  edit(transaction: any) { this.edition.set({...transaction.raw}); this.erreur.set(''); this.message.set(''); }
  fermerEdition() { this.edition.set(null); }
  enregistrerEdition() {
    const d=this.edition(); if(!d)return;
    this.erreur.set('');
    if (!String(d.libelle || '').trim()) { this.erreur.set('Le libellé est obligatoire.'); return; }
    if (Number(d.montant) <= 0) { this.erreur.set('Le montant doit être strictement supérieur à 0.'); return; }
    if (!d.date_depense) { this.erreur.set('La date de dépense est obligatoire.'); return; }
    this.financeService.modifierDepense(d.id,{libelle:d.libelle,montant:d.montant,date_depense:d.date_depense,fournisseur:d.fournisseur}).subscribe({
      next:()=>{this.message.set('Dépense modifiée.');this.edition.set(null);}, error:e=>this.erreur.set(e?.error?.detail||'Modification impossible.')});
  }
  supprimer(transaction:any) {
    if(!confirm(`Supprimer la dépense « ${transaction.label} » ?`))return;
    this.financeService.supprimerDepense(transaction.id).subscribe({next:()=>this.message.set('Dépense supprimée.'),error:e=>this.erreur.set(e?.error?.detail||'Suppression impossible.')});
  }
  ouvrirJustificatif(transaction:any) {
    this.fichierDepense.set(transaction);
    this.fichierJustificatif.set(null);
    this.automatisationEnCours.set(false);
    this.automatisationTerminee.set(false);
  }
  selectionnerJustificatif(event:Event) {
    const input = event.target as HTMLInputElement;
    const fichier = input.files?.[0] || null;
    this.erreur.set(''); this.message.set('');
    if (!fichier) { this.fichierJustificatif.set(null); return; }
    const extensions = ['pdf','png','jpg','jpeg'];
    const extension = fichier.name.split('.').pop()?.toLowerCase() || '';
    if (!extensions.includes(extension)) { this.erreur.set('Format non autorisé. Utilisez PDF, PNG, JPG ou JPEG.'); this.fichierJustificatif.set(null); input.value=''; return; }
    if (fichier.size <= 0) { this.erreur.set('Le fichier sélectionné est vide.'); this.fichierJustificatif.set(null); input.value=''; return; }
    if (fichier.size > 10 * 1024 * 1024) { this.erreur.set('Le justificatif ne doit pas dépasser 10 Mo.'); this.fichierJustificatif.set(null); input.value=''; return; }
    this.fichierJustificatif.set(fichier);
  }
  envoyerJustificatif() {
    const transaction = this.fichierDepense();
    const fichier = this.fichierJustificatif();
    if (!transaction || !fichier || this.automatisationEnCours()) return;

    this.erreur.set('');
    this.automatisationEnCours.set(true);
    this.automatisationTerminee.set(false);

    // Le backend exécute OCR → contrôles → analyse → alertes dans la même
    // chaîne métier. Une fois la réponse reçue, on rafraîchit les stores utiles
    // afin que les résultats apparaissent immédiatement dans l'interface.
    this.documentService.ajouterJustificatif(String(transaction.id), fichier).subscribe({
      next: () => {
        // Le POST a déjà ajouté le justificatif au signal local : la ligne se met
        // donc à jour immédiatement, sans F5. Les panneaux OCR/IA sont ensuite
        // resynchronisés indépendamment : une API secondaire en panne ne bloque
        // jamais l'affichage du justificatif qui vient d'être enregistré.
        this.automatisationEnCours.set(false);
        this.automatisationTerminee.set(true);
        this.message.set('Justificatif ajouté. OCR et contrôles en cours de synchronisation.');
        this.fichierDepense.set(null);
        this.fichierJustificatif.set(null);
        this.cdr.detectChanges();

        forkJoin({
          justificatifs: this.documentService.justificatifs().pipe(catchError(() => of([]))),
          extractions: this.documentService.extractions().pipe(catchError(() => of([]))),
          analyses: this.intelligenceService.analyses().pipe(catchError(() => of([]))),
          anomalies: this.intelligenceService.anomalies().pipe(catchError(() => of([]))),
        }).subscribe({
          next: () => { this.message.set('Justificatif ajouté. OCR et contrôles actualisés.'); this.cdr.detectChanges(); }
        });
      },
      error: e => {
        this.automatisationEnCours.set(false);
        const details = e?.error && typeof e.error === 'object' ? Object.entries(e.error).map(([champ,val]) => `${champ}: ${Array.isArray(val) ? val.join(' ') : val}`).join(' — ') : '';
        this.erreur.set(e?.error?.detail || details || `Ajout du justificatif impossible${e?.status ? ` (HTTP ${e.status})` : ''}.`);
        this.cdr.detectChanges();
      },
    });
  }

  fermerJustificatif(): void {
    if (this.automatisationEnCours()) return;
    this.fichierDepense.set(null);
    this.fichierJustificatif.set(null);
    this.automatisationTerminee.set(false);
  }
  goToPage(p: number) { this.currentPage = Math.min(Math.max(1, p), this.totalPages); }
  previousPage() { this.goToPage(this.currentPage - 1); }
  nextPage() { this.goToPage(this.currentPage + 1); }
  ouvrirAjoutDepense() { this.showAddExpenseModal = true; }
  fermerAjoutDepense() { this.showAddExpenseModal = false; }
  onExpenseAdded() { this.showAddExpenseModal = false; this.cdr.detectChanges(); /* les signals sont déjà synchronisés */ }
}
