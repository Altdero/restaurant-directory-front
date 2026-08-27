import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * Hand-rolled prev/next pager, not `mat-paginator` — measured via a real
 * build: `MatPaginatorModule` alone adds ~20kB to the bundle (it pulls in
 * `@angular/cdk` overlay/a11y/bidi machinery, the first would-be use of
 * CDK Overlay in this project), almost all of it for a page-size picker
 * this app doesn't use (page size is fixed per resource, not user-facing —
 * see docs/API.md). Not worth the weight for what amounts to two buttons
 * and a page indicator.
 */
@Component({
  selector: 'app-paginator-bar',
  imports: [MatButtonModule],
  template: `
    <div class="paginator-bar">
      <button
        mat-icon-button
        type="button"
        [disabled]="page() <= 1"
        (click)="pageChange.emit(page() - 1)"
        i18n-aria-label="@@paginatorBar.previous"
        aria-label="Previous page"
      >
        ‹
      </button>
      <span i18n="@@paginatorBar.pageIndicator"> Page {{ page() }} of {{ pageCount() }} </span>
      <button
        mat-icon-button
        type="button"
        [disabled]="page() >= pageCount()"
        (click)="pageChange.emit(page() + 1)"
        i18n-aria-label="@@paginatorBar.next"
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  `,
  styles: `
    .paginator-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class PaginatorBar {
  readonly count = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly page = input<number>(1);

  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.count() / this.pageSize())),
  );
}
