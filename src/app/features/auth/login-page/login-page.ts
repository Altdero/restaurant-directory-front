import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/models/api-error.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { applyFieldErrors } from '@core/utils/apply-field-errors';
import { AuthCard } from '@shared/components/auth-card/auth-card';

@Component({
  selector: 'app-login-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthCard,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <app-auth-card title="Log in" i18n-title="@@auth.login.title">
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline">
          <mat-label i18n="@@auth.login.username">Username</mat-label>
          <input matInput formControlName="username" autocomplete="username" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label i18n="@@auth.login.password">Password</mat-label>
          <input
            matInput
            type="password"
            formControlName="password"
            autocomplete="current-password"
          />
        </mat-form-field>

        @if (topLevelError(); as message) {
          <p class="error" role="alert">{{ message }}</p>
        }

        <button mat-flat-button type="submit" [disabled]="form.invalid || isSubmitting()">
          @if (isSubmitting()) {
            <mat-progress-spinner diameter="20" mode="indeterminate" />
          } @else {
            <span i18n="@@auth.login.submit">Log in</span>
          }
        </button>
      </form>

      <span footer i18n="@@auth.login.noAccount">
        Don't have an account? <a routerLink="/register">Register</a>
      </span>
    </app-auth-card>
  `,
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }
  `,
})
export class LoginPage {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  readonly isSubmitting = signal(false);
  readonly topLevelError = signal<string | undefined>(undefined);

  async submit(): Promise<void> {
    if (this.form.invalid) {
      return;
    }
    this.isSubmitting.set(true);
    this.topLevelError.set(undefined);
    try {
      await this.authStore.login(this.form.getRawValue());
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl ?? '/');
    } catch (error) {
      applyFieldErrors(this.form, error as ApiError);
      this.topLevelError.set(apiErrorMessage(error as ApiError));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
