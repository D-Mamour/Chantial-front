import { Component, EventEmitter, HostListener, OnInit, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { FinanceService } from '../../../services/finance.service';
import { InteractionService } from '../../../services/interaction.service';
import { ProjetService } from '../../../services/projet.service';

/**
 * Fenêtre modale utilisée par le bailleur pour demander une justification
 * ou une correction à l'entrepreneur.
 *
 * Principes appliqués :
 * - formulaire réactif et validation côté client ;
 * - aucune donnée métier simulée ;
 * - fermeture possible par bouton, Annuler, clic sur l'overlay ou Échap ;
 * - état d'envoi centralisé afin d'éviter les doubles soumissions.
 */
@Component({
  selector: 'app-demande',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './demande.html',
  styleUrl: './demande.css',
})
export class DemandeModalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projetService = inject(ProjetService);
  private readonly financeService = inject(FinanceService);
  private readonly interactionService = inject(InteractionService);

  @Output() readonly close = new EventEmitter<void>();
  @Output() readonly requestSent = new EventEmitter<unknown>();

  readonly isSubmitting = signal(false);
  readonly erreur = signal('');
  readonly elements = signal<any[]>([]);

  readonly requestForm = this.fb.nonNullable.group({
    type: ['justification', Validators.required],
    element: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
  });

  ngOnInit(): void {
    // Charge en parallèle les étapes et dépenses réellement accessibles au bailleur.
    forkJoin({
      etapes: this.projetService.etapes(),
      depenses: this.financeService.depenses(),
    }).subscribe({
      next: ({ depenses }) => this.elements.set(depenses),
      error: () => this.erreur.set('Impossible de charger les dépenses du chantier.'),
    });
  }

  /** Ferme la modale tant qu'une demande n'est pas en cours d'envoi. */
  fermer(): void {
    if (!this.isSubmitting()) this.close.emit();
  }

  /** Permet une fermeture clavier accessible et prévisible. */
  @HostListener('document:keydown.escape')
  fermerAvecEchap(): void {
    this.fermer();
  }

  /** Ferme uniquement si l'utilisateur clique réellement hors de la boîte de dialogue. */
  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.fermer();
  }

  /** Valide le formulaire puis envoie la demande à l'API. */
  envoyerDemande(): void {
    if (this.requestForm.invalid || this.isSubmitting()) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.erreur.set('');
    this.isSubmitting.set(true);
    const valeur = this.requestForm.getRawValue();
    const depense = this.elements().find(element => element.id === valeur.element);
    const etape = this.projetService.etapesSignal().find(item => item.id === depense?.etape);
    const projet = this.projetService.projetsSignal().find(item => item.id === etape?.projet);

    if (!projet) {
      this.erreur.set('Le projet associé à cette dépense est introuvable.');
      this.isSubmitting.set(false);
      return;
    }

    this.interactionService.creerDemande({
      projet: projet.id,
      depense: valeur.element,
      destinataire: projet.entrepreneur,
      type_demande: valeur.type.toUpperCase(),
      message: valeur.message.trim(),
    }).pipe(
      finalize(() => this.isSubmitting.set(false)),
    ).subscribe({
      next: reponse => {
        this.requestSent.emit(reponse);
        this.close.emit();
      },
      error: () => this.erreur.set("La demande n'a pas pu être envoyée. Réessayez."),
    });
  }
}
