-- ============================================================================
-- Discussion topics & threaded posts (blog-as-forum)
-- Run in Supabase SQL Editor after profiles exists.
-- ============================================================================

CREATE TABLE IF NOT EXISTS discussion_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  body text DEFAULT '' NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  is_pinned boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_topics_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_discussion_topics_status_pinned_updated
  ON discussion_topics (status, is_pinned DESC, updated_at DESC);

CREATE TABLE IF NOT EXISTS discussion_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES discussion_topics(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES discussion_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body text NOT NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT discussion_posts_body_len CHECK (char_length(body) <= 10000)
);

CREATE INDEX IF NOT EXISTS idx_discussion_posts_topic_created ON discussion_posts (topic_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_discussion_posts_parent_id ON discussion_posts (parent_id);

-- updated_at on topics
CREATE OR REPLACE FUNCTION discussion_topics_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discussion_topics_updated_at ON discussion_topics;
CREATE TRIGGER discussion_topics_updated_at
  BEFORE UPDATE ON discussion_topics
  FOR EACH ROW EXECUTE FUNCTION discussion_topics_set_updated_at();

CREATE OR REPLACE FUNCTION discussion_posts_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discussion_posts_updated_at ON discussion_posts;
CREATE TRIGGER discussion_posts_updated_at
  BEFORE UPDATE ON discussion_posts
  FOR EACH ROW EXECUTE FUNCTION discussion_posts_set_updated_at();

-- Bump topic updated_at when a post is added (for listing sort)
CREATE OR REPLACE FUNCTION discussion_posts_touch_topic()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE discussion_topics SET updated_at = now() WHERE id = NEW.topic_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS discussion_posts_touch_topic ON discussion_posts;
CREATE TRIGGER discussion_posts_touch_topic
  AFTER INSERT ON discussion_posts
  FOR EACH ROW EXECUTE FUNCTION discussion_posts_touch_topic();

ALTER TABLE discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_posts ENABLE ROW LEVEL SECURITY;

-- Helper: caller is admin
-- discussion_topics policies
CREATE POLICY "Anyone can read active topics"
  ON discussion_topics FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can read all topics"
  ON discussion_topics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins insert topics"
  ON discussion_topics FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins update topics"
  ON discussion_topics FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins delete topics"
  ON discussion_topics FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- discussion_posts: public read non-deleted under active topics
CREATE POLICY "Public reads posts on active topics"
  ON discussion_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM discussion_topics t
      WHERE t.id = discussion_posts.topic_id AND t.status = 'active'
    )
    AND is_deleted = false
  );

CREATE POLICY "Admins read all posts"
  ON discussion_posts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Logged-in, not blocked, topic active, valid parent
CREATE POLICY "Logged-in users insert posts on active topics"
  ON discussion_posts FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND COALESCE(p.is_blocked, false) = false
    )
    AND EXISTS (
      SELECT 1 FROM discussion_topics t
      WHERE t.id = topic_id AND t.status = 'active'
    )
    AND (
      parent_id IS NULL
      OR EXISTS (
        SELECT 1 FROM discussion_posts pp
        WHERE pp.id = parent_id
          AND pp.topic_id = topic_id
          AND pp.is_deleted = false
      )
    )
  );

CREATE POLICY "Admins update posts moderation"
  ON discussion_posts FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

COMMENT ON TABLE discussion_topics IS 'Admin-managed discussion threads (blog)';
COMMENT ON TABLE discussion_posts IS 'Nested replies in a discussion topic';
