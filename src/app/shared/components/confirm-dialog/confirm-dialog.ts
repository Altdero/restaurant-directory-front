import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface ConfirmDialogData {
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
}

/** `dialog.open(ConfirmDialog, { data }).afterClosed()` resolves `true`/`false`/`undefined` (backdrop dismiss). */
@Component({
  selector: 'app-confirm-dialog',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>{{ data.message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ data.cancelLabel ?? defaultCancel }}
      </button>
      <button mat-flat-button [mat-dialog-close]="true">
        {{ data.confirmLabel ?? defaultConfirm }}
      </button>
    </mat-dialog-actions>
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  protected readonly defaultCancel = $localize`:@@confirmDialog.cancel:Cancel`;
  protected readonly defaultConfirm = $localize`:@@confirmDialog.confirm:Confirm`;
}
