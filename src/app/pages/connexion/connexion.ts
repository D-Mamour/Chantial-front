import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './connexion.html',
  styleUrl: './connexion.css'
})
export class ConnexionComponent {

  isSubmitting = signal(false);
  showPassword = signal(false);

  connexionForm;

  constructor(private fb: FormBuilder) {

    this.connexionForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required
        ]
      ]
    });
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  seConnecter(): void {

    if (this.connexionForm.invalid) {
      this.connexionForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    const credentials = this.connexionForm.value;

    console.log('Connexion :', credentials);

    // Exemple avec ton service :
    //
    // this.authService.login(credentials).subscribe({
    //   next: (response) => {
    //     this.isSubmitting.set(false);
    //     this.router.navigate(['/dashboard']);
    //   },
    //   error: (error) => {
    //     this.isSubmitting.set(false);
    //   }
    // });

    setTimeout(() => {
      this.isSubmitting.set(false);
    }, 800);
  }
}