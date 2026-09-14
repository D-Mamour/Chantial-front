import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';

interface Step {
  image: string;
  alt: string;
  title: string;
  text: string;
}

/** Durée d'affichage de chaque étape avant de passer à la suivante. */
const SLIDE_DURATION_MS = 2000;

@Component({
  selector: 'app-steps-showcase',
  standalone: true,
  templateUrl: './steps-showcase.component.html',
  styleUrls: ['./steps-showcase.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepsShowcaseComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private timer?: ReturnType<typeof setInterval>;

  readonly slideDurationMs = SLIDE_DURATION_MS;

  readonly steps: Step[] = [
    {
      image: 'images/elevation.jpg',
      alt: 'Dossier de financement étudié par un analyste',
      title: 'Étude & validation du dossier',
      text: "Chaque projet est audité et validé avant le premier décaissement, pour sécuriser l'investissement dès le départ.",
    },
    {
      image: 'images/pied.png',
      alt: 'Pose de la première pierre sur le chantier',
      title: 'Pose de la première pierre',
      text: 'Le chantier démarre officiellement, avec un état des lieux photographique horodaté et partagé au bailleur.',
    },
    {
      image: 'assets/images/steps/03-fondations.jpg',
      alt: 'Terrassement et coulage des fondations',
      title: 'Terrassement & fondations',
      text: 'Chaque étape de fondation est documentée : mesures, matériaux livrés, factures scannées et vérifiées.',
    },
    {
      image: 'assets/images/steps/04-gros-oeuvre.jpg',
      alt: 'Élévation de la structure en béton',
      title: 'Gros œuvre',
      text: "L'élévation de la structure est suivie en temps réel, avec un historique des dépenses engagées à chaque niveau.",
    },
    {
      image: 'assets/images/steps/05-second-oeuvre.jpg',
      alt: 'Finitions intérieures et équipements',
      title: 'Second œuvre & finitions',
      text: 'Cloisons, réseaux, revêtements : chaque justificatif reste consultable et infalsifiable jusqu\'à la livraison.',
    },
    {
      image: 'assets/images/steps/06-remise-des-cles.jpg',
      alt: 'Remise des clés au bailleur',
      title: 'Remise des clés',
      text: 'Le bailleur reçoit un dossier complet et traçable, du premier franc investi jusqu\'aux clés en main.',
    },
  ];

  readonly activeIndex = signal(0);
  readonly isPaused = signal(false);

  ngOnInit(): void {
    this.startAutoplay();
    this.destroyRef.onDestroy(() => this.stopAutoplay());
  }

  /** Survol : on met en pause l'avancée automatique et le remplissage visuel. */
  onMouseEnter(): void {
    this.isPaused.set(true);
    this.stopAutoplay();
  }

  /** Fin du survol : on repart avec une durée complète sur l'étape courante. */
  onMouseLeave(): void {
    this.isPaused.set(false);
    this.startAutoplay();
  }

  private startAutoplay(): void {
    this.stopAutoplay();
    this.timer = setInterval(() => this.goToNext(), this.slideDurationMs);
  }

  private stopAutoplay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private goToNext(): void {
    this.activeIndex.update((i) => (i + 1) % this.steps.length);
  }
}
