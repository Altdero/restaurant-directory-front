import { CountedPage, CursorPage } from '@core/models/pagination.model';

/**
 * Wraps a resource's DTO-to-model mapper for a paginated response. The raw
 * JSON is `unknown` at this point — both `httpResource`'s `parse` option and
 * a plain `HttpClient` response are untyped past the wire — so this trusts
 * the server's documented envelope shape, the same trust boundary every
 * other `to*()` mapper in `core/models/` already applies to its `dto`
 * parameter.
 */
export function mapCountedPage<TDto, T>(map: (dto: TDto) => T) {
  return (raw: unknown): CountedPage<T> => {
    const page = raw as CountedPage<TDto>;
    return {
      count: page.count,
      next: page.next,
      previous: page.previous,
      results: page.results.map(map),
    };
  };
}

/** Same as {@link mapCountedPage}, for the cursor-paginated envelope (reviews). */
export function mapCursorPage<TDto, T>(map: (dto: TDto) => T) {
  return (raw: unknown): CursorPage<T> => {
    const page = raw as CursorPage<TDto>;
    return {
      next: page.next,
      previous: page.previous,
      results: page.results.map(map),
    };
  };
}
