import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { API_URL } from '../../environments/environment';
import { Depense } from '../models/api.models';

/** État réactif des dépenses. Toute mutation synchronise automatiquement le signal. */
@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private liste<T>(reponse: T[] | { results?: T[] } | null | undefined): T[] {
    if (Array.isArray(reponse)) return reponse;
    return Array.isArray(reponse?.results) ? reponse.results : [];
  }
  readonly depensesSignal = signal<Depense[]>([]);
  readonly totalDepenses = computed(() =>
    this.depensesSignal().reduce((s, d) => s + Number(d.montant || 0), 0),
  );

  depenses() {
    return this.http.get<Depense[] | { results?: Depense[] }>(`${API_URL}/depenses/`).pipe(
      map((v) => this.liste(v)),
      tap((v) => this.depensesSignal.set(v)),
    );
  }

  creerDepense(data: unknown) {
    return this.http
      .post<Depense>(`${API_URL}/depenses/`, data)
      .pipe(tap((depense) => this.depensesSignal.update((liste) => [depense, ...liste])));
  }

  modifierDepense(id: string, data: unknown) {
    return this.http
      .patch<Depense>(`${API_URL}/depenses/${id}/`, data)
      .pipe(tap((depense) => this.remplacer(depense)));
  }

  supprimerDepense(id: string) {
    return this.http
      .delete<void>(`${API_URL}/depenses/${id}/`)
      .pipe(tap(() => this.depensesSignal.update((liste) => liste.filter((d) => d.id !== id))));
  }

  validerDepense(id: string) {
    return this.http
      .post<Depense>(`${API_URL}/depenses/${id}/valider/`, {})
      .pipe(tap((d) => this.remplacer(d)));
  }
  rejeterDepense(id: string) {
    return this.http
      .post<Depense>(`${API_URL}/depenses/${id}/rejeter/`, {})
      .pipe(tap((d) => this.remplacer(d)));
  }

  private remplacer(depense: Depense) {
    this.depensesSignal.update((liste) => liste.map((d) => (d.id === depense.id ? depense : d)));
  }
}
