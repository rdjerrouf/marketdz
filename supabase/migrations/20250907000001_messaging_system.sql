-- Create messaging system tables
-- This migration adds conversations and messages tables for the MarketDZ messaging system

-- Conversations table
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT conversations_buyer_seller_different CHECK (buyer_id != seller_id),
  CONSTRAINT conversations_unread_counts_positive CHECK (
    buyer_unread_count >= 0 AND seller_unread_count >= 0
  )
);

-- Messages table
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT messages_content_not_empty CHECK (length(trim(content)) > 0)
);

-- Update conversations table to reference last message
ALTER TABLE conversations 
  ADD CONSTRAINT conversations_last_message_fkey 
  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Additional performance indexes for message queries
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
-- Users can see conversations where they are either buyer or seller
CREATE POLICY "Users can view their conversations" ON conversations
  FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Users can create conversations where they are the buyer or seller
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

-- Users can update conversations where they are either buyer or seller
CREATE POLICY "Users can update their conversations" ON conversations
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS Policies for messages
-- Users can see messages in conversations they participate in
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Users can create messages in conversations they participate in
CREATE POLICY "Users can create messages in their conversations" ON messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

-- Function to update conversation last_message_at and last_message_id
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW(),
    -- Increment unread count for the recipient
    buyer_unread_count = CASE 
      WHEN NEW.sender_id != buyer_id THEN buyer_unread_count + 1 
      ELSE buyer_unread_count 
    END,
    seller_unread_count = CASE 
      WHEN NEW.sender_id != seller_id THEN seller_unread_count + 1 
      ELSE seller_unread_count 
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation when message is inserted
CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to reset unread count when user reads messages
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  conversation_id UUID,
  user_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations 
  SET 
    buyer_unread_count = CASE 
      WHEN buyer_id = user_id THEN 0 
      ELSE buyer_unread_count 
    END,
    seller_unread_count = CASE 
      WHEN seller_id = user_id THEN 0 
      ELSE seller_unread_count 
    END
  WHERE id = conversation_id
  AND (buyer_id = user_id OR seller_id = user_id);
END;
$$ LANGUAGE plpgsql;
