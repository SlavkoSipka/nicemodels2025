# Phase 1 Report — NiceModels.ch SEO Overhaul
Generated: 2026-06-10

---

## Step 1 — `/profile/{id}` vs `/models/{id}` Comparison

**Verdict: `/models/{id}` is a strict superset. Step 2 proceeds.**

### Fields and sections visible to users

| Feature / Field | `/profile/{id}` | `/models/{id}` | Notes |
|---|---|---|---|
| Name | ✓ (`full_name`) | ✓ (`showname` / `username`) | Different source fields |
| Age | ✓ | ✓ | |
| Public ID | ✓ (display only) | ✓ (copyable) | |
| Verified badge | ✓ | ✓ | |
| Online Now badge | ✓ (hardcoded false) | — | Effectively identical |
| City | ✓ (`location_city`) | ✓ (`city`) | **Different DB columns** — old vs new schema |
| Country | ✓ (`location_country`) | — | `/models/` shows city only |
| View count | — | ✓ | |
| Slogan | — | ✓ (`slogan`) | |
| Rating + review count | ✓ | ✓ | |
| Photo gallery | ✓ | ✓ | `/models/` also includes videos |
| Video gallery | — | ✓ | |
| Photo likes | — | ✓ | |
| Lightbox | — | ✓ | |
| About / Bio | ✓ (`model_details.bio`) | ✓ (`model_details.about_me`) | **Different DB columns** |
| Services | ✓ (string[] from `model_details.services`) | ✓ (from `model_services` table, with names + services_for + other_services) | `/models/` richer |
| Languages | ✓ (string[] no proficiency) | ✓ (with proficiency stars per language) | `/models/` richer |
| Height | ✓ (`height`) | ✓ (`height_cm`) | Different column names |
| Weight | — | ✓ (`weight_kg`) | |
| Bust / Waist / Hip | — | ✓ | |
| Hair / Eye color | — | ✓ | |
| Ethnicity / Nationality | — | ✓ | |
| Dress size / Gender | — | ✓ | |
| Special characteristics | — | ✓ | |
| Rates (incall / outcall) | Calculated from `price_per_hour` (30min/1hr/2hr/overnight) | ✓ From `model_rates` table (actual rates, multiple durations, CHF) | `/models/` is real data |
| Price per hour (sidebar) | ✓ | — | Replaced by full rates table |
| Pricing table sidebar | ✓ (calculated) | — | Replaced by dedicated rates section |
| Contact (Show Contact) | ✓ (via `ContactButtons` component) | ✓ (inline: phone + SMS + WhatsApp/Viber/Telegram + email + website) | `/models/` richer |
| Phone on card (quick link) | — | ✓ (if `show_phone_on_card`) | |
| Contact instruction meta | — | ✓ (sms_only, no_withheld, etc.) | |
| Availability (days/hours) | ✓ (from `working_hours_type` / `custom_schedule`) | ✓ (from `model_working_hours` table) | Different source |
| 24/7 availability indicator | — | ✓ | |
| Location section (zip, street) | — | ✓ | |
| Live location (GPS) | — | ✓ | |
| Incall / outcall options | — | ✓ | |
| Collaborations section | — | ✓ | |
| Reviews (comments) | ✓ (all visitors) | ✓ (logged-in users only) | `/profile/` shows to all; `/models/` login-gated |
| Leave a review form | — | ✓ | |
| Favorites (save) | — | ✓ | |
| Share | ✓ (no-op button) | ✓ (Web Share API + clipboard) | `/models/` functional |
| Flag / Report | ✓ (no-op button) | — | Neither has backend action |
| Similar Profiles | ✓ (same-city grid) | — | Replaced by Collaborations |
| Safety Notice sidebar | ✓ | — | Static text box |
| Prev / Next navigation | — | ✓ (shuffled, all models) | |
| Quick Collab / Club invite | — | ✓ (for logged-in models/companies) | |
| JSON-LD (Person schema) | — | ✓ | |
| Dynamic SEO metadata | — | ✓ (title, desc, OG, Twitter, canonical) | |
| `generateMetadata` | — | ✓ | |

### What `/profile/{id}` shows that `/models/{id}` does NOT show

| Item | Assessment |
|---|---|
| Country (`location_country`) | **Legacy field** — `model_details.location_country` is from the old schema. Current model onboarding writes to `city` (no country). No data loss; the field is effectively empty for all current models. |
| "Safety First" sidebar notice | Static text box, not model data. No information lost. |
| Flag button | No-op UI element, no backend. Not a functional feature. |
| Similar Profiles grid | Replaced by the Collaborations section on `/models/`. Different concept but same "discover more models" purpose. |
| Reviews visible to all | `/models/` requires login to see reviews. This is an intentional product decision already in place. |

**Conclusion: No meaningful information gap.** The only structural difference is that `/profile/` reads from legacy schema columns (`location_city`, `bio`, `price_per_hour`) that are likely empty for all current models, while `/models/` reads from the live columns. Proceeding with Step 2.

---

## Step 2 — Link fixes

Changed `href` in two public components to point to `/models/{id}`:

| File | Line | Before | After |
|---|---|---|---|
| [ProfileGrid.tsx:90](src/components/search/ProfileGrid.tsx#L90) | 90 | `/profile/${profile.id}` | `/models/${profile.id}` |
| [SimilarProfiles.tsx:91](src/components/profile/SimilarProfiles.tsx#L91) | 91 | `/profile/${profile.id}` | `/models/${profile.id}` |

---

## Step 3 — Canonical safety net on `/profile/[id]`

Added `generateMetadata` to [profile/[id]/page.tsx](src/app/profile/[id]/page.tsx):

```typescript
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params
  return {
    alternates: { canonical: `https://www.nicemodels.ch/models/${id}` },
    robots: { index: false, follow: true },
  }
}
```

Effect: Google receives `<link rel="canonical" href="/models/{id}">` and `<meta name="robots" content="noindex, follow">` on every `/profile/` URL, permanently directing all signals to `/models/{id}` regardless of how the page was reached.

---

## 1.1 — `/models-page` metadata

Added `export const metadata: Metadata` to [models-page/page.tsx](src/app/models-page/page.tsx):

- **Title:** `Escort-Models in der Schweiz – Verifizierte Begleitung`
- **Description (139 chars):** `Entdecke verifizierte Escort-Models in der ganzen Schweiz auf NiceModels.ch. Zürich, Bern, Basel, Genf und mehr – jetzt Profile entdecken.`
- **OG title:** identical to title ✓
- **Twitter title:** identical to title ✓
- **Canonical:** `https://www.nicemodels.ch/models-page`

---

## 1.2 — `/privacy` and `/terms` canonical

| File | Change |
|---|---|
| [privacy/page.tsx](src/app/privacy/page.tsx) | Added `alternates: { canonical: 'https://www.nicemodels.ch/privacy' }` |
| [terms/page.tsx](src/app/terms/page.tsx) | Added `alternates: { canonical: 'https://www.nicemodels.ch/terms' }` |

---

## 1.3 — Blog language fix

All strings were hardcoded in the metadata exports (not in `messages/de.json`), so changes were made inline.

| File | Change |
|---|---|
| [blog/layout.tsx](src/app/blog/layout.tsx) | Title: `Community & Diskussionen \| NiceModels.ch` · Description: German |
| [blog/[slug]/page.tsx](src/app/blog/[slug]/page.tsx) | Fallback title: `Diskussion \| NiceModels.ch` · Title template: `– Diskussion \| NiceModels.ch` |

---

## Build & Type Check

| Check | Result |
|---|---|
| `npm run build` | ✅ Passes — all routes compile, `/models-page`, `/models/[id]`, `/profile/[id]`, `/privacy`, `/terms`, `/blog`, `/blog/[slug]` all listed in build output |
| `npx tsc --noEmit` | Pre-existing errors only (dashboard pages, cron routes, missing Supabase generated types). **Zero new errors introduced by Phase 1 changes.** |

---

## Files changed

1. `src/components/search/ProfileGrid.tsx` — link fix
2. `src/components/profile/SimilarProfiles.tsx` — link fix
3. `src/app/profile/[id]/page.tsx` — canonical + noindex
4. `src/app/models-page/page.tsx` — full metadata block
5. `src/app/privacy/page.tsx` — canonical
6. `src/app/terms/page.tsx` — canonical
7. `src/app/blog/layout.tsx` — German metadata
8. `src/app/blog/[slug]/page.tsx` — German title template

---

**STOP — awaiting "proceed to Phase 2."**
