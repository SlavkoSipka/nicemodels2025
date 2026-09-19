# 📝 Database Changelog

Sve promene u Supabase bazi podataka.

---

## 2026-09-19

### ✅ Dodato

**Nova placement vrednost: `sidebar_right`**
- Drugi (desni) plaćeni baner-bar pored feeda, uz postojeći `sidebar_left`
- `banners_placement_check` proširen na `('feed_wide','feed_card','sidebar_left','sidebar_right')`
- `banner_region_pricing_placement_check` proširen isto tako
- Seedovano 3 trajanja × 4 regiona za `sidebar_right`, cene 19 / 29 / 39 CHF (5 / 14 / 30 dana) — iste kao leva kolona
- Fajl: `ALTER-banners-add-sidebar-right-placement.sql`

### ⚠️ Breaking Changes

- Nema. Migracija samo širi CHECK constraint i dodaje redove u pricing tabelu; postojeći baneri ostaju netaknuti.

---

## 2026-02-09

### ✅ Dodato

**Funkcija: `models_with_active_ads()`**
- Vraća sve modele koji imaju aktivne plaćene oglase
- SECURITY DEFINER (zaobilazi RLS)
- Koristi se na home page-u
- Fajl: `CREATE-FUNCTION-models_with_active_ads.sql`

### 🔧 Popravljeno

**`profiles.role` casting:**
- Problem: `role` je enum tip, funkcija vraća `text`
- Rešenje: `p.role::text` u SELECT statement-u
- Error bio: "structure of query does not match function result type"

**`orders.payment_method` constraint:**
- Problem: Nije bilo dozvoljeno bilo šta sem 'card', 'twint', 'phone'
- CHECK constraint: `payment_method IN ('card', 'twint', 'phone')`
- Za beta free aktivacije koristimo: `payment_method = 'card'`

### 📋 Dokumentovano

- Kreiran `FULL-DATABASE-EXPORT.json` - kompletan export strukture
- Kreiran `DATABASE-STRUCTURE.md` - brzi pregled strukture
- Ažuriran `README.md` sa uputstvima

---

## Kako dodati novi changelog entry:

```markdown
## YYYY-MM-DD

### ✅ Dodato
- Nova tabela/funkcija/policy

### 🔧 Popravljeno
- Bug fix ili izmena

### ⚠️ Breaking Changes
- Promene koje mogu pokvariti postojeći kod

### 📋 Dokumentovano
- Nove dokumentacije ili ažuriranja
```
