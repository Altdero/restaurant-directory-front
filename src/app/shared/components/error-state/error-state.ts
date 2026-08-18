import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/** Generic error placeholder with a retry action — `message` defaults to a generic fallback. */
@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule],
  template: `
    <div class="error-state" role="alert">
      <p>{{ message() }}</p>
      <button mat-stroked-button type="button" (click)="retry.emit()" i18n="@@errorState.retry">
        Try again
      </button>
    </div>
  `,
  styles: `
    .error-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--mat-sys-error);
    }
  `,
})
export class ErrorState {
  readonly message = input<string>(
    $localize`:@@errorState.defaultMessage:Something went wrong loading this content.`,
  );
  readonly retry = output<void>();
}
