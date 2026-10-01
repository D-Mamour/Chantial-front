import { Component, computed, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ProjetService } from '../../../services/projet.service';
import { FinanceService } from '../../../services/finance.service';
import { DocumentService } from '../../../services/document.service';

/**
 * Modale de création d'une dépense.
 * La dépense est toujours créée avant l'éventuel justificatif : un échec OCR/upload
 * ne doit jamais provoquer la création de doublons lors d'une nouvelle tentative.
 */
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  selector: 'app-ajout-depense',
  styleUrl: './ajout-depense.css',
  templateUrl: './ajout-depense.html'
})
export class AjoutDepense implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projetService = inject(ProjetService);
  private readonly financeService = inject(FinanceService);
  private readonly documentService = inject(DocumentService);

  @Output() close = new EventEmitter<void>();
  @Output() expenseAdded = new EventEmitter<void>();

  readonly isSubmitting = signal(false);
  readonly erreur = signal('');
  readonly info = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly projets = this.projetService.projetsSignal;
  readonly toutesEtapes = this.projetService.etapesSignal;
  readonly projetSelectionne = signal('');

  /** Accepte un UUID direct ou une relation DRF imbriquée contenant id. */
  private idRelation(value: unknown): string {
    if (value && typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
      return String((value as { id: unknown }).id ?? '');
    }
    return String(value ?? '');
  }

  readonly etapes = computed(() => {
    const projetId = this.projetSelectionne();
    return this.toutesEtapes().filter(e => this.idRelation((e as any).projet) === projetId);
  });

  readonly expenseForm = this.fb.nonNullable.group({
    projet: ['', Validators.required],
    etape: ['', Validators.required],
    libelle: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
    montant: [null as number | null, [Validators.required, Validators.min(1)]],
    dateDepense: ['', Validators.required],
    fournisseur: ['', Validators.maxLength(180)]
  });

  ngOnInit(): void {
    // L'abonnement est installé AVANT le chargement afin que toute sélection
    // automatique déclenche correctement le filtrage des étapes.
    this.expenseForm.controls.projet.valueChanges.subscribe(id => this.selectionnerProjet(id));

    this.projetService.chargerTout().subscribe({
      next: () => {
        const projets = this.projets();
        if (!projets.length) {
          this.erreur.set('Aucun projet disponible. Créez d’abord un projet.');
          return;
        }
        // Sélectionne le premier projet pour éviter un select visuellement rempli
        // alors que le FormControl est encore vide.
        this.expenseForm.controls.projet.setValue(String(projets[0].id));
      },
      error: err => this.erreur.set(this.messageErreur(err) || 'Impossible de charger les projets et les étapes.')
    });
  }

  private selectionnerProjet(id: string): void {
    this.projetSelectionne.set(String(id || ''));
    const etapes = this.etapes();
    this.expenseForm.controls.etape.setValue(etapes.length ? String(etapes[0].id) : '');
  }

  fermer(): void { if (!this.isSubmitting()) this.close.emit(); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.validerFichier(input.files?.[0] ?? null, () => input.value = '');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.validerFichier(event.dataTransfer?.files?.[0] ?? null);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); }
  supprimerFichier(): void { this.selectedFile.set(null); this.erreur.set(''); }

  private validerFichier(fichier: File | null, reset?: () => void): void {
    this.erreur.set('');
    if (!fichier) { this.selectedFile.set(null); return; }
    const extension = fichier.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
      this.erreur.set('Format non autorisé. Utilisez PDF, JPG, JPEG ou PNG.');
      this.selectedFile.set(null); reset?.(); return;
    }
    if (fichier.size <= 0) {
      this.erreur.set('Le fichier sélectionné est vide.');
      this.selectedFile.set(null); reset?.(); return;
    }
    if (fichier.size > 10 * 1024 * 1024) {
      this.erreur.set('Le justificatif ne doit pas dépasser 10 Mo.');
      this.selectedFile.set(null); reset?.(); return;
    }
    this.selectedFile.set(fichier);
  }

  enregistrer(): void {
    this.erreur.set(''); this.info.set('');
    if (this.expenseForm.invalid) { this.expenseForm.markAllAsTouched(); return; }
    if (!this.etapes().length) {
      this.erreur.set('Le projet sélectionné ne possède aucune étape. Ajoutez d’abord une étape.');
      return;
    }

    const v = this.expenseForm.getRawValue();
    if (!v.etape) { this.erreur.set('Sélectionnez une étape.'); return; }
    this.isSubmitting.set(true);

    this.financeService.creerDepense({
      etape: v.etape,
      libelle: v.libelle.trim(),
      montant: Number(v.montant),
      date_depense: v.dateDepense,
      fournisseur: v.fournisseur.trim()
    }).pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: depense => {
        const fichier = this.selectedFile();
        if (!fichier) {
          this.expenseAdded.emit();
          this.close.emit();
          return;
        }
        // La dépense existe déjà. Si l'upload échoue, on ne recrée surtout pas
        // une seconde dépense : l'utilisateur pourra joindre le justificatif depuis la liste.
        this.isSubmitting.set(true);
        this.documentService.ajouterJustificatif(String(depense.id), fichier)
          .pipe(finalize(() => this.isSubmitting.set(false)))
          .subscribe({
            next: () => { this.expenseAdded.emit(); this.close.emit(); },
            error: err => {
              this.expenseAdded.emit();
              this.selectedFile.set(null);
              this.info.set('La dépense a bien été créée. Le justificatif n’a pas pu être envoyé : vous pouvez le joindre depuis la liste sans recréer la dépense.');
              this.erreur.set(this.messageErreur(err, 'Échec de l’ajout du justificatif.'));
            }
          });
      },
      error: err => this.erreur.set(this.messageErreur(err, 'Impossible d’enregistrer la dépense.'))
    });
  }

  onOverlayClick(event: MouseEvent): void { if (event.target === event.currentTarget) this.fermer(); }

  private messageErreur(err: any, fallback = 'Une erreur est survenue.'): string {
    if (!err) return fallback;
    if (err.status === 0) return 'API inaccessible. Vérifiez que le serveur Django est démarré.';
    if (err.status === 401) return 'Votre session a expiré. Reconnectez-vous.';
    if (err.status === 403) return err?.error?.detail || 'Vous n’êtes pas autorisé à effectuer cette action.';
    if (!err.error) return `${fallback}${err.status ? ` (HTTP ${err.status})` : ''}`;
    if (typeof err.error === 'string') return err.error;
    if (err.error.detail) return String(err.error.detail);
    const details = Object.entries(err.error)
      .map(([champ, message]) => `${champ} : ${Array.isArray(message) ? message.join(', ') : message}`)
      .join(' — ');
    return details || `${fallback}${err.status ? ` (HTTP ${err.status})` : ''}`;
  }
}
