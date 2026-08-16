import { computed, Signal } from '@angular/core';
import { AsyncMutation, AsyncResource } from '@core/interfaces/async-resource';
import { ApiError } from '@core/models/api-error.model';

/**
 * Structural subset of `CreateQueryResult<T, ApiError>` this adapter needs —
 * mirrors `ResourceLike<T>` in `core/services/http-resource/http-resource.adapter.ts`
 * for the same reason: reading only what's used sidesteps any variance
 * mismatch between TanStack's various query-result overloads.
 */
interface QueryResultLike<T> {
  readonly data: Signal<T | undefined>;
  readonly isLoading: Signal<boolean>;
  readonly error: Signal<ApiError | null>;
  refetch(): unknown;
}

/**
 * Structural subset of `CreateMutationResult<TResult, ApiError, TInput>`.
 */
interface MutationResultLike<TInput, TResult> {
  readonly isPending: Signal<boolean>;
  readonly error: Signal<ApiError | null>;
  mutateAsync(input: TInput): Promise<TResult>;
}

/**
 * Adapts an `injectQuery()` result to the implementation-agnostic
 * `AsyncResource` contract. Unlike `httpResource()` (see
 * `http-resource.adapter.ts`), TanStack Query does not wrap a rejected
 * `queryFn` promise in any framework error type — `query.error()` holds
 * exactly whatever `error.interceptor.ts` threw, confirmed with a real
 * `HttpTestingController` response in this module's spec. The only real
 * adaptation needed is `null` → `undefined`, since `QueryObserverBaseResult.error`
 * is typed `TError | null` and `AsyncResource.error` is `ApiError | undefined`.
 */
export function toAsyncResource<T>(query: QueryResultLike<T>): AsyncResource<T> {
  return {
    value: query.data,
    isLoading: query.isLoading,
    error: computed(() => query.error() ?? undefined),
    reload: () => {
      query.refetch();
    },
  };
}

/** Adapts an `injectMutation()` result to the `AsyncMutation` contract. */
export function toAsyncMutation<TInput, TResult>(
  mutation: MutationResultLike<TInput, TResult>,
): AsyncMutation<TInput, TResult> {
  return {
    isPending: mutation.isPending,
    error: computed(() => mutation.error() ?? undefined),
    mutate: (input: TInput) => mutation.mutateAsync(input),
  };
}
