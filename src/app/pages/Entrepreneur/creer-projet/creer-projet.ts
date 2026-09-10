import { Component, EventEmitter, Output, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

@Component({
  selector: 'app-creer-projet',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './creer-projet.html',
  styleUrl: './creer-projet.css'
})
export class CreerProjet {

  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<any>();

  isSubmitting = signal(false);

  projectForm;

  constructor(private fb: FormBuilder) {

    this.projectForm = this.fb.group({
      nom: ['', Validators.required],

      description: ['', Validators.required],

      adresse: ['', Validators.required],

      bailleur: ['', Validators.required],

      budget: ['', [
        Validators.required,
        Validators.min(1)
      ]],

      dateDebut: ['', Validators.required],

      dateFin: ['', Validators.required]
    });

  }


  fermer(): void {
    this.close.emit();
  }


  creerProjet(): void {

    if (this.projectForm.invalid) {

      this.projectForm.markAllAsTouched();

      return;
    }

    this.isSubmitting.set(true);

    const projet = this.projectForm.value;

    console.log('Projet créé :', projet);

    this.projectCreated.emit(projet);

    this.isSubmitting.set(false);

    this.fermer();
  }


  // Fermer uniquement si on clique sur l'arrière-plan
  onOverlayClick(event: MouseEvent): void {

    if (event.target === event.currentTarget) {
      this.fermer();
    }

  }
}