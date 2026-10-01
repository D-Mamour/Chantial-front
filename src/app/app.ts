import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AssistantChantialComponent } from './components/assistant-chantial/assistant-chantial';
import { CookieBannerComponent } from './components/cookie-banner/cookie-banner';
import { ConsentementService } from './services/consentement.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AssistantChantialComponent,
    CookieBannerComponent,
  ],
  templateUrl: 'app.html',
})
export class App {
  /** Initialise, si autorisé, la mesure d'audience après rechargement. */
  constructor(consentement: ConsentementService) { consentement.chargerAnalytics(); }
}
