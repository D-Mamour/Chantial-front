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

  @Output() closed = new EventEmitter<void>();

  @Output() stepAdded = new EventEmitter<any>();

  isOpen = false;

  stepForm: FormGroup;


  constructor(private fb: FormBuilder) {

    this.stepForm = this.fb.group({

      name: ['', Validators.required],

      order: [
        '',
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

      startDate: ['', Validators.required],

      endDate: ['', Validators.required],

      description: ['']

    });

  }


  open(): void {
    this.isOpen = true;

    document.body.classList.add('overflow-hidden');
  }


  close(): void {
    this.isOpen = false;

    document.body.classList.remove('overflow-hidden');

    this.closed.emit();
  }


  submit(): void {

    if (this.stepForm.invalid) {

      this.stepForm.markAllAsTouched();

      return;
    }


    const step = this.stepForm.value;

    console.log('Nouvelle étape :', step);

    this.stepAdded.emit(step);

    this.stepForm.reset();

    this.close();

  }
}
