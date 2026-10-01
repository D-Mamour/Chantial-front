import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page publique "Politique de confidentialité". Son contenu doit être adapté aux coordonnées légales réelles avant mise en production. */
@Component({selector:'app-confidentialite', standalone:true, imports:[RouterLink], templateUrl:'./confidentialite.html', changeDetection:ChangeDetectionStrategy.OnPush})
export class ConfidentialiteComponent {}
