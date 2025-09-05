// src/app/api/search/analytics/route.ts - Search Analytics API
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || '24h'; // 24h, 7d, 30d
    const metric = searchParams.get('metric') || 'overview'; // overview, performance, popular
    
    const supabase = await createServerSupabaseClient();
    
    // Calculate time range
    const timeRanges = {
      '24h': new Date(Date.now() - 24 * 60 * 60 * 1000),
      '7d': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      '30d': new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
    
    const since = timeRanges[timeframe as keyof typeof timeRanges] || timeRanges['24h'];
    
    let data = {};
    
    switch (metric) {
      case 'overview':
        data = await getSearchOverview(supabase, since);
        break;
      case 'performance':
        data = await getPerformanceMetrics(supabase, since);
        break;
      case 'popular':
        data = await getPopularSearches(supabase, since);
        break;
      default:
        data = await getSearchOverview(supabase, since);
    }
    
    return NextResponse.json({
      timeframe,
      metric,
      data,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

async function getSearchOverview(supabase: any, since: Date) {
  // For now, return mock data since we need the search_analytics table
  // In production, uncomment the real queries below
  
  return {
    totalSearches: 1250,
    uniqueUsers: 450,
    averageResults: 12.5,
    zeroResultSearches: 125,
    zeroResultRate: 10,
    categoryBreakdown: {
      'for_sale': 450,
      'job': 320,
      'service': 280,
      'for_rent': 200
    }
  };

  /*
  // Real implementation - uncomment when search_analytics table exists:
  
  // Total searches
  const { count: totalSearches } = await supabase
    .from('search_analytics')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString());
  
  // Unique users (by IP)
  const { data: uniqueUsers } = await supabase
    .from('search_analytics')
    .select('ip_address')
    .gte('created_at', since.toISOString());
  
  const uniqueUserCount = new Set(uniqueUsers?.map(u => u.ip_address)).size;
  
  // Average results per search
  const { data: avgResults } = await supabase
    .from('search_analytics')
    .select('results_count')
    .gte('created_at', since.toISOString())
    .not('results_count', 'is', null);
  
  const averageResults = avgResults?.length > 0 
    ? avgResults.reduce((sum, r) => sum + r.results_count, 0) / avgResults.length 
    : 0;
  
  // Searches by category
  const { data: categoryBreakdown } = await supabase
    .from('search_analytics')
    .select('category')
    .gte('created_at', since.toISOString())
    .not('category', 'is', null);
  
  const categoryCounts = categoryBreakdown?.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};
  
  // Zero-result searches
  const { count: zeroResultSearches } = await supabase
    .from('search_analytics')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString())
    .eq('results_count', 0);
  
  return {
    totalSearches: totalSearches || 0,
    uniqueUsers: uniqueUserCount,
    averageResults: Math.round(averageResults * 100) / 100,
    zeroResultSearches: zeroResultSearches || 0,
    zeroResultRate: totalSearches > 0 ? Math.round((zeroResultSearches || 0) / totalSearches * 100) : 0,
    categoryBreakdown: categoryCounts
  };
  */
}

async function getPerformanceMetrics(supabase: any, since: Date) {
  // Mock data for now
  return {
    strategyPerformance: {
      ilike: {
        count: 500,
        averageTime: 120,
        averageResults: 15,
        p50: 100,
        p95: 250,
        p99: 400
      },
      trigram: {
        count: 300,
        averageTime: 180,
        averageResults: 18,
        p50: 150,
        p95: 350,
        p99: 500
      },
      fulltext: {
        count: 200,
        averageTime: 80,
        averageResults: 22,
        p50: 70,
        p95: 150,
        p99: 200
      }
    },
    hourlyTrends: []
  };
}

async function getPopularSearches(supabase: any, since: Date) {
  // Mock popular searches data
  return {
    popularQueries: [
      { query: 'iphone', search_count: 45, avg_results: 12 },
      { query: 'voiture', search_count: 38, avg_results: 8 },
      { query: 'appartement', search_count: 32, avg_results: 15 },
      { query: 'laptop', search_count: 28, avg_results: 10 },
      { query: 'emploi', search_count: 25, avg_results: 6 }
    ],
    popularCategories: [
      { category: 'for_sale', search_count: 450 },
      { category: 'job', search_count: 320 },
      { category: 'service', search_count: 280 },
      { category: 'for_rent', search_count: 200 }
    ],
    trendingSearches: [
      { query: 'remote work', recentCount: 15, earlierCount: 5, growthRate: 2.0 },
      { query: 'electric car', recentCount: 12, earlierCount: 3, growthRate: 3.0 },
      { query: 'gaming setup', recentCount: 8, earlierCount: 2, growthRate: 3.0 }
    ]
  };
}

// Real-time search monitoring endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // For now, just log the analytics - in production, store in database
    console.log('Search Analytics:', {
      query: body.query,
      category: body.category,
      wilaya: body.wilaya,
      city: body.city,
      results_count: body.resultsCount,
      execution_time_ms: body.executionTime,
      strategy: body.strategy,
      ip_address: body.ip,
      user_agent: body.userAgent,
      user_id: body.userId,
      timestamp: new Date().toISOString()
    });
    
    /*
    // Real implementation - uncomment when search_analytics table exists:
    const supabase = await createServerSupabaseClient();
    
    const { error } = await supabase
      .from('search_analytics')
      .insert({
        query: body.query,
        category: body.category,
        wilaya: body.wilaya,
        city: body.city,
        results_count: body.resultsCount,
        execution_time_ms: body.executionTime,
        strategy: body.strategy,
        ip_address: body.ip,
        user_agent: body.userAgent,
        user_id: body.userId
      });
    
    if (error) {
      console.error('Analytics insert error:', error);
      return NextResponse.json(
        { error: 'Failed to log analytics' },
        { status: 500 }
      );
    }
    */
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Analytics POST error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
