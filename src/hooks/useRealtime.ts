// Real-time messaging hooks for MarketDZ
// Optimized for performance and proper connection management

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUser } from './useUser'

// Types
interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

interface Conversation {
  id: string
  buyer_id: string
  seller_id: string
  listing_id: string | null
  last_message_id: string | null
  last_message_at: string
  buyer_unread_count: number
  seller_unread_count: number
  status: string
  created_at: string
  updated_at: string
}

// Hook for real-time messaging in a specific conversation
export const useRealtimeMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  // Load initial messages
  useEffect(() => {
    if (!conversationId || !user) return

    const loadMessages = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
      setLoading(false)
    }

    loadMessages()
  }, [conversationId, user])

  // Real-time subscription for new messages
  useEffect(() => {
    if (!conversationId || !user) return

    const channel = supabase
      .channel(`messages_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          setMessages(prev => [...prev, newMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, user])

  const sendMessage = useCallback(async (content: string) => {
    if (!conversationId || !user || !content.trim()) return

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim()
      })

    if (error) {
      console.error('Error sending message:', error)
      throw error
    }
  }, [conversationId, user])

  const markAsRead = useCallback(async () => {
    if (!conversationId || !user) return

    const { error } = await supabase.rpc('mark_messages_read', {
      conversation_uuid: conversationId
    })

    if (error) {
      console.error('Error marking messages as read:', error)
    }
  }, [conversationId, user])

  return {
    messages,
    loading,
    sendMessage,
    markAsRead
  }
}

// Hook for user's conversation list with real-time updates
export const useRealtimeConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  // Load initial conversations
  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          listings(title, photos),
          buyer:profiles!conversations_buyer_id_fkey(first_name, last_name, avatar_url),
          seller:profiles!conversations_seller_id_fkey(first_name, last_name, avatar_url)
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      if (!error && data) {
        setConversations(data)
      }
      setLoading(false)
    }

    loadConversations()
  }, [user])

  // Real-time subscription for conversation updates
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`conversations_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `buyer_id.eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setConversations(prev => 
              prev.map(conv => 
                conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
              )
            )
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'conversations',
          filter: `seller_id.eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setConversations(prev =>
              prev.map(conv =>
                conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const createConversation = useCallback(async (sellerId: string, listingId?: string) => {
    if (!user) return null

    // Check if conversation already exists
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerId)

    if (listingId) {
      query = query.eq('listing_id', listingId)
    } else {
      query = query.is('listing_id', null)
    }

    const { data: existing } = await query.single()

    if (existing) {
      return existing.id
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        buyer_id: user.id,
        seller_id: sellerId,
        listing_id: listingId || null
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      throw error
    }

    return data.id
  }, [user])

  return {
    conversations,
    loading,
    createConversation
  }
}

// Hook for real-time notifications
export const useRealtimeNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  // Load initial notifications
  useEffect(() => {
    if (!user) return

    const loadNotifications = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter(n => !n.read_at).length)
      }
      setLoading(false)
    }

    loadNotifications()
  }, [user])

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new
          setNotifications(prev => [newNotification, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const markAsRead = useCallback(async (notificationId: string) => {
    const { error } = await supabase.rpc('mark_notification_read', {
      notification_id: notificationId
    })

    if (!error) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const { error } = await supabase.rpc('mark_all_notifications_read')

    if (!error) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      )
      setUnreadCount(0)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead
  }
}
