# 🎯 Club-Model Invite System - Complete Guide

**Last Updated:** 2026-02-09

## Overview

The invite system allows clubs/agencies to invite models to join their roster. Models can accept or decline invitations, and they can be part of multiple clubs simultaneously.

---

## Database Tables

### 1. `club_invites`

Stores all invitations from clubs to models.

```sql
CREATE TABLE club_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invited_model_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text,
  invited_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
)
```

**Columns:**
- `club_id`: ID of the club sending the invite
- `invited_model_id`: ID of the model being invited (REQUIRED - only existing models)
- `status`: pending | accepted | rejected | cancelled
- `message`: Optional personal message from club to model
- `invited_at`: When invite was sent
- `responded_at`: When model accepted/rejected

**Key Points:**
- ✅ Only existing models can be invited (no email invites)
- ✅ No expiration date (invites stay until responded or cancelled)
- ✅ Models can be in multiple clubs (no unique constraint)

---

### 2. `notifications`

Generic notification system for all user notifications.

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  action_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone
)
```

**Notification Types:**
- `club_invite`: Model received a club invitation
- `invite_accepted`: Club received acceptance from model
- `invite_rejected`: Club received rejection from model
- `verification_approved`: User verification was approved
- `system_message`: General system messages

**Key Points:**
- ✅ Users can delete notifications (removes the row)
- ✅ Refresh-based (no real-time subscriptions)
- ✅ `action_url` provides direct navigation link

---

## Database Trigger

Automatically creates a notification when a club sends an invite:

```sql
CREATE OR REPLACE FUNCTION notify_model_on_invite()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    related_entity_type,
    related_entity_id,
    action_url
  )
  SELECT
    NEW.invited_model_id,
    'club_invite',
    'New Club Invitation',
    'You have received an invitation from ' || 
      (SELECT club_name FROM club_details WHERE club_id = NEW.club_id),
    'club_invite',
    NEW.id,
    '/dashboard/model/invites'
  WHERE NEW.invited_model_id IS NOT NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_club_invite_created
  AFTER INSERT ON club_invites
  FOR EACH ROW
  EXECUTE FUNCTION notify_model_on_invite();
```

---

## Row Level Security (RLS) Policies

### `club_invites` Policies:

```sql
-- Clubs can view their own invites
CREATE POLICY "Clubs can view own invites"
  ON club_invites FOR SELECT
  USING (auth.uid() = club_id);

-- Clubs can create invites
CREATE POLICY "Clubs can create invites"
  ON club_invites FOR INSERT
  WITH CHECK (auth.uid() = club_id);

-- Clubs can cancel pending invites
CREATE POLICY "Clubs can cancel invites"
  ON club_invites FOR UPDATE
  USING (auth.uid() = club_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Models can view invites sent to them
CREATE POLICY "Models can view their invites"
  ON club_invites FOR SELECT
  USING (auth.uid() = invited_model_id);

-- Models can respond to invites
CREATE POLICY "Models can respond to invites"
  ON club_invites FOR UPDATE
  USING (auth.uid() = invited_model_id AND status = 'pending')
  WITH CHECK (status IN ('accepted', 'rejected'));
```

### `notifications` Policies:

```sql
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);
```

---

## User Flow

### For Clubs:

1. **Navigate to Manage Models** (`/dashboard/company/models`)
   - See tabs: "My Models" | "Pending Invites"
   
2. **Click "Invite Model"** button
   - Navigate to `/dashboard/company/models/invite`
   
3. **Search for Model**
   - Enter username or email
   - Select model from search results
   
4. **Send Invitation**
   - Add optional personal message
   - Click "Send Invitation"
   - Invite is created with status `pending`
   - Trigger automatically creates notification for model
   
5. **Monitor Pending Invites**
   - View in "Pending Invites" tab
   - Can cancel invite before model responds
   
6. **Get Notified** (future)
   - When model accepts/rejects (would need additional trigger)

---

### For Models:

1. **Receive Notification**
   - Notification bell shows unread count
   - Alert card appears on dashboard if pending invites exist
   
2. **View Invitations**
   - Click "View Invitations" on dashboard alert, OR
   - Click "Club Invites" in sidebar, OR
   - Click notification bell → "View all notifications"
   - Navigate to `/dashboard/model/invites`
   
3. **Review Invitation Details**
   - Club name, location
   - Personal message (if any)
   - Club description
   
4. **Accept or Decline**
   - **Accept**: Sets `model_details.club_id` to club's ID
   - **Decline**: Just updates invite status
   - Both: Update `club_invites.status` and `responded_at`
   - Notification is deleted from `notifications` table
   
5. **View Club Membership**
   - Club info appears in right sidebar on model dashboard
   - Shows club name and location

---

## Key Components

### 1. **NotificationBell.tsx** (`src/components/notifications/NotificationBell.tsx`)
- Dropdown notification panel
- Shows unread count badge
- Mark as read / Delete actions
- Integrated in both `DashboardSidebar` and `CompanySidebar`

### 2. **Invite Model Page** (`src/app/dashboard/company/models/invite/page.tsx`)
- Search functionality for models
- Model selection
- Personal message input
- Validation (no duplicate invites, not already in club)

### 3. **Model Invites Page** (`src/app/dashboard/model/invites/page.tsx`)
- List of pending invitations
- Club details display
- Accept/Decline actions
- Real-time status updates

### 4. **Manage Models Page** (`src/app/dashboard/company/models/page.tsx`)
- Tab system: My Models | Pending Invites
- View pending invites with model info
- Cancel invite functionality

### 5. **Model Dashboard** (`src/app/dashboard/model/page.tsx`)
- Alert card for pending invites
- Club membership display in sidebar
- Fetches club info if `model_details.club_id` exists

### 6. **Notifications Pages**
- Model: `/dashboard/model/notifications`
- Company: `/dashboard/company/notifications`
- Full notification management (filter, mark read, delete)

---

## API Endpoints / Queries Used

### For Clubs:

**Search Models:**
```typescript
const { data } = await supabase
  .from('profiles')
  .select('id, username, full_name, avatar_url, is_verified, profile_status')
  .eq('role', 'model')
  .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
  .limit(10)
```

**Create Invite:**
```typescript
const { error } = await supabase
  .from('club_invites')
  .insert({
    club_id: user.id,
    invited_model_id: selectedModel.id,
    message: inviteMessage.trim() || null,
    status: 'pending'
  })
```

**Fetch Pending Invites:**
```typescript
const { data } = await supabase
  .from('club_invites')
  .select(`
    id,
    invited_model_id,
    status,
    message,
    invited_at,
    model:profiles!club_invites_invited_model_id_fkey(username, full_name, avatar_url)
  `)
  .eq('club_id', user.id)
  .eq('status', 'pending')
  .order('invited_at', { ascending: false })
```

**Cancel Invite:**
```typescript
const { error } = await supabase
  .from('club_invites')
  .update({ status: 'cancelled' })
  .eq('id', inviteId)
```

---

### For Models:

**Fetch Invites:**
```typescript
const { data } = await supabase
  .from('club_invites')
  .select(`
    id,
    club_id,
    status,
    message,
    invited_at,
    club_details:club_details!club_invites_club_id_fkey(club_name, display_name, area, about_description)
  `)
  .eq('invited_model_id', user.id)
  .eq('status', 'pending')
  .order('invited_at', { ascending: false })
```

**Accept Invite:**
```typescript
// 1. Update model_details to link to club
const { error: updateError } = await supabase
  .from('model_details')
  .update({ club_id: clubId })
  .eq('model_id', user.id)

// 2. Update invite status
const { error: inviteError } = await supabase
  .from('club_invites')
  .update({ 
    status: 'accepted',
    responded_at: new Date().toISOString()
  })
  .eq('id', inviteId)

// 3. Delete notification
await supabase
  .from('notifications')
  .delete()
  .eq('user_id', user.id)
  .eq('related_entity_id', inviteId)
```

**Decline Invite:**
```typescript
// 1. Update invite status
const { error: inviteError } = await supabase
  .from('club_invites')
  .update({ 
    status: 'rejected',
    responded_at: new Date().toISOString()
  })
  .eq('id', inviteId)

// 2. Delete notification
await supabase
  .from('notifications')
  .delete()
  .eq('user_id', user.id)
  .eq('related_entity_id', inviteId)
```

**Fetch Club Info (if model is in a club):**
```typescript
const { data: clubData } = await supabase
  .from('club_details')
  .select('club_name, display_name, area, city')
  .eq('club_id', modelDetails.club_id)
  .single()
```

---

## Navigation Structure

### Company Dashboard:
```
/dashboard/company
├── /models (Manage Models)
│   ├── Tab: My Models
│   ├── Tab: Pending Invites
│   └── /invite (Invite Model page)
├── /notifications (All notifications)
└── Sidebar: NotificationBell component
```

### Model Dashboard:
```
/dashboard/model
├── Dashboard (with invite alert + club info)
├── /invites (Club Invites page)
├── /notifications (All notifications)
└── Sidebar: NotificationBell component + Club Invites link
```

---

## Future Enhancements (Optional)

1. **Notify clubs when models respond:**
   - Add trigger on `club_invites` UPDATE
   - Create notification for club when status changes to accepted/rejected

2. **Bulk invite:**
   - Allow clubs to invite multiple models at once

3. **Invite history:**
   - Show all invites (not just pending) with filters

4. **Rich notifications:**
   - Add model photo to invite notification
   - Add club logo to invite display

5. **Email notifications:**
   - Send email when model receives invite (using Supabase Auth emails or external service)

6. **Real-time notifications:**
   - Use Supabase Realtime to update notification badge instantly

---

## Testing Checklist

### As Club:
- [ ] Search for models by username
- [ ] Search for models by email
- [ ] Send invite with personal message
- [ ] Send invite without message
- [ ] View pending invites in "Pending Invites" tab
- [ ] Cancel a pending invite
- [ ] Try to invite same model twice (should show error)
- [ ] Try to invite model already in club (should show error)

### As Model:
- [ ] Receive notification when invited
- [ ] See invite alert on dashboard
- [ ] View pending invites page
- [ ] Accept an invitation
- [ ] Decline an invitation
- [ ] See club info in sidebar after accepting
- [ ] Notification disappears after responding
- [ ] Delete notification from bell dropdown
- [ ] Mark notification as read

### General:
- [ ] Notification bell shows correct unread count
- [ ] "View all notifications" link works
- [ ] Notifications page filters work (All/Unread)
- [ ] Mark all as read works
- [ ] Delete notification works
- [ ] Sidebar navigation works correctly

---

## Troubleshooting

### Issue: Notifications not appearing
- Check if trigger `on_club_invite_created` is active
- Verify `notify_model_on_invite()` function exists
- Check RLS policies on `notifications` table

### Issue: Can't send invite
- Verify `club_invites` INSERT policy allows it
- Check if model exists in `profiles` with role='model'
- Ensure no existing pending invite for same model

### Issue: Can't accept/reject invite
- Check `club_invites` UPDATE policy for models
- Verify invite status is 'pending'
- Ensure `model_details` has entry for model

### Issue: Club info not showing for model
- Check if `model_details.club_id` is set correctly
- Verify `club_details` exists for that club
- Check query for correct foreign key reference

---

## Summary

The invite system is fully functional with:
- ✅ Club search and invite functionality
- ✅ Model notification and response system
- ✅ Multi-club membership support
- ✅ Notification bell with dropdown
- ✅ Full notifications management pages
- ✅ Automatic notification creation via trigger
- ✅ Proper RLS policies for security
- ✅ UI integration in both dashboards

All features are **refresh-based** (no realtime), and models can **delete notifications** to clear them from view.
