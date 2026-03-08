-- ============================================================================
-- CHAT AVAILABLE FLAG
-- ============================================================================
-- Models with an active ad can toggle "Available for 1:1 Chat" from their
-- dashboard. When enabled their card appears in the homepage sidebar widget.
-- ============================================================================

ALTER TABLE model_details
  ADD COLUMN IF NOT EXISTS chat_available boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_model_details_chat_available
  ON model_details(chat_available)
  WHERE chat_available = true;
