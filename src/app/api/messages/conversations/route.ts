// src/app/api/messages/conversations/route.ts - Updated for new messaging system
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch conversations for the current user
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        id,
        buyer_id,
        seller_id,
        listing_id,
        last_message_id,
        last_message_at,
        buyer_unread_count,
        seller_unread_count,
        status,
        created_at,
        updated_at
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq('status', 'active')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Get unique user IDs to fetch profiles
    const userIds = new Set<string>();
    (conversations || []).forEach((conv: any) => {
      if (conv.buyer_id !== user.id) userIds.add(conv.buyer_id);
      if (conv.seller_id !== user.id) userIds.add(conv.seller_id);
    });

    // Fetch user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, avatar_url')
      .in('id', Array.from(userIds));

    if (profileError) {
      console.error('Error fetching profiles:', profileError);
      // Don't fail the request if profiles can't be fetched
    }

    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    // Combine conversations with user profiles
    const processedConversations = (conversations || []).map((conv: any) => ({
      ...conv,
      other_user: profileMap.get(conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id)
    }));

    return NextResponse.json({ conversations: processedConversations });

  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { buyer_id, seller_id, listing_id } = await request.json();
    
    if (!buyer_id || !seller_id) {
      return NextResponse.json({ error: 'buyer_id and seller_id are required' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.id !== buyer_id && user.id !== seller_id) {
      return NextResponse.json({ error: 'You must be either the buyer or seller' }, { status: 403 });
    }

    // Check if conversation already exists
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', buyer_id)
      .eq('seller_id', seller_id);

    if (listing_id) {
      query = query.eq('listing_id', listing_id);
    } else {
      query = query.is('listing_id', null);
    }

    const { data: existingConv, error: findError } = await query.single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('Error checking existing conversation:', findError);
      return NextResponse.json({ error: 'Failed to check existing conversation' }, { status: 500 });
    }

    if (existingConv) {
      return NextResponse.json({ conversation_id: existingConv.id });
    }

    // If listing_id is provided, verify it exists
    if (listing_id) {
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('id, status, user_id')
        .eq('id', listing_id)
        .single();

      if (listingError || !listing) {
        return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
      }

      if (listing.status !== 'active') {
        return NextResponse.json({ error: 'Listing is not active' }, { status: 400 });
      }
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        buyer_id,
        seller_id,
        listing_id: listing_id || null,
        last_message_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({ conversation_id: newConv.id });

  } catch (error) {
    console.error('Conversations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}