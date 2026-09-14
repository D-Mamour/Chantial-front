import { Component } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {

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

    this.router.navigate(['/login']);
  }
}