# NiceModels.ch

Swiss directory for models, clubs and agencies. It covers public model profiles (sedcards), club pages, job and rental listings, stories, chat, and an admin back office. Ads, banners and listings are paid through Stripe.

## Stack

- **Next.js 16** (App Router), React 19, TypeScript, Tailwind CSS
- **Supabase**: PostgreSQL with Row Level Security, Auth, Storage, Realtime
- **next-intl**: interface in 10 languages, German by default; the locale comes from a cookie, not the URL
- **TanStack Query** for client-side data
- **Stripe Checkout** (CHF), **Resend** for transactional email, **EmailJS** for the contact form
- **Netlify** hosting

## Getting started

Requirements: Node.js 20 and access to the Supabase project.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local` before starting; [docs/deployment.md](docs/deployment.md#environment-variables) describes each variable. The app runs at http://localhost:3000.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build, including type checking |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check without emitting |

Maintenance scripts in `scripts/`:

| Script | Description |
|---|---|
| `generate-icons.mjs` | Regenerates the favicon and app icons from `public/logo.webp` |
| `seed-cities.mjs` | Imports Swiss localities from the official postcode CSV into `cities` |
| `fix-mislabeled-photos.mjs` | Re-encodes stored images whose content does not match their extension |

## Project structure

```text
src/
  app/              Routes (App Router)
    api/            Route handlers: admin, checkout, Stripe webhook, cron, tracking, email
    dashboard/      Signed-in areas: admin, model, company (clubs), user
    models/ clubs/ jobs-rents/ escort/ blog/ ...   Public pages
  components/       UI, grouped by feature
  lib/              Data access, Supabase clients, email, Stripe, tracking, helpers
  i18n/             next-intl request configuration
  proxy.ts          Request proxy: Supabase session refresh, visitor region cookie
messages/           Translations (de, en, fr, it, es, pl, ro, hu, cs, ru)
supabase-docs/      SQL migration scripts and database changelog
docs/               Developer documentation
scripts/            Maintenance scripts
public/             Static assets
```

## Accounts

| Role | Can |
|---|---|
| Visitor (`user`) | Browse, save favourites and searches, comment, chat, publish job and rental listings |
| Model (`model`) | Maintain a profile with photos, videos, rates, services and working hours; post stories; activate a sedcard; buy banners; see statistics |
| Club or agency (`company`) | Maintain a club profile, invite models, activate an ad, publish job and rental listings, buy banners |
| Admin (`admin`) | Moderate content, verify identities, censor or remove media, block users and listings, change account types, view statistics |

## Documentation

- [Database](docs/database.md): clients, roles, migrations, storage, auth, conventions
- [Schema reference](docs/schema.md): every table, view and RPC function
- [Deployment](docs/deployment.md): environment variables, Supabase settings, scheduled jobs
- [Payments](docs/payments.md): Stripe checkout and webhook
- [Email](docs/email.md): Resend, Supabase Auth email, templates
- [SEO](docs/seo.md): metadata, sitemap, structured data

## Deployment

Pushing to `master` deploys to production on Netlify. Database changes are applied by hand in the Supabase SQL Editor before the code that needs them is deployed. See [docs/deployment.md](docs/deployment.md).

## License

Proprietary. All rights reserved.
