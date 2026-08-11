/**
 * Normalized shape for every DRF error response this API returns. Branch on
 * `type`, never on the text of a `detail`/message string — wording varies by
 * endpoint (see docs/API.md).
 */
export type ApiError =
  | { readonly type: 'field'; readonly errors: Readonly<Record<string, readonly string[]>> }
  | { readonly type: 'non-field'; readonly messages: readonly string[] }
  | {
      readonly type: 'detail';
      readonly status: number;
      readonly message: string;
      readonly code?: string;
    }
  | { readonly type: 'throttled'; readonly message: string; readonly retryAfterSeconds?: number }
  | { readonly type: 'unknown'; readonly status: number };
