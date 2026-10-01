import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

/** Barre latérale connectée au profil réel de l'utilisateur. */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent implements OnInit {
  profileMenuOpen = false;
  mobileMenuOpen = false;
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  utilisateur = this.authService.utilisateur;

  ngOnInit(): void {
    // Rafraîchit le profil depuis Django afin d'éviter d'afficher une ancienne valeur locale.
    this.authService.rafraichirProfil().subscribe();
  }

  nomComplet(): string {
    const u = this.utilisateur();
    return u ? (`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email) : 'Utilisateur';
  }

  libelleRole(): string {
    const role = this.utilisateur()?.role;
    if (role === 'ENTREPRENEUR') return 'Entrepreneur';
    if (role === 'BAILLEUR') return 'Bailleur';
    if (role === 'ADMINISTRATEUR') return 'Administrateur';
    return '';
  }

  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMobileMenu(): void { this.mobileMenuOpen = false; }
  toggleProfileMenu(): void { this.profileMenuOpen = !this.profileMenuOpen; }

  goToProfile(): void {
    this.profileMenuOpen = false;
    this.closeMobileMenu();
    this.router.navigate(['/entrepreneur/profil']);
  }

  logout(): void {
    this.profileMenuOpen = false;
    this.closeMobileMenu();
    this.authService.deconnexion();
  }
}
