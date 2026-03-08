-- ============================================================================
-- MODEL COLLABORATION SYSTEM - COMPLETE SQL SCRIPT
-- ============================================================================
-- Purpose: Model-to-model collaboration system with notifications
-- ============================================================================

-- ============================================================================
-- 1. CREATE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_collaborations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone,

  CONSTRAINT collab_valid_status CHECK (
    status IN ('pending', 'accepted', 'rejected', 'cancelled')
  ),
  CONSTRAINT collab_no_self_invite CHECK (sender_id != receiver_id),
  CONSTRAINT collab_unique_pair UNIQUE (sender_id, receiver_id)
);

-- ============================================================================
-- 2. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_model_collab_sender ON model_collaborations(sender_id);
CREATE INDEX IF NOT EXISTS idx_model_collab_receiver ON model_collaborations(receiver_id);
CREATE INDEX IF NOT EXISTS idx_model_collab_status ON model_collaborations(status);

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE model_collaborations ENABLE ROW LEVEL SECURITY;

-- Senders can view their own sent collaborations
CREATE POLICY "Senders can view own collabs"
  ON model_collaborations FOR SELECT
  USING (auth.uid() = sender_id);

-- Receivers can view collaborations sent to them
CREATE POLICY "Receivers can view their collabs"
  ON model_collaborations FOR SELECT
  USING (auth.uid() = receiver_id);

-- Models can create collaboration requests
CREATE POLICY "Models can create collabs"
  ON model_collaborations FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Senders can cancel their pending collaborations
CREATE POLICY "Senders can cancel collabs"
  ON model_collaborations FOR UPDATE
  USING (auth.uid() = sender_id AND status = 'pending')
  WITH CHECK (status = 'cancelled');

-- Receivers can respond to collaborations (accept/reject)
CREATE POLICY "Receivers can respond to collabs"
  ON model_collaborations FOR UPDATE
  USING (auth.uid() = receiver_id AND status = 'pending')
  WITH CHECK (status IN ('accepted', 'rejected'));

-- Either party can remove an accepted collaboration
CREATE POLICY "Either party can remove accepted collabs"
  ON model_collaborations FOR DELETE
  USING (
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
    AND status = 'accepted'
  );

-- ============================================================================
-- 4. TRIGGER FUNCTION - Notification on collaboration invite
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_model_on_collaboration()
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
    NEW.receiver_id,
    'collaboration_invite',
    'New Collaboration Request',
    'You have received a collaboration request from ' ||
      COALESCE(
        (SELECT showname FROM model_details WHERE model_id = NEW.sender_id),
        (SELECT username FROM profiles WHERE id = NEW.sender_id),
        'a model'
      ),
    'collaboration_invite',
    NEW.id,
    '/dashboard/model/collaborations'
  WHERE NEW.receiver_id IS NOT NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CREATE TRIGGER
-- ============================================================================

DROP TRIGGER IF EXISTS on_collaboration_created ON model_collaborations;

CREATE TRIGGER on_collaboration_created
  AFTER INSERT ON model_collaborations
  FOR EACH ROW
  EXECUTE FUNCTION notify_model_on_collaboration();

-- ============================================================================
-- 6. TRIGGER FUNCTION - Notification when collaboration is accepted
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_model_on_collaboration_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
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
      NEW.sender_id,
      'collaboration_accepted',
      'Collaboration Accepted',
      COALESCE(
        (SELECT showname FROM model_details WHERE model_id = NEW.receiver_id),
        (SELECT username FROM profiles WHERE id = NEW.receiver_id),
        'A model'
      ) || ' has accepted your collaboration request!',
      'collaboration_invite',
      NEW.id,
      '/dashboard/model/collaborations'
    WHERE NEW.sender_id IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_collaboration_accepted ON model_collaborations;

CREATE TRIGGER on_collaboration_accepted
  AFTER UPDATE ON model_collaborations
  FOR EACH ROW
  EXECUTE FUNCTION notify_model_on_collaboration_accepted();
