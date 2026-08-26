import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';
import { ownerGuard } from '@core/guards/owner.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'restaurants',
    loadComponent: () =>
      import('./features/restaurants/restaurant-list-page/restaurant-list-page').then(
        (m) => m.RestaurantListPage,
      ),
  },
  {
    path: 'restaurants/:id',
    loadComponent: () =>
      import('./features/restaurants/restaurant-detail-page/restaurant-detail-page').then(
        (m) => m.RestaurantDetailPage,
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
  {
    path: 'favorites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/favorites/favorites-page/favorites-page').then((m) => m.FavoritesPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'my/restaurants',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/owner/my-restaurants-page/my-restaurants-page').then(
        (m) => m.MyRestaurantsPage,
      ),
  },
  {
    path: 'my/restaurants/new',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/owner/restaurant-form-page/restaurant-form-page').then(
        (m) => m.RestaurantFormPage,
      ),
  },
  {
    path: 'my/restaurants/:id/edit',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/owner/restaurant-form-page/restaurant-form-page').then(
        (m) => m.RestaurantFormPage,
      ),
  },
  {
    path: 'my/restaurants/:id/menu',
    canActivate: [ownerGuard],
    loadComponent: () =>
      import('./features/owner/menu-manager-page/menu-manager-page').then((m) => m.MenuManagerPage),
  },
];
