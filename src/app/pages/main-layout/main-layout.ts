import { Component } from '@angular/core';
import { SidebarComponent } from '../Entrepreneur/sidebar_entrepreneur/sidebar';
import { RouterOutlet } from '@angular/router';

@Component({
  imports: [SidebarComponent, RouterOutlet],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {}
