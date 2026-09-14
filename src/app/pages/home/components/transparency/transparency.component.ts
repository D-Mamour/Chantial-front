import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-transparency',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './transparency.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransparencyComponent {}
