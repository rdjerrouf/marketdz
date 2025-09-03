// src/app/api/messages/conversations/route.ts - Fixed for your setup
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        listing_id,
        buyer_id,
        seller_id,
        last_message_at,
        listing:listing_id(
          id,
          title,
          price,
          photos,
          status,
          category
        ),
        buyer:buyer_id(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        seller:seller_id(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    return NextResponse.json({ conversations: conversations || [] });

  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { listingId, sellerId } = await request.json();
    
    if (!listingId || !sellerId) {
      return NextResponse.json({ error: 'Listing ID and seller ID are required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id === sellerId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerId)
      .maybeSingle();

    if (existingConversation) {
      return NextResponse.json({ conversationId: existingConversation.id });
    }

    // Verify listing exists and is active
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, status, user_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing || listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing not found or inactive' }, { status: 404 });
    }

    if (listing.user_id !== sellerId) {
      return NextResponse.json({ error: 'Invalid seller for this listing' }, { status: 400 });
    }

    // Create new conversation
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
        last_message_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Create conversation error:', error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({ conversationId: conversation.id });

  } catch (error) {
    console.error('Conversations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}