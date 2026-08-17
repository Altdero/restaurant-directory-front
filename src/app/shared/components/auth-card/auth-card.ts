import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

/**
 * Presentational card shell shared by `LoginPage` and `RegisterPage`. The
 * form itself is projected as default content; a `footer`-slotted
 * projection carries the "switch to register/login" link.
 */
@Component({
  selector: 'app-auth-card',
  imports: [MatCardModule],
  template: `
    <mat-card class="auth-card">
      <mat-card-header>
        <mat-card-title>{{ title() }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <ng-content />
      </mat-card-content>
      <mat-card-actions>
        <ng-content select="[footer]" />
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .auth-card {
      max-width: 24rem;
      margin: 2rem auto;
    }
  `,
})
export class AuthCard {
  readonly title = input.required<string>();
}
