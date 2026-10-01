import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { API_URL } from '../../environments/environment';
import { Alerte, Demande, Historique } from '../models/api.models';

/** Store réactif des demandes, alertes et traces d'audit. */
@Injectable({ providedIn: 'root' })
export class InteractionService {
  private readonly http = inject(HttpClient);
  private liste<T>(reponse: T[] | { results?: T[] } | null | undefined): T[] {
    if (Array.isArray(reponse)) return reponse;
    return Array.isArray(reponse?.results) ? reponse.results : [];
  }
  readonly demandesSignal = signal<Demande[]>([]);
  readonly alertesSignal = signal<Alerte[]>([]);
  readonly historiqueSignal = signal<Historique[]>([]);
  readonly alertesNonLues = computed(() => this.alertesSignal().filter((a) => !a.est_lue).length);

  demandes() {
    return this.http.get<Demande[] | { results?: Demande[] }>(`${API_URL}/demandes/`).pipe(
      map((v) => this.liste(v)),
      tap((v) => this.demandesSignal.set(v)),
    );
  }
  creerDemande(data: unknown) {
    return this.http
      .post<Demande>(`${API_URL}/demandes/`, data)
      .pipe(tap((v) => this.demandesSignal.update((l) => [v, ...l])));
  }
  modifierDemande(id: string, data: unknown) {
    return this.http
      .patch<Demande>(`${API_URL}/demandes/${id}/`, data)
      .pipe(tap((v) => this.demandesSignal.update((l) => l.map((d) => (d.id === v.id ? v : d)))));
  }
  /** Marque une alerte comme lue et synchronise le signal local. */
  marquerAlerteLue(id: string) {
    return this.http
      .post<Alerte>(`${API_URL}/alertes/${id}/marquer_lue/`, {})
      .pipe(tap((v) => this.alertesSignal.update((l) => l.map((a) => (a.id === v.id ? v : a)))));
  }
  toutMarquerLu() {
    return this.http
      .post(`${API_URL}/alertes/tout_marquer_lu/`, {})
      .pipe(tap(() => this.alertesSignal.update((l) => l.map((a) => ({ ...a, est_lue: true })))));
  }
  repondreDemande(id: string, reponse: string) {
    return this.http
      .post<Demande>(`${API_URL}/demandes/${id}/repondre/`, { reponse })
      .pipe(tap((v) => this.demandesSignal.update((l) => l.map((d) => (d.id === v.id ? v : d)))));
  }

  alertes() {
    return this.http.get<Alerte[] | { results?: Alerte[] }>(`${API_URL}/alertes/`).pipe(
      map((v) => this.liste(v)),
      tap((v) => this.alertesSignal.set(v)),
    );
  }
  historique() {
    return this.http.get<Historique[] | { results?: Historique[] }>(`${API_URL}/historique/`).pipe(
      map((v) => this.liste(v)),
      tap((v) => this.historiqueSignal.set(v)),
    );
  }
}
