import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './inscription.html',
  styleUrl: './inscription.css',
})
export class InscriptionComponent {
  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  role = signal<'entrepreneur' | 'bailleur'>('entrepreneur');

  inscriptionForm;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.inscriptionForm = this.fb.group({
      role: ['entrepreneur', Validators.required],

      prenom: ['', [Validators.required, Validators.minLength(2)]],

      nom: ['', [Validators.required, Validators.minLength(2)]],

      email: ['', [Validators.required, Validators.email]],

      telephone: ['', [Validators.required]],

      password: ['', [Validators.required, Validators.minLength(8)]],

      confirmPassword: ['', [Validators.required]],
    });
  }

  selectRole(role: 'entrepreneur' | 'bailleur'): void {
    this.role.set(role);

    this.inscriptionForm.patchValue({
      role,
    });
  }

  togglePassword(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  inscrire(): void {
    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched();
      return;
    }

    const password = this.inscriptionForm.value.password;
    const confirmPassword = this.inscriptionForm.value.confirmPassword;

    if (password !== confirmPassword) {
      this.inscriptionForm.get('confirmPassword')?.setErrors({
        passwordMismatch: true,
      });

      return;
    }

    this.isSubmitting.set(true);

    const data = {
      ...this.inscriptionForm.value,
      role: this.role(),
    };

    this.authService.inscription(data).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/connexion']);
      },
      error: () => this.isSubmitting.set(false),
    });
  }
}
