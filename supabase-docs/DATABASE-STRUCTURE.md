# 📊 Supabase Database Structure

**Exported:** 2026-02-09  
**Database URL:** `https://ykzqjwqomaeuppubofid.supabase.co`

## ⚠️ KRITIČNE KOLONE (česte greške)

### `profiles` tabela
```
- role (NOT user_role!) ← ENUM: 'user', 'model', 'company', 'admin'
- profile_status ← ENUM: 'pending', 'active', 'inactive', 'suspended'
- email, username, phone, created_at, updated_at
- onboarding_completed, is_verified, is_blocked
- city (za user profile), description (za user bio - max 500 chars)
```

### `orders` tabela
```
- id, user_id (FK → profiles.id), total_amount, status, payment_method, created_at
- payment_method MORA biti: 'card', 'twint', ili 'phone'
- status: 'pending', 'paid', 'cancelled'
```

### `order_items` tabela
```
- id, order_id (FK → orders.id), product_id (FK → products.id)
- price_chf, activation_type, activation_date
- banner_file_path, advertising_text, contact_phone, contact_email, contact_website
- created_at
```

### `products` tabela
```
- id, product_type, name, description, price_chf
- duration_days, duration_hours, discount_percent
- banner_type, is_active, display_order, created_at
- product_type: 'ad_package', 'banner_package'
```

### `club_photos` tabela
```
- id, club_id (FK → profiles.id), file_path, file_name
- is_verified, uploaded_at (NOT created_at!), is_approved
```

### `club_details` tabela
```
- id, club_id (FK → profiles.id), club_name, display_name, area
- about_description, is_club, entrance_fee, wellness, food_and_drinks
- outdoor_area, city, zip_code, street, street_number, country
- additional_info, created_at, updated_at
```

### `club_contact_details` tabela
```
- id, club_id (FK → profiles.id), show_phone_number, country_code, phone_number
- has_viber, has_whatsapp, has_telegram, email, website
- contact_instruction, no_withheld_numbers, other_instructions
- created_at, updated_at
```

### `club_working_hours` tabela
```
- id, club_id (FK → profiles.id), day_of_week
- opens_at (time), closes_at (time), is_closed
- created_at, updated_at
⚠️ Svaki dan je POSEBAN RED u tabeli!
```

## 📦 Storage Buckets

```
banner-images         → public, no limit
club-photos           → public, no limit
model-photos          → public, 10MB limit
model-videos          → public, 50MB limit
verification-documents → PRIVATE, no limit
```

## 🔗 Važne Relacije

```
profiles.id → orders.user_id
profiles.id → order_items (preko orders)
profiles.id → club_details.club_id
profiles.id → club_contact_details.club_id
profiles.id → club_photos.club_id
profiles.id → club_working_hours.club_id
profiles.id → model_details.model_id
profiles.id → model_photos.model_id

orders.id → order_items.order_id
products.id → order_items.product_id
```

## 🎯 Enums (User-Defined Types)

### app_role
- user, model, company, admin

### profile_status
- pending, active, inactive, suspended

### gender_type
- female, male, trans

### ethnicity_type
- asian, black, caucasian_white, latin, mixed, indian, arab, caucasian

### hair_color_type
- blond, light_brown, brunette, black, red, other

### eye_color_type
- black, brown, green, blue, gray

### payment_method (CHECK constraint)
- card, twint, phone

## 🔒 RLS Policies - Najvažnije

### profiles
- `allow_view_models`: Svi mogu videti profile sa role='model'
- `allow_view_self`: Korisnik može videti svoj profil
- `allow_update_self`: Korisnik može ažurirati svoj profil

### orders
- `Users can view own orders`: Korisnik vidi samo svoje narudžbine
- `Users can create own orders`: Korisnik može kreirati svoje narudžbine
- `Anyone can view paid orders user_id`: Svi mogu videti user_id plaćenih narudžbina (za ads)

### order_items
- `Users can view own order items`: Korisnik vidi svoje stavke
- `Users can create own order items`: Korisnik kreira svoje stavke

### products
- `Anyone can view active products`: Svi vide aktivne proizvode

### model_photos
- `Public can view approved photos`: Svi vide odobrene fotografije
- `Users can view their own photos`: Korisnik vidi svoje fotografije

### club_photos
- `allow_view_club_photos`: Svi mogu videti fotografije klubova

### favorites
- `Users can view own favorites`: Korisnik vidi svoje favorite
- `Users can add favorites`: Korisnik može dodati favorite
- `Users can remove favorites`: Korisnik može ukloniti favorite
- `Models can view their favorites count`: Model vidi ko ga je favoritovao (za statistike)

### model_comments
- `Users can view own comments`: Korisnik vidi svoje komentare
- `Users can create comments`: Korisnik može kreirati komentare (status = 'pending')
- `Users can update own pending comments`: Korisnik može ažurirati svoje pending komentare
- `Users can delete own pending comments`: Korisnik može obrisati svoje pending komentare
- `Public can view approved comments`: Svi vide odobrene komentare
- `Admins can view all comments`: Admin vidi sve komentare
- `Admins can update comments`: Admin može odobravati/odbijati komentare
- `Admins can delete comments`: Admin može brisati komentare

## 📝 Funkcije u Bazi

### `models_with_active_ads()`
```sql
RETURNS TABLE (id uuid, username text, email text, role text, created_at timestamptz)
SECURITY DEFINER
```
- Vraća sve modele koji imaju aktivne plaćene oglase
- SECURITY DEFINER (zaobilazi RLS za anonymous users)
- Koristi se na home page-u za prikaz modela
- Logika: JOIN profiles → orders → order_items → products
- Filter: role='model' AND status='paid' AND product_type='ad_package'
- **VAŽNO:** `role::text` cast jer je role enum tip
- Fajl: `supabase-docs/CREATE-FUNCTION-models_with_active_ads.sql`

### `favorites` tabela
```
- id, user_id (FK → profiles.id), model_id (FK → profiles.id)
- created_at
- UNIQUE(user_id, model_id) - user može samo jednom da favorituje model
```

### `model_comments` tabela
```
- id, user_id (FK → profiles.id), model_id (FK → profiles.id)
- comment_text, rating (1-5), status ('pending', 'approved', 'rejected')
- admin_notes, reviewed_by (FK → profiles.id), reviewed_at
- created_at, updated_at
- UNIQUE(user_id, model_id) - user može samo jedan komentar po modelu
```

## 🗂️ Kompletan Export

Za kompletan JSON export svih tabela, kolona, foreign keys, indexes, itd:
→ `supabase-docs/FULL-DATABASE-EXPORT.json`

## 📚 Kako Ažurirati Lokalnu Strukturu?

### Kada praviš promene u bazi:

1. **Izvršiš SQL u Supabase SQL Editor**
   - Kreiraj tabelu, funkciju, policy, itd.

2. **Ažuriraj lokalne fajlove:**
   
   a) **Za funkcije:**
   - Sačuvaj SQL u `supabase-docs/CREATE-FUNCTION-<ime>.sql`
   - Dodaj u `FULL-DATABASE-EXPORT.json` → `functions` array
   - Dodaj opis u `DATABASE-STRUCTURE.md` → sekcija "Funkcije u Bazi"
   
   b) **Za tabele/kolone:**
   - Izvrši `EXPORT-QUERIES.sql` (Query #1)
   - Ažuriraj `FULL-DATABASE-EXPORT.json` → `tables_and_columns`
   - Ažuriraj `DATABASE-STRUCTURE.md` ako je važna tabela
   
   c) **Za RLS policies:**
   - Izvrši `EXPORT-QUERIES.sql` (Query #5)
   - Ažuriraj `FULL-DATABASE-EXPORT.json` (dodaj policy sekciju ako treba)
   - Dokumentuj u `DATABASE-STRUCTURE.md` → sekcija "RLS Policies"

3. **Dodaj u changelog:**
   - U `FULL-DATABASE-EXPORT.json` → `changelog` array
   - Datum i opis promene

### Kompletno ponovno eksportovanje:

1. Otvori Supabase SQL Editor
2. Izvršiti query-je iz `EXPORT-QUERIES.sql` (1-10)
3. Zameni sadržaj u `FULL-DATABASE-EXPORT.json`
4. Ažuriraj `DATABASE-STRUCTURE.md` sa ključnim promenama
