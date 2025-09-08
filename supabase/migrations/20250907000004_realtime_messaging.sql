-- Real-time messaging system for MarketDZ
-- This creates efficient real-time messaging with proper RLS and indexing

-- Enable Row Level Security on conversations and messages
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;

-- RLS Policies for conversations
-- Users can see conversations where they are buyer or seller
CREATE POLICY "Users can view their own conversations" ON conversations
FOR SELECT USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- Users can create conversations (as buyer)
CREATE POLICY "Users can create conversations" ON conversations
FOR INSERT WITH CHECK (
  auth.uid() = buyer_id
);

-- Users can update their own conversations (mark as read, etc.)
CREATE POLICY "Users can update their own conversations" ON conversations
FOR UPDATE USING (
  auth.uid() = buyer_id OR auth.uid() = seller_id
);

-- RLS Policies for messages
-- Users can see messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
  )
);

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages" ON messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM conversations 
    WHERE conversations.id = messages.conversation_id 
    AND (auth.uid() = buyer_id OR auth.uid() = seller_id)
  )
);

-- Optimized indexes for real-time messaging
CREATE INDEX IF NOT EXISTS idx_conversations_users 
ON conversations (buyer_id, seller_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_time 
ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_unread 
ON messages (conversation_id, read_at) 
WHERE read_at IS NULL;

-- Function to update conversation metadata when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last message info and unread counts
  UPDATE conversations 
  SET 
    last_message_id = NEW.id,
    last_message_at = NEW.created_at,
    buyer_unread_count = CASE 
      WHEN NEW.sender_id = buyer_id THEN buyer_unread_count
      ELSE buyer_unread_count + 1 
    END,
    seller_unread_count = CASE 
      WHEN NEW.sender_id = seller_id THEN seller_unread_count  
      ELSE seller_unread_count + 1
    END,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
DROP TRIGGER IF EXISTS on_message_sent ON messages;
CREATE TRIGGER on_message_sent
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(conversation_uuid UUID)
RETURNS VOID AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Determine if user is buyer or seller in this conversation
  SELECT CASE 
    WHEN buyer_id = auth.uid() THEN 'buyer'
    WHEN seller_id = auth.uid() THEN 'seller'
    ELSE NULL
  END INTO user_role
  FROM conversations 
  WHERE id = conversation_uuid;
  
  IF user_role IS NULL THEN
    RAISE EXCEPTION 'User not authorized for this conversation';
  END IF;
  
  -- Mark messages as read
  UPDATE messages 
  SET read_at = NOW()
  WHERE conversation_id = conversation_uuid 
    AND sender_id != auth.uid()
    AND read_at IS NULL;
  
  -- Reset unread count
  IF user_role = 'buyer' THEN
    UPDATE conversations 
    SET buyer_unread_count = 0
    WHERE id = conversation_uuid;
  ELSE
    UPDATE conversations 
    SET seller_unread_count = 0
    WHERE id = conversation_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql;
