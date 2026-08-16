import { computed, signal, Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { ApiError } from '@core/models/api-error.model';
import { firstValueFrom, Observable } from 'rxjs';

/**
 * Structural subset of `HttpResourceRef<T>` this adapter needs. Deliberately
 * not `HttpResourceRef<T>` itself: `WritableResource`'s `set`/`update` take
 * `T` in a contravariant (input) position, which would make
 * `HttpResourceRef<Restaurant>` (built with `defaultValue`) fail to satisfy
 * a parameter typed `HttpResourceRef<Restaurant | undefined>` (built
 * without one) — even though both are valid, readable resources. Reading
 * only the four members this adapter actually touches sidesteps that.
 */
interface ResourceLike<T> {
  readonly value: Signal<T | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<Error | undefined>;
  reload(): boolean;
}

/**
 * Adapts an `httpResource()`-created resource to the implementation-agnostic
 * `AsyncResource` contract.
 *
 * `@angular/core`'s `resource()` primitive wraps a thrown non-`Error`-like
 * value in a `ResourceWrappedError` (see `encapsulateResourceError` in
 * `@angular/core/fesm2022/_resource-chunk.mjs`) — but `httpResource()`
 * specifically does not go through that path for HTTP failures: confirmed
 * with a real `HttpTestingController` 404 response in this module's spec,
 * `resource.error()` holds the exact `ApiError` object `error.interceptor.ts`
 * threw, completely unwrapped. The `Signal<Error | undefined>` type here is
 * therefore misleading at runtime for this specific resource factory — cast
 * through `unknown` rather than trust it.
 */
export function toAsyncResource<T>(resource: ResourceLike<T>): AsyncResource<T> {
  return {
    value: resource.value,
    isLoading: resource.isLoading,
    error: computed(() => resource.error() as unknown as ApiError | undefined),
    reload: () => {
      resource.reload();
    },
  };
}

/**
 * Builds an `AsyncMutation` from a one-shot HTTP call. Unlike `httpResource`,
 * a plain `HttpClient` observable rethrows whatever `error.interceptor.ts`
 * threw with no wrapping (that behavior is specific to `resource()`), so the
 * caught value here is already the real `ApiError`.
 */
export function createMutation<TInput, TResult>(
  request: (input: TInput) => Observable<TResult>,
): AsyncMutation<TInput, TResult> {
  const pending = signal(false);
  const error = signal<ApiError | undefined>(undefined);

  return {
    isPending: pending.asReadonly(),
    error: error.asReadonly(),
    async mutate(input: TInput): Promise<TResult> {
      pending.set(true);
      error.set(undefined);
      try {
        return await firstValueFrom(request(input));
      } catch (caught) {
        const apiError = caught as ApiError;
        error.set(apiError);
        throw apiError;
      } finally {
        pending.set(false);
      }
    },
  };
}
