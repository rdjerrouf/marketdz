// Debug API endpoint to check listings data
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('🔍 Debug API called with:', { 
      userId, 
      sessionUser: session?.user?.id,
      authenticated: !!session 
    })

    // Get all listings first (this will be affected by RLS)
    const { data: allListings, error: allError } = await supabase
      .from('listings')
      .select('id, title, user_id, status, created_at')
      .order('created_at', { ascending: false })

    if (allError) {
      console.error('❌ Error fetching all listings:', allError)
      return NextResponse.json({ error: 'Failed to fetch all listings', details: allError }, { status: 500 })
    }

    console.log('📋 All listings visible to current user (after RLS):', allListings)

    // Get filtered listings if userId provided
    let userListings = null
    if (userId) {
      const { data: filteredListings, error: filteredError } = await supabase
        .from('listings')
        .select('id, title, user_id, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (filteredError) {
        console.error('❌ Error fetching user listings:', filteredError)
        return NextResponse.json({ error: 'Failed to fetch user listings', details: filteredError }, { status: 500 })
      }

      userListings = filteredListings
      console.log('🔑 Filtered listings for user:', userListings)
    }

    return NextResponse.json({
      session: {
        authenticated: !!session,
        userId: session?.user?.id || null
      },
      requestedUserId: userId,
      allListings: {
        count: allListings?.length || 0,
        data: allListings
      },
      userListings: userListings ? {
        count: userListings.length,
        data: userListings
      } : null
    })

  } catch (error) {
    console.error('❌ Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}
