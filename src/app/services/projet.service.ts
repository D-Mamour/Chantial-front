import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize, forkJoin, map, of, tap } from 'rxjs';
import { API_URL } from '../../environments/environment';
import {
  Avancement,
  Etape,
  Projet,
  IndicateursFinanciers,
  Avenant,
  PreuveTerrain,
  SituationTravaux,
} from '../models/api.models';

/**
 * État réactif du domaine « projets ».
 * Angular 22 : les listes sont conservées dans des signals afin que les écrans
 * se mettent à jour immédiatement après une création, sans clic de rafraîchissement.
 */
@Injectable({ providedIn: 'root' })
export class ProjetService {
  private readonly http = inject(HttpClient);

  /** Accepte les listes DRF simples et les réponses paginées { results: [...] }. */
  private liste<T>(reponse: T[] | { results?: T[] } | null | undefined): T[] {
    if (Array.isArray(reponse)) return reponse;
    return Array.isArray(reponse?.results) ? reponse.results : [];
  }

  /** Normalise une réponse de liste avant de la transmettre aux composants. */
  private listeApi<T>(url: string) {
    return this.http.get<T[] | { results?: T[] }>(url).pipe(map((r) => this.liste<T>(r)));
  }

  readonly projetsSignal = signal<Projet[]>([]);
  readonly etapesSignal = signal<Etape[]>([]);
  readonly avancementsSignal = signal<Avancement[]>([]);
  readonly chargement = signal(false);
  readonly erreur = signal<string | null>(null);

  readonly nombreProjets = computed(() => this.projetsSignal().length);

  /** Charge en une fois les données nécessaires au suivi des projets. */
  chargerTout() {
    this.chargement.set(true);
    this.erreur.set(null);
    // Chaque réponse met à jour son signal immédiatement. Ainsi, si une API
    // secondaire échoue, la liste des projets déjà reçue reste affichée.
    return forkJoin({
      // Une API secondaire indisponible ne doit pas empêcher les projets déjà
      // disponibles de s’afficher dans les formulaires et les écrans de détail.
      projets: this.listeApi<Projet>(`${API_URL}/projets/`).pipe(
        tap((v) => this.projetsSignal.set(v)),
        catchError((err) => {
          this.erreur.set('Impossible de charger les projets.');
          return of([] as Projet[]);
        }),
      ),
      etapes: this.listeApi<Etape>(`${API_URL}/etapes/`).pipe(
        tap((v) => this.etapesSignal.set(v)),
        catchError(() => of([] as Etape[])),
      ),
      avancements: this.listeApi<Avancement>(`${API_URL}/avancements/`).pipe(
        tap((v) => this.avancementsSignal.set(v)),
        catchError(() => of([] as Avancement[])),
      ),
    }).pipe(finalize(() => this.chargement.set(false)));
  }

  projets() {
    return this.listeApi<Projet>(`${API_URL}/projets/`).pipe(tap((v) => this.projetsSignal.set(v)));
  }
  projet(id: string) {
    return this.http.get<Projet>(`${API_URL}/projets/${id}/`);
  }

  /** Crée le projet puis l'ajoute immédiatement au signal local. */
  creerProjet(data: unknown) {
    return this.http
      .post<Projet>(`${API_URL}/projets/`, data)
      .pipe(tap((projet) => this.projetsSignal.update((liste) => [projet, ...liste])));
  }

  etapes() {
    return this.listeApi<Etape>(`${API_URL}/etapes/`).pipe(tap((v) => this.etapesSignal.set(v)));
  }
  creerEtape(data: unknown) {
    return this.http
      .post<Etape>(`${API_URL}/etapes/`, data)
      .pipe(tap((etape) => this.etapesSignal.update((liste) => [...liste, etape])));
  }

  avancements() {
    return this.listeApi<Avancement>(`${API_URL}/avancements/`).pipe(
      tap((v) => this.avancementsSignal.set(v)),
    );
  }
  creerAvancement(data: unknown) {
    return this.http
      .post<Avancement>(`${API_URL}/avancements/`, data)
      .pipe(tap((avancement) => this.avancementsSignal.update((liste) => [avancement, ...liste])));
  }
  indicateursFinanciers(projetId: string) {
    return this.http.get<IndicateursFinanciers>(
      `${API_URL}/pilotage/${projetId}/indicateurs-financiers/`,
    );
  }
  rapportPdf(projetId: string) {
    return this.http.get(`${API_URL}/pilotage/${projetId}/rapport-pdf/`, { responseType: 'blob' });
  }
  diffuserRapport(projetId: string, data: { periode: string; email: boolean; whatsapp: boolean }) {
    return this.http.post<any>(`${API_URL}/pilotage/${projetId}/diffuser-rapport/`, data);
  }
  avenants() {
    return this.listeApi<Avenant>(`${API_URL}/avenants/`);
  }
  creerAvenant(data: FormData | unknown) {
    return this.http.post<Avenant>(`${API_URL}/avenants/`, data);
  }
  soumettreAvenant(id: string) {
    return this.http.post<Avenant>(`${API_URL}/avenants/${id}/soumettre/`, {});
  }
  approuverAvenant(id: string, commentaire = '') {
    return this.http.post<Avenant>(`${API_URL}/avenants/${id}/approuver/`, { commentaire });
  }
  rejeterAvenant(id: string, commentaire = '') {
    return this.http.post<Avenant>(`${API_URL}/avenants/${id}/rejeter/`, { commentaire });
  }
  situationsTravaux() {
    return this.listeApi<SituationTravaux>(`${API_URL}/situations-travaux/`);
  }
  creerSituation(data: unknown) {
    return this.http.post<SituationTravaux>(`${API_URL}/situations-travaux/`, data);
  }
  validerSituation(id: string) {
    return this.http.post<SituationTravaux>(`${API_URL}/situations-travaux/${id}/valider/`, {});
  }
  rejeterSituation(id: string, commentaire = '') {
    return this.http.post<SituationTravaux>(`${API_URL}/situations-travaux/${id}/rejeter/`, {
      commentaire,
    });
  }
  journalChantier() {
    return this.listeApi<PreuveTerrain>(`${API_URL}/journal-chantier/`);
  }
  ajouterPreuveTerrain(data: FormData) {
    return this.http.post<PreuveTerrain>(`${API_URL}/journal-chantier/`, data);
  }
}
