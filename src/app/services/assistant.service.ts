import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../environments/environment';

/** Source documentaire utilisée par le RAG pour construire une réponse. */
export interface AssistantSource {
  document: string;
  score: number;
}

/** Réponse normalisée de l'assistant Chantial. */
export interface AssistantResponse {
  reponse: string;
  llm_disponible: boolean;
  projet: string;
  projet_nom: string;
  sources: AssistantSource[];
}

/**
 * Point d'accès unique au chatbot.
 * Le token Hugging Face n'est jamais exposé dans Angular : l'IA est appelée par Django.
 */
@Injectable({ providedIn: 'root' })
export class AssistantService {
  private readonly http = inject(HttpClient);

  poserQuestion(question: string, projet?: string) {
    return this.http.post<AssistantResponse>(`${API_URL}/assistant/`, {
      question: question.trim(),
      projet: projet || null,
    });
  }
}
