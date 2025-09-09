-- Fix notification policies to allow message notifications
-- This fixes the RLS policy issue preventing message notifications

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Create a more permissive policy for system functions
CREATE POLICY "Allow notification creation via functions" ON notifications
FOR INSERT WITH CHECK (
  -- Allow inserts from authenticated users (covers trigger functions)
  auth.uid() IS NOT NULL
);

-- Update the create_notification function to run with definer rights
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_data JSONB DEFAULT '{}'
)
RETURNS UUID 
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Update the message notification function to be more robust
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get recipient (the other person in conversation)
  SELECT CASE 
    WHEN buyer_id = NEW.sender_id THEN seller_id
    ELSE buyer_id
  END INTO recipient_id
  FROM conversations
  WHERE id = NEW.conversation_id;
  
  -- Skip notification if no recipient found
  IF recipient_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get sender name
  SELECT COALESCE(first_name || ' ' || last_name, 'Someone')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification (ignore errors to prevent blocking message creation)
  BEGIN
    PERFORM create_notification(
      recipient_id,
      'message',
      'New Message',
      COALESCE(sender_name, 'Someone') || ' sent you a message',
      jsonb_build_object(
        'message_id', NEW.id,
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id
      )
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the message creation
      RAISE NOTICE 'Failed to create notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;