import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConsentementService } from '../../services/consentement.service';

/** Bannière de consentement : aucun analytics optionnel n'est chargé avant le choix. */
@Component({selector:'app-cookie-banner', standalone:true, imports:[RouterLink], templateUrl:'./cookie-banner.html', changeDetection:ChangeDetectionStrategy.OnPush})
export class CookieBannerComponent { readonly consentement = inject(ConsentementService); }
