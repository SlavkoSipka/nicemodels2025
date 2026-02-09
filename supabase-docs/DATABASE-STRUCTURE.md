# 📊 Database Structure Summary

**Last Updated:** 2026-02-09

## 🔑 Key Tables for Company Dashboard

### `club_photos`
```
- id: uuid (PK)
- club_id: uuid (FK → profiles.id)
- file_path: text
- file_name: text
- is_verified: boolean (default: false)
- uploaded_at: timestamp ⚠️ NOT created_at!
- is_approved: boolean (default: false)
```

### `club_details`
```
- id: uuid (PK)
- club_id: uuid (FK → profiles.id, UNIQUE)
- club_name: text (required)
- display_name: text
- area: text
- about_description: text
- is_club: boolean (default: true)
- entrance_fee: enum (na/free/with_cost)
- wellness: enum (na/yes/no)
- food_and_drinks: enum (na/yes/no)
- outdoor_area: enum (na/yes/no)
- city: text
- zip_code: text
- street: text
- street_number: text
- additional_info: text
- created_at: timestamp
- updated_at: timestamp
```

⚠️ **IMPORTANT:** `club_details` does NOT contain:
- contact fields (phone, email, etc.) → in `club_contact_details`
- working hours → in `club_working_hours` table

### `club_contact_details`
```
- id: uuid (PK)
- club_id: uuid (FK → profiles.id, UNIQUE)
- country_code: varchar(10) (default: '+41')
- phone_number: varchar(20)
- has_viber: boolean (default: false)
- has_whatsapp: boolean (default: false)
- has_telegram: boolean (default: false)
- contact_instruction: text
- no_withheld_numbers: boolean (default: false)
- other_instructions: text
- email: varchar(255)
- website: text
- created_at: timestamp
- updated_at: timestamp
```

### `club_working_hours`
```
- id: uuid (PK)
- club_id: uuid (FK → profiles.id)
- day_of_week: text (monday, tuesday, etc.)
- opens_at: time
- closes_at: time
- is_closed: boolean (default: false)
- created_at: timestamp
- updated_at: timestamp
```

⚠️ **IMPORTANT:** Working hours are stored as **separate rows per day**, not JSON!

## 🔄 Storage Buckets
```
- club-photos (public)
- club-videos (public) - has is_approved field
- model-photos (public, 10MB limit)
- model-videos (public, 50MB limit)
- verification-documents (private)
- banner-images (public)
```

## 📝 Common Mistakes to Avoid

1. **Photo timestamps:**
   - ✅ Use `uploaded_at` 
   - ❌ NOT `created_at`

2. **Contact details:**
   - ✅ Query `club_contact_details` table
   - ❌ NOT in `club_details`

3. **Working hours:**
   - ✅ Separate table with rows per day
   - ❌ NOT JSON in `club_details`

4. **club_details structure:**
   - ✅ Has `schedule_type`, `same_every_day_hours`, `custom_hours` fields
   - ⚠️ Need to check if these exist or if working hours are only in separate table

## 🎯 TODO: Verify Working Hours Structure

Need to check if `club_details` has:
- `schedule_type` (24_7, same_every_day, custom)?
- `same_every_day_hours` (JSON)?
- `custom_hours` (JSON)?

Or if all working hours are ONLY in `club_working_hours` table.
