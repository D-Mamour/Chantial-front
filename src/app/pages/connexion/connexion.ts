import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-connexion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './connexion.html',
  styleUrl: './connexion.css',
})
export class ConnexionComponent {
  isSubmitting = signal(false);
  showPassword = signal(false);

  connexionForm;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.connexionForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],

      password: ['', [Validators.required]],
    });
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  seConnecter(): void {
    if (this.connexionForm.invalid) {
      this.connexionForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const { email, password } = this.connexionForm.getRawValue();
    this.authService.connexion(email || '', password || '').subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.authService.redirigerSelonRole(response.utilisateur.role);
      },
      error: () => this.isSubmitting.set(false),
    });
  }
}
