// Temporary API endpoint to fix notification policies
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);
    
    // Drop the existing restrictive policy
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "System can create notifications" ON notifications;
        
        CREATE POLICY "Allow notification creation via functions" ON notifications
        FOR INSERT WITH CHECK (
          auth.uid() IS NOT NULL
        );
        
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
        
        CREATE OR REPLACE FUNCTION notify_on_new_message()
        RETURNS TRIGGER 
        SECURITY DEFINER
        AS $$
        DECLARE
          recipient_id UUID;
          sender_name TEXT;
        BEGIN
          SELECT CASE 
            WHEN buyer_id = NEW.sender_id THEN seller_id
            ELSE buyer_id
          END INTO recipient_id
          FROM conversations
          WHERE id = NEW.conversation_id;
          
          IF recipient_id IS NULL THEN
            RETURN NEW;
          END IF;
          
          SELECT COALESCE(first_name || ' ' || last_name, 'Someone')
          INTO sender_name
          FROM profiles
          WHERE id = NEW.sender_id;
          
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
              RAISE NOTICE 'Failed to create notification: %', SQLERRM;
          END;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    return NextResponse.json({ success: true, message: 'Notification policies fixed' });
    
  } catch (error) {
    console.error('Fix notifications error:', error);
    return NextResponse.json({ 
      error: 'Failed to fix notifications', 
      details: error 
    }, { status: 500 });
  }
}