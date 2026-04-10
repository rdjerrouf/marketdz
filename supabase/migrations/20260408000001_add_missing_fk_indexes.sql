-- Add Missing Foreign Key Indexes
-- Date: 2026-04-08
--
-- Issue: Supabase advisor detected FK columns without covering indexes.
-- Unindexed FKs cause slow JOINs and slow cascading deletes/updates.
--
-- Affected columns:
--   admin_invitations.invited_by  → admin_users(id)
--   conversations.last_message_id → messages(id)
--   conversations.listing_id      → listings(id)
--   conversations.seller_id       → profiles(id)  [idx_conversations_users covers buyer_id first; seller_id alone is not efficiently served]
--   messages.sender_id            → profiles(id)
--   reviews.listing_id            → listings(id)

-- admin_invitations
CREATE INDEX IF NOT EXISTS idx_admin_invitations_invited_by
  ON public.admin_invitations (invited_by);

-- conversations
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_id
  ON public.conversations (last_message_id);

CREATE INDEX IF NOT EXISTS idx_conversations_listing_id
  ON public.conversations (listing_id);

CREATE INDEX IF NOT EXISTS idx_conversations_seller_id
  ON public.conversations (seller_id);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id
  ON public.messages (sender_id);

-- reviews
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id
  ON public.reviews (listing_id);
