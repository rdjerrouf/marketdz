// src/app/api/health/route.ts - Connection pool health monitoring
import { NextResponse } from 'next/server'
import { getServerSupabase, checkConnectionHealth } from '@/lib/supabase/serverPool'

export async function GET() {
  const start = Date.now()
  
  try {
    // Check database connection health
    const health = await checkConnectionHealth()
    
    // Get basic metrics
    const supabase = getServerSupabase()
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
    
    const { count: activeListingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    const duration = Date.now() - start

    return NextResponse.json({
      status: health.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      response_time_ms: duration,
      database: {
        connected: health.healthy,
        error: health.error || null,
      },
      metrics: {
        total_listings: listingsCount || 0,
        active_listings: activeListingsCount || 0,
      },
      connection_pool: {
        strategy: 'supabase-pgbouncer',
        client_type: 'server-pooled',
      }
    })

  } catch (error) {
    const duration = Date.now() - start
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      response_time_ms: duration,
      error: String(error),
      connection_pool: {
        strategy: 'supabase-pgbouncer',
        client_type: 'server-pooled',
      }
    }, { status: 500 })
  }
}
