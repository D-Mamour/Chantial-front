import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { API_URL } from '../../environments/environment';
import { Analyse, Anomalie, Recommandation } from '../models/api.models';

/** Store réactif des résultats produits par le module d'intelligence. */
@Injectable({ providedIn: 'root' })
export class IntelligenceService {
  private readonly http = inject(HttpClient);
  private liste<T>(reponse: T[] | { results?: T[] } | null | undefined): T[] {
    if (Array.isArray(reponse)) return reponse;
    return Array.isArray(reponse?.results) ? reponse.results : [];
  }
  readonly analysesSignal = signal<Analyse[]>([]);
  readonly anomaliesSignal = signal<Anomalie[]>([]);
  readonly recommandationsSignal = signal<Recommandation[]>([]);

  analyses() {
    return this.http.get<Analyse[] | { results?: Analyse[] }>(`${API_URL}/analyses/`).pipe(
      map((v) => this.liste(v)),
      tap((v) => this.analysesSignal.set(v)),
    );
  }
  anomalies() {
    return this.http.get<Anomalie[] | { results?: Anomalie[] }>(`${API_URL}/anomalies/`).pipe(
      map((v) => this.liste(v)),
      tap((v) => this.anomaliesSignal.set(v)),
    );
  }
  recommandations() {
    return this.http
      .get<Recommandation[] | { results?: Recommandation[] }>(`${API_URL}/recommandations/`)
      .pipe(
        map((v) => this.liste(v)),
        tap((v) => this.recommandationsSignal.set(v)),
      );
  }

  /** Lance l'analyse puis rafraîchit le signal avec l'analyse renvoyée. */
  lancerAnalyse(projet: string) {
    return this.http
      .post<{ analyse: Analyse; rag: unknown }>(`${API_URL}/analyses/lancer/`, { projet })
      .pipe(
        tap((reponse) =>
          this.analysesSignal.update((liste) => [
            reponse.analyse,
            ...liste.filter((a) => a.id !== reponse.analyse.id),
          ]),
        ),
      );
  }
}
