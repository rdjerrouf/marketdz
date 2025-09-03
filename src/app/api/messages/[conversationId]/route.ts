// src/app/api/messages/[conversationId]/route.ts

// @ts-expect-error: Ignore missing types for Supabase client
import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error: Ignore missing types for Supabase client
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Verify user is part of conversation
    // @ts-expect-error: Ignore missing types for Supabase client
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
    // Fetch messages
    // @ts-expect-error: Ignore missing types for Supabase client
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        sender_id,
        created_at,
        read_at,
        sender:profiles(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
    // Mark unread messages as read
    // @ts-expect-error: Ignore missing types for Supabase client
    const unreadIds = messages
      ?.filter((msg: any) => msg.sender_id !== user.id && !msg.read_at)
      .map((msg: any) => msg.id) || [];
    if (unreadIds.length > 0) {
      // @ts-expect-error: Ignore missing types for Supabase client
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);
    }
    return NextResponse.json({ messages: messages || [] });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const { content, messageType = 'text' } = await request.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Verify access
    // @ts-expect-error: Ignore missing types for Supabase client
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
    // Send message
    // @ts-expect-error: Ignore missing types for Supabase client
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        message_type: messageType
      })
      .select(`
        id,
        content,
        message_type,
        sender_id,
        created_at,
        read_at,
        sender:profiles(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();
    if (error) {
      console.error('Send message error:', error);
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
    // Update conversation timestamp
    // @ts-expect-error: Ignore missing types for Supabase client
    await supabase
      .from('conversations')
      .update({ last_message_at: message.created_at })
      .eq('id', conversationId);
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
