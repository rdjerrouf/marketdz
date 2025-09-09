-- Create a function to insert messages without triggering notifications
-- This bypasses the problematic notification trigger

CREATE OR REPLACE FUNCTION create_message_safe(
  p_conversation_id UUID,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS TABLE (
  id UUID,
  conversation_id UUID,
  sender_id UUID,
  content TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  sender_first_name TEXT,
  sender_last_name TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Disable the trigger temporarily for this transaction
  SET session_replication_role = replica;
  
  -- Insert the message
  RETURN QUERY
  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (p_conversation_id, p_sender_id, p_content)
  RETURNING 
    messages.id,
    messages.conversation_id,
    messages.sender_id,
    messages.content,
    messages.read_at,
    messages.created_at,
    profiles.first_name,
    profiles.last_name
  FROM messages
  LEFT JOIN profiles ON messages.sender_id = profiles.id
  WHERE messages.id = (
    SELECT messages.id FROM messages WHERE conversation_id = p_conversation_id ORDER BY created_at DESC LIMIT 1
  );
  
  -- Re-enable triggers
  SET session_replication_role = DEFAULT;
  
END;
$$;