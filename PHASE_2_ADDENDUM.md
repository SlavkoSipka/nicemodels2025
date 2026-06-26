# Phase 2 Addendum — H1 Audit + Expanded Copy

## 1. H1 Uniqueness Audit

### Method
Grepped `src/components/home/`, `src/components/layout/`, `src/components/stories/`,
`src/components/filters/`, and a broad sweep of all `src/components/**/*.tsx` for `<h1`.

### Results

**`/` (homepage — MixedHomeClient)**
- `<h1>` found: **1** — in the `hero` prop rendered from `src/app/page.tsx` (Server Component)
- `<h1>` in child components rendered by `MixedHomeClient`: **0**
- Components checked: `MixedHomeClient`, `ProfileCard`, `BannerCard`, `ClubCard`,
  `ListingCard`, `FilterBar`, `StoriesRow`, `ChatModelsRow`, `StatusMessagesRow`, etc.

**`/models-page` (HomePageClient)**
- `<h1>` found: **1** — in the `hero` prop rendered from `src/app/models-page/page.tsx` (Server Component)
- `<h1>` in child components rendered by `HomePageClient`: **0**

**Other components containing `<h1>`** (not rendered on either page):
- `src/components/jobs-rent/CreateJobRentForm.tsx` — rendered only under `/dashboard/`
- `src/components/onboarding/SimplifiedClubModelForm.tsx` — rendered only on `/onboarding`
- `src/components/registration/steps/*.tsx` — rendered only on `/register`

**Verdict:** Each page has exactly one H1. No demotions needed.

---

## 2. Expanded Copy (all four locales)

### German (`messages/de.json`) — authoritative

```
home.seo.homeH1:
  "Escort Models & Clubs in der Schweiz"

home.seo.homeIntro:
  "Verifizierte Escort Models, Clubs und Agenturen in Zürich, Bern, Basel, Genf und der ganzen Schweiz."

home.seo.homeBody:
  "NiceModels.ch ist das führende Schweizer Portal für diskrete Begleitung. Alle Profile werden vor der Schaltung geprüft — du siehst nur echte, aktive Inserate. Neben Escort Models findest du hier auch Clubs, Agenturen und aktuelle Stellenangebote aus der Branche."

home.seo.modelsH1:
  "Escort-Models in der Schweiz"

home.seo.modelsIntro:
  "Verifizierte Sedcards aus Zürich, Bern, Basel, Genf und der ganzen Schweiz. Jetzt Profile entdecken."

home.seo.modelsBody:
  "Alle hier gezeigten Models haben ein aktives Inserat — keine veralteten Einträge. Filtere nach Region, Alter oder Angebot und finde die passende Begleitung in deiner Nähe. Diskret, sicher und direkt."
```

### English (`messages/en.json`) — mirror

```
home.seo.homeH1:    "Escort Models & Clubs in Switzerland"
home.seo.homeIntro: "Verified escort models, clubs and agencies in Zurich, Bern, Basel, Geneva and across Switzerland."
home.seo.homeBody:  "NiceModels.ch is Switzerland's leading platform for discreet companionship. All profiles are reviewed before going live — you only see real, active listings. Alongside escort models you'll also find clubs, agencies and current job listings from the industry."
home.seo.modelsH1:    "Escort Models in Switzerland"
home.seo.modelsIntro: "Verified sedcards from Zurich, Bern, Basel, Geneva and all across Switzerland. Browse profiles now."
home.seo.modelsBody:  "Every model shown here has an active listing — no stale entries. Filter by region, age or service and find the right companion near you. Discreet, safe and direct."
```

### French (`messages/fr.json`) — mirror

```
home.seo.homeH1:    "Escort Models & Clubs en Suisse"
home.seo.homeIntro: "Escort models, clubs et agences vérifiés à Zurich, Berne, Bâle, Genève et dans toute la Suisse."
home.seo.homeBody:  "NiceModels.ch est le premier portail suisse pour une compagnie discrète. Tous les profils sont vérifiés avant publication — vous ne voyez que de vraies annonces actives. En plus des escort models, vous trouverez des clubs, des agences et des offres d'emploi actuelles du secteur."
home.seo.modelsH1:    "Escort Models en Suisse"
home.seo.modelsIntro: "Sedcards vérifiées de Zurich, Berne, Bâle, Genève et de toute la Suisse. Découvrez les profils maintenant."
home.seo.modelsBody:  "Chaque model présenté ici dispose d'une annonce active — aucune fiche obsolète. Filtrez par région, âge ou prestation et trouvez la compagnie idéale près de chez vous. Discret, sûr et direct."
```

### Spanish (`messages/es.json`) — mirror

```
home.seo.homeH1:    "Escort Models y Clubs en Suiza"
home.seo.homeIntro: "Escort models, clubs y agencias verificados en Zúrich, Berna, Basilea, Ginebra y en toda Suiza."
home.seo.homeBody:  "NiceModels.ch es el portal líder en Suiza para acompañamiento discreto. Todos los perfiles se revisan antes de publicarse — solo ves anuncios reales y activos. Además de escort models, encontrarás clubs, agencias y ofertas de trabajo actuales del sector."
home.seo.modelsH1:    "Escort Models en Suiza"
home.seo.modelsIntro: "Sedcards verificadas de Zúrich, Berna, Basilea, Ginebra y toda Suiza. Descubre perfiles ahora."
home.seo.modelsBody:  "Todos los models aquí mostrados tienen un anuncio activo — sin entradas desactualizadas. Filtra por región, edad o servicio y encuentra la compañía adecuada cerca de ti. Discreto, seguro y directo."
```

---

## 3. Build Results

**`npm run build`:** ✅ Clean — 117 static/dynamic pages generated, 0 new errors.

**`npx tsc --noEmit`:** Pre-existing errors only (dashboard pages, chat, auth, registration components) — identical to Phase 1 baseline. Zero new errors introduced by Phase 2 changes.

---

## Files Changed in Phase 2 (full list)

| File | Change |
|------|--------|
| `src/app/page.tsx` | Added `getTranslations('home.seo')`, hero JSX with H1 + intro + body |
| `src/app/models-page/page.tsx` | Added `getTranslations('home.seo')`, hero JSX with H1 + intro + body |
| `src/components/home/MixedHomeClient.tsx` | Added `hero?: React.ReactNode` prop + render |
| `src/components/home/HomePageClient.tsx` | Added `hero?: React.ReactNode` prop + render |
| `messages/de.json` | Added `home.seo` block (6 keys, authoritative German) |
| `messages/en.json` | Added `home.seo` block (English mirror) |
| `messages/fr.json` | Added `home.seo` block (French mirror) |
| `messages/es.json` | Added `home.seo` block (Spanish mirror) |
