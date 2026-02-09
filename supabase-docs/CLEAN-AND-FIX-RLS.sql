-- Step 1: Drop ALL existing policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE tablename IN ('profiles', 'model_details', 'club_details', 'club_contact_details', 
                                  'club_working_hours', 'club_photos', 'club_invites', 'notifications')) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Step 2: Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_contact_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 3: Create ONLY necessary policies

-- profiles - Models are public, users can see themselves
CREATE POLICY "allow_view_models" ON profiles FOR SELECT USING (role = 'model');
CREATE POLICY "allow_view_self" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "allow_update_self" ON profiles FOR UPDATE USING (auth.uid() = id);

-- model_details - Public read
CREATE POLICY "allow_view_all" ON model_details FOR SELECT USING (true);
CREATE POLICY "allow_update_own" ON model_details FOR UPDATE USING (auth.uid() = model_id);
CREATE POLICY "allow_insert_own" ON model_details FOR INSERT WITH CHECK (auth.uid() = model_id);

-- club_details - Public read
CREATE POLICY "allow_view_club_details" ON club_details FOR SELECT USING (true);
CREATE POLICY "allow_update_club_own" ON club_details FOR UPDATE USING (auth.uid() = club_id);
CREATE POLICY "allow_insert_club_own" ON club_details FOR INSERT WITH CHECK (auth.uid() = club_id);

-- club_invites
CREATE POLICY "club_view_own" ON club_invites FOR SELECT USING (auth.uid() = club_id);
CREATE POLICY "club_create" ON club_invites FOR INSERT WITH CHECK (auth.uid() = club_id);
CREATE POLICY "club_cancel" ON club_invites FOR UPDATE USING (auth.uid() = club_id AND status = 'pending') WITH CHECK (status = 'cancelled');
CREATE POLICY "club_delete" ON club_invites FOR DELETE USING (auth.uid() = club_id);
CREATE POLICY "model_view_invites" ON club_invites FOR SELECT USING (auth.uid() = invited_model_id);
CREATE POLICY "model_respond" ON club_invites FOR UPDATE USING (auth.uid() = invited_model_id AND status = 'pending') WITH CHECK (status IN ('accepted', 'rejected'));

-- notifications
CREATE POLICY "notif_view" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notif_delete" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "notif_insert" ON notifications FOR INSERT WITH CHECK (true);

-- club_contact_details
ALTER TABLE club_contact_details ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_view_club_contacts" ON club_contact_details;
CREATE POLICY "allow_view_club_contacts" ON club_contact_details FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_update_club_contacts" ON club_contact_details;
CREATE POLICY "allow_update_club_contacts" ON club_contact_details FOR UPDATE USING (auth.uid() = club_id);
DROP POLICY IF EXISTS "allow_insert_club_contacts" ON club_contact_details;
CREATE POLICY "allow_insert_club_contacts" ON club_contact_details FOR INSERT WITH CHECK (auth.uid() = club_id);

-- club_working_hours
ALTER TABLE club_working_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_view_club_hours" ON club_working_hours;
CREATE POLICY "allow_view_club_hours" ON club_working_hours FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_update_club_hours" ON club_working_hours;
CREATE POLICY "allow_update_club_hours" ON club_working_hours FOR UPDATE USING (auth.uid() = club_id);
DROP POLICY IF EXISTS "allow_insert_club_hours" ON club_working_hours;
CREATE POLICY "allow_insert_club_hours" ON club_working_hours FOR INSERT WITH CHECK (auth.uid() = club_id);
DROP POLICY IF EXISTS "allow_delete_club_hours" ON club_working_hours;
CREATE POLICY "allow_delete_club_hours" ON club_working_hours FOR DELETE USING (auth.uid() = club_id);

-- club_photos
ALTER TABLE club_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_view_club_photos" ON club_photos;
CREATE POLICY "allow_view_club_photos" ON club_photos FOR SELECT USING (true);
DROP POLICY IF EXISTS "allow_update_club_photos" ON club_photos;
CREATE POLICY "allow_update_club_photos" ON club_photos FOR UPDATE USING (auth.uid() = club_id);
DROP POLICY IF EXISTS "allow_insert_club_photos" ON club_photos;
CREATE POLICY "allow_insert_club_photos" ON club_photos FOR INSERT WITH CHECK (auth.uid() = club_id);
DROP POLICY IF EXISTS "allow_delete_club_photos" ON club_photos;
CREATE POLICY "allow_delete_club_photos" ON club_photos FOR DELETE USING (auth.uid() = club_id);
