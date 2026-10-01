import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { InteractionService } from '../../../services/interaction.service';

/** Administration des comptes, sans données métier écrites en dur. */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
})
export class AdminComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly interactionService = inject(InteractionService);

  readonly utilisateurs = this.authService.utilisateursSignal;
  readonly selectedUser = signal<any | null>(null);
  readonly activity = signal<any[]>([]);
  readonly erreur = signal('');
  readonly enregistrement = signal(false);
  readonly aujourdHui = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date());

  readonly totalUtilisateurs = computed(() => this.utilisateurs().length);
  readonly totalBailleurs = computed(
    () => this.utilisateurs().filter((u) => u.role === 'BAILLEUR' && u.statut === 'ACTIF').length,
  );
  readonly totalEntrepreneurs = computed(
    () =>
      this.utilisateurs().filter((u) => u.role === 'ENTREPRENEUR' && u.statut === 'ACTIF').length,
  );
  readonly totalInactifs = computed(
    () => this.utilisateurs().filter((u) => u.statut !== 'ACTIF').length,
  );

  form: any = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    role: 'ENTREPRENEUR',
    actif: true,
    password: '',
  };

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.erreur.set('');
    forkJoin({
      utilisateurs: this.authService.utilisateurs(),
      historique: this.interactionService.historique(),
    }).subscribe({
      next: ({ historique }) =>
        this.activity.set(
          historique.map((h) => ({
            initials: '',
            date: this.dateHeure(h.date_action),
            text: h.description || h.action,
          })),
        ),
      error: (err) =>
        this.erreur.set(err?.error?.detail || 'Impossible de charger les données administrateur.'),
    });
  }

  /** Vue adaptée au tableau HTML existant. */
  get users() {
    return this.utilisateurs().map((u) => ({
      id: u.id,
      nom: `${u.first_name} ${u.last_name}`.trim() || u.email,
      email: u.email,
      telephone: u.telephone,
      role:
        u.role === 'ADMINISTRATEUR' ? 'Admin' : u.role === 'BAILLEUR' ? 'Bailleur' : 'Entrepreneur',
      statut: u.statut === 'ACTIF' ? 'Actif' : 'Suspendu',
      date: this.date(u.date_creation),
      brut: u,
    }));
  }

  editUser(u: any) {
    this.selectedUser.set(u);
    this.form = {
      prenom: u.brut.first_name,
      nom: u.brut.last_name,
      email: u.email,
      telephone: u.brut.telephone || '',
      role: u.brut.role,
      actif: u.brut.statut === 'ACTIF',
      password: '',
    };
  }
  createUser() {
    this.selectedUser.set(null);
    this.form = {
      prenom: '',
      nom: '',
      email: '',
      telephone: '',
      role: 'ENTREPRENEUR',
      actif: true,
      password: '',
    };
  }
  toggleUser(u: any) {
    this.authService
      .modifierUtilisateur(u.id, { statut: u.statut === 'ACTIF' ? 'INACTIF' : 'ACTIF' })
      .subscribe({
        next: () => this.charger(),
        error: (e) => this.erreur.set(e?.error?.detail || 'Modification impossible.'),
      });
  }
  deleteUser(u: any) {
    if (!confirm(`Désactiver le compte de ${u.nom} ?`)) return;
    this.authService
      .supprimerUtilisateur(u.id)
      .subscribe({
        next: () => this.charger(),
        error: (e) => this.erreur.set(e?.error?.detail || 'Désactivation impossible.'),
      });
  }

  saveUser() {
    this.erreur.set('');
    const email = String(this.form.email || '')
      .trim()
      .toLowerCase();
    const telephone = String(this.form.telephone || '').trim();
    if (!String(this.form.prenom || '').trim() || !String(this.form.nom || '').trim()) {
      this.erreur.set('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.erreur.set('Saisissez une adresse e-mail valide.');
      return;
    }
    if (telephone && !/^[0-9 +()\-]{6,20}$/.test(telephone)) {
      this.erreur.set('Le numéro de téléphone est invalide.');
      return;
    }
    if (!this.selectedUser() && String(this.form.password || '').length < 8) {
      this.erreur.set('Le mot de passe initial doit contenir au moins 8 caractères.');
      return;
    }
    this.form = {
      ...this.form,
      prenom: String(this.form.prenom).trim(),
      nom: String(this.form.nom).trim(),
      email,
      telephone,
    };
    this.enregistrement.set(true);
    const selection = this.selectedUser();
    const requete = selection
      ? this.authService.modifierUtilisateur(selection.id, {
          first_name: this.form.prenom,
          last_name: this.form.nom,
          email: this.form.email,
          telephone: this.form.telephone,
          role: this.form.role,
          statut: this.form.actif ? 'ACTIF' : 'INACTIF',
        })
      : this.authService.inscription({
          prenom: this.form.prenom,
          nom: this.form.nom,
          email: this.form.email,
          telephone: this.form.telephone,
          role: this.form.role,
          password: this.form.password,
        });
    requete.subscribe({
      next: () => {
        this.enregistrement.set(false);
        this.createUser();
        this.charger();
      },
      error: (e) => {
        this.enregistrement.set(false);
        this.erreur.set(this.messageErreur(e));
      },
    });
  }

  private date(v: string) {
    return v ? new Intl.DateTimeFormat('fr-FR').format(new Date(v)) : '—';
  }
  private dateHeure(v: string) {
    return v
      ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
          new Date(v),
        )
      : '—';
  }
  private messageErreur(err: any) {
    return err?.error
      ? Object.entries(err.error)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' — ')
      : 'Opération impossible.';
  }
}
