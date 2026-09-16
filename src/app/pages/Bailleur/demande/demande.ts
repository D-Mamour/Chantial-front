import { Component, EventEmitter, Output, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-demande',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: 'demande.html',
  styleUrl: './demande.css'
})
export class DemandeModalComponent {

  @Output() close = new EventEmitter<void>();
  @Output() requestSent = new EventEmitter<any>();

  isSubmitting = signal(false);

  requestForm;

  elements = [
    'Facture Ciment CPJ45 - 50 tonnes (Gros Œuvre)',
    'Devis initial du projet',
    'Bon de commande',
    'Rapport d’avancement'
  ];

  reasons = [
    'Montant suspect / Écart avec le devis initial',
    'Document manquant',
    'Erreur dans les informations',
    'Autre'
  ];

  constructor(private fb: FormBuilder) {

    this.requestForm = this.fb.group({
      type: ['justification', Validators.required],

      element: ['', Validators.required],

      motif: ['', Validators.required],

      message: ['', [
        Validators.required,
        Validators.minLength(10)
      ]]
    });

  }

  fermer(): void {
    this.close.emit();
  }

  envoyerDemande(): void {

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const demande = this.requestForm.value;

    console.log('Nouvelle demande :', demande);

    this.requestSent.emit(demande);

    this.isSubmitting.set(false);

    this.fermer();
  }

  onOverlayClick(event: MouseEvent): void {

    if (event.target === event.currentTarget) {
      this.fermer();
    }

  }
}