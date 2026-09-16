import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar-bailleur',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-bailleur.html',
  styleUrl: './sidebar-bailleur.css'
})
export class SidebarBailleurComponent {

  isOpen = signal(false);

  menuItems = [
    {
      label: 'Tableau de bord',
      icon: 'fa-solid fa-grip',
      route: '/bailleur/dashboard'
    },
    {
      label: 'Ma Construction',
      icon: 'fa-solid fa-building',
      route: '/bailleur/construction'
    },
    {
      label: 'Administration',
      icon: 'fa-solid fa-users',
      route: '/bailleur/administration'
    },
    {
      label: 'Notifications',
      icon: 'fa-solid fa-bell',
      route: '/bailleur/notifications'
    }
  ];

  toggleSidebar(): void {
    this.isOpen.update(value => !value);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
  }

}