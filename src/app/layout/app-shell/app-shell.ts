import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainToolbar } from '@layout/main-toolbar/main-toolbar';
import { SiteFooter } from '@layout/site-footer/site-footer';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, MainToolbar, SiteFooter],
  template: `
    <app-main-toolbar />
    <main>
      <router-outlet />
    </main>
    <app-site-footer />
  `,
})
export class AppShell {}
