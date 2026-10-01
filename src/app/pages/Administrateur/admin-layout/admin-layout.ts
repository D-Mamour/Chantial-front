import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin';

/**
 * Structure commune de l'espace administrateur.
 * La barre latérale devient un tiroir sur mobile afin de conserver
 * toute la largeur disponible pour le contenu métier.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarAdminComponent],
  templateUrl: './admin-layout.html',
})
export class AdminLayoutComponent {}
