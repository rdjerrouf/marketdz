-- Temporarily disable message notifications trigger due to RLS policy conflicts
-- This allows messages to be sent while we fix the notification system

DROP TRIGGER IF EXISTS on_message_created ON messages;

-- Add comment explaining the temporary fix
COMMENT ON TABLE messages IS 'Message notifications trigger temporarily disabled - messages will send but no notifications will be created';