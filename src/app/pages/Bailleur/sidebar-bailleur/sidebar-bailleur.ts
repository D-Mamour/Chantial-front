import { Component} from '@angular/core';
import { RouterLink, RouterLinkActive ,Router} from '@angular/router';

@Component({
  selector: 'app-sidebar-bailleur',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-bailleur.html',
  styleUrl: './sidebar-bailleur.css'
})
export class SidebarBailleurComponent {

  
  profileMenuOpen = false;
  mobileMenuOpen = false;

  constructor(private router: Router) {}

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  goToProfile(): void {
    this.profileMenuOpen = false;
    this.closeMobileMenu();

    this.router.navigate(['/profil']);
  }

  logout(): void {
    this.profileMenuOpen = false;
    this.closeMobileMenu();

    // Exemple :
    // localStorage.removeItem('token');

    this.router.navigate(['/connexion']);
  }
}