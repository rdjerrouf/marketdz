// src/lib/notifications/push.ts
import { supabase } from '@/lib/supabase/client'

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  requireInteraction?: boolean
  actions?: NotificationAction[]
  data?: Record<string, unknown>
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

// Temporary storage for push subscriptions (until database tables are created)
const pushSubscriptions = new Map<string, PushSubscription>()

// Store push subscription temporarily
export const storePushSubscription = async (userId: string, subscription: PushSubscription) => {
  try {
    // Store in memory for now (replace with database call after running SQL migration)
    pushSubscriptions.set(userId, subscription)
    
    // TODO: Replace with database storage after running admin_tables.sql
    // const { error } = await supabase
    //   .from('push_subscriptions')
    //   .upsert({
    //     user_id: userId,
    //     subscription: JSON.stringify(subscription),
    //     created_at: new Date().toISOString(),
    //     updated_at: new Date().toISOString()
    //   }, {
    //     onConflict: 'user_id'
    //   })

    console.log('Push subscription stored for user:', userId)
    return { success: true }
  } catch (error) {
    console.error('Error storing push subscription:', error)
    return { success: false, error }
  }
}

// Send push notification to specific user
export const sendPushNotification = async (
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; result?: unknown; error?: unknown }> => {
  try {
    // Get subscription from temporary storage
    const subscription = pushSubscriptions.get(userId)
    
    if (!subscription) {
      return { success: false, error: 'No push subscription found for user' }
    }

    // Call backend API to send the push notification
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription,
        payload
      })
    })

    const result = await response.json()

    // Log notification using profiles table for now
    await logNotificationToProfile(userId, payload)

    return { success: true, result }
  } catch (error) {
    console.error('Error sending push notification:', error)
    return { success: false, error }
  }
}

// Send push notification to multiple users
export const sendBulkPushNotification = async (
  userIds: string[],
  payload: PushNotificationPayload
): Promise<{ success: boolean; results?: unknown[]; error?: unknown }> => {
  try {
    const results = await Promise.all(
      userIds.map(userId => sendPushNotification(userId, payload))
    )

    return { success: true, results }
  } catch (error) {
    console.error('Error sending bulk push notifications:', error)
    return { success: false, error }
  }
}

// Temporary notification logging (until notifications table is created)
const logNotificationToProfile = async (userId: string, payload: PushNotificationPayload) => {
  try {
    // For now, just log to console
    console.log(`Notification sent to ${userId}:`, payload)
    
    // TODO: Replace with proper notifications table after running SQL migration
    // await supabase
    //   .from('notifications')
    //   .insert({
    //     user_id: userId,
    //     type: 'push',
    //     title: payload.title,
    //     message: payload.body,
    //     data: payload.data || {},
    //     sent_at: new Date().toISOString(),
    //     read: false
    //   })
  } catch (error) {
    console.error('Error logging notification:', error)
  }
}

// Request permission and register service worker
export const initializePushNotifications = async (): Promise<{ success: boolean; subscription?: PushSubscription; error?: unknown }> => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications')
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      throw new Error('This browser does not support service workers')
    }

    // Request permission
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission denied')
    }

    // Register service worker
    const registration = await navigator.serviceWorker.register('/push-sw.js')

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    })

    return { success: true, subscription }
  } catch (error) {
    console.error('Error initializing push notifications:', error)
    return { success: false, error }
  }
}

// Unsubscribe from push notifications
export const unsubscribeFromPush = async (userId: string): Promise<{ success: boolean; error?: unknown }> => {
  try {
    // Remove from temporary storage
    pushSubscriptions.delete(userId)
    
    // TODO: Replace with database deletion after running SQL migration
    // const { error } = await supabase
    //   .from('push_subscriptions')
    //   .delete()
    //   .eq('user_id', userId)

    // Unsubscribe from browser
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    
    if (subscription) {
      await subscription.unsubscribe()
    }

    return { success: true }
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error)
    return { success: false, error }
  }
}

// Predefined notification templates
export const NotificationTemplates = {
  newMessage: (senderName: string): PushNotificationPayload => ({
    title: 'New Message',
    body: `${senderName} sent you a message`,
    icon: '/icons/message.png',
    tag: 'new-message',
    data: { type: 'message' }
  }),

  listingApproved: (listingTitle: string): PushNotificationPayload => ({
    title: 'Listing Approved',
    body: `Your listing "${listingTitle}" has been approved`,
    icon: '/icons/approved.png',
    tag: 'listing-approved',
    data: { type: 'listing' }
  }),

  listingRejected: (listingTitle: string, reason: string): PushNotificationPayload => ({
    title: 'Listing Rejected',
    body: `Your listing "${listingTitle}" was rejected: ${reason}`,
    icon: '/icons/rejected.png',
    tag: 'listing-rejected',
    data: { type: 'listing' }
  }),

  favoriteListingUpdated: (listingTitle: string): PushNotificationPayload => ({
    title: 'Favorite Updated',
    body: `"${listingTitle}" has been updated`,
    icon: '/icons/favorite.png',
    tag: 'favorite-updated',
    data: { type: 'favorite' }
  }),

  priceDropAlert: (listingTitle: string, newPrice: number): PushNotificationPayload => ({
    title: 'Price Drop Alert',
    body: `"${listingTitle}" price dropped to ${newPrice} DA`,
    icon: '/icons/price-drop.png',
    tag: 'price-drop',
    data: { type: 'price-drop' }
  })
}
