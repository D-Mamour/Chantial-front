import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter, finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ProjetService } from '../../services/projet.service';
import { AssistantService, AssistantSource } from '../../services/assistant.service';
import { Projet } from '../../models/api.models';

interface MessageAssistant {
  auteur: 'utilisateur' | 'assistant';
  texte: string;
  sources?: AssistantSource[];
}

/** Assistant contextuel disponible dans tous les espaces authentifiés. */
@Component({
  selector: 'app-assistant-chantial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './assistant-chantial.html',
  styleUrl: './assistant-chantial.css',
})
export class AssistantChantialComponent {
  private readonly auth = inject(AuthService);
  private readonly projetsService = inject(ProjetService);
  private readonly assistant = inject(AssistantService);
  private readonly router = inject(Router);

  readonly ouvert = signal(false);
  readonly chargement = signal(false);
  readonly projets = signal<Projet[]>([]);
  readonly projetSelectionne = signal('');
  readonly messages = signal<MessageAssistant[]>([]);
  private readonly urlCourante = signal(this.router.url);
  question = '';

  constructor() {
    // Router.url n'est pas un signal Angular. On synchronise donc explicitement
    // l'URL après chaque navigation afin de masquer immédiatement l'assistant
    // sur les pages publiques (landing, connexion, inscription, CGU...).
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(event => {
        this.urlCourante.set(event.urlAfterRedirects);
        if (!this.estRouteApplicative(event.urlAfterRedirects)) this.ouvert.set(false);
      });
  }

  /**
   * Affiche l'assistant dans les espaces applicatifs protégés.
   * On ne dépend pas uniquement du token : au rechargement Angular peut reconstruire
   * l'interface avant que certains états réactifs soient rafraîchis. Les routes ci-dessous
   * sont déjà protégées par les guards d'authentification.
   */
  readonly connecte = computed(() => {
    const url = this.urlCourante();
    // L'assistant n'est jamais affiché sur les routes publiques, même si un ancien
    // jeton JWT est encore présent dans le navigateur.
    return this.estRouteApplicative(url) && (this.auth.estConnecte() || !!this.auth.utilisateur());
  });

  private estRouteApplicative(url: string): boolean {
    return ['/entrepreneur', '/bailleur', '/administrateur']
      .some(prefixe => url === prefixe || url.startsWith(`${prefixe}/`) || url.startsWith(`${prefixe}?`));
  }
  readonly suggestions = computed(() => this.auth.utilisateur()?.role === 'BAILLEUR'
    ? [
        'Résume mon chantier',
        'Où en sont le budget et l’avancement ?',
        'Quels éléments nécessitent mon attention ?',
        'Explique les recommandations disponibles',
      ]
    : [
        'Résume ce projet',
        'Où en sont le budget et l’avancement ?',
        'Quels documents du projet sont disponibles ?',
        'Que puis-je vérifier avant de transmettre au bailleur ?',
      ]);

  basculer(): void {
    this.ouvert.update(valeur => !valeur);
    if (this.ouvert() && this.projets().length === 0) {
      this.chargerProjets();
    }
  }

  fermer(): void {
    this.ouvert.set(false);
  }

  choisirSuggestion(texte: string): void {
    this.question = texte;
    this.envoyer();
  }

  envoyer(): void {
    const texte = this.question.trim();
    if (!texte || this.chargement()) return;

    this.messages.update(liste => [...liste, { auteur: 'utilisateur', texte }]);
    this.question = '';
    this.chargement.set(true);

    this.assistant.poserQuestion(texte, this.projetSelectionne() || undefined)
      .pipe(finalize(() => this.chargement.set(false)))
      .subscribe({
        next: reponse => {
          this.messages.update(liste => [...liste, {
            auteur: 'assistant',
            texte: reponse.reponse,
            sources: reponse.sources,
          }]);
        },
        error: erreur => {
          const detail = erreur?.error?.detail || 'Impossible de joindre Assistant Chantial pour le moment.';
          this.messages.update(liste => [...liste, { auteur: 'assistant', texte: detail }]);
        },
      });
  }

  private chargerProjets(): void {
    this.projetsService.projets().subscribe({
      next: projets => {
        this.projets.set(projets);
        if (projets.length > 0 && !this.projetSelectionne()) {
          this.projetSelectionne.set(projets[0].id);
        }
      },
      error: () => this.projets.set([]),
    });
  }
}
