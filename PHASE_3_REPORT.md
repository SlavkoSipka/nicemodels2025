# Phase 3 Report — Canonical & hreflang Signaling

## 1. New Helper: `src/lib/seo.ts`

`buildMetadata({ path, title, description, ogImage?, ogType? })` — returns a complete `Metadata`
object with canonical, hreflang languages block, OpenGraph, and Twitter Card pre-filled from
a single path argument. All values point to the same clean German URL (German-canonical strategy).

```typescript
alternates: {
  canonical: `https://www.nicemodels.ch${path}`,
  languages: {
    'de-CH': `https://www.nicemodels.ch${path}`,
    'x-default': `https://www.nicemodels.ch${path}`,
  },
}
```

No locale-prefixed URLs invented — only the real, existing URL is referenced.

---

## 2. Migration Table

### Static routes — migrated to `buildMetadata()` helper

| Route | Canonical | hreflang de-CH | hreflang x-default | OG/Twitter | File |
|-------|-----------|----------------|--------------------|------------|------|
| `/` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/page.tsx` |
| `/models-page` | ✅ | ✅ | ✅ | ✅ | `src/app/models-page/page.tsx` |
| `/clubs` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/clubs/page.tsx` |
| `/jobs-rents` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/jobs-rents/page.tsx` |
| `/search` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/search/page.tsx` |
| `/comments` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/comments/page.tsx` |
| `/latest-actions` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/latest-actions/page.tsx` |
| `/contact` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/contact/layout.tsx` |
| `/blog` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/blog/layout.tsx` |
| `/privacy` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/privacy/page.tsx` |
| `/terms` | ✅ | ✅ | ✅ | ✅ (new) | `src/app/terms/page.tsx` |

### Dynamic routes — `languages` added directly to existing `alternates` (generateMetadata NOT refactored)

Per instructions: these functions are working and their output is not changed beyond adding
the `languages` block alongside the existing `canonical`.

| Route | Canonical | hreflang de-CH | hreflang x-default | File |
|-------|-----------|----------------|--------------------|------|
| `/models/[id]` | ✅ (pre-existing) | ✅ (new) | ✅ (new) | `src/app/models/[id]/page.tsx` |
| `/clubs/[id]` | ✅ (pre-existing) | ✅ (new) | ✅ (new) | `src/app/clubs/[id]/page.tsx` |
| `/jobs-rents/[id]` | ✅ (pre-existing) | ✅ (new) | ✅ (new) | `src/app/jobs-rents/[id]/page.tsx` |

### Routes left untouched (by design)

| Route | Reason |
|-------|--------|
| `/profile/[id]` | Phase 1 — noindex + canonical pointing to `/models/{id}`. Correct as-is. |
| `/blog/[slug]` | Has conditional `robots.noindex` logic. Left alone to avoid regression. |
| `src/app/layout.tsx` | Root layout fallback; public pages now have explicit metadata. No hreflang noise on gated/dashboard routes. |

---

## 3. Build Results

**`npm run build`:** ✅ Clean — 117 pages, 0 new errors or warnings.

**`npx tsc --noEmit`:** Pre-existing errors only (identical to Phase 1/2 baseline in dashboard pages,
`profile/[id]`, `LatestActionsClient`, etc.). Zero new errors introduced by Phase 3 changes.

---

## 4. Files Changed

| File | Change |
|------|--------|
| `src/lib/seo.ts` | **New** — `buildMetadata()` helper |
| `src/app/page.tsx` | Added `export const metadata` (was missing entirely) |
| `src/app/models-page/page.tsx` | Replaced inline metadata block with `buildMetadata()` |
| `src/app/clubs/page.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/jobs-rents/page.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/search/page.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/comments/page.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/latest-actions/page.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/contact/layout.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/blog/layout.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/privacy/page.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/terms/page.tsx` | Replaced inline metadata with `buildMetadata()` |
| `src/app/models/[id]/page.tsx` | Added `languages` to existing `alternates` in `generateMetadata` |
| `src/app/clubs/[id]/page.tsx` | Added `languages` to existing `alternates` in `generateMetadata` |
| `src/app/jobs-rents/[id]/page.tsx` | Added `languages` to existing `alternates` in `generateMetadata` |
