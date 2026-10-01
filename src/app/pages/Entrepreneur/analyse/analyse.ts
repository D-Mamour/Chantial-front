import { ProjetService } from '../../../services/projet.service';
import { FinanceService } from '../../../services/finance.service';
import { IntelligenceService } from '../../../services/intelligence.service';
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { DocumentService } from '../../../services/document.service';
import { finalize, switchMap } from 'rxjs';

@Component({
  selector: 'app-analyses',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analyse.html',
  styleUrl: './analyse.css',
})
export class AnalysesComponent implements OnInit {
  // Service d'authentification injecté avant l'initialisation du signal utilisateur.
  private readonly auth = inject(AuthService);
  private readonly projetService = inject(ProjetService);
  private readonly financeService = inject(FinanceService);
  private readonly intelligenceService = inject(IntelligenceService);
  private readonly documentService = inject(DocumentService);
  selectedProject = '';
  projects: any[] = [];
  stats: any[] = [];
  risks: any[] = [];
  anomalies: any[] = [];
  recommendations: any[] = [];
  utilisateur = this.auth.utilisateur;
  budgetConsommePct = 0;
  avancementPct = 0;
  readonly analyseEnCours = signal(false);
  readonly erreur = signal('');
  readonly syntheseIa = signal('');
  readonly sourcesRag = signal<any[]>([]);
  readonly documentEnCours = signal(false);
  readonly messageDocument = signal('');
  readonly fichierDocument = signal<File | null>(null);
  readonly documents = this.documentService.documentsSignal;
  readonly indicateursFinanciers = signal<any | null>(null);
  readonly rapportEnCours = signal(false);
  ngOnInit() {
    this.projetService.projets().subscribe((p) => {
      this.projects = p;
      if (p.length) {
        this.selectedProject = p[0].id;
        this.charger();
      }
    });
  }
  charger() {
    if (this.selectedProject) {
      this.projetService
        .indicateursFinanciers(this.selectedProject)
        .subscribe((v) => this.indicateursFinanciers.set(v));
    }
    forkJoin({
      p: this.projetService.projets(),
      e: this.projetService.etapes(),
      a: this.projetService.avancements(),
      d: this.financeService.depenses(),
      analyses: this.intelligenceService.analyses(),
      ano: this.intelligenceService.anomalies(),
      rec: this.intelligenceService.recommandations(),
      docs: this.documentService.documents(),
    }).subscribe((x) => {
      const p = x.p.find((v) => v.id === this.selectedProject);
      if (!p) return;
      const es = x.e.filter((v) => v.projet === p.id);
      const ds = x.d.filter((v) => es.some((e) => e.id === v.etape));
      const progress = es.length
        ? es.reduce(
            (s, e) =>
              s +
              Number(
                x.a
                  .filter((a) => a.etape === e.id)
                  .sort((a, b) => b.date_declaration.localeCompare(a.date_declaration))[0]
                  ?.pourcentage || 0,
              ),
            0,
          ) / es.length
        : 0;
      this.avancementPct = Math.round(progress);
      const budget = Number(p.budget_previsionnel || 0);
      const depense = ds.reduce((s, d) => s + Number(d.montant), 0);
      this.budgetConsommePct = budget ? Math.min(100, Math.round((depense / budget) * 100)) : 0;
      const last = x.analyses
        .filter((a) => a.projet === p.id)
        .sort((a, b) => b.date_analyse.localeCompare(a.date_analyse))[0];
      this.stats = [
        {
          label: 'Budget prévisionnel',
          value: this.fcfa(p.budget_previsionnel),
          color: 'text-[#64748B]',
        },
        { label: 'Dépenses réalisées', value: this.fcfa(depense), color: 'text-[#0284C7]' },
        { label: 'Avancement global', value: `${Math.round(progress)} %`, color: 'text-[#10B981]' },
        { label: 'Risque de retard', value: last?.niveau_risque || '—', color: 'text-[#F59E0B]' },
      ];
      this.risks = es.map((e) => {
        const pct = Number(
          x.a
            .filter((a) => a.etape === e.id)
            .sort((a, b) => b.date_declaration.localeCompare(a.date_declaration))[0]?.pourcentage ||
            0,
        );
        return {
          name: e.nom,
          status: `${Math.round(pct)} %`,
          percentage: pct,
          color: 'bg-[#0284C7]',
          statusColor: 'text-[#64748B]',
        };
      });
      this.anomalies = x.ano
        .filter((a) => a.projet === p.id)
        .map((a) => ({
          title: a.type_anomalie,
          detail: a.description,
          color: a.niveau === 'CRITIQUE' ? 'bg-[#EF4444]' : 'bg-[#F59E0B]',
        }));
      this.recommendations = x.rec
        .filter((r) => r.projet === p.id)
        .map((r) => ({
          title: r.titre,
          description: r.description,
          color: 'bg-[#E0F2FE]',
          titleColor: 'text-[#0284C7]',
        }));
    });
  }
  courbePoints() {
    const valeurs = this.risks.map((r: any) => Number(r.percentage || 0));
    if (!valeurs.length) return '';
    const pas = valeurs.length > 1 ? 100 / (valeurs.length - 1) : 100;
    return valeurs
      .map((v: number, i: number) => `${i * pas},${100 - Math.max(0, Math.min(100, v))}`)
      .join(' ');
  }
  fcfa(v: any) {
    return `${Number(v || 0).toLocaleString('fr-FR')} FCFA`;
  }
  onProjectChange(e: Event) {
    this.selectedProject = (e.target as HTMLSelectElement).value;
    this.charger();
  }
  onDocumentSelected(event: Event) {
    this.fichierDocument.set((event.target as HTMLInputElement).files?.[0] || null);
    this.messageDocument.set('');
  }
  ajouterDocument() {
    const fichier = this.fichierDocument();
    if (!fichier || !this.selectedProject) return;
    this.documentEnCours.set(true);
    this.messageDocument.set('');
    const form = new FormData();
    form.append('projet', this.selectedProject);
    form.append('nom', fichier.name);
    form.append('type_document', 'DOCUMENT_PROJET');
    form.append('fichier', fichier);
    this.documentService
      .ajouterDocument(form)
      .pipe(
        switchMap((doc) => this.documentService.indexerRag(doc.id)),
        finalize(() => this.documentEnCours.set(false)),
      )
      .subscribe({
        next: () => {
          this.messageDocument.set('Document ajouté et indexé pour le RAG.');
          this.fichierDocument.set(null);
          this.documentService.documents().subscribe();
        },
        error: (e) =>
          this.messageDocument.set(e?.error?.detail || 'Le document n’a pas pu être indexé.'),
      });
  }
  documentsProjet() {
    return this.documents().filter((d: any) => d.projet === this.selectedProject);
  }
  telechargerRapport() {
    if (!this.selectedProject) return;
    this.rapportEnCours.set(true);
    this.projetService
      .rapportPdf(this.selectedProject)
      .pipe(finalize(() => this.rapportEnCours.set(false)))
      .subscribe((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-chantial-${this.selectedProject}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }
  lancerAnalyse() {
    if (!this.selectedProject) return;
    this.analyseEnCours.set(true);
    this.erreur.set('');
    this.syntheseIa.set('');
    this.sourcesRag.set([]);
    this.intelligenceService
      .lancerAnalyse(this.selectedProject)
      .pipe(finalize(() => this.analyseEnCours.set(false)))
      .subscribe({
        next: (reponse) => {
          const rag: any = reponse.rag;
          this.syntheseIa.set(rag?.reponse || reponse.analyse?.resume || 'Analyse terminée.');
          this.sourcesRag.set(Array.isArray(rag?.sources) ? rag.sources : []);
          this.charger();
        },
        error: (e) => this.erreur.set(e?.error?.detail || 'Analyse impossible.'),
      });
  }
}
