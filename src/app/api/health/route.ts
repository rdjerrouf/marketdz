/**
 * Health API - System Health Check & Metrics
 *
 * PROVIDES:
 * - Database connection health (connected/error state)
 * - Response time metrics
 * - Total & active listings count
 * - Connection pool strategy info
 *
 * USAGE:
 * - Monitoring systems (uptime checks, alerts)
 * - Load balancer health checks
 * - Debugging connection issues
 */

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
      .select('*', { count: 'exact' })
    
    const { count: activeListingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact' })
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
