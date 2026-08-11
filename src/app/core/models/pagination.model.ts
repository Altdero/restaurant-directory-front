/**
 * Shared response envelope for the page-number (categories, restaurants,
 * favorites) and limit/offset (menu items) pagination styles — both are
 * structurally identical; only their request query params differ.
 */
export interface CountedPage<T> {
  readonly count: number;
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: readonly T[];
}

/**
 * Response envelope for cursor pagination (reviews). Deliberately has no
 * `count` — never build UI that depends on a total for this resource.
 */
export interface CursorPage<T> {
  readonly next: string | null;
  readonly previous: string | null;
  readonly results: readonly T[];
}
