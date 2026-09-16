import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Router } from '@angular/router';
import { API_URL } from '../../environments/environment';
import { AuthResponse, Utilisateur } from '../models/api.models'; 

@Injectable({ providedIn: 'root' })
export class AuthService {
  utilisateur = signal<Utilisateur | null>(this.lireUtilisateur());

  constructor(private http: HttpClient, private router: Router) {}

  connexion(email: string, password: string) {
    return this.http.post<AuthResponse>(`${API_URL}/auth/connexion/`, {
      email, mot_de_passe: password
    }).pipe(tap(r => this.enregistrerSession(r)));
  }

  inscription(data: any) {
    return this.http.post(`${API_URL}/auth/inscription/`, {
      email: data.email,
      mot_de_passe: data.password,
      first_name: data.prenom,
      last_name: data.nom,
      telephone: data.telephone,
      role: String(data.role).toUpperCase()
    });
  }

  profil() { return this.http.get<Utilisateur>(`${API_URL}/auth/profil/`); }

  redirigerSelonRole(role?: string) {
    const r = role || this.utilisateur()?.role;
    if (r === 'ENTREPRENEUR') this.router.navigate(['/entrepreneur/projet']);
    else if (r === 'BAILLEUR') this.router.navigate(['/bailleur/dashboard']);
    else if (r === 'ADMINISTRATEUR') this.router.navigate(['/administrateur']);
    else this.router.navigate(['/']);
  }

  deconnexion() {
    localStorage.removeItem('chantial_access');
    localStorage.removeItem('chantial_refresh');
    localStorage.removeItem('chantial_user');
    this.utilisateur.set(null);
    this.router.navigate(['/connexion']);
  }

  estConnecte() { return !!localStorage.getItem('chantial_access'); }
  token() { return localStorage.getItem('chantial_access'); }

  private enregistrerSession(r: AuthResponse) {
    localStorage.setItem('chantial_access', r.access);
    localStorage.setItem('chantial_refresh', r.refresh);
    localStorage.setItem('chantial_user', JSON.stringify(r.utilisateur));
    this.utilisateur.set(r.utilisateur);
  }

  private lireUtilisateur(): Utilisateur | null {
    try {
      const raw = localStorage.getItem('chantial_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
}
