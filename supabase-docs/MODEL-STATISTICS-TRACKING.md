# Model Statistics Tracking System

## Overview
Sistem za praćenje korisničkih interakcija sa profilima modela.

## Tracked Actions

### 1. Profile View (`profile_view`)
- **Kada**: Korisnik klikne na karticu modela ili poseti profil
- **Gde**: 
  - ModelCard komponent (klik na karticu)
  - ModelProfileClient (automatski pri učitavanju profila)
- **Debounce**: 1 sekunda (da se izbegne tracking brzog scroll-a)

### 2. Contact View (`contact_view`)
- **Kada**: Korisnik klikne "Show Contact" dugme
- **Gde**: ModelProfileClient - handleShowContact funkcija

### 3. Favorite Add (`favorite_add`)
- **Kada**: Korisnik doda model u favorite
- **Gde**: ModelProfileClient - toggleFavorite funkcija

### 4. Share (`share`)
- **Kada**: Korisnik klikne "Share" dugme
- **Gde**: ModelProfileClient - handleShare funkcija

## Database Schema

### Table: `model_statistics`
```sql
CREATE TABLE model_statistics (
  id uuid PRIMARY KEY,
  model_id uuid NOT NULL,
  user_id uuid (NULL za anonimne),
  action_type text ('profile_view' | 'contact_view' | 'favorite_add' | 'share'),
  user_agent text,
  ip_address inet,
  created_at timestamp
);
```

### View: `model_statistics_summary`
Agregirana statistika za svakog modela:
- `total_profile_views`
- `total_contact_views`
- `total_favorites`
- `total_shares`
- `unique_profile_views`
- `last_profile_view`
- `last_activity`

### View: `model_statistics_daily`
Dnevna statistika (zadnjih 30 dana):
- `date`
- `profile_views`
- `contact_views`
- `favorites`
- `shares`
- `unique_visitors`

## Files Modified/Created

### Created:
1. **supabase-docs/CREATE-TABLE-model_statistics.sql** - SQL za kreiranje tabele i view-ova
2. **src/lib/tracking.ts** - Helper funkcije za tracking

### Modified:
1. **src/components/home/ModelCard.tsx** - Dodat tracking za profile_view
2. **src/app/models/[id]/ModelProfileClient.tsx** - Dodat tracking za sve akcije
3. **src/app/dashboard/model/statistics/page.tsx** - Kompletan redizajn za nove statistike

## Usage

### Tracking akcije:
```typescript
import { trackModelAction, trackProfileView } from '@/lib/tracking'

// Profile view (sa debounce-om)
trackProfileView(modelId)

// Ostale akcije (instant)
trackModelAction(modelId, 'contact_view')
trackModelAction(modelId, 'favorite_add')
trackModelAction(modelId, 'share')
```

### Čitanje statistike:
```typescript
// Summary statistika
const { data } = await supabase
  .from('model_statistics_summary')
  .select('*')
  .eq('model_id', modelId)
  .single()

// Dnevna statistika
const { data } = await supabase
  .from('model_statistics_daily')
  .select('*')
  .eq('model_id', modelId)
  .gte('date', '2026-01-01')
  .order('date', { ascending: false })
```

## Setup Instructions

1. Pokreni SQL skriptu:
   ```bash
   # U Supabase SQL Editor
   supabase-docs/CREATE-TABLE-model_statistics.sql
   ```

2. RLS je već konfigurisan:
   - Svi mogu da INSERT (tracking)
   - Modeli vide samo svoje statistike
   - Admini vide sve

3. Deploy izmene:
   ```bash
   # Push code na GitHub
   git add .
   git commit -m "Add model statistics tracking system"
   git push
   ```

## Statistics Dashboard

Dashboard je dostupan na: `/dashboard/model/statistics`

### Prikazuje:
- **Profile Performance**: Ukupni brojevi
  - Total Profile Views
  - Unique Visitors
  - Contact Views
  - Favorites
  
- **Engagement**: Share i Active Ads

- **Period Statistics**: Filtrirani po vremenu (7 dana / mesec / godina)
  - Views
  - Contact Views
  - Favorites
  - Shares

- **Recent Daily Activity**: Tabela sa detaljima za poslednjih 10 dana

## Notes

- Tracking je "silent fail" - greške se ne prikazuju korisniku
- Anonimni korisnici (`user_id = null`) se takođe trackuju
- `user_agent` se automatski snima za analizu
- Debounce na profile_view sprečava spam tracking
