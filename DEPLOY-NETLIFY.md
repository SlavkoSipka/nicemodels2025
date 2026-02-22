# Deploy na Netlify – checklist

## 1. Environment variables (obavezno)

U Netlify: **Site settings → Environment variables** dodaj:

| Variable | Opis |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL tvog Supabase projekta (npr. `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public ključ iz Supabase (Settings → API) |

Bez ovih vrednosti slike sa Supabase storage-a i API pozivi neće raditi na produkciji.

## 2. Šta je podešeno u repou

- **netlify.toml** – uklonjen je redirect `/* → /index.html` koji je slao sve zahteve (uključujući `/logo2.png` i ostale slike) na index i kreirao 404 za slike. Routing i static fajlove sada obrađuje `@netlify/plugin-nextjs`.
- **next.config.ts** – domen za Supabase slike (`*.supabase.co`) je već u `images.remotePatterns`, tako da `next/image` može da optimizuje slike sa storage-a.
- **public/** – fajlovi iz `public/` (npr. `logo2.png`) se serviraju na root: `/logo2.png`. Budi siguran da su u repou (npr. `public/logo2.png`) i da se commituju pre deploya.

## 3. Build na Netlify

- Build command: `npm run build`
- Publish directory ostavi kako Netlify predloži kada koristiš **@netlify/plugin-nextjs** (plugin sam postavlja output).
- Posle deploya proveri:
  - Da li se otvara `/logo2.png` (lokalna slika).
  - Da li se učitavaju slike modela (Supabase) na početnoj stranici i na profilima.

## 4. Ako slike i dalje ne rade

- Proveri u **Netlify → Deploy log** da li je build uspeo i da nema grešaka.
- U **Browser DevTools → Network** pogledaj zahteve za slike: da li su URL-ovi ispravni i da li vraćaju 200 ili 404/403.
- Za Supabase: u **Supabase Dashboard → Storage → model-photos** (i ostali bucket-ovi) proveri da je bucket **Public** i da anon ima read pristup (Policy za SELECT/get).
