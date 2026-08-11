import { Service, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Thin wrapper around MatSnackBar. Deliberately takes a ready-to-display
 * string rather than a message key: deciding *what* to say (and localizing
 * it with `$localize`) is the caller's responsibility, this service only
 * decides *how* it's shown.
 */
@Service()
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  error(message: string): void {
    this.snackBar.open(message, undefined, {
      duration: 6000,
      panelClass: ['app-notification-error'],
    });
  }
}
