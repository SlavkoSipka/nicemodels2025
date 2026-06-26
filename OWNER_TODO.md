# Owner TODO — Post-SEO-Overhaul Checklist

These items require action from you (the site owner). They cannot be done by code changes alone. Work through them in roughly this order after the code is deployed.

---

## 1. Deploy the code

The working directory contains all Phase 1–7 changes but they have not been committed or pushed. Deploy these changes to production before any of the steps below make sense.

---

## 2. Enforce the Content-Security-Policy (Phase 6)

**Current state:** CSP is deployed as `Content-Security-Policy-Report-Only` — it logs violations to the browser console but does NOT block anything.

**Action:** Run through the 10-step testing checklist in `PHASE_6_REPORT.md`. When the browser console is clean across all steps (homepage, model profile, Stripe checkout, contact form, chat, dashboard), open `next.config.ts` and change:

```diff
- { key: 'Content-Security-Policy-Report-Only', value: CSP },
+ { key: 'Content-Security-Policy', value: CSP },
```

Then redeploy. **Do not enforce until payments and chat have been tested.** A broken CSP on Stripe checkout silently prevents payments.

---

## 3. Set environment variables in your hosting provider

Two env vars are read in `src/app/layout.tsx` but currently produce no output (they're undefined):

```
GOOGLE_SITE_VERIFICATION=<your-value>
BING_SITE_VERIFICATION=<your-value>
```

Set these in Netlify (or wherever you deploy) → Site Settings → Environment Variables. These render as `<meta name="google-site-verification">` and `<meta name="msvalidate.01">` in the `<head>`. Without them, you cannot verify the site in Search Console.

---

## 4. Submit the sitemap in Google Search Console and Bing Webmaster Tools

The sitemap is at `https://www.nicemodels.ch/sitemap.xml`.

**Google Search Console:**
1. Go to `search.google.com/search-console` → select your property
2. Left sidebar → Sitemaps
3. Enter `sitemap.xml` → Submit

**Bing Webmaster Tools:**
1. Go to `bing.com/webmasters` → select your site
2. Sitemaps → Submit Sitemap
3. Enter `https://www.nicemodels.ch/sitemap.xml`

The sitemap now includes 11 city landing pages (`/escort` + 10 cities) that are new since any previous submission.

---

## 5. Review the per-city German intro copy (Phase 4)

The 10 city intro texts (~350 words each) live in `src/lib/data/cities-seo.ts` under the `introCopyDe` field. They are factual and non-explicit but were generated programmatically. A native German speaker should review each city's copy before it ranks — especially Genf (which is displayed as "Genf" but has a Francophone context), Lugano (Italian-speaking), and Basel (cross-border).

---

## 6. Keyword strategy (owner-owned)

The SEO copy uses topically relevant German terms but no systematic keyword research was done as part of this project. Consider:
- Tracking city page rankings for `escort [city]` terms in Google Search Console after indexing
- Adding service-specific content (if legally appropriate) once the city pages establish authority
- Internal link expansion from model profiles → city pages

---

## 7. Monitor age-gate impact on analytics

The 18+ age gate (Phase 6) is a client-side overlay. It will fire for every first-time visitor. Monitor:
- **Bounce rate** on the homepage in the first 2 weeks post-deploy — a spike may indicate gate friction
- **Session duration** — visitors who click "Nein" (→ google.com) count as bounces but that is intentional
- The cookie is `age_verified=true`, 60-day expiry. Returning users within 60 days see no gate.

---

## 8. EN / FR / ES copy review (low priority)

Translation files (`messages/en.json`, `messages/fr.json`, `messages/es.json`) were updated to mirror German copy added in Phases 2 and 4. The German is authoritative; the EN/FR/ES versions are direct translations and are NOT separately indexed (German-canonical strategy). A low-stakes manual review by a bilingual person is worthwhile before a French-market push — see item 9.

---

## 9. Future: full French / Italian locale refactor

The current German-canonical strategy means Romandie (FR) and Ticino (IT) visitors see German content. If the French-speaking Swiss market becomes a priority:
- Add `/fr/` URL prefixes AND a French `alternates.languages['fr-CH']` hreflang
- This is a **significant refactor** of routing, metadata, and copy — do not attempt without a dedicated sprint
- Do NOT add locale-prefixed URLs without also having the content to go with them — thin pages hurt more than they help

---

## 10. Code TODOs still in place (non-SEO)

Two pre-existing TODO comments remain in the codebase. They are not SEO-related but are noted here for completeness:

| File | TODO |
|------|------|
| `src/app/profile/[id]/page.tsx` | `// TODO: implement online status` |
| `src/components/registration/ModelRegistrationWizard.tsx` | `// TODO: Submit to Supabase` |

These were pre-existing before Phase 1 and were not introduced or altered during this project.

---

## 11. Confirm city DB names if you add more cities

If a new city is added to the site, the exact `cities.name` value from the database must be confirmed BEFORE creating the city page. The Geneva (Genf) mismatch — DB stores `"Genève"`, not `"Genf"` — showed how slug vs DB name divergence silently returns empty results. See `SEO_README.md` for the full add-city procedure.
