import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { ANALYTICS } from '../../environments/environment';

export type ChoixConsentement = 'accepte' | 'refuse' | null;

/**
 * Centralise le consentement aux mesures d'audience.
 * Aucun script analytics n'est chargé avant un consentement explicite.
 */
@Injectable({ providedIn: 'root' })
export class ConsentementService {
  private readonly document = inject(DOCUMENT);
  readonly choix = signal<ChoixConsentement>(this.lireChoix());

  accepter(): void {
    localStorage.setItem('chantial_consentement_analytics', 'accepte');
    this.choix.set('accepte');
    this.chargerAnalytics();
  }
  refuser(): void {
    localStorage.setItem('chantial_consentement_analytics', 'refuse');
    this.choix.set('refuse');
  }

  /** Charge le fournisseur seulement s'il est explicitement configuré en production. */
  chargerAnalytics(): void {
    if (this.choix() !== 'accepte' || !ANALYTICS.enabled || !ANALYTICS.domain) return;
    if (this.document.querySelector('script[data-chantial-analytics]')) return;
    const script = this.document.createElement('script');
    script.defer = true;
    script.src = ANALYTICS.scriptUrl;
    script.dataset['domain'] = ANALYTICS.domain;
    script.dataset['chantialAnalytics'] = 'true';
    this.document.head.appendChild(script);
  }

  private lireChoix(): ChoixConsentement {
    const valeur = localStorage.getItem('chantial_consentement_analytics');
    return valeur === 'accepte' || valeur === 'refuse' ? valeur : null;
  }
}
