import { Signal } from '@angular/core';
import { ApiError } from '@core/models/api-error.model';

/**
 * Implementation-agnostic read contract that both data-layer families
 * (`httpResource()` and TanStack Query) satisfy. Components depend on this
 * interface only, never on `HttpResourceRef`/`CreateQueryResult` directly.
 *
 * Must be created during an active injection context (a component or
 * service field initializer, same rule as `inject()`) — the `httpResource()`
 * implementation is an `@initializerApiFunction` and requires one.
 */
export interface AsyncResource<T> {
  readonly value: Signal<T | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<ApiError | undefined>;
  reload(): void;
}

/**
 * Implementation-agnostic write contract for create/update/delete flows.
 *
 * Must also be created during an active injection context, same as
 * `AsyncResource` — the `httpResource()` family's mutations happen not to
 * need this (they're plain `HttpClient` calls), but the TanStack family's
 * `injectMutation()` does, and the calling convention must be uniform
 * across both implementations for a component to stay agnostic of which
 * one it received.
 */
export interface AsyncMutation<TInput, TResult> {
  readonly isPending: Signal<boolean>;
  readonly error: Signal<ApiError | undefined>;
  mutate(input: TInput): Promise<TResult>;
}
