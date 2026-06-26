# Phase 0 Verification Report — NiceModels.ch SEO Overhaul
Generated: 2026-06-10

---

## 1. Audit Accuracy Confirmation

### 1.1 Claim: `/models-page` has no `generateMetadata`
**STATUS: CONFIRMED — with an additional drift**

`src/app/models-page/page.tsx` has no `export const metadata` and no `generateMetadata` function. The page exports only `export default async function ModelsPage()`. It inherits the global layout title.

**Drift from audit:** The audit states `export const dynamic = 'force-dynamic'` is set on `/models-page`. It is **NOT** present in the actual file. Instead, the page uses `unstable_cache` at the module level (`getModelsPageData`, 60s TTL), which means Next.js treats it as a dynamic page due to cookie/header access in the data fetching chain, but the explicit `force-dynamic` flag does not exist. This is a minor inaccuracy in the audit.

### 1.2 Claim: `robots.ts` disallows dashboard/api/auth etc.
**STATUS: CONFIRMED — exactly matches**

File `src/app/robots.ts` confirmed contents:
```
User-agent: *
Allow: /
Disallow: /dashboard/, /api/, /auth/, /test-db, /onboarding,
          /reset-password, /forgot-password, /chat/, /unsubscribe,
          /login, /register
Sitemap: https://www.nicemodels.ch/sitemap.xml
```
No AI bot rules present (as noted in audit).

### 1.3 Claim: `sitemap.ts` uses `new Date()` for static pages
**STATUS: CONFIRMED**

`src/app/sitemap.ts` lines 877–888: all 11 static entries use `lastModified: new Date()`. This means every sitemap generation reports today's date as the last-modified date for pages that may not have changed in months.

Dynamic entries (blog, models, clubs, listings) correctly use actual DB `updated_at` / `created_at` values, with `new Date()` as fallback for null dates.

### 1.4 Claim: `/profile/[id]` exists and is unoptimized
**STATUS: CONFIRMED — with a CRITICAL addition not in the audit**

`src/app/profile/[id]/page.tsx` confirmed: no `generateMetadata`, no `export const metadata`, no canonical, all UI strings are English ("Verified", "Online Now", "Reviews", "About Me", "Services Offered", "Availability", "Safety First", "per hour").

**CRITICAL FINDING — the audit is WRONG on one point:** The audit states `/profile/[id]` is "NOT linked from any navigation" and calls it an orphan. This is incorrect. It is linked from **two public-facing components**:

1. **`src/components/search/ProfileGrid.tsx` line 90:**
   ```tsx
   href={`/profile/${profile.id}`}
   ```
   This is the grid rendered on the `/search` page. Every search result card links to `/profile/{id}`, NOT to `/models/{id}`. Googlebot crawling `/search` will discover and follow ALL of these links.

2. **`src/components/profile/SimilarProfiles.tsx` line 91:**
   ```tsx
   href={`/profile/${profile.id}`}
   ```
   The "Similar Profiles" sidebar shown on model profile pages also links to `/profile/{id}`.

**Consequence:** The same Supabase UUID is used in both `/profile/{id}` and `/models/{id}`. Both routes fetch from the same tables (`profiles`, `model_details`, `model_photos`, etc.) and render the same model. This is **genuine duplicate content at scale** — every model has two indexable URLs with no canonical relationship between them. This is worse than the audit described.

**Impact on Phase 1.4:** The task instructions say "If linked somewhere: report it and ASK before changing." See Section 5 (Decision Required).

### 1.5 Claim: No hreflang anywhere
**STATUS: CONFIRMED**

Searched all pages read (`layout.tsx`, `models/[id]/page.tsx`, `clubs/[id]/page.tsx`, `blog/[slug]/page.tsx`, `blog/layout.tsx`, `search/page.tsx`, etc.). Zero instances of `alternates.languages`, `hreflang`, or any `languages` key in any metadata object.

---

## 2. Exact Versions (from package-lock.json)

| Package | Installed version |
|---|---|
| next | **16.1.6** |
| next-intl | **4.11.0** |
| react | 19.2.3 |
| @supabase/ssr | 0.8.0 |
| @supabase/supabase-js | 2.89.0 |
| stripe | 22.1.1 |
| typescript | 5.x (devDependency) |
| tailwindcss | 3.4.17 |

**next-intl 4.11.0 notes for Phase 3 (hreflang):**
- `alternates.languages` in the Next.js `Metadata` type is the correct way to emit hreflang — this works natively in Next.js 15+/16.x App Router without any next-intl-specific helper
- next-intl 4.x does NOT require middleware when using cookie-based routing (confirmed by absence of middleware.ts)
- The `createNextIntlPlugin` in `next.config.ts` only wires message loading; it does not impose URL-based routing

---

## 3. How Locale Is Read Server-Side

From `src/i18n/request.ts`:

```typescript
// Priority order:
// 1. Cookie `NEXT_LOCALE` (set by language switcher on return visits)
// 2. Accept-Language header negotiation (new visitors with browser locale)
// 3. Fallback: 'de'
```

**Implications for hreflang/canonical decisions:**
- Googlebot sends no `NEXT_LOCALE` cookie and no meaningful `Accept-Language` header → **always receives German (`de`) content**
- This means German content is what Google indexes at every URL — consistent with the strategy of declaring `de-CH` as canonical
- The `<html lang={locale}>` in `layout.tsx` line 144 correctly reflects the resolved locale, so German pages will render `<html lang="de">`
- For Phase 3: the canonical + hreflang strategy (`de-CH` = canonical, `x-default` = same URL) is technically sound given this server-side behavior

---

## 4. `/profile/[id]` — Internal Link Status

**Verdict: LINKED FROM TWO PUBLIC PAGES. Cannot simply noindex without breaking user experience.**

| Component | Location | Purpose |
|---|---|---|
| `ProfileGrid.tsx:90` | Rendered on `/search` | Every search result card → `/profile/{id}` |
| `SimilarProfiles.tsx:91` | Rendered on `/models/{id}` | "Similar profiles" sidebar → `/profile/{id}` |

Dashboard references (`dashboard/model/page.tsx`, `dashboard/company/page.tsx`, admin pages) are behind auth and do not affect crawlability.

**The SEO problem:**
- `/models/{id}` — fully optimized: dynamic metadata, canonical, JSON-LD Person schema, `noindex` for hidden sedcards
- `/profile/{id}` — zero metadata, English-only UI, no canonical, no JSON-LD, uses a **different data fetcher** (`getProfileById` from `src/lib/api/profiles.ts`) with different field names (`location_city` vs `city`, `price_per_hour`, `bio` vs `about_me`)

Both routes resolve to the same UUID from the `profiles` table.

**Decision required — see Section 5.**

---

## 5. Cities Table Query Pattern

**Table schema (confirmed from `CitySearch.tsx`):**
```typescript
.from('cities')
.select('id, name, postal_code, canton')
.eq('is_active', true)
```

Fields available: `id`, `name` (display name, e.g. "Zürich"), `postal_code`, `canton` (e.g. "ZH"), `is_active`.

**Pattern used in homepage / models-page for canton resolution:**
```typescript
admin
  .from('cities')
  .select('name, postal_code, canton')
  .in('name', cityNameArray)       // array of string names
  .eq('is_active', true)
```

**Pattern for model discovery by city (models-page):**
Models are associated with cities via `model_details.city` (plain text field matching `cities.name`). For a city landing page, the query would be:
```typescript
// Lookup city metadata
const { data: cityRow } = await admin
  .from('cities')
  .select('name, postal_code, canton')
  .eq('name', displayName)          // e.g. 'Zürich'
  .eq('is_active', true)
  .maybeSingle()

// Fetch models in that city (reusing models_with_active_ads RPC then filtering)
// OR direct query:
const { data: modelsInCity } = await admin
  .from('model_details')
  .select('model_id, showname, city, age, ethnicity, hair_color, about_me')
  .eq('city', displayName)
  // join with profiles to filter is_blocked + sedcard_visible
```

**Slug → display name mapping needed for Phase 4:** The cities table stores German display names ("Zürich", "Bern", "Genf", etc.). City landing page slugs ("zuerich", "genf") are not stored in the DB — a static mapping must be created in `src/lib/data/cities-seo.ts`. The mapping must match the exact `name` values in the `cities` table. **This requires the owner to confirm the exact names used** (e.g., is it "Zürich" or "Zuerich" or "Zurich" in the DB?).

---

## 6. `generateMetadata` Pattern on `/models/[id]` — Canonical Reference

`src/app/models/[id]/page.tsx` lines 107–142:

```typescript
export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { id } = await params
  const meta = await getModelMeta(id)   // cache() wrapper, admin client
  if (!meta) return { title: 'Model nicht gefunden', robots: { index: false, follow: false } }

  const { profile, details, photo, SUPA_URL } = meta
  const name = details?.showname || profile.username || 'Model'
  const city = details?.city || 'Schweiz'
  const age = details?.age ? `, ${details.age}` : ''
  const title = `${name}${age} – Escort in ${city}`
  const desc = details?.about_me?.replace(/<[^>]*>/g, '').slice(0, 155).trimEnd()
    || `${name} – verifiziertes Escort-Model in ${city}. Profil, Fotos und Kontakt auf NiceModels.ch.`

  const ogImage = photo?.file_path
    ? `${SUPA_URL}/storage/v1/object/public/model-photos/${photo.file_path}`
    : `${SITE_URL}/logo.webp`

  const isHidden = details?.sedcard_visible === false

  return {
    title,
    description: desc,
    ...(isHidden ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title, description: desc, type: 'profile',
      url: `${SITE_URL}/models/${id}`,
      images: [{ url: ogImage, alt: name }],
    },
    twitter: { card: 'summary_large_image', title, description: desc, images: [ogImage] },
    alternates: { canonical: `${SITE_URL}/models/${id}` },
  }
}
```

**Key patterns for Phase 1 new metadata:**
- `cache()` from React wraps the DB call (deduplication within a request)
- `createAdminClient()` is used (not the user Supabase client)
- `alternates: { canonical: ... }` is a flat property inside the return object
- `robots: { index: false, follow: false }` is spread conditionally
- No `alternates.languages` (hreflang) — this is the gap Phase 3 will fill

---

## 7. Additional Findings Not Covered or Understated in Audit

### 7.1 No middleware.ts anywhere
Confirmed: neither `src/middleware.ts` nor root `middleware.ts` exists. The `src/lib/supabase/middleware.ts` exports `updateSession` but it is never invoked from a Next.js middleware entry point. Supabase session refresh does not run on every request. This is outside SEO scope but worth noting.

### 7.2 Blog metadata is English — confirmed
`src/app/blog/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Discussions – Community | NiceModels',
  description: 'Community discussions and topics for members on NiceModels.ch. Sign in to take part in the conversation.',
  alternates: { canonical: 'https://www.nicemodels.ch/blog' },
}
```
Title and description are entirely English on a German-first Swiss site.

The `blog/[slug]/page.tsx` `generateMetadata` produces: `` `${title} – Discussion | NiceModels` `` — "Discussion" is English. Needs to be "Diskussion".

### 7.3 `/privacy` and `/terms` missing canonical — confirmed
```typescript
// src/app/privacy/page.tsx
export const metadata = {
  title: 'Datenschutz | nicemodels.ch',
  description: 'Datenschutzerklärung und Hinweise zum Datenschutz bei nicemodels.ch',
  // ← no alternates.canonical
}

// src/app/terms/page.tsx
export const metadata = {
  title: 'AGB | nicemodels.ch',
  description: 'Allgemeine Geschäftsbedingungen (AGB) für nicemodels.ch',
  // ← no alternates.canonical
}
```

### 7.4 Homepage has no server-rendered H1 — confirmed
`src/app/page.tsx` returns only `<MixedHomeClient ... />`. The component is a Client Component. Google's first render of the homepage sees no H1 and no body copy in the initial HTML.

### 7.5 `CitySearch.tsx` reveals cities table has `id` field
The `cities` table schema includes: `id, name, postal_code, canton, is_active`. The `id` is available if needed as a stable identifier for city pages, though using `name` as the lookup key is consistent with existing patterns.

---

## 8. DECISION REQUIRED: `/profile/[id]` treatment

The audit recommended: "If linked somewhere: report it and ASK before changing."

**Situation:** `/profile/[id]` is linked from the public `/search` page results grid and from the "Similar Profiles" sidebar on model pages. It renders the same model data as `/models/{id}` but via a different code path with no metadata, no canonical, and English-only strings.

**Two options for Phase 1.4:**

**Option A — Canonical redirect (safe, stays in Phase 1):**
Add to `src/app/profile/[id]/page.tsx`:
```typescript
export async function generateMetadata({ params }): Promise<Metadata> {
  const { id } = await params
  return {
    alternates: { canonical: `https://www.nicemodels.ch/models/${id}` },
    robots: { index: false, follow: true },
  }
}
```
Effect: Google stops indexing `/profile/{id}` and consolidates all signals to `/models/{id}`. Users still see the `/profile/` page normally. The links in `ProfileGrid` and `SimilarProfiles` still work.

**Option B — Fix the links (correct, but touches public components):**
Change `ProfileGrid.tsx` and `SimilarProfiles.tsx` to link to `/models/{id}` instead of `/profile/{id}`. This eliminates the duplicate URL entirely. Users land directly on the optimized page.

**Recommendation: Option B is correct long-term** — fix the links at their source. Option A is a band-aid. However, Option B modifies two public-facing components (`ProfileGrid`, `SimilarProfiles`) and could affect the search UX if the `/models/{id}` page looks significantly different from `/profile/{id}`. Both pages render model data but with different layouts.

**I will not proceed with either option until you confirm which to take.** Please respond with:
- "Option A" — noindex + canonical pointing to /models/{id}
- "Option B" — fix the links in ProfileGrid and SimilarProfiles
- "Both" — fix links AND add canonical as belt-and-suspenders

---

## 9. Phase 1 Plan

Pending decision on `/profile/[id]`, Phase 1 will execute in order:

**1.1 — `/models-page` metadata (no ambiguity)**
Add `export const metadata: Metadata` to `src/app/models-page/page.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Escort-Models in der Schweiz – Verifizierte Begleitung',
  description: 'Entdecke verifizierte Escort-Models in der ganzen Schweiz auf NiceModels.ch. Zürich, Bern, Basel, Genf und mehr – jetzt Profile entdecken.',
  alternates: { canonical: 'https://www.nicemodels.ch/models-page' },
  openGraph: {
    title: 'Escort-Models in der Schweiz – Verifizierte Begleitung',
    description: 'Entdecke verifizierte Escort-Models in der ganzen Schweiz.',
    type: 'website',
    url: 'https://www.nicemodels.ch/models-page',
    images: [{ url: 'https://www.nicemodels.ch/logo.webp', width: 512, height: 512, alt: 'NiceModels.ch' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Escort-Models in der Schweiz – Verifizierte Begleitung',
    description: 'Entdecke verifizierte Escort-Models in der ganzen Schweiz.',
    images: ['https://www.nicemodels.ch/logo.webp'],
  },
}
```

**1.2 — `/privacy` and `/terms` canonical (no ambiguity)**
Add `alternates: { canonical: 'https://www.nicemodels.ch/privacy' }` to privacy metadata.
Add `alternates: { canonical: 'https://www.nicemodels.ch/terms' }` to terms metadata.

**1.3 — Blog language fix (no ambiguity)**
- `src/app/blog/layout.tsx`: Change to German title/description
- `src/app/blog/[slug]/page.tsx`: Change `– Discussion |` to `– Diskussion |` in the title template

**1.4 — `/profile/[id]` (awaiting decision above)**

After all four items: `npm run build` + `npx tsc --noEmit` + `PHASE_1_REPORT.md`.

---

## 10. Pre-Phase-1 Checklist for Owner

Before I begin Phase 1:

1. **`git commit` the current state** as instructed ("Instruct the human to `git commit` before Phase 1")
2. **Confirm `/profile/[id]` treatment** (Option A, B, or Both) — see Section 8
3. **Optional: confirm the German copy for `/models-page`** in Section 9 item 1.1 (or approve the draft)
4. The `GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` env vars should be set in Netlify for Phase 7; no action needed now

---

*End of Phase 0 Verification Report*
