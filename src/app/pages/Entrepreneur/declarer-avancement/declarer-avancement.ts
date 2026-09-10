import { Component, EventEmitter, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  standalone: true,
  selector: 'app-declarer-avancement',
  styleUrl: './declarer-avancement.css',
  templateUrl: './declarer-avancement.html',
})
export class DeclarerAvancement {

  @Output() close = new EventEmitter<void>();
  @Output() progressDeclared = new EventEmitter<any>();

  isSubmitting = signal(false);

  currentProgress = 75;

  steps = [
    'Fondations',
    'Élévation des murs',
    'Toiture',
    'Électricité',
    'Plomberie',
    'Finitions'
  ];

  progressForm;

  constructor(private fb: FormBuilder) {

    this.progressForm = this.fb.group({
      etape: ['Toiture', Validators.required],

      pourcentage: [
        75,
        [
          Validators.required,
          Validators.min(0),
          Validators.max(100)
        ]
      ],

      dateDeclaration: [
        '2026-03-10',
        Validators.required
      ],

      commentaire: [
        '',
        Validators.required
      ]
    });

  }


  fermer(): void {
    this.close.emit();
  }


  onProgressChange(event: Event): void {

    const input = event.target as HTMLInputElement;

    this.progressForm.patchValue({
      pourcentage: Number(input.value)
    });

  }


  declarer(): void {

    if (this.progressForm.invalid) {

      this.progressForm.markAllAsTouched();

      return;
    }

    this.isSubmitting.set(true);

    const declaration = this.progressForm.value;

    console.log('Avancement déclaré :', declaration);

    this.progressDeclared.emit(declaration);

    this.isSubmitting.set(false);

    this.fermer();
  }


  onOverlayClick(event: MouseEvent): void {

    if (event.target === event.currentTarget) {
      this.fermer();
    }

  }
}
