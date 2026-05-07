# Stripe Integration — Runbook

End-to-end checklist for deploying and testing the Stripe payments integration on `nicemodels.ch`.

---

## 1. Stripe Dashboard prerequisites

1. Make sure your Stripe account is registered in **Switzerland (CH)** (required for TWINT).
2. Stripe Dashboard → **Settings → Payment methods** — enable **Card** and **TWINT** (CHF).
3. Stripe Dashboard → **Settings → Branding** — set your brand colour/logo so Checkout looks polished.
4. Default currency: **CHF**.

### Get your keys

- **Test keys (development):**
  - `STRIPE_SECRET_KEY=sk_test_...` (Dashboard → Developers → API keys)
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...`
- **Live keys (production):** the same fields with `sk_live_...` / `pk_live_...`

### Webhook endpoint

In Dashboard → **Developers → Webhooks → Add endpoint**:

- **URL:** `https://nicemodels.ch/api/stripe/webhook`
- **Events to send:**
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.expired`
  - `checkout.session.async_payment_failed`
  - `payment_intent.payment_failed`
- Copy the signing secret → `STRIPE_WEBHOOK_SECRET=whsec_...`

For local development, use the Stripe CLI to forward events to your dev server (instructions in section 4).

---

## 2. Environment variables

Add these to `.env.local` (dev) and your production environment (Netlify/Vercel/etc.):

```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SITE_URL=https://nicemodels.ch
```

`NEXT_PUBLIC_SITE_URL` is used to build success/cancel URLs. In dev it falls back to `https://nicemodels.ch`; for local testing, set it to `http://localhost:3000`.

---

## 3. Run the SQL migrations (Supabase SQL Editor)

Run each file once, in order:

1. `ALTER-orders-add-stripe-fields.sql` — adds Stripe columns to `orders` + linkage columns on `order_items`.
2. `UPDATE-job-package-prices.sql` — sets job/rent prices to 39/49/59 CHF.
3. `UPDATE-banner-region-pricing.sql` — sets banner pricing to the new rate card.
4. `ALTER-banners-add-pending-payment-status.sql` — adds `pending_payment` status.
5. `ALTER-job-listings-add-pending-payment-status.sql` — adds `pending_payment` status.
6. `INSERT-banner-package-interstitial.sql` — preps interstitial pricing rows (kept inactive).
7. `CREATE-cleanup-pending-payments.sql` — cleanup function for abandoned drafts.

Verify quickly:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name='orders' AND column_name LIKE 'stripe%';

SELECT placement, duration_days, price_chf
FROM banner_region_pricing
WHERE region_count = 4 ORDER BY placement, duration_days;

SELECT name, duration_days, price_chf, is_active
FROM products WHERE product_type='job_package' ORDER BY duration_days;
```

---

## 4. Local development & testing

### Start the dev server

```bash
npm run dev
```

### Forward webhooks to localhost

In a second terminal:

```bash
stripe login
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

The CLI prints a temporary signing secret like `whsec_abc123`. Use **that** value in `.env.local` while testing locally — it's different from the production webhook secret.

### End-to-end test cases

For each flow, use Stripe test cards:

| Card                     | Behaviour                  |
|--------------------------|----------------------------|
| `4242 4242 4242 4242`    | Card payment succeeds      |
| `4000 0027 6000 3184`    | Requires 3DS authentication|
| `4000 0000 0000 9995`    | Card declined (insufficient funds) |
| `4000 0084 0000 0066`    | TWINT-style async (use TWINT method) |

Any future expiry date, any 3-digit CVC, any postal code.

#### Sedcard activation

1. Sign in as a model. Go to **Activate Sedcard**.
2. Pick a duration → **Add to cart** → **Pay with Card or TWINT**.
3. On Stripe Checkout, pay with `4242 ...`.
4. You should be redirected to `/dashboard/checkout/success?session_id=...`.
5. Verify in Supabase:
   - `orders.status = 'paid'`
   - `orders.paid_at` set
   - `orders.stripe_payment_intent_id` set
6. Verify `Activate Sedcard` page now shows "Your ad is currently active".
7. Profile card shows up in search.

#### Banner purchase

1. Go to **Buy Banner**.
2. Pick placement → cantons → duration → upload image → **Pay with Card or TWINT**.
3. Cancel on the Stripe page (back arrow). You should land on `/dashboard/checkout/cancel`.
4. Confirm in DB that the `banners` row has `status = 'cancelled'`.
5. Repeat the flow but pay successfully → banner row flips to `status = 'active'` with proper `starts_at` / `expires_at`.

#### Job/Rent listing

1. Go to **Jobs / Rent → Create**.
2. Fill the form, upload photos, pick a duration, **Pay**.
3. Pay successfully → listing flips from `pending_payment` → `active`.
4. Listing appears on the public Jobs/Rent page.

#### Cleanup cron

```bash
curl -X POST http://localhost:3000/api/cron/cleanup-pending-payments \
  -H "x-cron-secret: $CRON_SECRET"
```

Should return JSON with counts of cancelled rows. Schedule this every 30 minutes in production (Netlify Functions / Vercel Cron / Supabase pg_cron).

---

## 5. Production deployment checklist

- [ ] Switch env vars to **live** keys (`sk_live_...`, `pk_live_...`, production `whsec_...`).
- [ ] Set `NEXT_PUBLIC_SITE_URL=https://nicemodels.ch`.
- [ ] Confirm Stripe webhook endpoint is live (Dashboard → Webhooks → "Listening").
- [ ] Schedule cleanup cron every 30 minutes.
- [ ] Run all SQL migrations on production DB.
- [ ] Smoke test one real card payment in production right after deploy.
- [ ] Monitor `failed_orders` and webhook delivery in Stripe Dashboard for the first 24h.

---

## 6. Operational notes

- **Refunds:** issued from the Stripe Dashboard. The webhook does NOT auto-deactivate banners/listings on refund — admins handle that manually.
- **Pending order cleanup:** runs from `cleanup_pending_payments(interval)` SQL function. Default age = 24 hours; matches Stripe's session expiry.
- **Idempotency:** the webhook checks `orders.status` before flipping to `paid`, so Stripe retries are safe.
- **Receipt URLs:** stored on `orders.stripe_receipt_url` and surfaced in `/dashboard/model/purchase-history`.
- **TWINT flows:** when the user picks TWINT in Checkout, payment is asynchronous. We listen for `checkout.session.async_payment_succeeded` and `*_failed` in addition to `completed`.

---

## 7. Scope / not in this rollout

- **Interstitial banner placement** — pricing seeded but UI/render not implemented.
- **Subscriptions / auto-renewal** — every order is `mode='payment'` (one-off).
- **Apple Pay / Google Pay** — not enabled (TWINT covers the local market). Easy to add later via `payment_method_types`.
- **Refund UI** — handled in Stripe Dashboard.
