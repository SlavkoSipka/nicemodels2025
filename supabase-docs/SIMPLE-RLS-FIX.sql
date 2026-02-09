-- Simple RLS Fix
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "Public can view model profiles" ON profiles;
CREATE POLICY "Public can view model profiles" ON profiles FOR SELECT USING (role = 'model');

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- model_details
DROP POLICY IF EXISTS "Public can view model details" ON model_details;
CREATE POLICY "Public can view model details" ON model_details FOR SELECT USING (true);

DROP POLICY IF EXISTS "Models can update own details" ON model_details;
CREATE POLICY "Models can update own details" ON model_details FOR UPDATE USING (auth.uid() = model_id);

DROP POLICY IF EXISTS "Models can insert own details" ON model_details;
CREATE POLICY "Models can insert own details" ON model_details FOR INSERT WITH CHECK (auth.uid() = model_id);

-- club_invites
DROP POLICY IF EXISTS "Clubs can view own invites" ON club_invites;
CREATE POLICY "Clubs can view own invites" ON club_invites FOR SELECT USING (auth.uid() = club_id);

DROP POLICY IF EXISTS "Clubs can create invites" ON club_invites;
CREATE POLICY "Clubs can create invites" ON club_invites FOR INSERT WITH CHECK (auth.uid() = club_id);

DROP POLICY IF EXISTS "Clubs can cancel invites" ON club_invites;
CREATE POLICY "Clubs can cancel invites" ON club_invites FOR UPDATE USING (auth.uid() = club_id AND status = 'pending') WITH CHECK (status = 'cancelled');

DROP POLICY IF EXISTS "Models can view their invites" ON club_invites;
CREATE POLICY "Models can view their invites" ON club_invites FOR SELECT USING (auth.uid() = invited_model_id);

DROP POLICY IF EXISTS "Models can respond to invites" ON club_invites;
CREATE POLICY "Models can respond to invites" ON club_invites FOR UPDATE USING (auth.uid() = invited_model_id AND status = 'pending') WITH CHECK (status IN ('accepted', 'rejected'));

-- notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
