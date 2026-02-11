# ✅ Netlify Deployment Checklist

Pre nego što deploješ na Netlify, proveri da su sve stavke odrađene:

## 📋 Pre-Deploy Checklist

### 1. Git Repository
- [ ] Kod je pushovan na GitHub/GitLab
- [ ] `.gitignore` pravilno ignoriše `.env.local`
- [ ] Nema hardkodovanih kredencijala u kodu

### 2. Environment Variables Spremne
```
NEXT_PUBLIC_SUPABASE_URL=https://ykzqjwqomaeuppubofid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=(tvoj anon key)
```

### 3. Build Test
- [ ] `npm run build` prolazi bez grešaka
- [ ] `npm run start` pokreće production build lokalno
- [ ] Sve stranice se učitavaju kako treba

### 4. Supabase Setup
- [ ] Svi SQL script-ovi izvršeni
- [ ] RLS policies postavljene
- [ ] Storage buckets kreirani (`model-photos`, `banner-images`, `club-photos`)
- [ ] Storage policies omogućavaju public pristup za approved slike

---

## 🚀 Deployment Steps

### Via Netlify Dashboard

1. **Idi na Netlify**
   - https://app.netlify.com

2. **Add New Site**
   - Klikni "Add new site" → "Import an existing project"

3. **Connect Git**
   - Izaberi GitHub/GitLab
   - Autorizuj Netlify
   - Izaberi svoj repo

4. **Build Settings** (automatski detektovano)
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Functions directory: `.netlify/functions`

5. **Environment Variables**
   - Site settings → Environment variables
   - Add variable:
     ```
     Key: NEXT_PUBLIC_SUPABASE_URL
     Value: https://ykzqjwqomaeuppubofid.supabase.co
     ```
   - Add variable:
     ```
     Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
     Value: (tvoj anon key iz Supabase)
     ```

6. **Deploy!**
   - Klikni "Deploy site"
   - Čekaj 3-5 minuta
   - Tvoj site će biti live na `https://random-name.netlify.app`

---

## 🔧 Post-Deploy Steps

### 1. Test Site
Testiraј sve ove funkcionalnosti na live site-u:

- [ ] Homepage učitava modele
- [ ] Login funkcioniše
- [ ] Register funkcioniše  
- [ ] Model profil se prikazuje
- [ ] Dashboard-ovi rade za sve role
- [ ] Upload slika radi
- [ ] Favorites radi
- [ ] Comments sistem radi

### 2. Update Supabase Auth Settings
Idi u Supabase → Authentication → URL Configuration

Dodaj:
- **Site URL:** `https://tvoj-site-name.netlify.app`
- **Redirect URLs:**
  ```
  https://tvoj-site-name.netlify.app/auth/callback
  https://tvoj-site-name.netlify.app/dashboard
  https://tvoj-site-name.netlify.app/onboarding
  ```

### 3. Custom Domain (Optional)
- Netlify → Domain settings → Add custom domain
- Sledi DNS instrukcije
- HTTPS se automatski aktivira

---

## 🐛 Ako Nešto Ne Radi

### Build Failed?
1. Proveri Netlify deploy logs
2. Testiraј `npm run build` lokalno
3. Proveri da li su svi dependency-ji u `package.json`

### Environment Variables Not Working?
1. Proveri da počinju sa `NEXT_PUBLIC_`
2. Redeploy nakon dodavanja env variables
3. Hard refresh browser (Ctrl + Shift + R)

### Images Not Loading?
1. Proveri Supabase Storage bucket policies
2. Proveri da su slike `is_approved: true`
3. Proveri CORS settings u Supabase

### Auth Not Working?
1. Proveri Supabase Auth redirect URLs
2. Proveri da je `Site URL` podešen
3. Testiraј logout/login ponovo

---

## 📊 Netlify Features

### Auto-Deploy
- Svaki push na `main` automatski deploys
- Pull request-ovi dobijaju preview links

### Deploy Previews
- Svaki PR dobija jedinstveni URL za testiranje
- Perfektno za review pre merge-a

### Rollback
- Lako se vrati na prethodnu verziju ako nešto krene naopako
- Deploys → Klikni na staru verziju → Publish deploy

---

## 🎯 Quick Commands

```bash
# Test build lokalno
npm run build

# Test production lokalno
npm run build && npm run start

# Deploy via CLI (optional)
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## 📝 Bitne Napomene

### Beta Features
Tokom beta faze, ovi feature-i su besplatni:
- Model ad activation
- Club ad activation  
- Banner ads

Ne zaboravi da dodaš payment kada ideš live!

### Performance
Netlify automatski:
- ✅ CDN distribuira tvoj site globalno
- ✅ Optimizuje slike
- ✅ Kompresuje JavaScript/CSS
- ✅ Dodaje HTTPS

### Monitoring
Proveri Netlify analytics:
- Site overview → Analytics
- Real-time deployment status
- Performance metrics

---

## ✨ Done!

Tvoj site je sada live i dostupan svima! 🎉

Next URL: `https://your-site-name.netlify.app`

**NAPOMENA:** Prvih nekoliko minuta može biti potrebno za cold start i caching.

---

Za detaljnije instrukcije, vidi **DEPLOYMENT.md**
