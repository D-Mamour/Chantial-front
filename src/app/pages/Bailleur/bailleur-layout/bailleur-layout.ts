import { Component } from '@angular/core';
import { SidebarBailleurComponent } from '../sidebar-bailleur/sidebar-bailleur';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [SidebarBailleurComponent, RouterOutlet],
  selector: 'app-bailleur-layout',
  styleUrl: './bailleur-layout.css',
  templateUrl: './bailleur-layout.html',
})
export class BailleurLayout {}
