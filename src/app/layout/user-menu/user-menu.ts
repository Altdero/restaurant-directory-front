import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import { UserProfile } from '@core/models/user-profile.model';

/** Presentational — `MainToolbar` owns the `AuthStore` dependency. */
@Component({
  selector: 'app-user-menu',
  imports: [NgOptimizedImage, MatButtonModule, MatMenuModule, RouterLink],
  template: `
    <button mat-button [matMenuTriggerFor]="menu">
      <span class="trigger">
        @if (user().avatar) {
          <img class="avatar" [ngSrc]="user().avatar" width="32" height="32" alt="" />
        } @else {
          <span class="avatar initials" aria-hidden="true">{{ initials() }}</span>
        }
        {{ user().username }}
      </span>
    </button>
    <mat-menu #menu="matMenu">
      <a mat-menu-item routerLink="/favorites" i18n="@@userMenu.favorites">Favorites</a>
      <a mat-menu-item routerLink="/profile" i18n="@@userMenu.profile">Profile</a>
      @if (isOwner()) {
        <a mat-menu-item routerLink="/my/restaurants" i18n="@@userMenu.myRestaurants">
          My restaurants
        </a>
      }
      <button mat-menu-item (click)="logout.emit()" i18n="@@userMenu.logout">Log out</button>
    </mat-menu>
  `,
  styles: `
    .trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .avatar {
      width: 2rem;
      height: 2rem;
      border-radius: var(--mat-sys-corner-full);
      object-fit: cover;
    }

    .avatar.initials {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--app-chip-teal-fg);
      color: #fff;
      font: var(--mat-sys-label-medium);
      font-weight: 600;
    }
  `,
})
export class UserMenu {
  readonly user = input.required<UserProfile>();
  readonly logout = output<void>();

  readonly isOwner = computed(() => ['owner', 'admin'].includes(this.user().role));
  protected readonly initials = computed(() => {
    const { firstName, lastName, username } = this.user();
    const first = firstName?.[0] ?? username[0] ?? '';
    const last = lastName?.[0] ?? '';
    return (first + last).toUpperCase();
  });
}
