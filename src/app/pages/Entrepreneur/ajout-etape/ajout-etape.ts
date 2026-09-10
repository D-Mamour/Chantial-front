import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormGroup, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  standalone: true,
  selector: 'app-ajout-etape',
  styleUrl: './ajout-etape.css',
  templateUrl: './ajout-etape.html',
})
export class AjoutEtape {

    @Output() close = new EventEmitter<void>();
  @Output() stepAdded = new EventEmitter<any>();

  isSubmitting = signal(false);

  steps = [
    'Fondations',
    'Élévation des murs',
    'Toiture',
    'Électricité',
    'Plomberie',
    'Second œuvre',
    'Revêtement',
    'Finitions'
  ];

  stepForm;

  constructor(private fb: FormBuilder) {

    this.stepForm = this.fb.group({

      nomEtape: [
        'Fondations',
        Validators.required
      ],

      ordre: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],

      budget: [
        '',
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      dateDebut: [
        '',
        Validators.required
      ],

      dateFin: [
        '',
        Validators.required
      ],

      description: [
        ''
      ]

    });

  }


  fermer(): void {
    this.close.emit();
  }


  ajouter(): void {

    if (this.stepForm.invalid) {

      this.stepForm.markAllAsTouched();

      return;
    }

    this.isSubmitting.set(true);

    const etape = this.stepForm.value;

    console.log('Étape ajoutée :', etape);

    this.stepAdded.emit(etape);

    this.isSubmitting.set(false);

    this.fermer();
  }


  onOverlayClick(event: MouseEvent): void {

    if (event.target === event.currentTarget) {
      this.fermer();
    }

  }
}