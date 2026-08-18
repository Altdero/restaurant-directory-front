import { Routes } from '@angular/router';
import { guestGuard } from '@core/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./features/restaurants/restaurant-list-page/restaurant-list-page').then(
        (m) => m.RestaurantListPage,
      ),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register-page/register-page').then((m) => m.RegisterPage),
  },
];
