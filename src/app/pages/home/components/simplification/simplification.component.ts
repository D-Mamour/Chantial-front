import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-simplification',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './simplification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimplificationComponent {}
