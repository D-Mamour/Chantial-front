import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cta-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaFooterComponent {
  readonly currentYear = new Date().getFullYear();
}
