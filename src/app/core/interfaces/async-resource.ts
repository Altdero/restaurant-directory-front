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

/** Implementation-agnostic write contract for create/update/delete flows. */
export interface AsyncMutation<TInput, TResult> {
  readonly isPending: Signal<boolean>;
  readonly error: Signal<ApiError | undefined>;
  mutate(input: TInput): Promise<TResult>;
}
