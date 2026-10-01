import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

/** Formulaire Angular 22 d'une nouvelle étape. La persistance est faite par la page projet. */
@Component({
  imports: [ReactiveFormsModule], standalone: true, selector: 'app-ajout-etape',
  styleUrl: './ajout-etape.css', templateUrl: './ajout-etape.html'
})
export class AjoutEtape {
  private readonly fb = inject(FormBuilder);
  readonly close = output<void>();
  readonly stepAdded = output<any>();
  readonly isSubmitting = signal(false);

  readonly stepForm = this.fb.nonNullable.group({
    nomEtape: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    ordre: [1, [Validators.required, Validators.min(1)]],
    budget: [0, [Validators.required, Validators.min(0)]],
    dateDebut: ['', Validators.required],
    dateFin: ['', Validators.required],
    description: ['']
  });

  fermer(): void { this.close.emit(); }

  ajouter(): void {
    if (this.stepForm.controls.dateDebut.value && this.stepForm.controls.dateFin.value && this.stepForm.controls.dateFin.value < this.stepForm.controls.dateDebut.value) { this.stepForm.controls.dateFin.setErrors({ dateOrder: true }); }
    if (this.stepForm.invalid) { this.stepForm.markAllAsTouched(); return; }
    const valeur = this.stepForm.getRawValue();
    if (new Date(valeur.dateFin) < new Date(valeur.dateDebut)) {
      this.stepForm.controls.dateFin.setErrors({ dateInvalide: true });
      return;
    }
    this.isSubmitting.set(true);
    this.stepAdded.emit(valeur);
    // Le composant parent ferme la modale après confirmation de l'API.
    this.isSubmitting.set(false);
  }

  onOverlayClick(event: MouseEvent): void { if (event.target === event.currentTarget) this.fermer(); }
}
