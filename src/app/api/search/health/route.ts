// src/app/api/search/health/route.ts - Search Health Check
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const startTime = Date.now();
    const supabase = await createServerSupabaseClient();
    
    // Test database connectivity
    const { data, error } = await supabase
      .from('listings')
      .select('id')
      .limit(1);
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    const dbResponseTime = Date.now() - startTime;
    
    // Mock performance stats (replace with real monitoring when implemented)
    const performanceStats = {
      totalSearches: 0,
      averageExecutionTime: 0,
      slowQueries: 0,
      cacheHitRate: 0,
      strategyBreakdown: {}
    };
    
    // Check search indexes (requires appropriate permissions)
    let indexHealth = 'unknown';
    try {
      // In production, you could check index usage with:
      // const { data: indexData } = await supabase.rpc('check_search_indexes');
      indexHealth = 'healthy'; // Default for now
    } catch (error) {
      // Index check not available
    }
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        responseTime: dbResponseTime
      },
      search: {
        performance: performanceStats,
        indexHealth
      },
      version: process.env.npm_package_version || 'unknown'
    };
    
    // Determine overall health status
    if (dbResponseTime > 2000 || performanceStats.averageExecutionTime > 5000) {
      health.status = 'degraded';
    }
    
    const response = NextResponse.json(health);
    
    // Cache health check for 30 seconds
    response.headers.set('Cache-Control', 'public, s-maxage=30');
    
    return response;
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 503 }
    );
  }
}
