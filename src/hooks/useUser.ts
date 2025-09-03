// src/hooks/useUser.ts - Missing hook
'use client';

import { useState, useEffect } from 'react';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  return { user, loading };
}

// src/hooks/useMessages.ts - Corrected for your setup
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { createClientComponentClient } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: string;
  message_type: 'text' | 'image' | 'system';
  sender_id: string;
  created_at: string;
  read_at: string | null;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  listing: {
    id: string;
    title: string;
    price: number;
    photos: string[];
    status: string;
    category: string;
  };
  buyer: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
  seller: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export function useMessages(conversationId?: string) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/messages/conversations');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setConversations(data.conversations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (convId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/messages/${convId}`);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendMessage = async (convId: string, content: string) => {
    if (!user || !content.trim()) return false;

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${convId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      setMessages(prev => [...prev, data.message]);
      await fetchConversations();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  };

  const startConversation = async (listingId: string, sellerId: string) => {
    if (!user) return null;

    try {
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, sellerId })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);
      return data.conversationId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      return null;
    }
  };

  // Real-time subscription
  useEffect(() => {
    if (!user || !conversationId) return;

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch complete message with sender info
          const { data: newMessage } = await supabase
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
            .eq('id', payload.new.id)
            .single();

          if (newMessage && newMessage.sender_id !== user.id) {
            setMessages(prev => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, conversationId, supabase]);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  useEffect(() => {
    if (conversationId && user) {
      fetchMessages(conversationId);
    }
  }, [conversationId, user, fetchMessages]);

  return {
    messages,
    conversations,
    loading,
    sending,
    error,
    sendMessage,
    startConversation,
    fetchConversations,
    fetchMessages
  };
}

// src/app/api/messages/[conversationId]/route.ts - Fixed
import { NextRequest, NextResponse } from 'next/server';
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
    const unreadIds = messages
      ?.filter(msg => msg.sender_id !== user.id && !msg.read_at)
      .map(msg => msg.id) || [];

    if (unreadIds.length > 0) {
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