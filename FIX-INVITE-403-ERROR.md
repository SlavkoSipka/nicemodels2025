# 🚨 FIX: 403 Forbidden Error When Sending Invite

## Problem

Kada pokušaš da pošalješ invite modelu, dobijaš:
```
406 (Not Acceptable) - when checking existing invites
403 (Forbidden) - when creating new invite
```

## Root Cause

**RLS (Row Level Security)** politike za `club_invites` i `notifications` tabele nisu primenjene.

Klubovi nemaju dozvolu da:
- ❌ SELECT iz `club_invites` (da provere postojeće invite-ove)
- ❌ INSERT u `club_invites` (da pošalju nove invite-ove)

---

## ✅ Solution (1 minut)

### Run Updated SQL Fix:

1. **Otvori** `supabase-docs/FIX-RLS-INVITE-SYSTEM.sql`
2. **Kopiraj SVE** (ažuriran sa novim politikama)
3. **Paste** u Supabase SQL Editor
4. **Klikni RUN**
5. **Refresh** invite page
6. **Pošalji invite** → Trebalo bi da radi! ✅

---

## 📋 Šta je dodato u SQL fix?

### 1. **club_invites Policies:**
```sql
✅ "Clubs can view own invites" - Klubovi vide svoje invite-ove
✅ "Clubs can create invites" - Klubovi mogu da šalju invite-ove
✅ "Clubs can cancel invites" - Klubovi mogu da otkazuju invite-ove
✅ "Models can view their invites" - Modeli vide svoje invite-ove
✅ "Models can respond to invites" - Modeli mogu accept/reject
```

### 2. **notifications Policies:**
```sql
✅ "Users can view own notifications" - Vide svoje notifikacije
✅ "Users can update own notifications" - Mark as read
✅ "Users can delete own notifications" - Delete notifikacije
```

---

## 🧪 Testing After Fix:

1. **Otvori invite page** (`/dashboard/company/models/invite`)
2. **Izaberi model**
3. **Dodaj personal message** (optional)
4. **Klikni "Send Invitation"**
5. **Trebalo bi:**
   - ✅ Nema errora u console-u
   - ✅ Vidiš "Invitation sent successfully!"
   - ✅ Redirect na `/dashboard/company/models`

6. **Proveri kao model:**
   - Login kao model
   - Trebalo bi da vidiš notification u bell-u
   - Trebalo bi da vidiš invite alert na dashboard-u

---

## 📊 Expected Console Logs (After Fix):

**Pre (ERROR):**
```
❌ 406 (Not Acceptable)
❌ 403 (Forbidden)
```

**Posle (SUCCESS):**
```
✅ POST /club_invites 201 (Created)
✅ Invitation sent successfully!
```

---

## 🔐 Security Check:

Sve politike su **sigurne**:
- ✅ Klubovi vide **samo svoje** invite-ove
- ✅ Modeli vide **samo invite-ove poslate njima**
- ✅ Niko ne može da menja tuđe podatke
- ✅ Svi mogu samo da odgovore na svoje invite-ove

---

## ⚠️ If Still Not Working:

### 1. Check Console:
- Otvori F12 → Console
- Vidi tačan error
- Screenshot i pošalji

### 2. Verify SQL was applied:
```sql
-- Run this in Supabase SQL Editor:
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies 
WHERE tablename IN ('club_invites', 'notifications')
ORDER BY tablename, policyname;
```

Trebalo bi da vidiš **9 policies** ukupno:
- 5 za `club_invites`
- 3 za `notifications`
- 1 za `profiles` (opciono)

### 3. Verify RLS is enabled:
```sql
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls
FROM pg_tables 
WHERE tablename IN ('club_invites', 'notifications', 'profiles', 'model_details');
```

Sve tabele trebaju imati **✅ Enabled**.

---

## 🎯 Quick Checklist:

- [ ] Run `FIX-RLS-INVITE-SYSTEM.sql` (updated version)
- [ ] Refresh invite page
- [ ] Try sending invite
- [ ] No 403 error? ✅
- [ ] Sees "Invitation sent successfully!"? ✅
- [ ] Model receives notification? ✅

---

**After running the SQL fix, invite system should work perfectly!** 🎉
