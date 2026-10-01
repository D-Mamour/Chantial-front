import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs';
import { API_URL } from '../../environments/environment';
import { DocumentProjet, ExtractionOCR, Justificatif } from '../models/api.models';

/**
 * Store documentaire réactif.
 * Les justificatifs et résultats OCR sont conservés dans des signals Angular 22.
 */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);

  /** Normalise les listes DRF, paginées ou non. */
  private liste<T>(reponse: T[] | { results?: T[] } | null | undefined): T[] {
    if (Array.isArray(reponse)) return reponse;
    return Array.isArray(reponse?.results) ? reponse.results : [];
  }

  private listeApi<T>(url: string) {
    return this.http.get<T[] | { results?: T[] }>(url).pipe(map((r) => this.liste<T>(r)));
  }

  readonly justificatifsSignal = signal<Justificatif[]>([]);
  readonly extractionsSignal = signal<ExtractionOCR[]>([]);
  readonly documentsSignal = signal<DocumentProjet[]>([]);
  readonly nombreJustificatifs = computed(() => this.justificatifsSignal().length);

  justificatifs() {
    return this.listeApi<Justificatif>(`${API_URL}/justificatifs/`).pipe(
      tap((liste) => this.justificatifsSignal.set(liste)),
    );
  }

  ajouterJustificatif(depense: string, fichier: File, typeDocument = 'FACTURE') {
    const formulaire = new FormData();
    formulaire.append('depense', depense);
    formulaire.append('fichier', fichier);
    formulaire.append('type_document', typeDocument.trim().slice(0, 80) || 'FACTURE');
    return this.http
      .post<Justificatif>(`${API_URL}/justificatifs/`, formulaire)
      .pipe(
        tap((justificatif) => this.justificatifsSignal.update((liste) => [justificatif, ...liste])),
      );
  }

  /** Vérifie que le moteur OCR du serveur est disponible. */
  etatOcr() {
    return this.http.get<{ disponible: boolean; version?: string; detail?: string }>(
      `${API_URL}/justificatifs/etat-ocr/`,
    );
  }

  /** Relance l'OCR d'un justificatif puis met à jour le store. */
  relancerOcr(id: string) {
    return this.http.post<ExtractionOCR>(`${API_URL}/justificatifs/${id}/relancer-ocr/`, {}).pipe(
      tap((extraction) =>
        this.extractionsSignal.update((liste) => {
          const index = liste.findIndex((x) => x.id === extraction.id);
          return index >= 0
            ? liste.map((x) => (x.id === extraction.id ? extraction : x))
            : [extraction, ...liste];
        }),
      ),
    );
  }

  extractions() {
    return this.listeApi<ExtractionOCR>(`${API_URL}/extractions-ocr/`).pipe(
      tap((liste) => this.extractionsSignal.set(liste)),
    );
  }

  documents() {
    return this.listeApi<DocumentProjet>(`${API_URL}/documents/`).pipe(
      tap((liste) => this.documentsSignal.set(liste)),
    );
  }

  ajouterDocument(formulaire: FormData) {
    return this.http
      .post<DocumentProjet>(`${API_URL}/documents/`, formulaire)
      .pipe(tap((document) => this.documentsSignal.update((liste) => [document, ...liste])));
  }

  indexerRag(id: string) {
    return this.http.post(`${API_URL}/documents/${id}/indexer_rag/`, {});
  }
}
