# 🔍 DEBUGGING STORIES - Zašto se ne prikazuju?

## Problem:
Story se upload-uje u bucket, ali se ne prikazuje na sajtu.

## ✅ KORACI ZA REŠAVANJE:

### KORAK 1: Proveri da li postoje stories u bazi

Pokreni u Supabase SQL Editor:
```sql
File: supabase-docs/DEBUG-stories.sql
```

Ovo će ti pokazati:
- Da li postoje stories u `model_stories` tabeli
- Da li su aktivni (`is_active = TRUE`)
- Da li nisu expired (`expires_at > NOW()`)
- Šta funkcija `get_active_model_stories()` vraća

---

### KORAK 2: Popravi SQL funkciju

Pokreni:
```sql
File: supabase-docs/FIX-get-active-stories.sql
```

Ovo će:
- Drop-ovati postojeću funkciju
- Kreirati novu sa boljom logikom
- Dodati `SECURITY DEFINER` (funkcija se izvršava sa pravima power user-a)
- Grant-ovati permissions za authenticated i anon users
- Testirati funkciju odmah

---

### KORAK 3: Proveri Console u browseru

1. Otvori sajt
2. Pritisni **F12** → **Console**
3. Refresh stranicu
4. Gledaj poruke:

**Ako vidiš:**
```
📸 Loading stories...
✅ Stories loaded: [... data ...]
```
**→ Dobro! Stories se učitavaju.**

**Ako vidiš:**
```
📸 Loading stories...
❌ Error loading stories: { error details }
```
**→ Problem! Pošalji mi error.**

**Ako vidiš:**
```
📸 Loading stories...
✅ Stories loaded: []
```
**→ Funkcija radi, ali nema stories. Proveri bazu.**

---

### KORAK 4: Proveri Storage bucket permissions

Možda problem je što browser ne može da učita sliku/video iz storage-a.

Pokreni u Supabase SQL Editor:
```sql
-- Proveri RLS policies za storage
SELECT 
  policyname, 
  cmd, 
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects';
```

Trebalo bi da vidiš policy:
```
"Anyone can view model stories" | SELECT | bucket_id = 'model-stories'
```

Ako ne postoji, pokreni:
```sql
File: supabase-docs/SETUP-STORAGE-model-stories.sql
```

---

### KORAK 5: Proveri Network tab

1. Otvori sajt
2. **F12** → **Network tab**
3. Refresh stranicu
4. Filtriraj: **XHR** ili **Fetch**
5. Traži request ka `supabase.co/rest/v1/rpc/get_active_model_stories`

**Klikni na taj request:**
- **Status:** Trebalo bi `200 OK`
- **Response:** Trebalo bi JSON sa stories
- **Preview:** Vidiš podatke?

**Ako vidiš 401 Unauthorized:**
→ Problem sa permissions (verovatno RLS)

**Ako vidiš 404 Not Found:**
→ Funkcija ne postoji ili se pogrešno zove

**Ako vidiš 500 Internal Server Error:**
→ Greška u SQL funkciji

---

### KORAK 6: Proveri da li se slika/video učitava

Ako se stories prikazuju u listi, ali slika/video ne učitava:

1. **F12** → **Network tab**
2. Klikni na story
3. Gledaj request ka `supabase.co/storage/v1/object/public/model-stories/...`

**Ako vidiš 403 Forbidden:**
→ Storage bucket nije public ili nema RLS policy za čitanje

**Ako vidiš 404 Not Found:**
→ Fajl ne postoji na tom path-u (proveri `media_url` u bazi)

---

## 🎯 NAJČEŠĆI PROBLEMI:

### Problem 1: Funkcija vraća prazan array `[]`

**Uzrok:**
- `is_active = FALSE` (story je deaktiviran)
- `expires_at < NOW()` (story je istekao)
- `profile_status != 'active'` (model profil nije aktivan)
- Model nema `model_details` red

**Rešenje:**
```sql
-- Proveri stories
SELECT id, model_id, is_active, expires_at, created_at 
FROM model_stories 
ORDER BY created_at DESC LIMIT 5;

-- Ako je is_active = FALSE, postavi na TRUE
UPDATE model_stories 
SET is_active = TRUE 
WHERE id = 'STORY_ID';

-- Ako je expires_at u prošlosti, produži
UPDATE model_stories 
SET expires_at = NOW() + INTERVAL '24 hours' 
WHERE id = 'STORY_ID';
```

---

### Problem 2: RLS blokira pristup

**Uzrok:** RLS policies su previše striktne

**Rešenje:**
```sql
-- Proveri policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'model_stories';

-- Trebalo bi da vidiš:
-- "Anyone can view active stories" | SELECT | (is_active = true) AND (expires_at > now())
```

---

### Problem 3: Storage fajl ne može da se učita

**Uzrok:** 
- Bucket nije public
- Nema storage RLS policy
- Pogrešan path

**Rešenje:**
```sql
-- Proveri bucket
SELECT id, name, public FROM storage.buckets WHERE id = 'model-stories';
-- Trebalo bi: public = TRUE

-- Ako nije, postavi:
UPDATE storage.buckets SET public = TRUE WHERE id = 'model-stories';
```

---

### Problem 4: Funkcija nema permissions

**Uzrok:** Funkcija nije kreirana sa `SECURITY DEFINER` ili nema GRANT

**Rešenje:**
```sql
File: supabase-docs/FIX-get-active-stories.sql
```

---

## 📱 QUICK TEST:

Najbrži način da testiraš:

```sql
-- 1. Proveri da li postoje stories
SELECT COUNT(*) FROM model_stories WHERE is_active = TRUE AND expires_at > NOW();

-- 2. Testiraj funkciju direktno
SELECT * FROM get_active_model_stories();

-- 3. Ako vraća podatke → Frontend problem (Console log)
-- 4. Ako ne vraća podatke → Backend problem (SQL)
```

---

## ✅ FINALNI CHECKLIST:

- [ ] Story postoji u `model_stories` tabeli
- [ ] `is_active = TRUE`
- [ ] `expires_at > NOW()`
- [ ] Funkcija `get_active_model_stories()` vraća podatke
- [ ] Storage bucket `model-stories` je PUBLIC
- [ ] Storage RLS policy za čitanje postoji
- [ ] Frontend Console log pokazuje stories
- [ ] Network tab pokazuje uspešan request
- [ ] Slika/video se učitava u browseru

---

**Pošalji mi screenshot Console log-a i Network tab-a i videćemo gde je problem!** 🔍
