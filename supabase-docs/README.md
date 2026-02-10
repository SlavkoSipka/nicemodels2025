# 📊 Supabase Database Documentation

**Ovaj folder sadrži lokalnu kopiju Supabase baze podataka za praćenje strukture.**

---

## 📁 Glavni Fajlovi

### 1. `DATABASE-STRUCTURE.md` ⭐
**Glavni fajl za brzi uvid u strukturu baze.**

Sadrži:
- Najvažnije tabele i njihove kolone
- Kritične greške koje se često prave (npr. `role` umesto `user_role`)
- Storage buckets
- Enums
- RLS policies
- Funkcije

👉 **Uvek prvo pogledaj ovaj fajl!**

---

### 2. `FULL-DATABASE-EXPORT.json` 📦
**Kompletan JSON export baze podataka.**

Sadrži SVE:
- Sve tabele i kolone (detaljno)
- Primary keys
- Foreign keys
- Indexes
- RLS policies
- Storage buckets
- Enums
- Triggers

---

### 3. `EXPORT-QUERIES.sql` 🔄
**SQL upiti za ponovno eksportovanje strukture baze.**

Koristi kada trebaš da ažuriraš lokalnu kopiju:
1. Otvori Supabase SQL Editor
2. Izvrši query-je 1-10 redom
3. Kopiraj rezultate u `FULL-DATABASE-EXPORT.json`
4. Ažuriraj `DATABASE-STRUCTURE.md` sa novim promenama

---

### 4. `CREATE-FUNCTION-models_with_active_ads.sql`
**SQL funkcija koja vraća modele sa aktivnim oglasima.**

Ova funkcija se koristi na home page-u:
- `SECURITY DEFINER` → zaobilazi RLS
- Vraća sve modele koji imaju aktivne plaćene oglase

---

### 5. `CHANGELOG.md` 📝
**Istorija svih promena u bazi.**

- Datum svake promene
- Šta je dodato/popravljeno
- Breaking changes
- Dokumentacija

---

## 🎯 Kako Koristiti?

### Za AI Agente:
1. Čitaj `DATABASE-STRUCTURE.md` za brzi uvid
2. Koristi `FULL-DATABASE-EXPORT.json` za detaljne informacije
3. Uvek proveri kolone pre pisanja koda

### Za Developere:
1. Nakon promene u bazi → izvrši `EXPORT-QUERIES.sql`
2. Ažuriraj `FULL-DATABASE-EXPORT.json`
3. Ažuriraj `DATABASE-STRUCTURE.md` sa ključnim promenama

---

## ⚠️ Česte Greške

1. **`profiles.role` NE `profiles.user_role`**
2. **`club_photos.uploaded_at` NE `club_photos.created_at`**
3. **`orders.payment_method` mora biti: `card`, `twint`, ili `phone`**
4. **`club_working_hours` svaki dan je poseban red u tabeli**

---

## 📚 Dodatni Fajlovi

- `INVITE-SYSTEM-GUIDE.md` → Dokumentacija invite sistema
- `INVITE-SYSTEM-IMPLEMENTATION.md` → Implementacija invite sistema
- `INVITE-SYSTEM-SQL-COMPLETE.sql` → SQL za invite sistem

---

**Poslednji export:** 2026-02-09
