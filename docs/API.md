# API Reference

Reference for the Django REST Framework backend this frontend consumes. Consult the live Swagger UI (`/api/schema/swagger-ui/`) or the OpenAPI schema (`/api/schema/`) for anything not covered here.

## Base URL

- Local development: `http://localhost:8000/api/`
- Production: value of the `API_BASE_URL` environment variable
- Every path below is relative to this base, e.g. `restaurants/` → `http://localhost:8000/api/restaurants/`

## Authentication flow

JWT via `djangorestframework-simplejwt`. The refresh token is delivered as an `httpOnly` cookie — it is never present in a JSON response body and is never read by frontend JavaScript.

- **Access token**: returned in the JSON body on register/login/refresh. Kept in memory only (`AuthStore`, a signal) — never in `localStorage`/`sessionStorage`. Sent as `Authorization: Bearer <access_token>` on every authenticated request.
- **Refresh token**: set by the server as a cookie named `refresh_token` (`httpOnly`; `Secure` + `SameSite=None` in production, non-secure + `SameSite=Lax` in development), scoped to path `/api/auth/`.
- **`withCredentials: true`** is required on every request so the browser sends/receives this cookie.
- Access token lifetime: 60 minutes. Refresh token lifetime: 7 days, rotated on every successful refresh.
- **401-retry pattern**: on a `401` from a protected endpoint, `error.interceptor.ts` attempts one `POST auth/refresh/` and retries the original request once with the new access token. If the refresh call itself fails, the in-memory token is cleared and the user is redirected to login.
- **Exclusion list**: `auth/login/`, `auth/register/`, and `auth/refresh/` are excluded from the retry pattern. A failed login returns `401` with `{"detail": "No active account found with the given credentials"}` — without the exclusion, a wrong password would trigger a spurious refresh attempt and force a logout redirect.

| Method | Path             | Auth            | Request body                                                                  | Response (2xx)                                                      |
| ------ | ---------------- | --------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| POST   | `auth/register/` | Public          | `{ username, email, first_name?, last_name?, password, password_confirm }`    | `201` `{ user: UserProfile, access }` + sets `refresh_token` cookie |
| POST   | `auth/login/`    | Public          | `{ username, password }`                                                      | `200` `{ access }` + sets `refresh_token` cookie                    |
| POST   | `auth/refresh/`  | Public (cookie) | — (reads `refresh_token` cookie)                                              | `200` `{ access }` + rotates `refresh_token` cookie                 |
| POST   | `auth/verify/`   | Public          | `{ token }`                                                                   | `200` `{}` if valid, `401` otherwise                                |
| POST   | `auth/logout/`   | Authenticated   | —                                                                             | `200` `{ detail }` + clears `refresh_token` cookie                  |
| GET    | `users/me/`      | Authenticated   | —                                                                             | `200` `UserProfile`                                                 |
| PATCH  | `users/me/`      | Authenticated   | Partial `UserProfile` (`email`, `first_name`, `last_name`, `phone`, `avatar`) | `200` `UserProfile`                                                 |

`UserProfile`:

```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "customer | owner | admin",
  "phone": "string",
  "avatar": "string (url)",
  "date_joined": "ISO-8601 datetime"
}
```

`username`, `role`, and `date_joined` are read-only on this endpoint. `role` defaults to `customer` at registration and cannot be self-escalated through the API. Treat `role` as UX convenience only — the backend enforces the same rule independently regardless of what the UI shows.

## Resource endpoints

Base path for all resources below is `/api/`. Every `{id}` is a UUID, not a numeric id.

### Categories — `categories/`

| Method      | Path               | Auth   |
| ----------- | ------------------ | ------ |
| GET         | `categories/`      | Public |
| GET         | `categories/{id}/` | Public |
| POST        | `categories/`      | Admin  |
| PUT / PATCH | `categories/{id}/` | Admin  |
| DELETE      | `categories/{id}/` | Admin  |

Page-number pagination, page size 10. Public list only returns `is_active: true` categories.

```json
{
  "id": "uuid",
  "name": "string",
  "slug": "string (read-only, auto-generated)",
  "description": "string",
  "icon": "string",
  "is_active": true,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

### Restaurants — `restaurants/`

| Method      | Path                | Auth                                            |
| ----------- | ------------------- | ----------------------------------------------- |
| GET         | `restaurants/`      | Public                                          |
| GET         | `restaurants/{id}/` | Public                                          |
| GET         | `restaurants/my/`   | Authenticated — restaurants owned by the caller |
| POST        | `restaurants/`      | Authenticated, role `owner` or `admin`          |
| PUT / PATCH | `restaurants/{id}/` | Owner of the restaurant, or `admin`             |
| DELETE      | `restaurants/{id}/` | Owner of the restaurant, or `admin`             |

Page-number pagination, page size 12, on both `restaurants/` and `restaurants/my/`. List query params: `category` (id), `city`, `price_range` (`$`/`$$`/`$$$`/`$$$$`), `min_rating`, `search` (matches name).

```json
{
  "id": "uuid",
  "owner": "string (username, read-only)",
  "name": "string",
  "slug": "string (read-only)",
  "description": "string",
  "categories": [
    {
      "id": "uuid",
      "name": "string",
      "slug": "string",
      "description": "string",
      "icon": "string",
      "is_active": true,
      "created_at": "ISO-8601",
      "updated_at": "ISO-8601"
    }
  ],
  "category_ids": ["uuid"],
  "address": "string",
  "city": "string",
  "state": "string",
  "country": "string",
  "postal_code": "string",
  "latitude": "decimal string | null",
  "longitude": "decimal string | null",
  "phone": "string",
  "email": "string",
  "website": "string",
  "price_range": "$ | $$ | $$$ | $$$$",
  "cover_image": "string (url)",
  "average_rating": "decimal string (read-only)",
  "total_reviews": "int (read-only)",
  "opening_hours": { "mon": { "open": "09:00", "close": "22:00" } },
  "is_active": true,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

`categories` returns the **full** nested `Category` object (confirmed against the live API — not a trimmed `{id, name, slug}` summary). Write category membership through `category_ids` only. `opening_hours` is keyed by three-letter lowercase weekday (`mon`…`sun`) — an absent day means closed. `average_rating`/`total_reviews` are server-computed; never send them.

### Menu items — `menu-items/`

| Method      | Path               | Auth                                                       |
| ----------- | ------------------ | ---------------------------------------------------------- |
| GET         | `menu-items/`      | Public                                                     |
| GET         | `menu-items/{id}/` | Public                                                     |
| POST        | `menu-items/`      | Authenticated, must own the target restaurant (or `admin`) |
| PUT / PATCH | `menu-items/{id}/` | Owner of the item's restaurant, or `admin`                 |
| DELETE      | `menu-items/{id}/` | Owner of the item's restaurant, or `admin`                 |

Limit/offset pagination (default limit 20, max 100). List query params: `restaurant_id`, `category`, `is_available` (`true`).

```json
{
  "id": "uuid",
  "restaurant": "uuid",
  "restaurant_name": "string (read-only)",
  "name": "string",
  "description": "string",
  "price": "decimal string, > 0.01",
  "category": "appetizer | main_course | dessert | beverage | other",
  "image": "string (url)",
  "is_available": true,
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

### Reviews — `reviews/`

| Method | Path            | Auth                                               |
| ------ | --------------- | -------------------------------------------------- |
| GET    | `reviews/`      | Public                                             |
| GET    | `reviews/{id}/` | Public                                             |
| POST   | `reviews/`      | Authenticated — one review per user per restaurant |
| PATCH  | `reviews/{id}/` | Review's author only — no PUT, partial update only |
| DELETE | `reviews/{id}/` | Author, or `admin` (moderation)                    |

Cursor pagination (page size 10, ordered newest-first) — **no `count` field**. Build "load more"/infinite scroll from the opaque `next`/`previous` URLs; never construct a `cursor` value manually.

```json
{
  "id": "uuid",
  "restaurant": "uuid",
  "user": "uuid (read-only)",
  "username": "string (read-only)",
  "rating": "int 1-5",
  "comment": "string",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
}
```

A second review by the same user for the same restaurant is rejected with `400` `{"non_field_errors": [...]}`.

### Favorites — `favorites/`

| Method | Path                | Auth                                   |
| ------ | ------------------- | -------------------------------------- |
| GET    | `favorites/`        | Authenticated — caller's own favorites |
| POST   | `favorites/`        | Authenticated                          |
| DELETE | `favorites/{id}/`   | Owner of the favorite                  |
| POST   | `favorites/toggle/` | Authenticated                          |

Page-number pagination, page size 10.

```json
{
  "id": "uuid",
  "restaurant": { "...": "full nested Restaurant object, read-only" },
  "restaurant_id": "uuid (write-only, create only)",
  "created_at": "ISO-8601"
}
```

`{id}` in `DELETE favorites/{id}/` is the favorite's own id, not the restaurant id. For a heart/bookmark toggle keyed by restaurant, use `POST favorites/toggle/` — body `{ "restaurant_id": "uuid" }` → `{ "favorited": true | false }`.

### Uploads — `uploads/`

| Method | Path                 | Auth          |
| ------ | -------------------- | ------------- |
| POST   | `uploads/signature/` | Authenticated |

Body: `{ "folder": "restaurants" | "menu-items" | "avatars" }`. Response:

```json
{
  "signature": "string",
  "timestamp": 1234567890,
  "api_key": "string",
  "cloud_name": "string",
  "folder": "string (already namespaced, e.g. restaurant-directory/restaurants)"
}
```

Flow: request a signature for the target `folder` → upload the file directly to Cloudinary (`https://api.cloudinary.com/v1_1/{cloud_name}/image/upload`, `multipart/form-data` with `file`, `api_key`, `timestamp`, `signature`, `folder`) → Cloudinary responds with `secure_url` → send that URL as the target model field (`cover_image`, `image`, `avatar`) in a normal `POST`/`PATCH`. The file itself never touches the Django backend; the Cloudinary API secret never reaches the browser. No frontend environment variable is needed for `cloud_name` — it arrives in the signature response.

## Pagination formats

Three response envelopes are in use, chosen per resource:

**Page-number** (categories, restaurants, favorites) — query params `page`, `page_size`:

```json
{ "count": 42, "next": "...?page=3", "previous": "...?page=1", "results": [] }
```

**Limit/offset** (menu items) — query params `limit`, `offset`:

```json
{
  "count": 87,
  "next": "...?limit=20&offset=40",
  "previous": "...?limit=20&offset=0",
  "results": []
}
```

**Cursor** (reviews) — query param `cursor` (opaque; always follow `next`/`previous` verbatim):

```json
{ "next": "...?cursor=cD0yMDI2LTA4LTA5KzAwJTNBMDA=", "previous": null, "results": [] }
```

## Error format

Standard DRF error shapes; branch on status code and object shape, never on the text of a `detail` message.

**Field validation errors** (`400`):

```json
{ "email": ["This field is required."], "price": ["Price must be greater than 0."] }
```

**Non-field validation errors** (`400`):

```json
{ "non_field_errors": ["You have already reviewed this restaurant."] }
```

**Auth / permission / not-found** — flat `detail` string, status `401`/`403`/`404`. The exact wording varies by endpoint (e.g. a restaurant 404 returns `"No Restaurant matches the given query."`) — do not match on it.

**Invalid/expired JWT** (`401`):

```json
{ "detail": "Token is invalid or expired", "code": "token_not_valid" }
```

**Failed login** (`401`, not `400`):

```json
{ "detail": "No active account found with the given credentials" }
```

**Rate limited** (`429`):

```json
{ "detail": "Request was throttled. Expected available in 42 seconds." }
```

Anonymous clients: 30 requests/minute. Authenticated clients: 100 requests/minute. Handled generically in `error.interceptor.ts` with a toast, not per-endpoint.

The API only ever returns `application/json`.

## Naming and compatibility conventions

- Every resource id is a UUID **string** — type `id: string`, never `number`.
- Timestamps are ISO-8601 with a `-06:00` offset (`America/Mexico_City`, no DST) — don't assume a trailing `Z`/UTC.
- Decimal fields (`price`, `average_rating`, `latitude`, `longitude`) are serialized as JSON **strings** — parse explicitly before arithmetic or comparisons.
- Nested-read / flat-write is a recurring pattern: `restaurants.categories` (nested, read-only) pairs with `category_ids` (flat, write-only); `favorites.restaurant` (nested) pairs with `restaurant_id` (write-only). Model separate read and write DTOs per resource.
- CORS confirmed for `http://localhost:4200` with credentials allowed — no dev proxy needed.
