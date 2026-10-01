import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

/** Navigation responsive réservée à l'administrateur. */
@Component({
  selector: 'app-sidebar-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-admin.html',
})
export class SidebarAdminComponent implements OnInit {
  mobileMenuOpen = false;
  profileMenuOpen = false;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly utilisateur = this.auth.utilisateur;

  ngOnInit(): void {
    // Le profil affiché vient du serveur et non d'une donnée fictive.
    this.auth.rafraichirProfil().subscribe();
  }

  nomComplet(): string {
    const u = this.utilisateur();
    return u ? (`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email) : 'Administrateur';
  }

  toggleMobileMenu(): void { this.mobileMenuOpen = !this.mobileMenuOpen; }
  closeMobileMenu(): void { this.mobileMenuOpen = false; }
  toggleProfileMenu(): void { this.profileMenuOpen = !this.profileMenuOpen; }

  allerProfil(): void {
    this.profileMenuOpen = false;
    this.closeMobileMenu();
    this.router.navigate(['/administrateur/profil']);
  }

  logout(): void {
    this.profileMenuOpen = false;
    this.closeMobileMenu();
    this.auth.deconnexion();
  }
}
