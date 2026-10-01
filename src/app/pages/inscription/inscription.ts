import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService, InscriptionPayload } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-inscription',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './inscription.html',
  styleUrl: './inscription.css',
})
export class InscriptionComponent {
  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  erreur = signal('');

  role = signal<'entrepreneur' | 'bailleur'>('entrepreneur');

  inscriptionForm;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.inscriptionForm = this.fb.group({
      role: ['entrepreneur', Validators.required],

      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/)]],

      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80), Validators.pattern(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/)]],

      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],

      telephone: ['', [Validators.required, Validators.pattern(/^[0-9 +()\-]{8,20}$/)]],

      password: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(128)]],

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

    this.erreur.set('');
    this.isSubmitting.set(true);

    // Construit explicitement le payload attendu par l'API afin d'éviter
    // d'envoyer des valeurs nulles ou indéfinies issues du formulaire Angular.
    const valeurs = this.inscriptionForm.getRawValue();
    const data: InscriptionPayload = {
      prenom: (valeurs.prenom ?? '').trim(),
      nom: (valeurs.nom ?? '').trim(),
      email: (valeurs.email ?? '').trim().toLowerCase(),
      telephone: (valeurs.telephone ?? '').trim(),
      password: valeurs.password ?? '',
      role: this.role(),
    };

    this.authService.inscription(data).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.router.navigate(['/connexion']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.erreur.set('Création du compte impossible. Vérifiez les informations saisies.');
      },
    });
  }
}
