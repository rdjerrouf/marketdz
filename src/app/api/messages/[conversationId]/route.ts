// src/app/api/messages/[conversationId]/route.ts - Updated for new messaging schema

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const before = searchParams.get('before');

    const supabase = await createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is part of conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build query for messages
    let query = supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        read_at,
        created_at,
        sender:profiles(
          id,
          first_name,
          last_name
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Mark unread messages as read (simplified version)
    const unreadMessages = (messages || []).filter(
      (msg: any) => msg.sender_id !== user.id && !msg.read_at
    );
    
    if (unreadMessages.length > 0) {
      const unreadIds = unreadMessages.map((msg: any) => msg.id);
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      // Update conversation unread counts
      const updateField = conversation.buyer_id === user.id 
        ? 'buyer_unread_count' 
        : 'seller_unread_count';
      
      await supabase
        .from('conversations')
        .update({ 
          [updateField]: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);
    }

    // Return messages in chronological order (oldest first)
    const sortedMessages = (messages || []).reverse();
    
    return NextResponse.json({ 
      messages: sortedMessages,
      hasMore: messages?.length === limit
    });

  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const { content } = await request.json();
    
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify access to conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id, listing_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Use service role key to bypass RLS policies temporarily
    const { createClient: createServiceClient } = await import('@supabase/supabase-js');
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Insert message using service role to bypass trigger issues
    const { data: message, error } = await serviceSupabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        read_at,
        created_at,
        sender:profiles(
          id,
          first_name,
          last_name
        )
      `)
      .single();

    if (error) {
      console.error('Send message error:', error);
      // Check if error is related to notifications - provide helpful error
      if (error.message && error.message.includes('notifications')) {
        console.log('Notification error detected. The message trigger is blocking message creation.');
        
        // For now, return a clear error message
        return NextResponse.json({ 
          error: 'Unable to send message due to notification system configuration. Please contact support to resolve this issue.',
          code: 'NOTIFICATION_TRIGGER_ERROR',
          details: 'The database trigger for message notifications is preventing message creation due to RLS policy conflicts.'
        }, { status: 503 });
      } else {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
      }
    }

    // Update conversation last_message_at and increment unread count using service role
    const unreadCountField = conversation.buyer_id === user.id ? 'seller_unread_count' : 'buyer_unread_count';
    
    // Get current unread count and increment it
    const { data: currentConv } = await serviceSupabase
      .from('conversations')
      .select(unreadCountField)
      .eq('id', conversationId)
      .single();
    
    const currentCount = (currentConv as any)?.[unreadCountField] || 0;
    
    await serviceSupabase
      .from('conversations')
      .update({ 
        last_message_at: message.created_at,
        last_message_id: message.id,
        [unreadCountField]: currentCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
