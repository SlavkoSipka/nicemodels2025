# Database

The application uses a single Supabase project: PostgreSQL with Row Level Security (RLS), Supabase Auth, Storage and Realtime. The full column-level reference is in [schema.md](schema.md).

## Clients

| Client | File | Key | Use |
|---|---|---|---|
| Browser | `src/lib/supabase/client.ts` | anon | Client components. One shared instance per tab, so auth refreshes do not race. |
| Server | `src/lib/supabase/server.ts` | anon + session cookies | Server components and route handlers acting as the signed-in user. |
| Admin | `src/lib/supabase/admin.ts` | service role | Route handlers only: admin actions, tracking writes, cron jobs and the Stripe webhook. Bypasses RLS. |

The session is refreshed in `src/lib/supabase/middleware.ts`, which `src/proxy.ts` runs on every request that needs it.

Code that uses the admin client must check the caller first, usually by reading the user with the server client and requiring `profiles.role = 'admin'`.

## Roles

`profiles.role` is the `app_role` enum:

| Role | Meaning |
|---|---|
| `user` | Visitor account: favourites, comments, chat, saved searches. |
| `model` | Model with a public profile (sedcard). |
| `company` | Club or agency with a club profile, job and rental listings. |
| `admin` | Full access to the admin dashboard. |

Admins can change an account's type from the admin user lists (`/api/admin/change-role`). Role-specific rows are kept when the type changes, so switching back restores them. The user completes the new profile through `/onboarding` on their next login.

## Schema reference

[schema.md](schema.md) is generated from the PostgREST OpenAPI description of the production database. To regenerate it after a schema change:

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" > openapi.json
```

Then rebuild the Markdown from `openapi.json` with the generator script kept outside the repository, or edit the affected tables in `schema.md` by hand. RLS policies, triggers and indexes do not appear in the OpenAPI description; they live in the SQL scripts.

## Migrations

Schema changes are plain SQL scripts in `supabase-docs/`, run once in the Supabase SQL Editor. There is no migration runner, so:

1. Write the change as a new script named after what it does, for example `ALTER-orders-add-stripe-fields.sql` or `FIX-favorites-RLS-policies.sql`.
2. Prefer `IF NOT EXISTS` / `CREATE OR REPLACE` so a script can be re-run safely.
3. Run it in the SQL Editor of the production project.
4. Add an entry to `supabase-docs/CHANGELOG.md` and update [schema.md](schema.md).

The prefixes describe the kind of change: `CREATE-` (new tables, functions, buckets), `ALTER-` / `ADD-` (new columns or constraints), `UPDATE-` / `INSERT-` (data), `FIX-` (corrections to policies, functions or data).

## Storage buckets

| Bucket | Access | Limit | Contents |
|---|---|---|---|
| `model-photos` | public | 10 MB | Model gallery photos |
| `model-videos` | public | 50 MB | Model videos |
| `model-stories` | public | none | Story photos and videos, removed after expiry |
| `club-photos` | public | none | Club gallery photos |
| `club-videos` | public | 50 MB | Club videos |
| `job-listing-photos` | public | none | Job and rental listing photos |
| `banners` | public | none | Purchased banner images |
| `discussion-images` | public | none | Cover images for discussion topics |
| `user-avatars` | public | none | Visitor avatars, one file per user |
| `verification-documents` | private | none | ID card, selfie and video for identity verification |
| `report-screenshots` | private | none | Screenshots attached to user reports |
| `media-originals` | private | none | Originals of photos and videos an admin censored, kept so the edit can be undone |
| `banner-images` | public | none | Legacy bucket, not used by the current code |

Model media and verification files are stored under a folder named after the account's email address (`{email}/photos/...`, `{email}/id-card-...`). File names are content-addressed (timestamp plus random suffix) and never overwritten, which is why gallery uploads are cached for a year (`IMMUTABLE_CACHE_CONTROL` in `src/lib/imageProcessor.ts`).

Uploads are prepared in the browser: `processImage` resizes, watermarks and re-encodes photos to WebP (JPEG where the browser has no WebP encoder) before upload.

## Auth

- **Sign-up** logs the user in immediately. Email confirmation for sign-up is switched off in the Supabase dashboard (Authentication → Providers → Email → Confirm email). If it is switched on again, `signUp()` returns no session and the registration flow breaks.
- **Password recovery and email change** use the token-hash flow at `/auth/confirm`, which works when the link is opened on another device and is not consumed by mail scanners that prefetch links. The Supabase email templates link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<type>&next=<path>`.
- **`/auth/callback`** exchanges a PKCE code for a session and redirects to the canonical site URL (`NEXT_PUBLIC_SITE_URL`, falling back to the request origin).

## Realtime

The `supabase_realtime` publication includes `messages`, `conversations` and `online_status` (`FIX-REALTIME-COMPLETE.sql`). The chat widget, chat pages and online indicators subscribe to these tables; RLS limits each subscriber to rows they can read.

## Account deletion

`POST /api/account/delete` deletes the caller's own account, or any account when called by an admin:

1. A snapshot of the profile and its role-specific rows is written to `deleted_accounts`, which only admins can read. If the snapshot cannot be written, nothing is deleted.
2. `auth.admin.deleteUser()` deletes the auth user; `profiles` and dependent rows follow through `ON DELETE CASCADE`. If a foreign key still blocks the delete, the route falls back to the `admin_delete_user` RPC, which removes dependent rows first (`FIX-admin-delete-cascade.sql`).
3. The former user receives an `admin_account_deleted` email.

Deleting the auth user frees the email address for a new registration. Files in storage are not removed by this route.

## Active ads (sedcards)

A model or club appears in public listings while it has an active ad: a paid `order_items` row for an `ad_package` product whose window (activation date, or the order date, plus the product duration) contains the current time.

- `models_with_active_ads()`, `clubs_with_active_ads()` and `model_ids_with_active_ads()` return the listed profiles. They are `SECURITY DEFINER` functions, so public pages can call them without access to `orders`.
- `user_has_active_ad(p_user_id)` and `checkActiveAd()` in `src/lib/activeAd.ts` answer the same question for one account.
- `fetchActiveAds()` in `src/lib/api/activeAds.ts` throws on error, so `unstable_cache` never stores an empty listing after a transient failure.
- During a free promotional period (on unless `NEXT_PUBLIC_MODEL_SEDCARD_FREE` or `NEXT_PUBLIC_CLUB_AD_FREE` is set to `false`), activation creates an order with `status = 'paid'`, `total_amount = 0` and `payment_method = 'card'`, because `orders.payment_method` only allows `card`, `twint` and `phone`.

## Statistics

| Data | Written by | Read by |
|---|---|---|
| `model_statistics` (`profile_view`, `contact_view`, `favorite_add`, `share`) | `src/lib/tracking.ts` from the browser | Model statistics page, through the `model_statistics_summary` and `model_statistics_daily` views |
| `page_views`, `listing_views`, `listing_clicks`, `banner_impressions`, `banner_clicks` | `POST /api/track/event` with the admin client | Admin statistics |
| `club_analytics` | Club profile page | Club dashboard |

A profile view is counted at most once per model every 30 minutes per browser session, so reloads do not inflate the numbers. View counters on public cards come from `get_model_view_counts`, `get_club_view_counts` and `get_listing_view_counts`.

## Club invites

A club invites a model through `club_invites`. An invite starts as `pending`; the model sets it to `accepted` or `rejected`, and the club can set it to `cancelled`. The `on_club_invite_created` trigger inserts a `notifications` row for the invited model. Models with an accepted invite are listed on the club's public profile.

## Conventions and pitfalls

- The role column is `profiles.role`. There is no `user_role` column.
- `club_photos` has `uploaded_at`, not `created_at`.
- Working hours (`model_working_hours`, `club_working_hours`) store one row per day of the week.
- Functions that return `profiles.role` as `text` must cast it (`p.role::text`), otherwise Postgres rejects the function with "structure of query does not match function result type".
- `notifications.type` is free text. The values in use are defined where notifications are created (`src/lib/admin/notify.ts`, database triggers).
- Public listings are cached with `unstable_cache`, so a data change appears on them once the cache TTL has passed.
