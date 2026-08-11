import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('opens a snack bar with the given message and an error panel class', () => {
    const openSpy = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: MatSnackBar, useValue: { open: openSpy } }],
    });

    TestBed.inject(NotificationService).error('Something went wrong');

    expect(openSpy).toHaveBeenCalledWith('Something went wrong', undefined, {
      duration: 6000,
      panelClass: ['app-notification-error'],
    });
  });
});
