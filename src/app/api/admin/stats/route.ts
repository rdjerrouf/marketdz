// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  // Create Supabase client at request time, not module import time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  try {
    // Get current user session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, allow any authenticated user to view stats
    // In production, you should check admin permissions

    // Get total users count
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })

    // Get total listings count
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })

    // Get active listings count
    const { count: activeListingsCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')

    // Get total reviews count
    const { count: reviewsCount } = await supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentUsersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    // Get recent listings (last 30 days)
    const { count: recentListingsCount } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString())

    return NextResponse.json({
      stats: {
        totalUsers: usersCount || 0,
        totalListings: listingsCount || 0,
        activeListings: activeListingsCount || 0,
        totalReviews: reviewsCount || 0,
        recentUsers: recentUsersCount || 0,
        recentListings: recentListingsCount || 0,
      }
    })
  } catch (error) {
    console.error('Error in admin stats API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
