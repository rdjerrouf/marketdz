import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  data: Record<string, any>
  channels: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Process notification queue
    const { data: notifications, error } = await supabaseClient
      .from('notification_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10)

    if (error) throw error

    const results = []

    for (const notification of notifications) {
      try {
        // Mark as processing
        await supabaseClient
          .from('notification_queue')
          .update({ 
            status: 'processing', 
            last_attempt_at: new Date().toISOString(),
            attempts: notification.attempts + 1 
          })
          .eq('id', notification.id)

        // Process each channel
        const deliveryResults = await Promise.allSettled(
          notification.channels.map(channel => 
            deliverNotification(notification, channel, supabaseClient)
          )
        )

        const allSucceeded = deliveryResults.every(result => result.status === 'fulfilled')

        if (allSucceeded) {
          // Mark as delivered
          await supabaseClient
            .from('notification_queue')
            .update({ 
              status: 'delivered',
              delivered_at: new Date().toISOString()
            })
            .eq('id', notification.id)

          results.push({ id: notification.id, status: 'delivered' })
        } else {
          // Handle partial failures or retry logic
          const failedChannels = deliveryResults
            .map((result, index) => result.status === 'rejected' ? notification.channels[index] : null)
            .filter(Boolean)

          if (notification.attempts >= 3) {
            // Max retries reached
            await supabaseClient
              .from('notification_queue')
              .update({ 
                status: 'failed',
                error_message: `Failed channels: ${failedChannels.join(', ')}`
              })
              .eq('id', notification.id)
            
            results.push({ id: notification.id, status: 'failed', error: failedChannels })
          } else {
            // Schedule retry in 5 minutes
            await supabaseClient
              .from('notification_queue')
              .update({ 
                status: 'pending',
                scheduled_for: new Date(Date.now() + 5 * 60 * 1000).toISOString()
              })
              .eq('id', notification.id)
            
            results.push({ id: notification.id, status: 'retry_scheduled' })
          }
        }

      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error)
        results.push({ id: notification.id, status: 'error', error: error.message })
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: notifications.length,
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

async function deliverNotification(
  notification: NotificationPayload, 
  channel: string,
  supabaseClient: any
): Promise<void> {
  switch (channel) {
    case 'push':
      return deliverPushNotification(notification)
    case 'email':
      return deliverEmailNotification(notification)
    case 'database':
      return deliverDatabaseNotification(notification, supabaseClient)
    default:
      throw new Error(`Unsupported channel: ${channel}`)
  }
}

async function deliverPushNotification(notification: NotificationPayload): Promise<void> {
  // Placeholder for push notification delivery
  // Integrate with FCM, APNs, or other push services
  console.log(`Push notification delivered to user ${notification.user_id}:`, notification.title)
  
  // Example FCM integration:
  // const fcmToken = await getUserFCMToken(notification.user_id)
  // if (fcmToken) {
  //   await sendFCMNotification(fcmToken, notification.title, notification.message, notification.data)
  // }
}

async function deliverEmailNotification(notification: NotificationPayload): Promise<void> {
  // Placeholder for email delivery
  // Integrate with SendGrid, Resend, or other email services
  console.log(`Email notification delivered to user ${notification.user_id}:`, notification.title)
  
  // Example email integration:
  // const userEmail = await getUserEmail(notification.user_id)
  // if (userEmail) {
  //   await sendEmail(userEmail, notification.title, notification.message)
  // }
}

async function deliverDatabaseNotification(
  notification: NotificationPayload,
  supabaseClient: any
): Promise<void> {
  // Store in-app notification in database
  const { error } = await supabaseClient
    .from('notifications')
    .insert({
      user_id: notification.user_id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      read: false
    })

  if (error) {
    throw new Error(`Failed to store database notification: ${error.message}`)
  }

  console.log(`Database notification delivered to user ${notification.user_id}`)
}