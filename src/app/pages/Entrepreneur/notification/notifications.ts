import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { InteractionService } from '../../../services/interaction.service';

/** Centre de notifications alimenté par le signal partagé des alertes. */
@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-notifications',
  styleUrl: './notifications.css',
  templateUrl: './notifications.html'
})
export class Notifications implements OnInit {
  private readonly interactionService = inject(InteractionService);
  readonly notifications = this.interactionService.alertesSignal;

  ngOnInit(): void { this.interactionService.alertes().subscribe(); }

  marquerLue(id: string): void { this.interactionService.marquerAlerteLue(id).subscribe(); }
  toutMarquerLu(): void { this.interactionService.toutMarquerLu().subscribe(); }
}
