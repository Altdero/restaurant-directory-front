import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** For cursor-paginated resources (reviews) — no total count exists, so there's no "page N of M", only "more or not". */
@Component({
  selector: 'app-cursor-load-more',
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    @if (hasMore()) {
      <button
        mat-stroked-button
        class="pill"
        type="button"
        [disabled]="isLoading()"
        (click)="loadMore.emit()"
      >
        @if (isLoading()) {
          <mat-progress-spinner diameter="20" mode="indeterminate" />
        } @else {
          <span i18n="@@cursorLoadMore.label">Load more</span>
        }
      </button>
    }
  `,
  styles: `
    .pill {
      border-radius: var(--mat-sys-corner-full);
      height: 2.75rem;
      padding: 0 1.5rem;
    }
  `,
})
export class CursorLoadMore {
  readonly hasMore = input.required<boolean>();
  readonly isLoading = input<boolean>(false);
  readonly loadMore = output<void>();
}
