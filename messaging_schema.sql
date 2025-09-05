-- MarketDZ Messaging System Schema
-- Run this SQL in your Supabase SQL Editor

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  listing_id UUID REFERENCES listings(id),
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique conversation per buyer-seller-listing combination
  UNIQUE(buyer_id, seller_id, listing_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  metadata JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE,
  edited_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure content is not empty for text messages
  CONSTRAINT non_empty_content CHECK (
    (message_type != 'text') OR (message_type = 'text' AND LENGTH(TRIM(content)) > 0)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS conversations_buyer_id_idx ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_id_idx ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can view conversations they are part of" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations where they are buyer or seller" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update conversations they are part of" ON conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE conversations.id = messages.conversation_id 
      AND (conversations.buyer_id = auth.uid() OR conversations.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Function to update conversation last_message info
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the conversation with last message info
  UPDATE conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    updated_at = NOW(),
    -- Increment unread count for the recipient
    buyer_unread_count = CASE 
      WHEN NEW.sender_id != conversations.buyer_id 
      THEN conversations.buyer_unread_count + 1
      ELSE conversations.buyer_unread_count
    END,
    seller_unread_count = CASE 
      WHEN NEW.sender_id != conversations.seller_id 
      THEN conversations.seller_unread_count + 1
      ELSE conversations.seller_unread_count
    END
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update conversation when new message is inserted
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  conversation_uuid UUID,
  user_uuid UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Mark unread messages as read
  UPDATE messages 
  SET read_at = NOW()
  WHERE conversation_id = conversation_uuid
    AND sender_id != user_uuid
    AND read_at IS NULL;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Reset unread count for this user
  UPDATE conversations
  SET 
    buyer_unread_count = CASE 
      WHEN buyer_id = user_uuid THEN 0 
      ELSE buyer_unread_count 
    END,
    seller_unread_count = CASE 
      WHEN seller_id = user_uuid THEN 0 
      ELSE seller_unread_count 
    END,
    updated_at = NOW()
  WHERE id = conversation_uuid
    AND (buyer_id = user_uuid OR seller_id = user_uuid);
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  buyer_uuid UUID,
  seller_uuid UUID,
  listing_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_uuid UUID;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO conversation_uuid
  FROM conversations
  WHERE buyer_id = buyer_uuid 
    AND seller_id = seller_uuid 
    AND (listing_id = listing_uuid OR (listing_id IS NULL AND listing_uuid IS NULL));
  
  -- If not found, create new conversation
  IF conversation_uuid IS NULL THEN
    INSERT INTO conversations (buyer_id, seller_id, listing_id)
    VALUES (buyer_uuid, seller_uuid, listing_uuid)
    RETURNING id INTO conversation_uuid;
  END IF;
  
  RETURN conversation_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
