import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from '../../environments/environment';
import { AuthResponse, Utilisateur } from '../models/api.models';

/** Données minimales nécessaires à la création d'un compte. */
export interface InscriptionPayload {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  telephone?: string;
  role: string;
}

/**
 * Service d'authentification et de gestion de la session utilisateur.
 * La session est limitée à l'onglet du navigateur via sessionStorage.
 * IMPORTANT : la protection définitive des jetons nécessite côté Django des cookies
 * HttpOnly/Secure/SameSite ; le frontend seul ne peut pas rendre un JWT inaccessible à XSS.
 * Les données utilisateur et les jetons sont conservés dans sessionStorage : ils sont
 * supprimés à la fermeture de l'onglet. La sécurité d'autorisation reste imposée par Django.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Utilisateur connecté, partagé réactivement dans toute l'application. */
  readonly utilisateur = signal<Utilisateur | null>(this.lireUtilisateur());
  /** Utilisateurs visibles pour le rôle courant (bailleurs pour un entrepreneur). */
  readonly utilisateursSignal = signal<Utilisateur[]>([]);
  /** Nom affichable du compte connecté, calculé automatiquement. */
  readonly nomComplet = computed(() => {
    const u = this.utilisateur();
    return u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email : '';
  });

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  /** Authentifie un utilisateur avec son adresse e-mail et son mot de passe. */
  connexion(email: string, password: string) {
    const emailNormalise = email.trim().toLowerCase();
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/connexion/`, {
        email: emailNormalise,
        mot_de_passe: password,
      })
      .pipe(tap((r) => this.enregistrerSession(r)));
  }

  /** Crée un compte en adaptant les noms de champs du formulaire à ceux de Django. */
  inscription(data: InscriptionPayload) {
    return this.http.post(`${API_URL}/utilisateurs/`, {
      email: String(data.email ?? '')
        .trim()
        .toLowerCase(),
      mot_de_passe: data.password,
      first_name: data.prenom,
      last_name: data.nom,
      telephone: data.telephone,
      role: String(data.role).toUpperCase(),
    });
  }

  /** Renouvelle le jeton d'accès à partir du refresh token JWT. */
  rafraichirToken() {
    const refresh = sessionStorage.getItem('chantial_refresh');
    return this.http
      .post<{ access: string }>(`${API_URL}/auth/rafraichir/`, { refresh })
      .pipe(tap((reponse) => sessionStorage.setItem('chantial_access', reponse.access)));
  }

  /** Récupère le profil de l'utilisateur connecté. */
  profil() {
    return this.http.get<Utilisateur>(`${API_URL}/auth/profil/`);
  }

  /** Rafraîchit le signal utilisateur avec les données actuelles du backend. */
  rafraichirProfil() {
    return this.profil().pipe(
      tap((utilisateur) => {
        sessionStorage.setItem('chantial_user', JSON.stringify(utilisateur));
        this.utilisateur.set(utilisateur);
      }),
    );
  }

  /** Modifie les informations du profil connecté. */
  modifierProfil(data: Partial<Utilisateur>) {
    return this.http.patch<Utilisateur>(`${API_URL}/auth/profil/`, data);
  }

  /** Met à jour la copie locale après une modification réussie du profil. */
  mettreAJourUtilisateurLocal(utilisateur: Utilisateur) {
    sessionStorage.setItem('chantial_user', JSON.stringify(utilisateur));
    this.utilisateur.set(utilisateur);
  }

  /** Récupère les utilisateurs visibles selon le rôle courant. */
  utilisateurs() {
    return this.http
      .get<Utilisateur[] | { results?: Utilisateur[] }>(`${API_URL}/utilisateurs/`)
      .pipe(
        map((r) => (Array.isArray(r) ? r : (r.results ?? []))),
        tap((utilisateurs) => this.utilisateursSignal.set(utilisateurs)),
      );
  }
  /** Met à jour un utilisateur. */
  modifierUtilisateur(id: string, data: Partial<Utilisateur>) {
    return this.http.patch<Utilisateur>(`${API_URL}/utilisateurs/${id}/`, data);
  }
  /** Désactive/supprime un utilisateur via l'API selon la logique du backend. */
  supprimerUtilisateur(id: string) {
    return this.http.delete(`${API_URL}/utilisateurs/${id}/`);
  }

  /** Redirige vers l'espace correspondant au rôle. */
  redirigerSelonRole(role?: string) {
    const r = role || this.utilisateur()?.role;
    if (r === 'ENTREPRENEUR') this.router.navigate(['/entrepreneur/projet']);
    else if (r === 'BAILLEUR') this.router.navigate(['/bailleur/dashboard']);
    else if (r === 'ADMINISTRATEUR') this.router.navigate(['/administrateur']);
    else this.router.navigate(['/']);
  }

  /** Supprime la session locale puis retourne à la page de connexion. */
  deconnexion() {
    sessionStorage.removeItem('chantial_access');
    sessionStorage.removeItem('chantial_refresh');
    sessionStorage.removeItem('chantial_user');
    this.utilisateur.set(null);
    this.router.navigate(['/connexion']);
  }

  estConnecte() {
    return !!sessionStorage.getItem('chantial_access');
  }
  token() {
    return sessionStorage.getItem('chantial_access');
  }

  private enregistrerSession(r: AuthResponse) {
    sessionStorage.setItem('chantial_access', r.access);
    sessionStorage.setItem('chantial_refresh', r.refresh);
    sessionStorage.setItem('chantial_user', JSON.stringify(r.utilisateur));
    this.utilisateur.set(r.utilisateur);
  }

  private lireUtilisateur(): Utilisateur | null {
    try {
      const raw = sessionStorage.getItem('chantial_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
