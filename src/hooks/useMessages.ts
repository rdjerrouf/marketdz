// src/hooks/useMessages.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { createClient } from '@/lib/supabase/client';

// You should define these interfaces in a types file and import them
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
  const supabase = createClient();

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
        async (payload: any) => {
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
