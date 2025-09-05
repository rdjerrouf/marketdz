// src/lib/search/performance-monitor.ts - Search Performance Monitoring
export class SearchPerformanceMonitor {
  private static instance: SearchPerformanceMonitor;
  private metrics: Map<string, any> = new Map();

  static getInstance(): SearchPerformanceMonitor {
    if (!this.instance) {
      this.instance = new SearchPerformanceMonitor();
    }
    return this.instance;
  }

  // Track search performance
  trackSearch(searchId: string, params: {
    query?: string;
    strategy: string;
    executionTime: number;
    resultsCount: number;
    cacheHit?: boolean;
  }): void {
    this.metrics.set(searchId, {
      ...params,
      timestamp: Date.now()
    });

    // Clean old metrics (keep last 1000)
    if (this.metrics.size > 1000) {
      const oldestKeys = Array.from(this.metrics.keys()).slice(0, 100);
      oldestKeys.forEach(key => this.metrics.delete(key));
    }

    // Log slow queries
    if (params.executionTime > 5000) { // 5 seconds
      console.warn('Slow search detected:', {
        query: params.query,
        strategy: params.strategy,
        executionTime: params.executionTime,
        resultsCount: params.resultsCount
      });
    }
  }

  // Get performance statistics
  getStats(): {
    totalSearches: number;
    averageExecutionTime: number;
    slowQueries: number;
    cacheHitRate: number;
    strategyBreakdown: Record<string, any>;
  } {
    const recentMetrics = Array.from(this.metrics.values())
      .filter(metric => Date.now() - metric.timestamp < 3600000); // Last hour

    if (recentMetrics.length === 0) {
      return {
        totalSearches: 0,
        averageExecutionTime: 0,
        slowQueries: 0,
        cacheHitRate: 0,
        strategyBreakdown: {}
      };
    }

    const totalExecutionTime = recentMetrics.reduce((sum, metric) => sum + metric.executionTime, 0);
    const slowQueries = recentMetrics.filter(metric => metric.executionTime > 5000).length;
    const cacheHits = recentMetrics.filter(metric => metric.cacheHit).length;
    
    const strategyBreakdown = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.strategy]) {
        acc[metric.strategy] = {
          count: 0,
          totalTime: 0,
          averageTime: 0
        };
      }
      
      acc[metric.strategy].count++;
      acc[metric.strategy].totalTime += metric.executionTime;
      acc[metric.strategy].averageTime = acc[metric.strategy].totalTime / acc[metric.strategy].count;
      
      return acc;
    }, {} as Record<string, any>);

    return {
      totalSearches: recentMetrics.length,
      averageExecutionTime: Math.round(totalExecutionTime / recentMetrics.length),
      slowQueries,
      cacheHitRate: Math.round((cacheHits / recentMetrics.length) * 100),
      strategyBreakdown
    };
  }

  // Alert on performance degradation
  checkPerformanceAlerts(): void {
    const stats = this.getStats();
    
    if (stats.averageExecutionTime > 3000) {
      console.error('Performance Alert: Average search time exceeds 3 seconds', stats);
    }
    
    if (stats.slowQueries > 10) {
      console.error('Performance Alert: Too many slow queries detected', stats);
    }
    
    if (stats.cacheHitRate < 20) {
      console.warn('Performance Warning: Low cache hit rate', stats);
    }
  }
}
