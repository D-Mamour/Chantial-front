import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-transparency',
  standalone: true,
  imports: [],
  templateUrl: './transparency.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransparencyComponent {}
