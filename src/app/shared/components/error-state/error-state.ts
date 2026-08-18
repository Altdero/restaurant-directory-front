import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

const DEFAULT_MESSAGE = $localize`:@@errorState.defaultMessage:Something went wrong loading this content.`;

/**
 * Generic error placeholder with a retry action. `message` is optional —
 * accepts `apiErrorMessage()`'s `string | undefined` directly (`undefined`
 * for the `'field'` `ApiError` variant, which has no top-level text) rather
 * than every caller having to fall back to a duplicated default string.
 */
@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule],
  template: `
    <div class="error-state" role="alert">
      <p>{{ message() ?? defaultMessage }}</p>
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
  readonly message = input<string | undefined>();
  protected readonly defaultMessage = DEFAULT_MESSAGE;
  readonly retry = output<void>();
}
