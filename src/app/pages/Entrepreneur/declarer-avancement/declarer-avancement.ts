import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

/**
 * Modale de déclaration d'avancement d'une étape.
 * Toute la validation présente ici concerne l'expérience utilisateur :
 * le backend reste la source d'autorité pour la validation métier finale.
 */
@Component({
  imports: [ReactiveFormsModule], standalone: true, selector: 'app-declarer-avancement',
  styleUrl: './declarer-avancement.css', templateUrl: './declarer-avancement.html'
})
export class DeclarerAvancement {
  private readonly fb = inject(FormBuilder);
  readonly steps = input<any[]>([]);
  readonly etapeInitiale = input<string>('');
  readonly close = output<void>();
  readonly progressDeclared = output<any>();
  /** État et erreur pilotés par le parent pendant l'appel HTTP réel. */
  readonly enregistrement = input(false);
  readonly erreurServeur = input('');
  readonly erreurLocale = signal('');

  readonly progressForm = this.fb.nonNullable.group({
    etape: ['', Validators.required],
    pourcentage: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    commentaire: ['', Validators.maxLength(1000)]
  });

  constructor() {
    // Si la modale est ouverte depuis une ligne d'étape, celle-ci est présélectionnée
    // et le curseur démarre au dernier pourcentage réellement déclaré.
    effect(() => {
      const id = this.etapeInitiale();
      const liste = this.steps();
      if (id) {
        this.progressForm.controls.etape.setValue(id, { emitEvent: false });
        this.progressForm.controls.pourcentage.setValue(this.progressionEtape(id), { emitEvent: false });
      } else if (liste.length && !this.progressForm.controls.etape.value) {
        const premierId = String(liste[0].id);
        this.progressForm.controls.etape.setValue(premierId, { emitEvent: false });
        this.progressForm.controls.pourcentage.setValue(this.progressionEtape(premierId), { emitEvent: false });
      }
    });
  }

  get currentProgress(): number {
    return Number(this.progressForm.controls.pourcentage.value ?? 0);
  }

  /** Format entier pour l'affichage, sans dépendre du DecimalPipe dans cette modale. */
  pourcentageAffiche(valeur: unknown): number {
    return Math.round(Number(valeur ?? 0));
  }

  get avancementActuel(): number {
    return this.progressionEtape(this.progressForm.controls.etape.value);
  }

  private progressionEtape(id: string): number {
    const etape = this.steps().find(s => String(s.id) === String(id));
    return Math.min(100, Math.max(0, Number(etape?.progress ?? 0)));
  }

  changerEtape(): void {
    const actuel = this.avancementActuel;
    this.progressForm.controls.pourcentage.setValue(actuel);
    this.erreurLocale.set('');
  }

  fermer(): void { this.close.emit(); }

  onProgressChange(event: Event): void {
    this.progressForm.controls.pourcentage.setValue(Number((event.target as HTMLInputElement).value));
    this.erreurLocale.set('');
  }

  declarer(): void {
    this.erreurLocale.set('');
    if (this.progressForm.invalid) {
      this.progressForm.markAllAsTouched();
      this.erreurLocale.set('Veuillez vérifier les informations du formulaire.');
      return;
    }

    const valeur = Number(this.progressForm.controls.pourcentage.value);
    if (valeur < this.avancementActuel) {
      this.erreurLocale.set(`Le nouvel avancement ne peut pas être inférieur à l’avancement actuel (${this.avancementActuel} %).`);
      return;
    }

    if (this.enregistrement()) return;
    this.progressDeclared.emit(this.progressForm.getRawValue());
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.enregistrement()) this.fermer();
  }
}
