# 📊 Supabase Database Documentation

Ovaj folder sadrži kompletan snapshot Supabase baze podataka za lakše praćenje strukture i debug.

## 🔄 Kako eksportovati strukturu baze?

### Korak 1: Otvori Supabase SQL Editor
1. Idi na https://supabase.com/dashboard
2. Selektuj svoj projekat
3. Klikni na **SQL Editor** u levom meniju

### Korak 2: Izvršavaj upite jedan po jedan
Otvori **EXPORT-QUERIES.sql** i izvršavaj svaki query redom:

1. **Query #1** → Kopiraj rezultat u `01-tables-columns.txt`
2. **Query #2** → Kopiraj rezultat u `02-primary-keys.txt`
3. **Query #3** → Kopiraj rezultat u `03-foreign-keys.txt`
4. **Query #4** → Kopiraj rezultat u `04-indexes.txt`
5. **Query #5** → Kopiraj rezultat u `05-rls-policies.txt`
6. **Query #6** → Kopiraj rezultat u `06-create-statements.txt`
7. **Query #7** → Kopiraj rezultat u `07-storage-buckets.txt`
8. **Query #8** → Kopiraj rezultat u `08-functions-triggers.txt`
9. **Query #9** → Kopiraj rezultat u `09-enums.txt`
10. **Query #10** → Kopiraj rezultat u `10-table-counts.txt`

### Korak 3: Formatiranje rezultata

**Opcija A - JSON format (najbolje):**
- U SQL Editor, nakon izvršavanja query-ja
- Klikni **"Results"** tab
- Klikni na **"..."** (tri tačke)
- Selektuj **"Copy as JSON"**
- Nalepi u odgovarajući `.txt` fajl

**Opcija B - CSV format:**
- U SQL Editor
- Klikni **"Download CSV"**
- Preimenuj i stavi u ovaj folder

**Opcija C - Text format:**
- Samo selektuj sve rezultate
- Copy/Paste u `.txt` fajl

## 📁 Struktura fajlova

```
supabase-docs/
├── README.md (ovaj fajl)
├── EXPORT-QUERIES.sql (svi SQL upiti)
├── 01-tables-columns.txt (sve tabele i kolone)
├── 02-primary-keys.txt (primary keys)
├── 03-foreign-keys.txt (veze između tabela)
├── 04-indexes.txt (indexi)
├── 05-rls-policies.txt (security policies)
├── 06-create-statements.txt (CREATE TABLE naredbe)
├── 07-storage-buckets.txt (storage buckets)
├── 08-functions-triggers.txt (funkcije i triggeri)
├── 09-enums.txt (enum tipovi)
└── 10-table-counts.txt (broj zapisa po tabeli)
```

## 🔍 Brza provera (za debugiranje)

Ako imaš problem sa konkretnom tabelom (npr. `club_photos`), izvršiti:

```sql
-- Proveri da li tabela postoji:
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'club_photos'
);

-- Proveri kolone:
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'club_photos'
ORDER BY ordinal_position;

-- Proveri sample data:
SELECT * FROM club_photos LIMIT 3;
```

## ⚠️ Važno!

- **NE commituj** sensitive podatke (email-ove, lozinke, API keys)
- Ovi fajlovi su već u `.gitignore` (osim README i EXPORT-QUERIES.sql)
- Refresh-uj strukturu nakon svake veće promene u bazi
- Datum poslednjeg updatea: **[DODAJ DATUM OVDE]**

## 🐛 Debug problemi

Trenutni problem koji rešavamo:
- ❌ `club_photos` tabela - greška pri učitavanju
- Verovatno: kolona `created_at` ne postoji ili se drugačije zove
- Check: Query #1 će nam pokazati tačne nazive kolona

---

**Poslednji export:** _[Dodaj datum kada eksportuješ]_
