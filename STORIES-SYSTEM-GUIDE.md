# 📸 MODEL STORIES SYSTEM - Setup & Implementation Guide

## 🎯 Features

### Instagram-Style Stories System
- ✅ Models can upload photos & videos
- ✅ Stories automatically expire after 24 hours
- ✅ Track views (who viewed which story)
- ✅ Beautiful Instagram-like viewer with progress bars
- ✅ Swipe/click navigation between stories
- ✅ Video with play/pause/mute controls
- ✅ Story rings show unviewed stories (pink gradient)
- ✅ Multiple stories per model grouped together

---

## 📋 Setup Checklist

### STEP 1: Create Supabase Storage Bucket

Go to Supabase Dashboard → **Storage** → Create new bucket:

```
Bucket Name: model-stories
Public bucket: YES ✅
File size limit: 50MB
Allowed MIME types: image/*, video/*
```

**RLS Policies for Storage:**

Run this in Supabase SQL Editor:

```sql
-- Allow anyone to read stories
CREATE POLICY "Anyone can view stories"
ON storage.objects FOR SELECT
USING ( bucket_id = 'model-stories' );

-- Allow models to upload their own stories
CREATE POLICY "Models can upload stories"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'model-stories' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow models to delete their own stories
CREATE POLICY "Models can delete own stories"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'model-stories' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### STEP 2: Create Database Tables

Run this SQL script:
**File:** `supabase-docs/CREATE-TABLE-model-stories.sql`

This creates:
- `model_stories` table - stores story metadata
- `story_views` table - tracks who viewed each story
- Functions for getting active stories and marking as viewed
- RLS policies
- Auto-expire functions

---

### STEP 3: Enable Realtime (Optional but Recommended)

For real-time story view counts:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE model_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE story_views;
```

---

### STEP 4: Setup Cron Job for Auto-Deletion

To automatically delete expired stories, set up a cron job (Edge Function or external):

**Option A: Supabase Edge Function (Recommended)**

Create a new Edge Function that runs daily:

```sql
SELECT delete_expired_stories();
```

**Option B: External Cron (if you have a backend)**

Schedule this to run every hour:

```typescript
const { data, error } = await supabase.rpc('delete_expired_stories');
console.log(`Deleted ${data} expired stories`);
```

---

## 🎨 How It Works

### For Models:

1. Go to **Dashboard** → **Upload Story**
2. Select photo or video (max 50MB)
3. Add optional caption
4. For images: Choose display duration (3-10 seconds)
5. Click "Post Story"
6. Story appears on homepage for 24 hours

### For Users:

1. Homepage shows stories at the top (like Instagram)
2. Pink gradient ring = unviewed stories
3. Gray ring = all stories viewed
4. Number badge = multiple stories
5. Click to open full-screen viewer
6. Swipe/click to navigate
7. Progress bars show current story position

---

## 📱 UI Components

### 1. **StoriesSection** (`src/components/stories/StoriesSection.tsx`)
- Horizontal scrollable list of model avatars
- Shows on homepage below city selector
- Pink gradient ring for unviewed stories
- "+ Add Story" button for models

### 2. **StoryViewer** (`src/components/stories/StoryViewer.tsx`)
- Full-screen Instagram-style viewer
- Progress bars at top
- Model info header with link to profile
- Auto-play images with configurable duration
- Video controls (play/pause/mute)
- Navigation: click left/right or swipe
- Shows view count
- Auto-advance to next story

### 3. **Upload Story Page** (`src/app/dashboard/model/upload-story/page.tsx`)
- File upload with preview
- Caption input (max 200 chars)
- Duration selector for images
- Upload progress indicator
- Error handling

---

## 🔧 Database Schema

### `model_stories` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| model_id | UUID | FK to profiles |
| media_type | TEXT | 'image' or 'video' |
| media_url | TEXT | Path in storage |
| thumbnail_url | TEXT | Optional video thumbnail |
| caption | TEXT | Optional caption |
| duration | INTEGER | Seconds to show (images only) |
| created_at | TIMESTAMP | When story was created |
| expires_at | TIMESTAMP | Auto-set to +24 hours |
| views_count | INTEGER | Total views |
| is_active | BOOLEAN | Auto-set to false after expiry |

### `story_views` Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| story_id | UUID | FK to model_stories |
| viewer_id | UUID | FK to profiles (nullable) |
| viewed_at | TIMESTAMP | When viewed |

**Unique constraint:** (story_id, viewer_id) - prevents duplicate views

---

## 🚀 Features In Detail

### Auto-Expiry System

1. **Soft Delete (immediate):**
   - `is_active = false` when `expires_at` is reached
   - Stories stop appearing in lists instantly
   - Data still exists for analytics

2. **Hard Delete (1 hour after expiry):**
   - Cron job calls `delete_expired_stories()`
   - Deletes database records
   - Should also delete storage files (implement in cron)

### View Tracking

- One view per user per story (unique constraint)
- Anonymous views possible (viewer_id = NULL)
- View count updated in real-time
- Models can see who viewed their stories

### Performance

- Indexes on:
  - `model_id` - fast lookup by model
  - `is_active, expires_at` - fast filtering
  - `created_at DESC` - fast sorting
- RPC function groups stories by model for efficiency
- Only active stories loaded

---

## 📊 SQL Functions

### `get_active_model_stories()`

Returns all active stories grouped by model with:
- Model info (username, showname, photo)
- Total story count
- Unviewed story count (for current user)
- Latest story timestamp
- All stories as JSON array

### `mark_story_viewed(p_story_id UUID)`

Marks a story as viewed by current user:
- Inserts view record (if not already viewed)
- Updates story views_count
- Returns nothing (VOID)

### `expire_old_stories()`

Sets `is_active = false` for expired stories:
- Returns count of expired stories
- Should be called periodically

### `delete_expired_stories()`

Deletes stories expired > 1 hour ago:
- Returns count of deleted stories
- Should be called by cron job
- Note: Doesn't delete storage files (handle separately)

---

## 🔐 Security (RLS Policies)

### model_stories

- ✅ Anyone can view active stories
- ✅ Models can create own stories
- ✅ Models can update own stories
- ✅ Models can delete own stories

### story_views

- ✅ Anyone can record views
- ✅ Users can view own view history
- ✅ Models can see who viewed their stories

---

## 🎯 Future Enhancements (Not Implemented Yet)

- [ ] Story replies/comments
- [ ] Direct messages from stories
- [ ] Story highlights (saved stories)
- [ ] Story analytics dashboard
- [ ] Multiple stories upload at once
- [ ] Story filters/stickers
- [ ] Music for stories
- [ ] Story mentions/tags
- [ ] Archive/unarchive stories

---

## ✅ Testing Checklist

- [ ] Create storage bucket `model-stories`
- [ ] Run SQL migrations
- [ ] Enable Realtime (optional)
- [ ] Setup cron job for deletion
- [ ] Test upload as model
- [ ] Test viewing as user
- [ ] Test auto-expiry (wait 24h or manually set `expires_at`)
- [ ] Test view tracking
- [ ] Test multiple stories per model
- [ ] Test video upload & playback
- [ ] Test image duration settings
- [ ] Test navigation (next/previous)
- [ ] Test on mobile devices

---

**Files Created:**
1. `supabase-docs/CREATE-TABLE-model-stories.sql` - Database schema
2. `src/components/stories/StoriesSection.tsx` - Homepage stories list
3. `src/components/stories/StoryViewer.tsx` - Full-screen viewer
4. `src/app/dashboard/model/upload-story/page.tsx` - Upload page
5. Updated `src/components/home/HomePageClient.tsx` - Added stories to homepage
6. Updated `src/components/layout/DashboardSidebar.tsx` - Added upload link

**Ready for deployment!** 🚀
