-- Real-time notifications system for MarketDZ
-- Handles notifications for reviews, favorites, and other events

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'review', 'favorite', 'message', 'listing_sold'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT notifications_type_check CHECK (
    type IN ('review', 'favorite', 'message', 'listing_sold', 'listing_expired')
  )
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT USING (auth.uid() = user_id);

-- RLS Policy: System can create notifications (via functions)
CREATE POLICY "System can create notifications" ON notifications
FOR INSERT WITH CHECK (true);

-- RLS Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Indexes for efficient notification queries
CREATE INDEX idx_notifications_user_unread 
ON notifications (user_id, read_at, created_at DESC) 
WHERE read_at IS NULL;

CREATE INDEX idx_notifications_user_all 
ON notifications (user_id, created_at DESC);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  notification_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET read_at = NOW()
  WHERE id = notification_id 
    AND user_id = auth.uid()
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET read_at = NOW()
  WHERE user_id = auth.uid()
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for new review notifications
CREATE OR REPLACE FUNCTION notify_on_new_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for the reviewed user
  PERFORM create_notification(
    NEW.reviewed_id,
    'review',
    'New Review Received',
    'You received a new ' || NEW.rating || '-star review!',
    jsonb_build_object(
      'review_id', NEW.id,
      'reviewer_id', NEW.reviewer_id,
      'rating', NEW.rating
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for review notifications
DROP TRIGGER IF EXISTS on_review_created ON reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_review();

-- Trigger function for favorite notifications
CREATE OR REPLACE FUNCTION notify_on_new_favorite()
RETURNS TRIGGER AS $$
DECLARE
  listing_owner UUID;
  listing_title TEXT;
BEGIN
  -- Get listing owner and title
  SELECT user_id, title INTO listing_owner, listing_title
  FROM listings 
  WHERE id = NEW.listing_id;
  
  -- Don't notify if user favorites their own listing
  IF listing_owner != NEW.user_id THEN
    PERFORM create_notification(
      listing_owner,
      'favorite',
      'Listing Favorited',
      'Someone added "' || listing_title || '" to their favorites!',
      jsonb_build_object(
        'listing_id', NEW.listing_id,
        'favorited_by', NEW.user_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for favorite notifications  
DROP TRIGGER IF EXISTS on_favorite_created ON favorites;
CREATE TRIGGER on_favorite_created
  AFTER INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_favorite();

-- Trigger function for message notifications
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
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
  
  -- Get sender name
  SELECT COALESCE(first_name || ' ' || last_name, 'Someone')
  INTO sender_name
  FROM profiles
  WHERE id = NEW.sender_id;
  
  -- Create notification
  PERFORM create_notification(
    recipient_id,
    'message',
    'New Message',
    sender_name || ' sent you a message',
    jsonb_build_object(
      'message_id', NEW.id,
      'conversation_id', NEW.conversation_id,
      'sender_id', NEW.sender_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for message notifications
DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_new_message();
