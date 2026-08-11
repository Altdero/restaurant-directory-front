import { Service, signal } from '@angular/core';

/**
 * Holds the in-memory access token. Deliberately minimal and separate from
 * the full `AuthStore` (user profile, login/logout orchestration): the HTTP
 * interceptors only ever need to read/replace the token, never the rest of
 * the auth state, and this keeps them free of a dependency on the larger
 * store. The refresh token is never held here — it lives only in the
 * `httpOnly` cookie the browser manages.
 */
@Service()
export class AccessTokenStore {
  private readonly token = signal<string | null>(null);
  readonly value = this.token.asReadonly();

  set(token: string | null): void {
    this.token.set(token);
  }
}
