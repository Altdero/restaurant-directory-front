import { NgOptimizedImage } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Presentational, no HTTP — matches every other form/data split in this
 * codebase (`ReviewForm`, `RestaurantFilters`). Only picks a file and
 * emits it; the smart parent owns the actual `CloudinaryUploadService`
 * call and feeds the resulting URL back down via `imageUrl`. A native
 * `<label>` wrapping a hidden file input opens the picker with no JS —
 * deliberately not a `viewChild` + programmatic `.click()`, and not
 * `MatButtonModule` (its directives target `<button>`/`<a>`, not
 * `<label>`) — one less thing to wire, matching `PaginatorBar`'s
 * precedent of preferring plain markup over Material weight where native
 * HTML already does the job.
 */
@Component({
  selector: 'app-image-uploader',
  imports: [NgOptimizedImage, MatProgressSpinnerModule],
  templateUrl: './image-uploader.html',
  styles: `
    .image-uploader {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .preview {
      display: block;
      width: 6rem;
      height: 4rem;
      object-fit: cover;
      border-radius: var(--mat-sys-corner-small);
    }

    .preview.circle {
      width: 5.5rem;
      height: 5.5rem;
      border-radius: var(--mat-sys-corner-full);
    }

    .preview.placeholder {
      background: var(--mat-sys-surface-variant);
    }

    .upload-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      height: 2.5rem;
      padding: 0 1.25rem;
      border: 1px solid var(--mat-sys-primary);
      border-radius: var(--mat-sys-corner-full);
      color: var(--mat-sys-primary);
      cursor: pointer;
      font: var(--mat-sys-label-large);
    }

    .upload-button.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    input[type='file'] {
      display: none;
    }
  `,
})
export class ImageUploader {
  readonly imageUrl = input<string>('');
  readonly isUploading = input<boolean>(false);
  /** `'circle'` for an avatar-style preview (`ProfileForm`); `'rect'` (default) for a cover-photo thumbnail. */
  readonly shape = input<'rect' | 'circle'>('rect');

  readonly fileSelected = output<File>();

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.fileSelected.emit(file);
    }
    input.value = '';
  }
}
