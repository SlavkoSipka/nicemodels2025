# 🔒 RLS Fix Required for Invite System

**Issue:** Clubs cannot see any models on the invite page (shows "All Models (0)")

**Root Cause:** Row Level Security (RLS) policies on `profiles` and `model_details` tables are likely blocking access.

---

## 🔍 Diagnosis

1. **Open browser console** on the invite page
2. **Check for errors** in console logs (I added detailed logging)
3. **Run diagnosis SQL** in Supabase SQL Editor:

```sql
-- File: supabase-docs/CHECK-RLS-PROFILES.sql
-- This will show current RLS policies
```

---

## ✅ Solution

**Run this SQL script** in Supabase SQL Editor:

```sql
-- File: supabase-docs/FIX-RLS-INVITE-SYSTEM.sql
```

This script will:
- ✅ Allow anyone to view model profiles (public data)
- ✅ Allow anyone to view model details (showname, city, age, etc.)
- ✅ Preserve security: users can only edit their own data

---

## 🧪 How to Test

### Step 1: Check Console
1. Open invite page: `/dashboard/company/models/invite`
2. Open browser console (F12)
3. Look for logs:
   - `Profiles query result:` - should show models array
   - `Found X models` - should show count > 0
   - `Model details query result:` - should show details
   - `Enriched results:` - should show final array

### Step 2: Check Errors
If you see errors like:
- `"permission denied for table profiles"` → RLS is blocking
- `"column ... does not exist"` → Schema mismatch (already fixed)
- Empty array but no error → No models exist OR RLS is blocking silently

### Step 3: Run SQL Fix
1. Go to Supabase Dashboard
2. SQL Editor
3. Copy contents from `supabase-docs/FIX-RLS-INVITE-SYSTEM.sql`
4. Execute
5. Refresh invite page

---

## 📊 Expected Result After Fix

**Before:**
```
All Models (0)
No models available
```

**After:**
```
All Models (15)
[List of all models with avatars, usernames, etc.]
```

---

## 🔐 Security Notes

The fix is **safe** because:
- ✅ Model profiles are **public data** (usernames, shownames, cities)
- ✅ Private data (email, phone, etc.) is NOT exposed
- ✅ Users can only edit their **own** data
- ✅ Club invites use proper RLS (already implemented)

Model profiles **should be public** because:
- Users browse models on the website anyway
- Clubs need to see models to invite them
- Only basic info is visible (no contact details)

---

## 🐛 Alternative: Disable RLS (NOT RECOMMENDED)

If you want to temporarily test without proper policies:

```sql
-- TEMPORARY FIX (NOT FOR PRODUCTION!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE model_details DISABLE ROW LEVEL SECURITY;
```

⚠️ **WARNING:** This disables ALL security! Only use for testing!

---

## 📝 Files Created

- `supabase-docs/CHECK-RLS-PROFILES.sql` - Diagnosis queries
- `supabase-docs/FIX-RLS-INVITE-SYSTEM.sql` - Fix queries
- `RLS-FIX-NEEDED.md` - This file

---

## ✅ Checklist

- [ ] Run `CHECK-RLS-PROFILES.sql` to diagnose
- [ ] Check browser console for detailed logs
- [ ] Run `FIX-RLS-INVITE-SYSTEM.sql` to fix
- [ ] Refresh invite page
- [ ] Verify models are visible
- [ ] Test search functionality
- [ ] Test sending an invite

---

## 💡 Next Steps After Fix

Once models are visible:
1. Test search (should filter instantly)
2. Select a model
3. Add personal message
4. Send invite
5. Check model receives notification

---

**Need Help?** 
Check console logs first - they now have detailed debugging info!
