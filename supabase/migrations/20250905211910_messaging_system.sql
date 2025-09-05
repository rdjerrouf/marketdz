-- MarketDZ Messaging System Upgrade Migration
-- This will upgrade your existing messaging tables to support advanced features

-- Step 1: Add missing columns to conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS last_message_id UUID,
ADD COLUMN IF NOT EXISTS buyer_unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS seller_unread_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraint for status if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'conversations_status_check'
  ) THEN
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_status_check 
    CHECK (status IN ('active', 'archived', 'blocked'));
  END IF;
END $$;

-- Step 2: Add missing columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Step 3: Update message_type to support new values
-- First, add the new 'file' value to the existing enum
DO $$
BEGIN
  -- Add 'file' to message_type enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'file' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'message_type')
  ) THEN
    ALTER TYPE message_type ADD VALUE 'file';
  END IF;
END $$;

-- Step 4: Add content validation constraint
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'non_empty_content'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT non_empty_content;
  END IF;
  
  -- Add updated constraint
  ALTER TABLE messages 
  ADD CONSTRAINT non_empty_content 
  CHECK ((message_type != 'text') OR (message_type = 'text' AND LENGTH(TRIM(content)) > 0));
END $$;

-- Step 5: Update foreign key constraints to reference profiles instead of auth.users
-- First, check and update conversations table constraints
DO $$
BEGIN
  -- Check if constraints need updating
  IF EXISTS (
    SELECT 1 FROM pg_constraint pc
    JOIN pg_class pt ON pt.oid = pc.confrelid
    WHERE pc.conname = 'conversations_buyer_id_fkey' 
    AND pt.relname = 'users'
  ) THEN
    -- Drop old constraints
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey;
    ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey;
    
    -- Add new constraints
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_buyer_id_fkey 
    FOREIGN KEY (buyer_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
    ALTER TABLE conversations 
    ADD CONSTRAINT conversations_seller_id_fkey 
    FOREIGN KEY (seller_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update messages table constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint pc
    JOIN pg_class pt ON pt.oid = pc.confrelid
    WHERE pc.conname = 'messages_sender_id_fkey' 
    AND pt.relname = 'users'
  ) THEN
    -- Drop old constraint
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    
    -- Add new constraint
    ALTER TABLE messages 
    ADD CONSTRAINT messages_sender_id_fkey 
    FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 6: Create enhanced indexes if they don't exist
CREATE INDEX IF NOT EXISTS conversations_buyer_id_idx ON conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_id_idx ON conversations(seller_id);
CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON conversations(listing_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON messages(conversation_id, created_at DESC);

-- Step 7: Create functions for enhanced messaging
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

-- Step 8: Create trigger for automatic conversation updates
DROP TRIGGER IF EXISTS update_conversation_on_new_message ON messages;
CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Step 9: Function to mark messages as read
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

-- Step 10: Function to get or create conversation
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

-- Step 11: Update existing conversations to set default values
UPDATE conversations 
SET 
  status = 'active' 
WHERE status IS NULL;

UPDATE conversations 
SET 
  updated_at = created_at 
WHERE updated_at IS NULL;

-- Step 12: Update RLS policies to match new schema
-- Drop existing policies if they exist and recreate them

-- Conversations policies
DROP POLICY IF EXISTS "Users can view conversations they are part of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations where they are buyer or seller" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they are part of" ON conversations;

CREATE POLICY "Users can view conversations they are part of" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations where they are buyer or seller" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update conversations they are part of" ON conversations
  FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages policies  
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

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
