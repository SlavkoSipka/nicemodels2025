# SEO Architecture — NiceModels.ch

This document is for developers maintaining or extending the SEO layer. Read it before touching metadata, routing, or the sitemap.

---

## German-canonical strategy

The site is Swiss German–primary. There are NO locale-prefixed URLs (`/de/`, `/fr/`, etc.). Every canonical URL points to the German version. The `hreflang` block on each page is:

```
de-CH → the page URL
x-default → the page URL (same)
```

This means Romandie (FR) and Ticino (IT) visitors see German content. The `next-intl` package is installed and the UI is internationalised for the UI shell, but from Google's perspective there is one canonical German URL per page.

**Do NOT add locale-prefixed alternate URLs unless you also have fully localised content at those URLs.** Declaring hreflang alternates that point to thin or identical content is worse than having no hreflang at all.

---

## Central metadata helper — `src/lib/seo.ts`

All static and most dynamic pages generate metadata via `buildMetadata()`:

```typescript
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  path: '/some-route',          // relative path — canonical is built from this
  title: 'Page Title',          // WITHOUT '| NiceModels.ch' — template adds it
  description: 'Under 155 chars.',
  ogImage: '/custom.webp',      // optional; defaults to /logo.webp
  ogType: 'article',            // optional; defaults to 'website'
})
```

`buildMetadata()` emits:
- `title` (string; root layout template appends `| NiceModels.ch`)
- `description`
- `alternates.canonical` (absolute URL)
- `alternates.languages` (`de-CH` + `x-default` pointing to the same canonical)
- `openGraph` with `siteName`, `locale`, `type`, `url`, `images`
- `twitter` card

**Title template rule**: The root layout (`src/app/layout.tsx`) sets `title: { template: '%s | NiceModels.ch' }`. Titles passed to `buildMetadata()` must NOT already contain `| NiceModels.ch`. Static pages (e.g. `/terms`) pass just `'AGB'`; the template produces `'AGB | NiceModels.ch'`.

---

## Per-page metadata — dynamic routes

Dynamic pages (`/models/[id]`, `/clubs/[id]`, `/jobs-rents/[id]`, `/blog/[slug]`) export `generateMetadata()` functions directly in their page files. They do NOT use `buildMetadata()` because they need per-item data. These functions must manually:
- Set `alternates.canonical`
- Set `alternates.languages` (`de-CH` + `x-default`) — **except** `/blog/[slug]` which omits `languages` (German-canonical, no translated blog content)
- Build `openGraph` with appropriate `type` (`'profile'`, `'article'`, etc.)
- Include `twitter` card

The `openGraph` object on a page completely replaces the root layout's `openGraph` — there is no deep merge. That's why `siteName` and `locale` must be set on every page that emits OG data.

---

## Profile pages: `/profile/[id]` → `/models/[id]`

`/profile/[id]` is a legacy URL that should not be indexed. Its `generateMetadata()` returns:

```typescript
{
  robots: { index: false, follow: false },
  alternates: { canonical: `https://www.nicemodels.ch/models/${id}` },
}
```

The canonical redirects crawlers to the canonical model URL. Do not change this.

---

## City pages — `src/app/escort/`

### Structure

```
src/app/escort/
  page.tsx          — /escort (city index, static)
  [city]/
    page.tsx        — /escort/:city (dynamic but statically pre-rendered)
src/lib/data/
  cities-seo.ts     — single source of truth for city config
```

### `cities-seo.ts` fields

| Field | Purpose |
|-------|---------|
| `slug` | URL segment, e.g. `'zurich'` |
| `labelDe` | Display name, e.g. `'Zürich'` |
| `canton` | Canton abbreviation, e.g. `'ZH'` |
| `dbCityName` | Exact value in `model_details.city` DB column |
| `dbAreaName` | Exact value in `club_details.area` DB column |
| `introCopyDe` | ~350-word intro copy, `\n\n` separates paragraphs |
| `relatedCitySlugs` | Array of 3–4 slugs to show in "Related cities" section |

### Adding a new city

1. Confirm the exact DB values for `model_details.city` and `club_details.area` — run a Supabase query to be sure. Do NOT guess.
2. Write a ~350-word German intro text (factual, no explicit content).
3. Add a `CityConfig` entry to the `CITIES` array in `cities-seo.ts`.
4. The sitemap is generated from `CITIES` automatically — no sitemap changes needed.
5. Run `npm run build` to confirm static generation of the new city page.

### JSON-LD on city pages

City pages inject `BreadcrumbList + CollectionPage` via a plain `<script type="application/ld+json">` tag in the server component — NOT via `next/script`. This is intentional and critical: `next/script` defers injection to client-side hydration, which means crawlers that don't execute JS won't see the schema. Always use plain `<script>` for JSON-LD in server components.

---

## JSON-LD inventory

| URL pattern | Schema type | Location |
|------------|-------------|----------|
| All pages | `WebSite` | `src/app/layout.tsx` inline `<script>` |
| `/escort/[city]` | `BreadcrumbList`, `CollectionPage` | `src/app/escort/[city]/page.tsx` inline `<script>` |
| `/jobs-rents/[id]` (job listings only) | `JobPosting` | `src/app/jobs-rents/[id]/page.tsx` inline `<script>` |
| `/blog/[slug]` | `DiscussionForumPosting` | `src/app/blog/[slug]/page.tsx` inline `<script>` |

---

## robots.ts — `src/app/robots.ts`

`/robots.txt` is generated by `src/app/robots.ts`. Current rules:

- `User-Agent: *` — allows `/`, disallows all private paths (dashboard, API, auth, chat, etc.)
- 10 AI bots blocked entirely: GPTBot, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot, CCBot, Google-Extended, OAI-SearchBot, Bytespider, Amazonbot

To add a new AI bot, add its user agent string to the `AI_BOTS` array in `src/app/robots.ts`.

To add a new private path, add it to the `disallow` array in the wildcard rule.

---

## sitemap.ts — `src/app/sitemap.ts`

`/sitemap.xml` is generated by `src/app/sitemap.ts`. Three sections:

1. **Static pages** — hardcoded URLs with `STATIC_LASTMOD = new Date('2026-06-11')`. Update `STATIC_LASTMOD` when static content changes.
2. **City pages** — generated from the `CITIES` array (`/escort` + 10 city slugs). Priority `0.8`, `changeFrequency: 'weekly'`.
3. **Dynamic entries** — models, clubs, job listings, blog topics fetched from Supabase with real DB timestamps. Only active/public entries are included.

**Never use `new Date()` as `lastmod` for static pages** — it makes every page appear changed on every rebuild and forces Google to re-crawl pages that haven't changed.

---

## Age gate — `src/components/AgeGate.tsx`

The 18+ gate is a `'use client'` component added to `src/app/layout.tsx`. It:

1. Uses `useState(false)` as initial state — SSR always renders `null` (bots and crawlers see full page content)
2. Reads the `age_verified` cookie in `useEffect` (client-only)
3. Shows the gate overlay only if the cookie is absent
4. Sets `age_verified=true` cookie (60-day expiry, `SameSite=Lax; Secure`) on "Ja, ich bin 18+"
5. Does NOT show on: `/dashboard`, `/auth`, `/login`, `/register`, `/onboarding`, `/forgot-password`, `/reset-password`, `/chat`

**Do not convert AgeGate to a server component** — the cookie read must stay client-side so SSR never blocks the page from rendering. Moving it server-side would show a blank page to Googlebot.

---

## CSP — `next.config.ts`

The Content-Security-Policy is currently deployed as `Content-Security-Policy-Report-Only`. It is NOT enforcing. When you have confirmed (via browser console on all key pages) that no violations appear:

1. Change `'Content-Security-Policy-Report-Only'` → `'Content-Security-Policy'` in `next.config.ts`
2. Redeploy
3. Monitor for 24 hours

If you add a new third-party domain (CDN, analytics, etc.), add it to the relevant CSP directive in `next.config.ts` BEFORE enforcing.

---

## What NOT to change

| What | Why |
|------|-----|
| `STATIC_LASTMOD` value | Arbitrary future dates reset crawl priority; only update it when content actually changes |
| `<script type="application/ld+json">` → `<Script>` | `next/script` defers JSON-LD — crawlers won't see it in the initial HTML |
| Root layout canonical to have `languages:` | Root layout sets only `canonical`; hreflang comes from individual pages via `buildMetadata()` |
| AgeGate initial state to `true` | Would block SSR — Googlebot would see the gate, not content |
| Title strings to include `\| NiceModels.ch` | Root layout template already appends the brand name; including it manually doubles it |
| `/profile/[id]` `robots: { index: false }` | Intentional — these are legacy URLs that should not compete with `/models/[id]` |
