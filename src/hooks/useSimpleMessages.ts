/**
 * useSimpleMessages Hooks - Simplified Messaging for Debugging
 *
 * WHY THIS EXISTS:
 * - Simpler alternative to useMessages (which has caching, real-time, pagination)
 * - Better for debugging messaging issues
 * - Explicit logging for troubleshooting
 *
 * HOOKS:
 * - useConversations: List all user's conversations
 * - useConversationMessages: Messages for specific conversation
 * - useStartConversation: Create new conversation with initial message
 *
 * NOTE: For production features, prefer useMessages (has caching + real-time)
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from './useUser';
import { supabase } from '@/lib/supabase/client';

// Simple interfaces for debugging
export interface SimpleMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export interface SimpleConversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id?: string;
  last_message_at: string;
  status: string;
  other_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

// Simple hook for conversations list
export function useConversations() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<SimpleConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    if (!user) {
      console.log('👤 No user, skipping conversations fetch');
      setLoading(false);
      return;
    }

    try {
      console.log('📱 Fetching conversations for user:', user.id);
      setLoading(true);
      setError(null);

      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('📱 Added auth header for conversations');
      }

      const response = await fetch('/api/messages/conversations', {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📱 Conversations response:', data);

      setConversations(data.conversations || []);
    } catch (err) {
      console.error('❌ Conversations fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [user]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations
  };
}

// Simple hook for messages in a conversation
export function useConversationMessages(conversationId: string | null) {
  const { user } = useUser();
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    if (!conversationId || !user) {
      console.log('💬 No conversation or user, skipping messages fetch');
      setMessages([]);
      return;
    }

    try {
      console.log('💬 Fetching messages for conversation:', conversationId);
      setLoading(true);
      setError(null);

      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('💬 Added auth header for messages');
      }

      const response = await fetch(`/api/messages/${conversationId}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('💬 Messages response:', data);

      setMessages(data.messages || []);
    } catch (err) {
      console.error('❌ Messages fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!conversationId || !user || !content.trim()) {
      console.log('💬 Cannot send message: missing data');
      return false;
    }

    try {
      console.log('📤 Sending message:', { conversationId, content: content.substring(0, 50) + '...' });
      setSending(true);
      setError(null);

      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('📤 Added auth header for send message');
      }

      const response = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📤 Message sent successfully:', data);

      // Add the new message to the list
      if (data.message) {
        setMessages(prev => [data.message, ...prev]);
      }

      // Refresh messages to get the latest state
      await fetchMessages();
      
      return true;
    } catch (err) {
      console.error('❌ Send message error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId, user]);

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    refetch: fetchMessages
  };
}

// Simple hook to start a new conversation
export function useStartConversation() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startConversation = async (listingId: string, sellerId: string, initialMessage: string) => {
    if (!user) {
      console.log('👤 No user, cannot start conversation');
      return null;
    }

    try {
      console.log('🆕 Starting conversation:', { listingId, sellerId, initialMessage: initialMessage.substring(0, 50) + '...' });
      setLoading(true);
      setError(null);

      // Get current session to include token
      const { data: { session } } = await supabase.auth.getSession();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if we have a session
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('🆕 Added auth header for start conversation');
      }

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          listing_id: listingId,
          seller_id: sellerId,
          initial_message: initialMessage
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🆕 Conversation started:', data);

      return data.conversation;
    } catch (err) {
      console.error('❌ Start conversation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start conversation');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    startConversation,
    loading,
    error
  };
}
