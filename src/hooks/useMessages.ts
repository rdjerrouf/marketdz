// src/hooks/useMessages.ts - Comprehensive messaging hook with caching and real-time
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useUser } from './useUser';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, any>;
  read_at?: string;
  edited_at?: string;
  deleted_at?: string;
  created_at: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

export interface Conversation {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string | null;
  last_message_id: string | null;
  last_message_at: string;
  buyer_unread_count: number;
  seller_unread_count: number;
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
  updated_at: string;
  last_message?: Message;
  other_user?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

interface MessageCache {
  [conversationId: string]: {
    messages: Message[];
    hasMore: boolean;
    oldestMessageId?: string;
    loading: boolean;
  };
}

export const useMessages = (conversationId?: string) => {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messageCache, setMessageCache] = useState<MessageCache>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for subscription management
  const conversationSubscription = useRef<any>(null);
  const messageSubscriptions = useRef<Map<string, any>>(new Map());

  // Get messages for a specific conversation with caching
  const getMessages = useCallback(async (
    convId: string, 
    limit: number = 20, 
    before?: string
  ): Promise<Message[]> => {
    if (!user) return [];

    try {
      let query = supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata,
          read_at,
          edited_at,
          deleted_at,
          created_at,
          sender:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('conversation_id', convId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before);
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      return (messages || []).reverse() as Message[]; // Reverse to show oldest first
    } catch (err) {
      console.error('Error fetching messages:', err);
      throw err;
    }
  }, [user]);

  // Load initial messages for a conversation
  const loadMessages = useCallback(async (convId: string) => {
    if (!user || messageCache[convId]?.loading) return;

    setMessageCache(prev => ({
      ...prev,
      [convId]: { 
        ...prev[convId], 
        loading: true 
      }
    }));

    try {
      const messages = await getMessages(convId, 20);
      
      setMessageCache(prev => ({
        ...prev,
        [convId]: {
          messages,
          hasMore: messages.length === 20,
          oldestMessageId: messages[0]?.id,
          loading: false
        }
      }));

      // Mark messages as read
      await markAsRead(convId);
    } catch (err) {
      setError('Failed to load messages');
      setMessageCache(prev => ({
        ...prev,
        [convId]: { 
          ...prev[convId], 
          loading: false 
        }
      }));
    }
  }, [user, messageCache, getMessages]);

  // Load older messages (pagination)
  const loadOlderMessages = useCallback(async (convId: string) => {
    const cache = messageCache[convId];
    if (!user || !cache || cache.loading || !cache.hasMore) return;

    setMessageCache(prev => ({
      ...prev,
      [convId]: { ...prev[convId], loading: true }
    }));

    try {
      const oldestMessage = cache.messages[0];
      if (!oldestMessage) return;

      const olderMessages = await getMessages(convId, 20, oldestMessage.created_at);
      
      setMessageCache(prev => ({
        ...prev,
        [convId]: {
          ...prev[convId],
          messages: [...olderMessages, ...prev[convId].messages],
          hasMore: olderMessages.length === 20,
          oldestMessageId: olderMessages[0]?.id,
          loading: false
        }
      }));
    } catch (err) {
      setError('Failed to load older messages');
      setMessageCache(prev => ({
        ...prev,
        [convId]: { ...prev[convId], loading: false }
      }));
    }
  }, [user, messageCache, getMessages]);

  // Send a message
  const sendMessage = useCallback(async (
    convId: string,
    content: string,
    type: 'text' | 'image' | 'file' | 'system' = 'text',
    metadata?: Record<string, any>
  ) => {
    if (!user || !content.trim()) return null;

    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: convId,
          sender_id: user.id,
          content: content.trim(),
          message_type: type,
          metadata: metadata || {}
        })
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          message_type,
          metadata,
          read_at,
          created_at,
          sender:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return message as Message;
    } catch (err) {
      setError('Failed to send message');
      console.error('Error sending message:', err);
      return null;
    }
  }, [user]);

  // Mark messages as read (simplified version without RPC)
  const markAsRead = useCallback(async (convId: string) => {
    if (!user) return;

    try {
      // Update messages to mark as read
      const { error: messageError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', convId)
        .neq('sender_id', user.id)
        .is('read_at', null);

      if (messageError) throw messageError;

      // Update conversation unread counts
      const { error: convError } = await supabase
        .from('conversations')
        .update({
          buyer_unread_count: 0,
          seller_unread_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', convId);

      if (convError) throw convError;

      // Update local cache
      setMessageCache(prev => {
        const cache = prev[convId];
        if (!cache) return prev;

        const updatedMessages = cache.messages.map(msg => 
          msg.sender_id !== user.id && !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        );

        return {
          ...prev,
          [convId]: {
            ...cache,
            messages: updatedMessages
          }
        };
      });

      // Update conversation unread count
      setConversations(prev => 
        prev.map(conv => 
          conv.id === convId
            ? {
                ...conv,
                buyer_unread_count: 0,
                seller_unread_count: 0
              }
            : conv
        )
      );
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user]);

  // Get or create conversation (simplified without RPC)
  const getOrCreateConversation = useCallback(async (
    buyerId: string,
    sellerId: string,
    listingId?: string
  ) => {
    if (!user) return null;

    try {
      // First try to find existing conversation
      let query = supabase
        .from('conversations')
        .select('id')
        .eq('buyer_id', buyerId)
        .eq('seller_id', sellerId);

      if (listingId) {
        query = query.eq('listing_id', listingId);
      } else {
        query = query.is('listing_id', null);
      }

      const { data: existing, error: findError } = await query.single();

      if (findError && findError.code !== 'PGRST116') {
        throw findError;
      }

      if (existing) {
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          buyer_id: buyerId,
          seller_id: sellerId,
          listing_id: listingId,
          last_message_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (createError) throw createError;

      return newConv.id;
    } catch (err) {
      setError('Failed to create conversation');
      console.error('Error creating conversation:', err);
      return null;
    }
  }, [user]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
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

      if (error) throw error;

      // Fetch other user profiles separately
      const userIds = new Set<string>();
      (conversations || []).forEach((conv: Conversation) => {
        if (conv.buyer_id !== user.id) userIds.add(conv.buyer_id);
        if (conv.seller_id !== user.id) userIds.add(conv.seller_id);
      });

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', Array.from(userIds));

      if (profileError) throw profileError;

      type ProfileData = { id: string; first_name: string; last_name: string; avatar_url: string | null };
      const profileMap = new Map(profiles?.map((p: ProfileData) => [p.id, p]) || []);

      const processedConversations = (conversations || []).map((conv: Conversation) => ({
        ...conv,
        other_user: profileMap.get(conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id)
      }));

      setConversations(processedConversations as Conversation[]);
    } catch (err) {
      setError('Failed to load conversations');
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!user) return;

    // Subscribe to conversation changes
    conversationSubscription.current = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `or(buyer_id.eq.${user.id},seller_id.eq.${user.id})`
        },
        (payload: RealtimePostgresChangesPayload<Conversation>) => {
          if (payload.eventType === 'INSERT') {
            // Fetch the complete conversation data
            fetchConversations();
          } else if (payload.eventType === 'UPDATE') {
            const updatedConv = payload.new as Conversation;
            setConversations(prev =>
              prev.map(conv =>
                conv.id === updatedConv.id
                  ? { ...conv, ...updatedConv } as Conversation
                  : conv
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (conversationSubscription.current) {
        supabase.removeChannel(conversationSubscription.current);
      }
    };
  }, [user, fetchConversations]);

  // Subscribe to real-time messages for active conversation
  useEffect(() => {
    if (!user || !conversationId) return;

    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload: RealtimePostgresChangesPayload<Message>) => {
          // Fetch complete message data
          const newMessage = payload.new as Message;
          const { data: message, error } = await supabase
            .from('messages')
            .select(`
              id,
              conversation_id,
              sender_id,
              content,
              message_type,
              metadata,
              read_at,
              created_at,
              sender:profiles(
                id,
                first_name,
                last_name,
                avatar_url
              )
            `)
            .eq('id', newMessage.id)
            .single();

          if (!error && message) {
            setMessageCache(prev => {
              const cache = prev[conversationId];
              if (!cache) return prev;

              return {
                ...prev,
                [conversationId]: {
                  ...cache,
                  messages: [...cache.messages, message as Message]
                }
              };
            });

            // Auto-mark as read if message is from other user
            if ((message as Message).sender_id !== user.id) {
              setTimeout(() => markAsRead(conversationId), 1000);
            }
          }
        }
      )
      .subscribe();

    messageSubscriptions.current.set(conversationId, subscription);

    return () => {
      const sub = messageSubscriptions.current.get(conversationId);
      if (sub) {
        supabase.removeChannel(sub);
        messageSubscriptions.current.delete(conversationId);
      }
    };
  }, [user, conversationId, markAsRead]);

  // Initial load
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user, fetchConversations]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId && user && !messageCache[conversationId]) {
      loadMessages(conversationId);
    }
  }, [conversationId, user, loadMessages, messageCache]);

  const currentMessages = conversationId ? messageCache[conversationId]?.messages || [] : [];
  const hasMoreMessages = conversationId ? messageCache[conversationId]?.hasMore || false : false;
  const isLoadingMessages = conversationId ? messageCache[conversationId]?.loading || false : false;

  return {
    // Data
    conversations,
    messages: currentMessages,
    
    // State
    isLoading,
    isLoadingMessages,
    hasMoreMessages,
    error,
    
    // Actions
    sendMessage,
    markAsRead,
    loadOlderMessages,
    getOrCreateConversation,
    refreshConversations: fetchConversations,
    
    // Utils
    clearError: () => setError(null)
  };
};
