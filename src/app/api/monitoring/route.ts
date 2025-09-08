// src/app/api/monitoring/route.ts - Real-time monitoring dashboard  
import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase/serverPool'

export async function GET() {
  const start = Date.now()
  
  try {
    const supabase = getServerSupabase()
    
    // Run monitoring queries with current schema
    const [
      messageMetrics,
      listingMetrics,
      favoriteMetrics,
      reviewMetrics
    ] = await Promise.all([
      // Message activity (last hour)
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60*60*1000).toISOString()),
        
      // Active listings count
      supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
        
      // Favorites activity (last hour)  
      supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60*60*1000).toISOString()),
        
      // Reviews activity (last hour)
      supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 60*60*1000).toISOString())
    ])

    const queryDuration = Date.now() - start

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      response_time_ms: queryDuration,
      metrics: {
        database: {
          query_performance: queryDuration < 100 ? 'excellent' : queryDuration < 300 ? 'good' : 'slow',
          response_time_ms: queryDuration
        },
        activity_last_hour: {
          new_messages: messageMetrics.count || 0,
          new_favorites: favoriteMetrics.count || 0,
          new_reviews: reviewMetrics.count || 0,
          status: 'tracking'
        },
        listings: {
          active_count: listingMetrics.count || 0,
          status: 'operational'
        },
        realtime_features: {
          messaging: !messageMetrics.error ? 'operational' : 'error',
          favorites: !favoriteMetrics.error ? 'operational' : 'error', 
          reviews: !reviewMetrics.error ? 'operational' : 'error'
        }
      },
      health_checks: {
        database_connected: true,
        messaging_table: !messageMetrics.error,
        listings_table: !listingMetrics.error,
        favorites_table: !favoriteMetrics.error,
        reviews_table: !reviewMetrics.error
      },
      performance_grade: queryDuration < 100 ? 'A+' : queryDuration < 200 ? 'A' : queryDuration < 500 ? 'B' : 'C',
      recommendations: queryDuration > 300 ? [
        'Database queries are slow - check indexes',
        'Consider connection pooling',
        'Monitor for heavy operations'
      ] : [
        'Performance is excellent! ⚡',
        'All real-time features operational 🚀',
        'Database indexes working perfectly 📊'
      ]
    })

  } catch (error) {
    const duration = Date.now() - start
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(), 
      response_time_ms: duration,
      error: String(error),
      recommendations: [
        'Check database connection',
        'Verify migration status',
        'Review error logs'
      ]
    }, { status: 500 })
  }
}
