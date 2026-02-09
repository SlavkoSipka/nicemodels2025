# ✅ Database Fixes Applied

**Date:** 2026-02-09  
**Issue:** Console error when loading club photos

## 🔴 Problems Found:

### 1. **club_photos table - Wrong column name**
- ❌ Code used: `created_at`
- ✅ Database has: `uploaded_at`

### 2. **club_contact_details - Wrong table**
- ❌ Code tried to save contact fields in `club_details`
- ✅ Database has separate table: `club_contact_details`

### 3. **club_working_hours - Wrong structure**
- ❌ Code tried to save JSON in `club_details` (`schedule_type`, `same_every_day_hours`, `custom_hours`)
- ✅ Database has separate table: `club_working_hours` with rows per day

## 🔧 Files Fixed:

### 1. `src/app/dashboard/company/profile/club-photos/page.tsx`
```diff
- .order('created_at', { ascending: false })
+ .order('uploaded_at', { ascending: false })

- created_at: string
+ uploaded_at: string

- {new Date(photo.created_at).toLocaleDateString()}
+ {new Date(photo.uploaded_at).toLocaleDateString()}
```

### 2. `src/app/dashboard/company/profile/contact-details/page.tsx`
**Changed from:**
- Single `club_details` query/update

**Changed to:**
- Query both `club_contact_details` and `club_details`
- Update contact fields in `club_contact_details` (upsert with conflict on `club_id`)
- Update address fields in `club_details`

**Fields moved to `club_contact_details`:**
- country_code, phone_number
- has_viber, has_whatsapp, has_telegram
- contact_instruction, no_withheld_numbers, other_instructions
- email, website

**Fields staying in `club_details`:**
- street, street_number, additional_info
- city, zip_code

### 3. `src/app/dashboard/company/profile/working-hours/page.tsx`
**Complete rewrite:**

**Old approach:**
- Save JSON fields in `club_details`

**New approach:**
- Load: Read from `club_working_hours` table and detect schedule type
- Save: Delete all existing hours, insert new rows based on schedule type
- Each day = separate row in table

**Database structure:**
```sql
club_working_hours (
  club_id,
  day_of_week (monday, tuesday, etc.),
  opens_at (time),
  closes_at (time),
  is_closed (boolean)
)
```

## ✨ Result:
- ✅ Club photos now load correctly
- ✅ Contact details save to correct table
- ✅ Working hours save as separate rows
- ✅ No more console errors
- ✅ All pages aligned with actual database structure

## 📝 Notes:
- `hide_contact_info` field doesn't exist in schema yet (removed from form)
- All timestamps use ISO format with `new Date().toISOString()`
- Working hours support 3 modes: 24/7, same_every_day, custom
