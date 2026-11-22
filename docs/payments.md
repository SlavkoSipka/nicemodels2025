# Payments

Sedcards (model and club ads), banners and job or rental listings are paid through Stripe Checkout in CHF. Every order is a one-off payment; there are no subscriptions.

## Flow

1. The client posts the cart to `POST /api/checkout/session`. The route resolves prices on the server, creates an `orders` row (`pending`) with its `order_items`, and creates a Checkout Session. Banners and listings are created up front with `status = 'pending_payment'`.
2. The user pays on Stripe's hosted page and returns to `/dashboard/checkout/success?session_id=...`, or to `/dashboard/checkout/cancel` if they abort.
3. Stripe calls `POST /api/stripe/webhook`. On success the order becomes `paid` (with `paid_at`, payment intent and receipt URL), and `activateOrderItems()` switches the related banners and listings to `active` with their `starts_at` / `expires_at`. Sedcards need no extra step: an `ad_package` item is active while the paid order's window covers the current time.

During a free promotional period (see [database.md](database.md#active-ads-sedcards)) the checkout route skips Stripe and records a paid order with a total of 0.

### Webhook events

| Event | Effect |
|---|---|
| `checkout.session.completed`, `checkout.session.async_payment_succeeded` | Order paid, items activated |
| `checkout.session.expired`, `checkout.session.async_payment_failed` | Order and its pending banner or listing cancelled |
| `payment_intent.payment_failed` | Failure recorded on the order |

The webhook verifies the Stripe signature on the raw body. It checks the order status before marking it paid, so Stripe retries are safe. Handler errors are logged and acknowledged with 200, so a malformed event is not retried indefinitely.

### Abandoned checkouts

Checkout Sessions expire after 12 hours, which triggers `checkout.session.expired`. As a safety net, the `cleanup_pending_payments(age)` function cancels orders, banners and listings still pending after 24 hours. It runs from the cron endpoint `/api/cron/cleanup-pending-payments` (see [deployment.md](deployment.md#scheduled-jobs)).

## Payment methods

Checkout currently offers card payments only (`payment_method_types: ['card']` in `src/app/api/checkout/session/route.ts`). TWINT requires a Stripe account registered in Switzerland. To offer it, enable TWINT in the Stripe Dashboard (Settings → Payment methods) and add `'twint'` to that list. The webhook already handles the asynchronous events TWINT uses.

## Configuration

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` in development, `sk_live_...` in production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` / `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the webhook endpoint |
| `NEXT_PUBLIC_SITE_URL` | Base for the success and cancel URLs; defaults to `https://nicemodels.ch` |

`validateStripeEnv()` (`src/lib/stripe/validate-env.ts`) fails the request with a clear error when one of the Stripe variables is missing, and warns when a live key is used outside production.

In the Stripe Dashboard (Developers → Webhooks), add the endpoint `https://www.nicemodels.ch/api/stripe/webhook` with the five events listed above.

The database side comes from these scripts in `supabase-docs/`, in order: `ALTER-orders-add-stripe-fields.sql`, `UPDATE-job-package-prices.sql`, `UPDATE-banner-region-pricing.sql`, `ALTER-banners-add-pending-payment-status.sql`, `ALTER-job-listings-add-pending-payment-status.sql`, `INSERT-banner-package-interstitial.sql`, `CREATE-cleanup-pending-payments.sql`.

## Local testing

Forward webhooks to the dev server with the Stripe CLI:

```bash
stripe listen --forward-to http://localhost:3000/api/stripe/webhook
```

Use the signing secret it prints as `STRIPE_WEBHOOK_SECRET` in `.env.local`, and set `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

Test cards (any future expiry, any CVC):

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Payment succeeds |
| `4000 0027 6000 3184` | Requires 3D Secure |
| `4000 0000 0000 9995` | Declined (insufficient funds) |

Check after a test purchase:

- `orders.status = 'paid'`, with `paid_at` and `stripe_payment_intent_id` set.
- A banner or listing moved from `pending_payment` to `active`; after a cancelled checkout it is `cancelled`.
- A paid sedcard makes the profile appear in the public listings.

The cleanup job can be run by hand:

```bash
curl -X POST http://localhost:3000/api/cron/cleanup-pending-payments \
  -H "x-cron-secret: $CRON_SECRET"
```

## Operations

- **Refunds** are issued in the Stripe Dashboard. A refund does not deactivate the banner or listing; an admin does that in the admin dashboard.
- **Receipts**: the Stripe receipt URL is stored in `orders.stripe_receipt_url` and linked from the checkout success page and the purchase history.
- **Interstitial banners** have pricing rows (inactive) but no placement on the site yet.
