import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ProjetService } from '../../../services/projet.service';
import { Utilisateur } from '../../../models/api.models';

/** Formulaire de création d'un projet alimenté par les bailleurs réels du backend. */
@Component({ selector: 'app-creer-projet', standalone: true, imports: [ReactiveFormsModule], templateUrl: './creer-projet.html', styleUrl: './creer-projet.css' })
export class CreerProjet implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly projetService = inject(ProjetService);
  private readonly authService = inject(AuthService);

  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<void>();

  readonly bailleurs = signal<Utilisateur[]>([]);
  readonly chargementBailleurs = signal(false);
  readonly erreurBailleurs = signal('');
  readonly erreurCreation = signal('');
  readonly isSubmitting = signal(false);

  readonly projectForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(180)]], description: ['', [Validators.required, Validators.maxLength(3000)]], adresse: ['', [Validators.required, Validators.maxLength(255)]],
    bailleur: ['', Validators.required], budget: [0, [Validators.required, Validators.min(1)]],
    dateDebut: ['', Validators.required], dateFin: ['', Validators.required]
  });

  ngOnInit(): void {
    this.chargementBailleurs.set(true);
    this.authService.utilisateurs().pipe(finalize(() => this.chargementBailleurs.set(false))).subscribe({
      next: users => {
        const bailleurs = users.filter(u => u.role === 'BAILLEUR' && u.statut === 'ACTIF');
        this.bailleurs.set(bailleurs);
        if (!bailleurs.length) this.erreurBailleurs.set('Aucun bailleur actif disponible. Créez d’abord un compte bailleur.');
      },
      error: err => this.erreurBailleurs.set(err?.error?.detail || 'Impossible de charger les bailleurs actifs.')
    });
  }

  fermer(): void { this.close.emit(); }
  creerProjet(): void {
    this.erreurCreation.set('');
    if (this.projectForm.controls.dateDebut.value && this.projectForm.controls.dateFin.value && this.projectForm.controls.dateFin.value < this.projectForm.controls.dateDebut.value) { this.projectForm.controls.dateFin.setErrors({ dateOrder: true }); }
    if (this.projectForm.invalid) { this.projectForm.markAllAsTouched(); return; }
    const v = this.projectForm.getRawValue();
    if (new Date(v.dateFin) < new Date(v.dateDebut)) { this.erreurCreation.set('La date de fin doit être postérieure à la date de début.'); return; }
    this.isSubmitting.set(true);
    this.projetService.creerProjet({
      bailleur: v.bailleur, nom: v.nom.trim(), description: v.description.trim(), localisation: v.adresse.trim(),
      budget_previsionnel: v.budget, date_debut: v.dateDebut, date_fin_prevue: v.dateFin, statut: 'PLANIFIE'
    }).pipe(finalize(() => this.isSubmitting.set(false))).subscribe({
      next: () => { this.projectCreated.emit(); this.fermer(); },
      error: err => this.erreurCreation.set(this.messageErreur(err))
    });
  }
  onOverlayClick(event: MouseEvent): void { if (event.target === event.currentTarget) this.fermer(); }
  private messageErreur(err: any): string {
    if (!err?.error) return 'Création du projet impossible.';
    if (typeof err.error === 'string') return err.error;
    return Object.entries(err.error).map(([champ, message]) => `${champ} : ${Array.isArray(message) ? message.join(', ') : message}`).join(' — ');
  }
}
