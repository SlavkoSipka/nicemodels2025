# 🚨 QUICK FIX: Invite System Issues

## ✅ FIXED: Schema Issues
**Updated:** 2026-02-09

Popravio sam sledeće probleme:
- ❌ `column profiles.full_name does not exist` → Uklonjeno iz koda
- ❌ `column profiles.avatar_url does not exist` → Uklonjeno iz koda
- ✅ Sada prikazuje inicijale korisnika umesto avatara

## 🆕 NEW ISSUE: 403 Forbidden When Sending Invite

Ako dobijaš error:
```
403 (Forbidden) when sending invite
406 (Not Acceptable) when checking invites
```

**➡️ See:** `FIX-INVITE-403-ERROR.md` za kompletno rešenje!

**Quick Fix:** Run `supabase-docs/FIX-RLS-INVITE-SYSTEM.sql` (updated!)

---

## Problem 1: Ne vidiš modele
Ne vidiš modele na `/dashboard/company/models/invite` stranici.

## Rešenje (2 minuta)

### Korak 1: Otvori Console
1. Pritisni **F12** u browser-u
2. Idi na **Console** tab
3. **Refresh** stranu
4. Vidi šta piše u console-u

### Korak 2: Run SQL Fix
1. Idi na **Supabase Dashboard**
2. Klikni **SQL Editor**
3. Kopiraj **SVE** iz fajla: `supabase-docs/FIX-RLS-INVITE-SYSTEM.sql`
4. Paste u SQL editor
5. Klikni **RUN**

### Korak 3: Refresh
1. Vrati se na invite page
2. **Refresh** (Ctrl+R ili F5)
3. Sad bi trebalo da vidiš modele! ✅

---

## Šta sam dodao u kod?

Dodao sam **console.log** poruke koje će ti pokazati:
- `Profiles query result:` - šta vraća query za profile
- `Found X models` - koliko modela je pronađeno
- `Model details query result:` - detalji modela
- `Enriched results:` - finalni rezultat

Ako vidiš **error** u console-u, pošalji mi screenshot!

---

## Ako i dalje ne radi...

Ako posle SQL fix-a i dalje vidiš `All Models (0)`:

1. **Proveri** da li **ima modela** u bazi:
   ```sql
   SELECT COUNT(*) FROM profiles WHERE role = 'model';
   ```

2. **Proveri RLS** politike:
   ```sql
   -- Fajl: supabase-docs/CHECK-RLS-PROFILES.sql
   ```

3. **Pošalji mi**:
   - Screenshot console-a
   - Screenshot SQL rezultata

---

## Zašto se ovo desilo?

**Row Level Security (RLS)** blokira pristup. 

Klubovi treba da mogu da **vide** profile modela (jer su javni), ali RLS politika to sprečava.

SQL fix dodaje politiku:
```sql
"Public can view model profiles" - Svako može da vidi profile modela
"Public can view model details" - Svako može da vidi detalje
```

---

## ✅ Nakon fix-a bi trebalo da vidiš:

```
All Models (15)  <-- broj modela

[Lista modela sa:]
- Avatar ili inicijal
- Showname ili username
- @username
- Age i grad (ako ima)
- Verified badge (ako je verified)
- "Select" button
```

---

**Brzo rešenje:** 
1. F12 → Console → Proveri error
2. Supabase → SQL Editor → Run `FIX-RLS-INVITE-SYSTEM.sql`
3. Refresh → Trebalo bi da radi!

🎉
