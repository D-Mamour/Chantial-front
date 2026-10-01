import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page publique "Page introuvable". Son contenu doit être adapté aux coordonnées légales réelles avant mise en production. */
@Component({selector:'app-not-found', standalone:true, imports:[RouterLink], templateUrl:'./not-found.html', changeDetection:ChangeDetectionStrategy.OnPush})
export class NotFoundComponent {}
