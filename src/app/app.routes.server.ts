import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'restaurants',
    renderMode: RenderMode.Server,
  },
  {
    path: 'restaurants/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'login',
    renderMode: RenderMode.Client,
  },
  {
    path: 'register',
    renderMode: RenderMode.Client,
  },
  {
    path: 'favorites',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my/restaurants',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my/restaurants/new',
    renderMode: RenderMode.Client,
  },
  {
    path: 'my/restaurants/:id/edit',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
