# Deployment

The site runs on Netlify with the Next.js runtime (`@netlify/plugin-nextjs`). Netlify builds every push to `master` and publishes it to production; `netlify.toml` sets the build command (`npm run build`) and Node 20.

## Environment variables

Set these in Netlify (Site configuration → Environment variables). `.env.example` lists the same names for local development, where they go in `.env.local`. Variables prefixed with `NEXT_PUBLIC_` are inlined into the browser bundle at build time, so changing one requires a new deploy.

### Required

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser and server, RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for the admin client. Server only; never expose it. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin, `https://www.nicemodels.ch`. Used for auth redirects, Stripe return URLs and links in emails. |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Signing secret of the Stripe webhook endpoint |
| `CRON_SECRET` | Shared secret the scheduled jobs send in `x-cron-secret` |

### Email

| Variable | Purpose |
|---|---|
| `RESEND_API_KEY` | Enables transactional email. Without it, email sending is skipped. |
| `EMAIL_FROM` | Sender, default `NiceModels <noreply@nicemodels.ch>` |
| `EMAIL_REPLY_TO` | Reply-to address, default `info@nicemodels.ch` |
| `EMAIL_UNSUB_SECRET` | Signs unsubscribe links |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID`, `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID`, `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Contact form (EmailJS) |

### Optional

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_MODEL_SEDCARD_FREE` | Set to `false` to charge for model sedcards. Free while unset. |
| `NEXT_PUBLIC_CLUB_AD_FREE` | Set to `false` to charge for club ads. Free while unset. |
| `CMS_BASE_URL`, `CMS_SITE_ID` | Blog CMS. Without them the blog is empty. |
| `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION` | Search console verification meta tags |

## Supabase

- **Authentication → URL Configuration**: Site URL `https://www.nicemodels.ch`; add `https://www.nicemodels.ch/**` (and `http://localhost:3000/**` for development) to the redirect URLs.
- **Authentication → Providers → Email**: "Confirm email" off. See [database.md](database.md#auth).
- **SMTP and email templates**: see [email.md](email.md#supabase-auth).
- **Schema changes**: run the SQL script in the SQL Editor before deploying code that depends on it. See [database.md](database.md#migrations).

## Stripe

Register the webhook endpoint `https://www.nicemodels.ch/api/stripe/webhook` and use live keys in production. See [payments.md](payments.md#configuration).

## Scheduled jobs

Three endpoints have to be called on a schedule. Each accepts `GET` or `POST` with the header `x-cron-secret: <CRON_SECRET>` and returns 401 without it. No scheduler is defined in this repository; use Supabase `pg_cron` with `pg_net`, a GitHub Actions workflow or any external cron service.

| Endpoint | Schedule | Job |
|---|---|---|
| `/api/cron/cleanup-pending-payments` | every 30 minutes | Cancels orders, banners and listings left in `pending_payment` for more than 24 hours |
| `/api/cron/email/sedcard-reminders` | hourly | Emails models whose sedcard expires within 24 hours or has expired |
| `/api/cron/email/fav-digest` | daily, 08:00 | Sends the daily digest of changes to favourited profiles |

Example call:

```bash
curl -X POST https://www.nicemodels.ch/api/cron/email/sedcard-reminders \
  -H "x-cron-secret: $CRON_SECRET"
```

Example with `pg_cron` and `pg_net`:

```sql
select cron.schedule(
  'sedcard-reminders',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://www.nicemodels.ch/api/cron/email/sedcard-reminders',
    headers := jsonb_build_object('x-cron-secret', '<CRON_SECRET>')
  );
  $$
);
```

## HTTP behaviour

- Security headers are set in `next.config.ts` (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) and `netlify.toml`.
- The Content Security Policy is sent as `Content-Security-Policy-Report-Only`. To enforce it, confirm that key pages log no violations and rename the header in `next.config.ts`; see [seo.md](seo.md#csp--nextconfigts).
- Legacy URLs redirect permanently (308) in `next.config.ts`: `/profile/:id` to `/models/:id`, and `/register/model` to `/register`.
- Images are served through the Next.js image optimizer (Netlify Image CDN in production), configured under `images` in `next.config.ts`. `<Image quality>` values snap to the nearest entry in `images.qualities`; hand-built `/_next/image` URLs must use one of those values exactly.

## After a deploy

1. Open the home page, a model profile and a club profile.
2. Sign in, open the dashboard and check that the chat widget loads conversations.
3. After changes to payments: complete one checkout and confirm the webhook delivery in the Stripe Dashboard.
4. Check the Netlify function logs for errors.
