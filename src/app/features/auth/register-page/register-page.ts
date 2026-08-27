import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/models/api-error.model';
import { AuthStore } from '@core/services/auth/auth.store';
import { apiErrorMessage } from '@core/utils/api-error-message';
import { applyFieldErrors } from '@core/utils/apply-field-errors';
import { fieldErrorMessage } from '@core/utils/field-error-message';
import { AuthCard } from '@shared/components/auth-card/auth-card';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirm = control.get('password_confirm')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AuthCard,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register-page.html',
  styles: `
    form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .error {
      color: var(--mat-sys-error);
      margin: 0;
    }

    [footer] {
      font: var(--mat-sys-body-medium);
      color: var(--mat-sys-on-surface-variant);
    }

    [footer] a {
      color: var(--mat-sys-primary);
      font-weight: 500;
      text-decoration: none;
    }
  `,
})
export class RegisterPage {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      first_name: [''],
      last_name: [''],
      password: ['', Validators.required],
      password_confirm: ['', Validators.required],
    },
    { validators: passwordsMatchValidator },
  );

  readonly isSubmitting = signal(false);
  readonly topLevelError = signal<string | undefined>(undefined);

  protected readonly fieldErrorMessage = fieldErrorMessage;

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.topLevelError.set(undefined);
    try {
      await this.authStore.register(this.form.getRawValue());
      await this.router.navigateByUrl('/');
    } catch (error) {
      applyFieldErrors(this.form, error as ApiError);
      this.topLevelError.set(apiErrorMessage(error as ApiError));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
