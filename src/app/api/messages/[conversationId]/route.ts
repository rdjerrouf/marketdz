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

    // Insert message using the authenticated user's session
    const { data: message, error } = await supabase
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
      console.error('❌ Send message error:', JSON.stringify(error, null, 2));
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });

      // Return detailed error for debugging
      return NextResponse.json({
        error: error.message || 'Failed to send message',
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    // Update conversation last_message_at and increment unread count
    const unreadCountField = conversation.buyer_id === user.id ? 'seller_unread_count' : 'buyer_unread_count';

    // Get current unread count and increment it
    const { data: currentConv } = await supabase
      .from('conversations')
      .select(unreadCountField)
      .eq('id', conversationId)
      .single();

    const currentCount = (currentConv as any)?.[unreadCountField] || 0;

    await supabase
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
