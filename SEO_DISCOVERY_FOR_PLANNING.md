# SEO Discovery Report — NiceModels.ch
Generated: 2026-06-10

---

## 1. PROJECT OVERVIEW

**Site name:** NiceModels.ch
**Domain:** https://www.nicemodels.ch
**Category:** Swiss adult/escort portal (Erotikportal)
**Primary market:** Switzerland (DE-CH default locale, also FR, EN, ES)
**Business model:** B2B2C — models and clubs pay for ad placement and banner slots; readers browse for free
**Contact:** info@nicemodels.ch · WhatsApp +41 78 333 93 96
**Deployment:** Netlify (@netlify/plugin-nextjs devDependency)

**Purpose of this report:** Dense fact-base for SEO planning. All data sourced by reading actual source files. Nothing is guessed or inferred from memory.

---

## 2. TECH STACK

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js | ^16.1.6 |
| React | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^3.4.17 |
| i18n | next-intl | ^4.11.0 |
| Database/auth | Supabase (@supabase/ssr + @supabase/supabase-js) | ^0.8.0 / ^2.89.0 |
| Payments | Stripe (@stripe/stripe-js + stripe) | ^9.4.0 / ^22.1.1 |
| Email | EmailJS (@emailjs/browser) + Resend | ^4.4.1 / ^6.12.2 |
| Queries | @tanstack/react-query | ^5.100.10 |
| Charts | Recharts | ^3.8.1 |
| Icons | lucide-react | ^0.562.0 |
| Rich text | TinyMCE (self-hosted, copied to public/ at build time) | from node_modules |
| Excel export | xlsx | ^0.18.5 |
| Hosting | Netlify (plugin-nextjs) | ^5.15.9 |

**Key architectural observations for SEO:**
- Next.js App Router (not Pages Router)
- Mix of Server Components (SC) and Client Components (CC): 182 files have `'use client'` directive
- `export const dynamic = 'force-dynamic'` on homepage (`src/app/page.tsx`), models-page, clubs, jobs-rents, blog, latest-actions — meaning these pages are fully SSR with no static generation
- `unstable_cache` used on homepage and models-page for 60-second TTL caching of Supabase queries
- `typescript.ignoreBuildErrors: true` in `next.config.ts` — build does not fail on type errors
- `compress: true` in next.config.ts — Gzip/Brotli enabled at framework level
- `reactStrictMode: true`
- `poweredByHeader: false` — X-Powered-By removed

**Image optimization:**
- AVIF + WebP formats enabled (`images.formats: ['image/avif', 'image/webp']`)
- Device sizes: [640, 750, 828, 1080, 1200]
- Minimum cache TTL: 86400 seconds (1 day)
- Remote patterns whitelisted: images.unsplash.com + ykzqjwqomaeuppubofid.supabase.co

**HTTP security headers (applied globally via next.config.ts):**
```
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```
Note: No `Content-Security-Policy` header is defined.

**Fonts:**
- `Inter` (Google Fonts, `next/font/google`, subsets: latin, display: swap) — body
- `Playfair_Display` (Google Fonts, variable `--font-playfair`, subsets: latin, display: swap) — headings/accents
- Both loaded via Next.js font optimization (automatic self-hosting, no render-blocking)

---

## 3. SITE STRUCTURE

### 3.1 Public Routes (indexable or partially indexable)

```
/                          Homepage — mixed feed (models + clubs + banners + listings + stories)
/models-page               Full model listing with filters
/models/[id]               Individual model sedcard/profile
/clubs                     Club/agency listing
/clubs/[id]                Individual club profile
/jobs-rents                Job & room-rental listings
/jobs-rents/[id]           Individual job/rental listing detail
/search                    Search with filters (client-side results via Supabase)
/blog                      Community discussion topics list
/blog/[slug]               Individual discussion topic
/comments                  All approved model reviews/ratings
/latest-actions            Platform activity feed + stats
/contact                   Contact page (EmailJS form)
/privacy                   Privacy policy (references /terms)
/terms                     Full AGB (Allgemeine Geschäftsbedingungen)
```

### 3.2 Auth Routes (disallowed in robots.txt)

```
/login
/register
/register/model
/forgot-password
/reset-password
/onboarding
```

### 3.3 Dashboard Routes (disallowed in robots.txt)

```
/dashboard                          (root redirect)
/dashboard/admin/...                (full admin panel)
/dashboard/model/...                (model dashboard)
/dashboard/company/...              (club/company dashboard)
/dashboard/user/...                 (visitor dashboard)
/dashboard/checkout/success
/dashboard/checkout/cancel
```

### 3.4 Other Protected/Utility Routes (disallowed)

```
/api/...
/auth/...
/chat/[id]
/unsubscribe
/test-db
```

### 3.5 Additional Route Found in Glob (Not in sitemap)

```
/profile/[id]              Legacy/alternative profile view (src/app/profile/[id]/page.tsx)
                           English-language copy, uses a different data fetcher (getProfileById)
                           No metadata defined, no canonical tag, NOT in sitemap
```

### 3.6 Navigation Menu Links (Navbar + Footer)

**Navbar (pink gradient bar):**
- /models-page (Models)
- /clubs (Clubs & Agency)
- /jobs-rents (Jobs & Rent)
- /latest-actions (Latest Actions)
- /comments (Comments)
- /contact (Contact)
- /blog (Blog)

**Footer columns:**
- Pages: /models-page, /clubs, /comments, /blog, /contact
- Legal: /privacy, /terms
- Support: WhatsApp link, /contact

Note: `/search` and `/latest-actions` are NOT in the footer. `/jobs-rents` is NOT in the footer.

---

## 4. CURRENT SEO STATE

### 4.1 Global Metadata (src/app/layout.tsx)

```typescript
title: {
  default: "NiceModels.ch – Das Erotikportal der Schweiz",
  template: "%s | NiceModels.ch",
}
description: "NiceModels.ch – Das führende Erotikportal der Schweiz. Finde verifizierte 
  Escort-Models, Clubs und Agenturen in Zürich, Bern, Basel, Genf und der ganzen Schweiz."
keywords: ["Escort Schweiz","Escort Zürich","Escort Bern","Escort Basel",
           "Escort Genf","Erotikportal Schweiz","NiceModels","Begleitservice Schweiz",
           "Models Schweiz","Clubs Schweiz"]
```

OpenGraph: `type: "website"`, `locale: "de_CH"`, image: `/logo.webp` (512×512)
Twitter card: `summary_large_image`
Canonical: hardcoded `https://www.nicemodels.ch` (homepage only in layout)
Google/Bing site verification: reads from env vars `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION`
metadataBase: `new URL("https://www.nicemodels.ch")`

### 4.2 Per-Page Metadata Audit

| Route | Has metadata | Title pattern | Description | Canonical | generateMetadata |
|---|---|---|---|---|---|
| `/` (homepage) | Global layout only | "NiceModels.ch – Das Erotikportal der Schweiz" | Full German desc | `/` via layout | No |
| `/models-page` | No static export | Inherits template | None | None | No |
| `/models/[id]` | Yes — dynamic | `{name}{age} – Escort in {city}` | From about_me or fallback | `/models/{id}` | Yes |
| `/clubs` | Yes — static | `Clubs & Agenturen in der Schweiz` | German copy | `/clubs` | No |
| `/clubs/[id]` | Yes — dynamic | `{name} – Club in {area}` | From description | `/clubs/{id}` | Yes |
| `/jobs-rents` | Yes — static | `Jobs & Miete – Stellenangebote und Mietangebote` | German | `/jobs-rents` | No |
| `/jobs-rents/[id]` | Yes — dynamic | `{title} – {Job/Miete} in {location}` | From description | `/jobs-rents/{id}` | Yes |
| `/blog` | layout.tsx | `Discussions – Community \| NiceModels` (English!) | English | `/blog` via layout | No |
| `/blog/[slug]` | Yes — dynamic | `{title} – Discussion \| NiceModels` (English!) | From body | `/blog/{slug}` | Yes |
| `/search` | Yes — static | `Escort-Models suchen – Schweiz` | German | `/search` | No |
| `/contact` | contact/layout.tsx | `Kontakt` | Short German | `/contact` | No |
| `/comments` | Yes — static | `Bewertungen & Kommentare` | German | `/comments` | No |
| `/latest-actions` | Yes — static | `Neueste Aktivitäten` | German | `/latest-actions` | No |
| `/privacy` | Yes — static | `Datenschutz \| nicemodels.ch` | German | None! | No |
| `/terms` | Yes — static | `AGB \| nicemodels.ch` | German | None! | No |
| `/login` | None | Inherits template | None | None | No |
| `/register` | None | Inherits template | None | None | No |
| `/onboarding` | None | Inherits template | None | None | No |
| `/profile/[id]` | None | None | None | None | No |

**RED FLAGS in metadata:**
1. `/models-page` — No dedicated metadata export. Inherits generic global title. This is the primary SEO money page and has no unique title/description.
2. `/blog` and `/blog/[slug]` — English metadata (`Discussion | NiceModels`) on a German-first Swiss site. Language mismatch will hurt relevance.
3. `/privacy` and `/terms` — No `alternates.canonical` in the metadata export. No canonical URL set.
4. `/profile/[id]` — Completely unoptimised legacy route with zero metadata.
5. Homepage has no per-page `generateMetadata`, just inherits layout defaults.

### 4.3 Robots.txt (src/app/robots.ts)

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/
Disallow: /auth/
Disallow: /test-db
Disallow: /onboarding
Disallow: /reset-password
Disallow: /forgot-password
Disallow: /chat/
Disallow: /unsubscribe
Disallow: /login
Disallow: /register
Sitemap: https://www.nicemodels.ch/sitemap.xml
```

Notes:
- `/profile/[id]` is NOT disallowed, so it is crawlable. It has zero metadata and no canonical.
- `/comments` is NOT in sitemap but IS accessible by bots (no disallow). It does have metadata.
- All dashboard sub-paths are blocked via `/dashboard/` prefix.

### 4.4 Sitemap (src/app/sitemap.ts)

Dynamic sitemap generated at runtime with Supabase queries. Contains:
- 11 static pages (priority 0.2–1.0)
- Up to 500 active blog/discussion topics (priority 0.5)
- Up to 5,000 model profiles, `role=model`, not blocked (priority 0.8)
- Up to 5,000 club profiles, `role=company`, not blocked (priority 0.7)
- Up to 2,000 active job listings, not expired, not blocked (priority 0.6)

Static pages in sitemap:
```
/ (priority 1.0, daily)
/search (0.9, daily)
/clubs (0.8, daily)
/jobs-rents (0.7, daily)
/models-page (0.9, daily)
/comments (0.5, weekly) ← In sitemap but NOT in nav footer
/latest-actions (0.6, daily)
/blog (0.6, weekly)
/contact (0.4, monthly)
/privacy (0.2, yearly)
/terms (0.2, yearly)
```

Missing from sitemap:
- `/profile/[id]` pages (legacy route, zero metadata anyway)
- `/register`, `/login` (intentionally excluded, robots.txt disallowed)

**ISSUE:** The sitemap uses `lastModified: new Date()` for all static pages on every request — meaning every crawl will show today's date as the modification date, even if nothing changed. This is misleading to crawlers and wastes crawl budget signals.

### 4.5 Canonical Tags

Canonical URLs are present on the following routes:
- `/` — via `alternates.canonical` in layout.tsx metadata
- `/search` — `https://www.nicemodels.ch/search`
- `/clubs` — `https://www.nicemodels.ch/clubs`
- `/jobs-rents` — `https://www.nicemodels.ch/jobs-rents`
- `/models-page` — NOT SET (missing)
- `/comments` — `https://www.nicemodels.ch/comments`
- `/latest-actions` — `https://www.nicemodels.ch/latest-actions`
- `/blog` — `https://www.nicemodels.ch/blog` (via layout.tsx)
- `/contact` — `https://www.nicemodels.ch/contact` (via layout.tsx)
- `/models/[id]` — `https://www.nicemodels.ch/models/{id}`
- `/clubs/[id]` — `https://www.nicemodels.ch/clubs/{id}`
- `/jobs-rents/[id]` — `https://www.nicemodels.ch/jobs-rents/{id}`
- `/blog/[slug]` — `https://www.nicemodels.ch/blog/{slug}`
- `/privacy` — MISSING
- `/terms` — MISSING
- `/profile/[id]` — MISSING

### 4.6 Noindex Usage

The word `noindex` does not appear as a string literal anywhere in the codebase. However, `robots: { index: false, follow: false }` IS used in code:

1. `src/app/models/[id]/page.tsx` line 110: returned when model profile not found
2. `src/app/models/[id]/page.tsx` line 131: `isHidden = details?.sedcard_visible === false` — if model toggled sedcard off, page is noindexed
3. `src/app/blog/[slug]/page.tsx` line 26: returned when topic not found or not active

These are correct conditional noindex implementations.

### 4.7 Hreflang Tags

**NONE. Not implemented anywhere in the codebase.**

The site supports 4 languages (de, en, fr, es) via next-intl with cookie/Accept-Language negotiation, but there are zero `hreflang` link elements or `alternates.languages` entries in any metadata. This is a significant gap for a multilingual site targeting a German-speaking market (CH, AT, DE) where en/fr users also exist.

### 4.8 JSON-LD Structured Data

Found in 4 files:

**1. `src/app/layout.tsx` (global, every page):**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "NiceModels.ch",
  "url": "https://www.nicemodels.ch",
  "description": "...",
  "potentialAction": {
    "@type": "SearchAction",
    "target": { "urlTemplate": "https://www.nicemodels.ch/search?q={search_term_string}" }
  },
  "publisher": { "@type": "Organization", "name": "NiceModels.ch" }
}
```

**2. `src/app/models/[id]/page.tsx` (model profile pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "{showname}",
  "url": "https://www.nicemodels.ch/models/{id}",
  "image": "{photo_url}",
  "description": "{about_me (first 300 chars, HTML stripped)}",
  "address": { "@type": "PostalAddress", "addressLocality": "{city}", "addressCountry": "CH" }
}
```

**3. `src/app/clubs/[id]/page.tsx` (club profile pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "{club_name}",
  "url": "https://www.nicemodels.ch/clubs/{id}",
  "image": "{photo_url}",
  "description": "{about_description (first 300 chars)}",
  "address": { "@type": "PostalAddress", "addressLocality": "{city}", "streetAddress": "{street}", "addressCountry": "CH" },
  "telephone": "{phone_number}"
}
```

**4. `src/app/blog/[slug]/page.tsx` (discussion topic pages):**
```json
{
  "@context": "https://schema.org",
  "@type": "DiscussionForumPosting",
  "headline": "{title}",
  "url": "https://www.nicemodels.ch/blog/{slug}",
  "datePublished": "{created_at}",
  "dateModified": "{updated_at}",
  "image": "{cover_image}",
  "publisher": { "@type": "Organization", "name": "NiceModels.ch" },
  "interactionStatistic": {
    "@type": "InteractionCounter",
    "interactionType": "https://schema.org/CommentAction",
    "userInteractionCount": {post_count}
  }
}
```

**Missing JSON-LD:**
- `/jobs-rents/[id]` — No structured data. Could use `JobPosting` schema.
- Homepage — WebSite schema only. No `ItemList` for featured models/clubs.
- `/blog` listing page — No `ItemList` for discussion topics.

### 4.9 OpenGraph / Twitter Card

- Model profiles: OG type `profile`, dynamic image from first approved photo
- Club profiles: OG type `profile`, dynamic image from first approved photo
- Job listings: OG type `article`, dynamic image from first listing photo
- Blog topics: OG type `article`, with `publishedTime` and `modifiedTime`
- Global fallback: `logo.webp` (512×512 WebP) for all pages without specific images

OG locale is hardcoded to `de_CH` in layout.tsx regardless of the active locale — no `og:locale:alternate` tags for en/fr/es variants.

### 4.10 International SEO (i18n)

**Locale detection order:**
1. Cookie `NEXT_LOCALE` (set by language switcher)
2. Accept-Language header negotiation
3. Fallback: `de`

**Supported locales:** de, en, fr, es
**Default:** de

**Key issues:**
- No `lang` attribute variation per locale — the root `<html lang={locale}>` correctly reflects current locale
- No `hreflang` tags AT ALL — Google cannot discover locale variants
- No URL-based locale routing (e.g. `/de/`, `/fr/`) — all locales share same URL paths, only differentiated by cookie
- Since URLs are identical across locales, Google will canonicalise all to a single language version, almost certainly German (first/dominant traffic)
- Sitemap uses hardcoded `https://www.nicemodels.ch/...` without locale prefixes

### 4.11 Analytics

**NO Google Analytics, GTM, Plausible, PostHog, Mixpanel, or any third-party analytics is installed.**

The site runs a **fully proprietary in-house analytics system** built on Supabase:

- `src/components/analytics/PageTracker.tsx` — Client component in root layout, fires `trackPageView()` on every route change (400ms debounce), excludes `/dashboard/admin` paths
- `src/lib/tracking.ts` — Tracking functions: `trackPageView`, `trackProfileView`, `trackListingView`, `trackListingClick`, `trackBannerImpression`, `trackBannerClick`
- `src/app/api/track/event/route.ts` — Server-side event ingestion endpoint, inserts into Supabase tables: `page_views`, `listing_views`, `listing_clicks`, `banner_impressions`, `banner_clicks`, `model_statistics`
- Admin dashboard at `/dashboard/admin/statistics/traffic` reads from `get_traffic_aggregates_v1` Supabase RPC

**Analytics data stored:** path, session_id, referrer, user_agent, IP address, viewer_id, viewer_role, timestamp

**Implications for SEO:**
- No Google Search Console integration discoverable from code (verification via env var only)
- No Bing Webmaster Tools integration discoverable
- No Core Web Vitals reporting to external tools
- Referrer data is available internally but not exportable to standard SEO tools

### 4.12 Age Gate

**NO age gate exists.** The site has no age verification overlay, modal, or wall. There is no `age.*gate`, `AgeGate`, `ageVerif`, or similar pattern in the source. The only mentions of age/18+ are in dashboard checkout/success pages related to Stripe billing (not age verification).

This is a significant compliance and SEO risk for adult content in Switzerland.

---

## 5. PERFORMANCE & TECHNICAL

### 5.1 Rendering Strategy

| Route | Rendering | Cache strategy |
|---|---|---|
| `/` | SSR + `force-dynamic` | `unstable_cache` 60s per data function, per-request seed shuffle |
| `/models-page` | SSR + `force-dynamic` | `unstable_cache` 60s (`models-page-data-v1` tag) |
| `/clubs` | SSR + `force-dynamic` | None apparent in route — calls `loadClubsForPage()` |
| `/jobs-rents` | SSR + `force-dynamic` | No cache |
| `/blog` | SSR + `force-dynamic` | No cache |
| `/latest-actions` | SSR + `force-dynamic` | No cache |
| `/models/[id]` | SSR (no force-dynamic) | `unstable_cache` 60s per model ID tag |
| `/clubs/[id]` | SSR (no force-dynamic) | No `unstable_cache` |
| `/jobs-rents/[id]` | SSR (no force-dynamic) | No `unstable_cache` |
| `/blog/[slug]` | SSR (no force-dynamic) | No `unstable_cache` |
| `/search` | Server shell + client fetch | Client-side Supabase query |
| `/contact` | CSR (`'use client'`) | None |

**ISSUE:** Most page-level routes have `force-dynamic` and NO `generateStaticParams`, meaning zero static pre-rendering. Every request hits Supabase. This is the intended approach for frequently-changing adult content, but it means:
- Time to First Byte (TTFB) is high — every user triggers real DB queries
- No ISR (Incremental Static Regeneration) is used
- Googlebot sees fully SSR'd HTML (good for indexing) but response times are query-dependent

### 5.2 Image Handling

- `next/image` used throughout with `priority` on Navbar logo
- Images from Supabase storage domains (whitelisted in `next.config.ts`)
- AVIF/WebP formats enabled
- Lazy loading used in Footer logo (`loading="lazy"`)
- Blog cover images: `fill` + `sizes="160px"` — no explicit width/height attributes

### 5.3 HTTP Caching Headers

From `next.config.ts`:
```
/_next/static/(*) → Cache-Control: public, max-age=31536000, immutable
/_next/image(*)   → Cache-Control: public, max-age=86400, stale-while-revalidate=604800
/(all pages)      → No explicit Cache-Control set
```
No `Cache-Control` for page responses — relies on Netlify CDN defaults.

### 5.4 Bundle Optimization

Package import optimization in `next.config.ts`:
```typescript
experimental.optimizePackageImports: ['lucide-react', 'recharts', '@supabase/ssr', '@supabase/supabase-js']
```

TinyMCE is self-hosted (copied to `public/tinymce` at build time) to avoid requiring an API key.

### 5.5 Preconnect / DNS Prefetch

Only the Supabase storage origin gets `preconnect` + `dns-prefetch` in `layout.tsx`:
```tsx
<link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
<link rel="dns-prefetch" href={supabaseOrigin} />
```
No preconnect for Google Fonts CDN (though `next/font` self-hosts fonts, so this is correct behavior).

---

## 6. CONTENT & COPY

### 6.1 Language Strategy

- **Primary language:** German (Schweizerdeutsch/Standard German)
- **Default locale:** `de`
- **i18n keys system:** `next-intl` with JSON message files in `/messages/` directory
- **Locale files:** `de.json`, `en.json`, `fr.json`, `es.json`

All public-facing copy (nav, footer, forms, profile pages) is translated via i18n keys. Legal pages (privacy, terms) are hard-coded in German only, using `<ForceGermanProvider>` wrapper — this forces German regardless of user locale selection.

### 6.2 Key Page Copy

**Homepage:** No visible H1 or introductory text in the server component. The homepage (`src/app/page.tsx`) renders `<MixedHomeClient ...>` — a fully client-side component that displays models + clubs + banners + listings + stories as a mixed feed. The homepage body is driven by dynamic data, not static copy.

**Models page (`/models-page`):** Renders `<HomePageClient>` which is client-side. No static H1 visible in server component.

**Search page (`/search`):** Has a visible H1 built from i18n translations:
```tsx
<h1 className="text-5xl font-bold mb-8">
  {t('titlePart1')}<span>{t('titleHighlight')}</span>
</h1>
```

**Blog listing (`/blog`):** Has proper H1 from i18n `t('discussionsTitle')` and H2 per topic. But "Discussions" branding (English) conflicts with German-first brand.

**Model profile `/models/[id]`:** Page title `{name}, {age} – Escort in {city}` is well-structured. About-me content is user-generated HTML stripped to 300 chars for JSON-LD.

**Club profile `/clubs/[id]`:** Title `{name} – Club in {area}` is well-structured. LocalBusiness JSON-LD with address and phone.

**Contact page:** Hard-coded contact details: WhatsApp +41 78 333 93 96, email info@nicemodels.ch. Business hours shown: Mon–Fri 09:00–11:00 / 14:00–16:00 / 19:00–20:00, weekends 16:00–18:00. Location field present but value comes from i18n key `t('locationValue')` — cannot determine exact value without running the app.

### 6.3 i18n Key Structure (de.json sample)

The German translation file has these top-level namespaces:
- `admin` — admin panel labels
- `sidebar` — admin sidebar navigation

(Based on first 80 lines read. Full file has many more namespaces including `nav`, `footer`, `auth`, `onboarding`, `models`, `publicPages`, `search`, etc.)

### 6.4 Content Types in Supabase

Inferred from sitemap queries and page data fetches:

| Content type | Table(s) | Key fields |
|---|---|---|
| Model profiles | `profiles` (role=model) + `model_details` | showname, city, age, ethnicity, hair_color, about_me, services_for |
| Model photos | `model_photos` | file_path, is_approved, display_order |
| Model services | `model_services` + `services` | service name |
| Model rates | `model_rates` | rate_type |
| Model languages | `model_languages` | |
| Model working hours | `model_working_hours` | day_of_week |
| Model contact | `model_contact_details` | |
| Model comments | `model_comments` | comment_text, rating, status (approved/reviewed) |
| Club profiles | `profiles` (role=company) + `club_details` | club_name, display_name, area, about_description |
| Club photos | `club_photos` | |
| Club contact | `club_contact_details` | city, street, phone_number |
| Club working hours | `club_working_hours` | |
| Job listings | `job_listings` | listing_type (job/rent), title, location, description, status |
| Listing photos | `job_listing_photos` | |
| Listing services | `job_listing_services` | |
| Blog topics | `discussion_topics` | slug, title, body, cover_image, status, is_pinned |
| Blog posts | `discussion_posts` | topic_id, parent_id, body |
| Banners | `banners` | owner_type, owner_id, title, image_path, cta_url, placement, target_cantons |
| Stories | `model_status_messages` + RPC `get_active_model_stories` | |
| Cities | `cities` | name, postal_code, canton, is_active |
| Site actions | `site_actions` | actor_id, created_at |
| Page views | `page_views` | path, viewer_id, session_id, referrer |

---

## 7. CONVERSION / BUSINESS ELEMENTS

### 7.1 Payment System

Stripe is fully integrated:
- `src/lib/stripe/client.ts` — Stripe.js loader
- `src/lib/stripe/server.ts` — Stripe SDK for server-side
- `src/app/api/checkout/session/route.ts` — Creates checkout sessions
- `src/app/api/stripe/webhook/route.ts` — Handles Stripe webhooks
- `src/app/dashboard/checkout/success/page.tsx` — Post-payment success page
- `src/app/dashboard/checkout/cancel/page.tsx` — Cancelled payment page
- `src/app/dashboard/model/purchase-history/page.tsx` — Model payment history

Paid features inferred from dashboard routes:
- `/dashboard/model/activate-ad` — Models pay to activate their listing ad
- `/dashboard/model/buy-banner` — Models pay for banner placement
- `/dashboard/company/activate-ad` — Clubs pay to activate listing ad
- `/dashboard/company/buy-banner` — Clubs pay for banner placement

### 7.2 Banner System

Banners are prominently integrated into the homepage and models-page feed:
- `target_cantons` field allows geographic targeting by Swiss canton
- `placement` field for different ad positions
- Banner impressions and clicks tracked to `banner_impressions` / `banner_clicks` tables
- One banner per owner shown at a time (deduplication logic)

### 7.3 Registration Flow

1. `/register` — Email/password registration, role selection (model / club / user)
2. `/onboarding` — Role-specific onboarding forms:
   - `ModelOnboardingForm`
   - `CompanyOnboardingForm`
   - `UserOnboardingForm`
3. Welcome email sent via `/api/email/welcome` on first onboarding render
4. `/dashboard/{role}` — Role-specific dashboards

### 7.4 Verification System

- Models and users can request verification: `/dashboard/model/verification`, `/dashboard/user/verification`
- Admin reviews: `/dashboard/admin/verification`
- `is_verified` flag on profiles affects display (blue checkmark in club models list)

### 7.5 Chat / Messaging

- Global chat component: `src/components/chat/GlobalChat.tsx` — always rendered in layout
- `src/app/chat/[id]/page.tsx` — Dedicated chat page (disallowed by robots.txt)
- `chat_available` and `sedcard_visible` flags on model_details control visibility
- Up to 10 "available for chat" models shown on homepage/models-page

### 7.6 Reviews / Comments

- `/comments` — Public page listing all approved model comments with ratings
- Models can reply to comments from their dashboard
- Comment statuses: `approved`, `reviewed` (both public), others (pending/hidden)
- Rating system visible on model profiles

### 7.7 Social / Engagement Features

- Stories (Instagram-style): `model_status_messages` + RPC `get_active_model_stories`
- Model collaborations: models can link to partner models (`model_collaborations` table)
- Favorites: users can favorite models (`/dashboard/user/favorites`)
- Saved searches: `/dashboard/user/saved-searches`
- Email digest for favorites: `/api/cron/email/fav-digest`

### 7.8 Contact Methods Exposed on Profiles

Both model profiles and job listings expose:
- Phone number
- WhatsApp (has_whatsapp flag)
- Viber (has_viber flag)
- Telegram (has_telegram flag)
- Email
- Website URL

---

## 8. KNOWN GAPS / RED FLAGS

### 8.1 Critical SEO Gaps

**1. No Hreflang Implementation (HIGH PRIORITY)**
The site serves de/en/fr/es but zero `hreflang` tags exist. All locales share the same URL. Google will pick one language version to index and ignore others. Since locale is cookie-based, Googlebot (which doesn't persist cookies across crawls) will likely always see the default German version.

**2. /models-page Has No Metadata (HIGH PRIORITY)**
This is arguably the most important SEO page (the main model listing). It has `export const dynamic = 'force-dynamic'` but no `export const metadata` and no `generateMetadata`. It inherits the global layout title "NiceModels.ch – Das Erotikportal der Schweiz" which is generic and shared with the homepage. Both the homepage AND /models-page will compete for the same title/description in SERPs.

**3. Blog Language Mismatch (MEDIUM)**
The blog section uses English-language metadata ("Discussions – Community | NiceModels") while the rest of the site is German. The title template for individual posts is `{title} – Discussion | NiceModels` — the word "Discussion" is English. This will confuse German-speaking users in SERPs and signals inconsistency to search engines.

**4. /profile/[id] — Orphan Route with No SEO (MEDIUM)**
`src/app/profile/[id]/page.tsx` is an accessible, crawlable route with a full profile render but absolutely no metadata, no canonical, not in sitemap, and not linked from any navigation. Google can find it via links on other pages. If model profiles link to both `/models/{id}` and `/profile/{id}`, this creates duplicate content.

**5. Privacy and Terms Pages Missing Canonical Tags (MEDIUM)**
`/privacy` and `/terms` have metadata but no `alternates.canonical`. These pages are low-priority but should be canonicalized.

**6. No Age Gate (COMPLIANCE + SEO RISK)**
Switzerland has legal requirements for age verification on adult content sites. From an SEO standpoint, absence of an age gate may affect ad revenue options (Google Ads won't serve on adult-classified pages without controls), and some search engines apply different treatment to explicit content.

**7. Homepage Has No Static Text / H1 (HIGH PRIORITY)**
The homepage server component renders a single client component (`<MixedHomeClient>`). There is no server-rendered H1, introductory text, or static copy. If JavaScript is delayed or for any reason the client component hydration is slow, Googlebot sees an essentially empty page body. The global metadata description is generic. No keyword-rich static copy exists.

**8. Sitemap lastModified = new Date() for All Static Pages (MEDIUM)**
Every time the sitemap is generated, ALL static pages get `lastModified: new Date()` (current timestamp). This tells crawlers that every static page changes daily, which wastes crawl budget signals and provides no accurate freshness guidance.

**9. No generateStaticParams for Dynamic Routes (MEDIUM)**
`/models/[id]`, `/clubs/[id]`, `/jobs-rents/[id]`, `/blog/[slug]` all use SSR without `generateStaticParams`. Pages are generated on-demand for each request. This means Google's first crawl of a new model profile must wait for real-time Supabase queries.

**10. No Content-Security-Policy Header (LOW-MEDIUM)**
The security headers in `next.config.ts` include X-Content-Type-Options, X-Frame-Options, and Referrer-Policy but NOT Content-Security-Policy. CSP is increasingly a trust signal.

**11. Contact Page is 'use client' — No SSR (LOW)**
`src/app/contact/page.tsx` is a full client component (`'use client'` at top). Contact pages are usually low-value SEO targets, but the page renders entirely client-side, meaning Googlebot needs to execute JavaScript to see the phone number and email address.

**12. No XML Sitemap Index or Sitemap Splitting**
A single sitemap.xml could theoretically contain 10,000+ URLs (5000 models + 5000 clubs + 2000 listings + blogs). XML sitemaps have a 50,000 URL / 50MB limit. Current limits are set conservatively (5000+5000+2000 = 12,000 max dynamic + 11 static + 500 blog = ~12,511) so technically within limits, but a sitemap index with separate sitemaps per content type would be better practice.

**13. No Internal Linking Strategy Visible**
Model profile pages have prev/next navigation between models (via `allModelIds` array), which is good. But there is no breadcrumb navigation on model/club profile pages (only on `/profile/[id]` legacy route). No category/canton landing pages exist.

**14. No City/Canton Landing Pages**
The `cities` table exists with `name`, `postal_code`, `canton` fields. Models are associated with cities and cantons. But there are no dedicated landing pages for e.g., "Escort Zürich", "Escort Bern", "Escort Basel". These are high-value local SEO keywords mentioned in the global metadata keywords array but not backed by actual content pages.

**15. No Structured Data for Job Listings**
`/jobs-rents/[id]` pages have no JSON-LD. `JobPosting` schema could significantly improve CTR for job listings in SERPs.

**16. Search Page Is Client-Side Only**
`/search` renders a static shell with `<SearchFilters>` and `<ProfileGrid>` as client components. No server-rendered results are present. Googlebot sees the search shell but no actual model results — all filtering and display happens in the browser via Supabase queries.

### 8.2 Positive SEO Signals

1. Model and club profiles have well-structured dynamic `generateMetadata` with proper canonical, OG, and Twitter card
2. Schema.org JSON-LD on model profiles (Person), club profiles (LocalBusiness), blog posts (DiscussionForumPosting), and global WebSite with SearchAction
3. HTML served with correct `<html lang={locale}>` attribute
4. Google/Bing site verification support via env vars
5. Robots.txt properly protecting dashboard, API, and auth routes
6. Sitemap dynamically generated from live Supabase data
7. Next.js image optimization (AVIF/WebP, lazy loading, `priority` on above-fold)
8. Fonts loaded via `next/font/google` (automatic self-hosting, no render-blocking)
9. Models with `sedcard_visible = false` are properly noindexed
10. Supabase preconnect hint in `<head>`
11. Prev/next model navigation creates internal link graph
12. Model comments/ratings are SSR'd and visible to crawlers
13. Blog posts include `datePublished`/`dateModified` in both meta and JSON-LD

---

## 9. RAW REFERENCE DATA

### 9.1 Full package.json

```json
{
  "name": "nice-models",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@emailjs/browser": "^4.4.1",
    "@stripe/stripe-js": "^9.4.0",
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.89.0",
    "@tanstack/react-query": "^5.100.10",
    "@tanstack/react-query-devtools": "^5.100.10",
    "lucide-react": "^0.562.0",
    "next": "^16.1.6",
    "next-intl": "^4.11.0",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^3.8.1",
    "resend": "^6.12.2",
    "stripe": "^22.1.1",
    "xlsx": "^0.18.5"
  },
  "overrides": {
    "postcss": "^8.5.10"
  },
  "devDependencies": {
    "@netlify/plugin-nextjs": "^5.15.9",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "autoprefixer": "^10.4.20",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "postcss": "^8.5.10",
    "tailwindcss": "^3.4.17",
    "typescript": "^5"
  },
  "browserslist": [
    "chrome >= 90",
    "firefox >= 90",
    "safari >= 14",
    "edge >= 90",
    "not dead"
  ]
}
```

### 9.2 Full next.config.ts

```typescript
import type { NextConfig } from "next";
import fs from 'fs'
import path from 'path'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// Copy TinyMCE to public folder for self-hosting
const tinymceSrc = path.join(process.cwd(), 'node_modules/tinymce')
const tinymceDest = path.join(process.cwd(), 'public/tinymce')
if (fs.existsSync(tinymceSrc)) {
  try {
    fs.cpSync(tinymceSrc, tinymceDest, { recursive: true, force: false, errorOnExist: false })
  } catch {
    // non-fatal
  }
}

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@supabase/ssr',
      '@supabase/supabase-js',
    ],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    qualities: [60, 75, 80, 85],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'ykzqjwqomaeuppubofid.supabase.co', port: '', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ]
  },
};

export default withNextIntl(nextConfig);
```

### 9.3 Full robots.ts

```typescript
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/api/',
          '/auth/',
          '/test-db',
          '/onboarding',
          '/reset-password',
          '/forgot-password',
          '/chat/',
          '/unsubscribe',
          '/login',
          '/register',
        ],
      },
    ],
    sitemap: 'https://www.nicemodels.ch/sitemap.xml',
  }
}
```

### 9.4 Full sitemap.ts

```typescript
import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'

const SITE_URL = 'https://www.nicemodels.ch'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient()

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/clubs`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/jobs-rents`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/models-page`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/comments`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE_URL}/latest-actions`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE_URL}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Dynamic: blog topics (up to 500)
  let blogPages: MetadataRoute.Sitemap = []
  const { data: discussionTopics } = await admin
    .from('discussion_topics')
    .select('slug, updated_at')
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(500)
  if (discussionTopics?.length) {
    blogPages = discussionTopics.map(t => ({
      url: `${SITE_URL}/blog/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))
  }

  // Dynamic: model profiles (up to 5000)
  let modelPages: MetadataRoute.Sitemap = []
  const { data: models } = await admin
    .from('profiles')
    .select('id, updated_at')
    .eq('role', 'model')
    .eq('is_blocked', false)
    .order('updated_at', { ascending: false })
    .limit(5000)
  if (models?.length) {
    modelPages = models.map(m => ({
      url: `${SITE_URL}/models/${m.id}`,
      lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  }

  // Dynamic: club profiles (up to 5000)
  let clubPages: MetadataRoute.Sitemap = []
  const { data: clubs } = await admin
    .from('profiles')
    .select('id, updated_at')
    .eq('role', 'company')
    .eq('is_blocked', false)
    .order('updated_at', { ascending: false })
    .limit(5000)
  if (clubs?.length) {
    clubPages = clubs.map(c => ({
      url: `${SITE_URL}/clubs/${c.id}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  }

  // Dynamic: job listings (up to 2000)
  let listingPages: MetadataRoute.Sitemap = []
  const sitemapNowIso = new Date().toISOString()
  const { data: listings } = await admin
    .from('job_listings')
    .select('id, created_at')
    .eq('status', 'active')
    .eq('is_blocked', false)
    .or(`expires_at.is.null,expires_at.gt.${sitemapNowIso}`)
    .order('created_at', { ascending: false })
    .limit(2000)
  if (listings?.length) {
    listingPages = listings.map(l => ({
      url: `${SITE_URL}/jobs-rents/${l.id}`,
      lastModified: l.created_at ? new Date(l.created_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))
  }

  return [...staticPages, ...blogPages, ...modelPages, ...clubPages, ...listingPages]
}
```

### 9.5 Middleware

No root-level `middleware.ts` file exists in the project (`src/middleware.ts` — DOES NOT EXIST).

The auth/session management middleware logic lives in `src/lib/supabase/middleware.ts` (the `updateSession` function). There is no actual `middleware.ts` export at the Next.js middleware path, meaning the `updateSession` function defined in the lib file is NOT automatically called by Next.js on every request. This is likely called from within layout/page components or there is an undiscovered entry point.

UPDATE: On further inspection, the `.next/server/middleware.js` compiled output exists, suggesting a middleware file IS compiled and active — but the source file is NOT in the expected `src/middleware.ts` location. It may have been deleted or moved. The compiled output suggests it was present at some point during the last build.

### 9.6 Full i18n/request.ts

```typescript
import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

export const SUPPORTED_LOCALES = ['de', 'en', 'fr', 'es'] as const
export type AppLocale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: AppLocale = 'de'
export const LOCALE_COOKIE = 'NEXT_LOCALE'

function isSupported(value: string | undefined | null): value is AppLocale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function negotiateFromAcceptLanguage(header: string | null): AppLocale | null {
  if (!header) return null
  const tags = header.split(',').map(p => p.trim().split(';')[0].toLowerCase())
  for (const tag of tags) {
    const base = tag.split('-')[0]
    if (isSupported(base)) return base
  }
  return null
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value
  let locale: AppLocale = isSupported(cookieLocale) ? cookieLocale : DEFAULT_LOCALE

  if (!isSupported(cookieLocale)) {
    const headerStore = await headers()
    const negotiated = negotiateFromAcceptLanguage(headerStore.get('accept-language'))
    if (negotiated) locale = negotiated
  }

  const loaders: Record<AppLocale, () => Promise<{ default: Record<string, unknown> }>> = {
    de: () => import('../../messages/de.json'),
    en: () => import('../../messages/en.json'),
    fr: () => import('../../messages/fr.json'),
    es: () => import('../../messages/es.json'),
  }
  const messages = (await loaders[locale]()).default

  return { locale, messages }
})
```

### 9.7 Complete Flat Route List

All routes discovered via `src/app/**/page.tsx` glob:

**Public routes:**
```
/                                           src/app/page.tsx
/blog                                       src/app/blog/page.tsx
/blog/[slug]                                src/app/blog/[slug]/page.tsx
/clubs                                      src/app/clubs/page.tsx
/clubs/[id]                                 src/app/clubs/[id]/page.tsx
/comments                                   src/app/comments/page.tsx
/contact                                    src/app/contact/page.tsx
/forgot-password                            src/app/forgot-password/page.tsx
/jobs-rents                                 src/app/jobs-rents/page.tsx
/jobs-rents/[id]                            src/app/jobs-rents/[id]/page.tsx
/latest-actions                             src/app/latest-actions/page.tsx
/login                                      src/app/login/page.tsx
/models-page                                src/app/models-page/page.tsx
/models/[id]                                src/app/models/[id]/page.tsx
/onboarding                                 src/app/onboarding/page.tsx
/privacy                                    src/app/privacy/page.tsx
/profile/[id]                               src/app/profile/[id]/page.tsx
/register                                   src/app/register/page.tsx
/register/model                             src/app/register/model/page.tsx
/reset-password                             src/app/reset-password/page.tsx
/search                                     src/app/search/page.tsx
/terms                                      src/app/terms/page.tsx
/unsubscribe                                src/app/unsubscribe/page.tsx
/test-db                                    src/app/test-db/page.tsx
/chat/[id]                                  src/app/chat/[id]/page.tsx
```

**Dashboard routes (disallowed):**
```
/dashboard                                  src/app/dashboard/page.tsx
/dashboard/admin                            src/app/dashboard/admin/page.tsx
/dashboard/admin/banners                    src/app/dashboard/admin/banners/page.tsx
/dashboard/admin/blocked                    src/app/dashboard/admin/blocked/page.tsx
/dashboard/admin/clubs                      src/app/dashboard/admin/clubs/page.tsx
/dashboard/admin/clubs/[id]                 src/app/dashboard/admin/clubs/[id]/page.tsx
/dashboard/admin/comments                   src/app/dashboard/admin/comments/page.tsx
/dashboard/admin/deleted                    src/app/dashboard/admin/deleted/page.tsx
/dashboard/admin/discussions                src/app/dashboard/admin/discussions/page.tsx
/dashboard/admin/jobs-rents                 src/app/dashboard/admin/jobs-rents/page.tsx
/dashboard/admin/jobs-rents/[id]            src/app/dashboard/admin/jobs-rents/[id]/page.tsx
/dashboard/admin/models                     src/app/dashboard/admin/models/page.tsx
/dashboard/admin/models/[id]                src/app/dashboard/admin/models/[id]/page.tsx
/dashboard/admin/reports                    src/app/dashboard/admin/reports/page.tsx
/dashboard/admin/review-media               src/app/dashboard/admin/review-media/page.tsx
/dashboard/admin/statistics/banners         src/app/dashboard/admin/statistics/banners/page.tsx
/dashboard/admin/statistics/clubs           src/app/dashboard/admin/statistics/clubs/page.tsx
/dashboard/admin/statistics/listings        src/app/dashboard/admin/statistics/listings/page.tsx
/dashboard/admin/statistics/models          src/app/dashboard/admin/statistics/models/page.tsx
/dashboard/admin/statistics/revenue         src/app/dashboard/admin/statistics/revenue/page.tsx
/dashboard/admin/statistics/traffic         src/app/dashboard/admin/statistics/traffic/page.tsx
/dashboard/admin/users                      src/app/dashboard/admin/users/page.tsx
/dashboard/admin/verification               src/app/dashboard/admin/verification/page.tsx
/dashboard/checkout/cancel                  src/app/dashboard/checkout/cancel/page.tsx
/dashboard/checkout/success                 src/app/dashboard/checkout/success/page.tsx
/dashboard/company                          src/app/dashboard/company/page.tsx
/dashboard/company/activate-ad              src/app/dashboard/company/activate-ad/page.tsx
/dashboard/company/buy-banner               src/app/dashboard/company/buy-banner/page.tsx
/dashboard/company/jobs-rent                src/app/dashboard/company/jobs-rent/page.tsx
/dashboard/company/jobs-rent/create         src/app/dashboard/company/jobs-rent/create/page.tsx
/dashboard/company/jobs-rent/edit/[id]      src/app/dashboard/company/jobs-rent/edit/[id]/page.tsx
/dashboard/company/models                   src/app/dashboard/company/models/page.tsx
/dashboard/company/models/create            src/app/dashboard/company/models/create/page.tsx
/dashboard/company/models/invite            src/app/dashboard/company/models/invite/page.tsx
/dashboard/company/notifications            src/app/dashboard/company/notifications/page.tsx
/dashboard/company/profile/basic-info       src/app/dashboard/company/profile/basic-info/page.tsx
/dashboard/company/profile/club-photos      src/app/dashboard/company/profile/club-photos/page.tsx
/dashboard/company/profile/contact-details  src/app/dashboard/company/profile/contact-details/page.tsx
/dashboard/company/profile/working-hours    src/app/dashboard/company/profile/working-hours/page.tsx
/dashboard/company/settings                 src/app/dashboard/company/settings/page.tsx
/dashboard/company/statistics               src/app/dashboard/company/statistics/page.tsx
/dashboard/model                            src/app/dashboard/model/page.tsx
/dashboard/model/activate-ad                src/app/dashboard/model/activate-ad/page.tsx
/dashboard/model/buy-banner                 src/app/dashboard/model/buy-banner/page.tsx
/dashboard/model/collaborations             src/app/dashboard/model/collaborations/page.tsx
/dashboard/model/comments                   src/app/dashboard/model/comments/page.tsx
/dashboard/model/invites                    src/app/dashboard/model/invites/page.tsx
/dashboard/model/notifications              src/app/dashboard/model/notifications/page.tsx
/dashboard/model/profile/about-me           src/app/dashboard/model/profile/about-me/page.tsx
/dashboard/model/profile/area               src/app/dashboard/model/profile/area/page.tsx
/dashboard/model/profile/biography          src/app/dashboard/model/profile/biography/page.tsx
/dashboard/model/profile/contact-details    src/app/dashboard/model/profile/contact-details/page.tsx
/dashboard/model/profile/languages          src/app/dashboard/model/profile/languages/page.tsx
/dashboard/model/profile/pictures-video     src/app/dashboard/model/profile/pictures-video/page.tsx
/dashboard/model/profile/rates              src/app/dashboard/model/profile/rates/page.tsx
/dashboard/model/profile/services           src/app/dashboard/model/profile/services/page.tsx
/dashboard/model/profile/working-hours      src/app/dashboard/model/profile/working-hours/page.tsx
/dashboard/model/purchase-history           src/app/dashboard/model/purchase-history/page.tsx
/dashboard/model/settings                   src/app/dashboard/model/settings/page.tsx
/dashboard/model/statistics                 src/app/dashboard/model/statistics/page.tsx
/dashboard/model/upload-story               src/app/dashboard/model/upload-story/page.tsx
/dashboard/model/verification               src/app/dashboard/model/verification/page.tsx
/dashboard/user                             src/app/dashboard/user/page.tsx
/dashboard/user/comments                    src/app/dashboard/user/comments/page.tsx
/dashboard/user/favorites                   src/app/dashboard/user/favorites/page.tsx
/dashboard/user/jobs-rent                   src/app/dashboard/user/jobs-rent/page.tsx
/dashboard/user/jobs-rent/create            src/app/dashboard/user/jobs-rent/create/page.tsx
/dashboard/user/notifications               src/app/dashboard/user/notifications/page.tsx
/dashboard/user/profile                     src/app/dashboard/user/profile/page.tsx
/dashboard/user/saved-searches              src/app/dashboard/user/saved-searches/page.tsx
/dashboard/user/saved-searches/[id]/edit    src/app/dashboard/user/saved-searches/[id]/edit/page.tsx
/dashboard/user/saved-searches/new          src/app/dashboard/user/saved-searches/new/page.tsx
/dashboard/user/settings                    src/app/dashboard/user/settings/page.tsx
/dashboard/user/verification                src/app/dashboard/user/verification/page.tsx
```

**API Routes:**
```
POST /api/track/event
POST /api/checkout/session
POST /api/stripe/webhook
POST /api/email/welcome
POST /api/onboarding/complete
POST /api/reports/submit
POST /api/reports/update-status
GET  /api/admin/stats/traffic
GET  /api/admin/stats/models
GET  /api/admin/stats/clubs
GET  /api/admin/stats/banners
GET  /api/admin/stats/revenue
GET  /api/admin/stats/listings
GET  /api/admin/stats/overview
GET  /api/admin/verifications
GET  /api/admin/verifications/urls
POST /api/admin/write
POST /api/admin/block-user
POST /api/admin/block-listing
POST /api/admin/send-message
POST /api/admin/update-contact-details
POST /api/admin/update-listing
POST /api/admin/update-visitor
POST /api/admin/email-verification-decision
POST /api/admin/listing-photo
POST /api/admin/listing-services
GET/POST /api/admin/reports
GET /api/admin/reports/screenshot-urls
GET /api/admin/contacts
POST /api/admin/blocked-users
POST /api/admin/discussion-posts
POST /api/admin/discussion-topics
GET /api/locale
POST /api/update-live-location
POST /api/account/delete
GET /api/reports/screenshot-url
GET /api/_debug/geo
POST /api/chat/display-names
GET /api/cron/cleanup-pending-payments
GET /api/cron/email/fav-digest
```

### 9.8 Key File Paths for SEO Work

| Purpose | File |
|---|---|
| Global metadata | `src/app/layout.tsx` |
| Robots | `src/app/robots.ts` |
| Sitemap | `src/app/sitemap.ts` |
| i18n config | `src/i18n/request.ts` |
| German translations | `messages/de.json` |
| Next.js config | `next.config.ts` |
| Homepage | `src/app/page.tsx` |
| Models listing | `src/app/models-page/page.tsx` |
| Model profile (SEO) | `src/app/models/[id]/page.tsx` |
| Club listing | `src/app/clubs/page.tsx` |
| Club profile (SEO) | `src/app/clubs/[id]/page.tsx` |
| Job listings | `src/app/jobs-rents/page.tsx` |
| Job listing detail | `src/app/jobs-rents/[id]/page.tsx` |
| Blog listing | `src/app/blog/page.tsx` |
| Blog topic | `src/app/blog/[slug]/page.tsx` |
| Blog layout metadata | `src/app/blog/layout.tsx` |
| Contact layout metadata | `src/app/contact/layout.tsx` |
| Search page | `src/app/search/page.tsx` |
| Comments page | `src/app/comments/page.tsx` |
| Latest actions | `src/app/latest-actions/page.tsx` |
| Legacy profile route | `src/app/profile/[id]/page.tsx` |
| Navbar (nav links) | `src/components/layout/Navbar.tsx` |
| Footer (nav links) | `src/components/layout/Footer.tsx` |
| Page tracking | `src/components/analytics/PageTracker.tsx` |
| Tracking functions | `src/lib/tracking.ts` |
| Track event API | `src/app/api/track/event/route.ts` |
| Supabase middleware helper | `src/lib/supabase/middleware.ts` |

---

*End of SEO Discovery Report — NiceModels.ch — Generated 2026-06-10*
