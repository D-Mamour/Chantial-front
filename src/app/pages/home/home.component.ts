import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroComponent } from './components/hero/hero.component';
import { SimplificationComponent } from './components/simplification/simplification.component';
import { TransparencyComponent } from './components/transparency/transparency.component';
import { StepsShowcaseComponent } from './components/steps-showcase/steps-showcase.component';
import { EntrepreneurSplitComponent } from './components/entrepreneur-split/entrepreneur-split.component';
import { CtaFooterComponent } from './components/cta-footer/cta-footer.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    HeroComponent,
    SimplificationComponent,
    TransparencyComponent,
    StepsShowcaseComponent,
    EntrepreneurSplitComponent,
    CtaFooterComponent,
  ],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
