import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Page publique "Conditions générales d’utilisation". Son contenu doit être adapté aux coordonnées légales réelles avant mise en production. */
@Component({selector:'app-cgu', standalone:true, imports:[RouterLink], templateUrl:'./cgu.html', changeDetection:ChangeDetectionStrategy.OnPush})
export class CguComponent {}
