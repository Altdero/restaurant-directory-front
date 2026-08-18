import { Component, input } from '@angular/core';

/** Generic "nothing here" placeholder — the message is always caller-supplied and i18n'd by the caller. */
@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <p>{{ message() }}</p>
    </div>
  `,
  styles: `
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class EmptyState {
  readonly message = input.required<string>();
}
