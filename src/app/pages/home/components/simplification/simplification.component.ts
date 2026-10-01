import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-simplification',
  standalone: true,
  imports: [],
  templateUrl: './simplification.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimplificationComponent {}
