import { Component, EventEmitter, Output, signal} from '@angular/core';
import { Validators, ReactiveFormsModule, FormBuilder } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-ajout-depense',
  styleUrl: './ajout-depense.css',
  templateUrl: './ajout-depense.html',
})
export class AjoutDepense {
  @Output() close = new EventEmitter<void>();
  @Output() expenseAdded = new EventEmitter<any>();

  isSubmitting = signal(false);

  projects = [
    'Résidence Almadies',
    'École Pikine',
    'Clinique Diamniadio',
    'Pont Kaolack',
    'Logements Rufisque',
    'Centre Commercial Thiès'
  ];

  steps = [
    'Fondations',
    'Élévation',
    'Toiture',
    'Second œuvre',
    'Revêtement',
    'Finitions'
  ];

  categories = [
    'Matériaux',
    'Main d’œuvre',
    'Location',
    'Transport',
    'Équipement',
    'Autres'
  ];

  selectedFile: File | null = null;

  expenseForm;

  constructor(private fb: FormBuilder) {

    this.expenseForm = this.fb.group({

      projet: [
        'Résidence Almadies',
        Validators.required
      ],

      etape: [
        'Fondations',
        Validators.required
      ],

      libelle: [
        '',
        Validators.required
      ],

      categorie: [
        'Matériaux',
        Validators.required
      ],

      montant: [
        '',
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      dateDepense: [
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


  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {

      this.selectedFile = input.files[0];

    }

  }


  onDrop(event: DragEvent): void {

    event.preventDefault();

    if (event.dataTransfer?.files?.length) {

      this.selectedFile = event.dataTransfer.files[0];

    }

  }


  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }


  supprimerFichier(): void {
    this.selectedFile = null;
  }


  enregistrer(): void {

    if (this.expenseForm.invalid) {

      this.expenseForm.markAllAsTouched();

      return;
    }

    this.isSubmitting.set(true);

    const depense = {
      ...this.expenseForm.value,
      justificatif: this.selectedFile
    };

    console.log('Dépense ajoutée :', depense);

    this.expenseAdded.emit(depense);

    this.isSubmitting.set(false);

    this.fermer();
  }


  onOverlayClick(event: MouseEvent): void {

    if (event.target === event.currentTarget) {
      this.fermer();
    }

  }

}
