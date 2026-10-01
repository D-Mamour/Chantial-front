import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DocumentService } from '../../../services/document.service';
import { FinanceService } from '../../../services/finance.service';
import { ProjetService } from '../../../services/projet.service';
import { ExtractionOCR } from '../../../models/api.models';

/**
 * Écran de contrôle OCR partagé entre entrepreneur et bailleur.
 * Toutes les données proviennent de l'API : aucun justificatif n'est simulé.
 */
@Component({
  selector: 'app-orc-controle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orc-controle.html',
  styleUrl: './orc-controle.css'
})
export class OrcControle implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly projetService = inject(ProjetService);
  private readonly financeService = inject(FinanceService);
  private readonly documentService = inject(DocumentService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly utilisateur = this.auth.utilisateur;
  readonly chargement = signal(true);
  readonly erreur = signal('');
  readonly extractions = this.documentService.extractionsSignal;
  readonly justificatifs = this.documentService.justificatifsSignal;
  readonly depenses = this.financeService.depensesSignal;
  readonly etapes = this.projetService.etapesSignal;
  readonly extractionSelectionneeId = signal('');
  /** Empêche les doubles clics pendant une décision financière. */
  readonly decisionEnCours = signal(false);
  /** Décision en attente de confirmation par le bailleur. */
  readonly decisionAConfirmer = signal<'VALIDER' | 'REJETER' | null>(null);

  /** Normalise une relation DRF qu'elle soit renvoyée comme UUID ou objet imbriqué. */
  private idRelation(valeur: unknown): string {
    if (valeur && typeof valeur === 'object' && 'id' in (valeur as Record<string, unknown>)) {
      return String((valeur as { id: unknown }).id ?? '');
    }
    return String(valeur ?? '');
  }

  readonly extraction = computed(() => this.extractions().find(x => String(x.id) === this.extractionSelectionneeId()) ?? null);
  readonly justificatif = computed(() => this.justificatifs().find(j => String(j.id) === this.idRelation(this.extraction()?.justificatif)) ?? null);
  readonly depense = computed(() => this.depenses().find(d => String(d.id) === this.idRelation(this.justificatif()?.depense)) ?? null);
  readonly etape = computed(() => this.etapes().find(e => String(e.id) === this.idRelation(this.depense()?.etape)) ?? null);
  /** Écart financier entre la déclaration et le montant TTC lu par OCR. */
  readonly ecart = computed(() => {
    const d = this.depense(); const o = this.extraction();
    return d && o?.montant_extrait != null ? Number(d.montant) - Number(o.montant_extrait) : null;
  });

  /** Compare les dates sans dépendre du format d'affichage. */
  readonly dateConforme = computed(() => {
    const d = this.depense()?.date_depense;
    const o = this.extraction()?.date_document;
    return !!d && !!o && String(d).slice(0, 10) === String(o).slice(0, 10);
  });

  /** Compare les fournisseurs après normalisation des espaces et de la casse. */
  readonly fournisseurConforme = computed(() => {
    const normaliser = (v: unknown) => String(v ?? '').trim().toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ');
    const d = normaliser(this.depense()?.fournisseur);
    const o = normaliser(this.extraction()?.fournisseur);
    return !!d && !!o && d === o;
  });

  /** Indique si au moins un contrôle automatique nécessite une vérification. */
  readonly comparaisonAnormale = computed(() => {
    const montant = this.ecart();
    return montant === null || Math.abs(montant) > 0.01 || !this.dateConforme() || !this.fournisseurConforme();
  });

  /** Taux de complétude des quatre champs métier attendus, sans inventer un score OCR. */
  readonly completude = computed(() => {
    const o=this.extraction(); if(!o)return 0;
    const valeurs=[o.numero_document,o.fournisseur,o.date_document,o.montant_extrait];
    return Math.round(valeurs.filter(v=>v!==null && v!==undefined && String(v).trim()!=='').length/valeurs.length*100);
  });
  readonly champsManquants = computed(() => {
    const o=this.extraction(); if(!o)return ['Extraction OCR']; const m:string[]=[];
    if(!o.fournisseur)m.push('fournisseur'); if(!o.date_document)m.push('date d’émission');
    if(o.montant_extrait==null)m.push('montant TTC'); if(!o.numero_document)m.push('numéro de facture'); return m;
  });

  ngOnInit(): void {
    forkJoin({
      // Chaque ressource secondaire est tolérante aux erreurs : une API indisponible
      // ne doit pas empêcher l'utilisateur de consulter les autres données OCR.
      ocr: this.documentService.extractions().pipe(catchError(() => of([]))),
      justificatifs: this.documentService.justificatifs().pipe(catchError(() => of([]))),
      depenses: this.financeService.depenses().pipe(catchError(() => of([]))),
      etapes: this.projetService.etapes().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ ocr, justificatifs }) => {
        const depenseDemandee = this.route.snapshot.queryParamMap.get('depense');
        let cible: ExtractionOCR | undefined;
        if (depenseDemandee) {
          const justificatif = justificatifs.find(j => this.idRelation(j.depense) === depenseDemandee);
          cible = ocr.find(x => this.idRelation(x.justificatif) === String(justificatif?.id ?? ''));
        }
        cible ??= [...ocr].sort((a, b) => b.date_extraction.localeCompare(a.date_extraction))[0];
        this.extractionSelectionneeId.set(cible?.id ?? '');
        this.chargement.set(false);
      },
      error: err => {
        this.erreur.set(err?.error?.detail || 'Impossible de charger les résultats OCR.');
        this.chargement.set(false);
      }
    });
  }

  selectionner(event: Event): void { this.extractionSelectionneeId.set((event.target as HTMLSelectElement).value); }
  estBailleur(): boolean { return this.utilisateur()?.role === 'BAILLEUR'; }
  fcfa(v: unknown): string { return v == null ? '—' : `${Number(v).toLocaleString('fr-FR')} FCFA`; }
  date(v: unknown): string { return v ? new Intl.DateTimeFormat('fr-FR').format(new Date(String(v))) : '—'; }

  /** Ouvre le fichier réellement déposé dans un nouvel onglet. */
  ouvrirDocument(): void {
    const url = this.justificatif()?.fichier;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  relancerOcr(): void {
    const id = this.justificatif()?.id;
    if (!id) return;
    this.chargement.set(true); this.erreur.set('');
    this.documentService.relancerOcr(id).subscribe({
      next: extraction => { this.extractionSelectionneeId.set(extraction.id); this.chargement.set(false); },
      error: err => { this.erreur.set(err?.error?.detail || 'La relance OCR a échoué.'); this.chargement.set(false); }
    });
  }

  /** Ouvre une confirmation avant toute décision irréversible. */
  demanderConfirmation(decision: 'VALIDER' | 'REJETER'): void {
    if (!this.estBailleur() || !this.depense() || this.decisionEnCours()) return;
    this.decisionAConfirmer.set(decision);
  }

  /** Ferme la confirmation sans modifier la dépense. */
  annulerDecision(): void {
    if (!this.decisionEnCours()) this.decisionAConfirmer.set(null);
  }

  /** Exécute la décision confirmée et synchronise l'état local via FinanceService. */
  confirmerDecision(): void {
    const depense = this.depense();
    const decision = this.decisionAConfirmer();
    if (!depense || !decision || !this.estBailleur() || this.decisionEnCours()) return;

    this.decisionEnCours.set(true);
    this.erreur.set('');
    const requete = decision === 'VALIDER'
      ? this.financeService.validerDepense(depense.id)
      : this.financeService.rejeterDepense(depense.id);

    requete.subscribe({
      next: () => {
        this.decisionEnCours.set(false);
        this.decisionAConfirmer.set(null);
      },
      error: err => {
        this.erreur.set(err?.error?.detail || 'La décision n’a pas pu être enregistrée.');
        this.decisionEnCours.set(false);
      }
    });
  }

  demanderCorrection(): void { this.router.navigate(['/bailleur/demande'], { queryParams: { depense: this.depense()?.id } }); }
}
