import { Location } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

/** Page réactive de consultation et modification du profil connecté. */
@Component({ selector: 'app-profil', standalone: true, imports: [ReactiveFormsModule], templateUrl: './profil.html' })
export class ProfilComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly location = inject(Location);

  readonly enregistrement = signal(false);
  readonly chargement = signal(true);
  readonly message = signal('');

  readonly formulaire = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]], last_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    email: [{ value: '', disabled: true }], telephone: ['', Validators.pattern(/^[0-9 +()\-]{0,20}$/)], role: [{ value: '', disabled: true }]
  });

  ngOnInit(): void {
    this.auth.rafraichirProfil().subscribe({
      next: u => { this.formulaire.patchValue(u); this.chargement.set(false); },
      error: () => { this.message.set('Impossible de charger le profil.'); this.chargement.set(false); }
    });
  }

  enregistrer(): void {
    if (this.formulaire.invalid || this.enregistrement()) { this.formulaire.markAllAsTouched(); return; }
    this.enregistrement.set(true); this.message.set('');
    const v = this.formulaire.getRawValue();
    this.auth.modifierProfil({ first_name: v.first_name, last_name: v.last_name, telephone: v.telephone }).subscribe({
      next: u => { this.auth.mettreAJourUtilisateurLocal(u); this.formulaire.patchValue(u); this.message.set('Profil mis à jour avec succès.'); this.enregistrement.set(false); },
      error: () => { this.message.set('La mise à jour du profil a échoué.'); this.enregistrement.set(false); }
    });
  }

  retour(): void { this.location.back(); }
}
