import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { UserProfile } from '@core/models/user-profile.model';

/** Presentational — `MainToolbar` owns the `AuthStore` dependency. */
@Component({
  selector: 'app-user-menu',
  imports: [MatButtonModule, MatMenuModule, RouterLink],
  template: `
    <button mat-button [matMenuTriggerFor]="menu">{{ user().username }}</button>
    <mat-menu #menu="matMenu">
      <a mat-menu-item routerLink="/profile" i18n="@@userMenu.profile">Profile</a>
      @if (isOwner()) {
        <a mat-menu-item routerLink="/my/restaurants" i18n="@@userMenu.myRestaurants">
          My restaurants
        </a>
      }
      <button mat-menu-item (click)="logout.emit()" i18n="@@userMenu.logout">Log out</button>
    </mat-menu>
  `,
})
export class UserMenu {
  readonly user = input.required<UserProfile>();
  readonly logout = output<void>();

  readonly isOwner = computed(() => ['owner', 'admin'].includes(this.user().role));
}
