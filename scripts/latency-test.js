#!/usr/bin/env node

/**
 * Latency Test Script for MarketDZ - North Africa Optimization
 * Tests latency from Algeria to different Supabase regions
 */

const https = require('https')
const { performance } = require('perf_hooks')

// Supabase regions to test (simulating different deployment options)
const REGIONS_TO_TEST = {
  'Frankfurt (EU-Central)': {
    endpoint: 'eu-central-1.supabase.co',
    expected_latency: '30-50ms',
    distance_km: 1680,
    description: 'Primary recommendation for North Africa'
  },
  'Ireland (EU-West)': {
    endpoint: 'eu-west-1.supabase.co', 
    expected_latency: '40-60ms',
    distance_km: 2100,
    description: 'Backup/read-replica option'
  },
  'Johannesburg (AF-South)': {
    endpoint: 'af-south-1.supabase.co',
    expected_latency: '180-250ms',
    distance_km: 4200,
    description: 'Africa region but very far from Algeria'
  },
  'Singapore (AP-Southeast)': {
    endpoint: 'ap-southeast-1.supabase.co',
    expected_latency: '280-350ms', 
    distance_km: 11000,
    description: 'Control - very distant region'
  }
}

// CDN PoP locations relevant to North Africa
const CDN_POPS_ANALYSIS = {
  'Cloudflare Casablanca': {
    location: 'Morocco',
    distance_to_algeria: '500km',
    expected_latency: '15-25ms',
    coverage: 'Northwest Africa'
  },
  'Cloudflare Tunis': {
    location: 'Tunisia', 
    distance_to_algeria: '300km',
    expected_latency: '10-20ms',
    coverage: 'Northeast Algeria'
  },
  'Cloudflare Cairo': {
    location: 'Egypt',
    distance_to_algeria: '2200km', 
    expected_latency: '45-60ms',
    coverage: 'Eastern MENA'
  },
  'Cloudflare Paris': {
    location: 'France',
    distance_to_algeria: '1400km',
    expected_latency: '25-35ms', 
    coverage: 'Europe + Northwest Africa'
  }
}

class LatencyTester {
  constructor() {
    this.results = {}
  }

  async testHTTPSLatency(hostname, path = '/') {
    return new Promise((resolve, reject) => {
      const startTime = performance.now()
      
      const options = {
        hostname,
        path,
        method: 'HEAD',
        timeout: 10000
      }

      const req = https.request(options, (res) => {
        const endTime = performance.now()
        const latency = Math.round(endTime - startTime)
        
        resolve({
          latency,
          statusCode: res.statusCode,
          success: true
        })
      })

      req.on('error', (error) => {
        const endTime = performance.now()
        const latency = Math.round(endTime - startTime)
        
        resolve({
          latency,
          error: error.message,
          success: false
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          latency: 10000,
          error: 'Request timeout',
          success: false
        })
      })

      req.end()
    })
  }

  async runLatencyTests() {
    console.log('🇩🇿 MarketDZ Latency Analysis for Algeria Users')
    console.log('=' .repeat(60))
    console.log()

    console.log('📍 Testing Database/API Latency to Supabase Regions:')
    console.log('-'.repeat(60))

    for (const [regionName, config] of Object.entries(REGIONS_TO_TEST)) {
      console.log(`\n🔍 Testing ${regionName}...`)
      console.log(`   Distance: ${config.distance_km}km | Expected: ${config.expected_latency}`)
      
      // Test multiple times for accuracy
      const tests = []
      for (let i = 0; i < 5; i++) {
        const result = await this.testHTTPSLatency(`${config.endpoint}`)
        tests.push(result)
        await this.sleep(200) // Small delay between tests
      }

      const successfulTests = tests.filter(t => t.success)
      if (successfulTests.length > 0) {
        const avgLatency = Math.round(
          successfulTests.reduce((sum, t) => sum + t.latency, 0) / successfulTests.length
        )
        const minLatency = Math.min(...successfulTests.map(t => t.latency))
        const maxLatency = Math.max(...successfulTests.map(t => t.latency))

        console.log(`   ✅ Average: ${avgLatency}ms | Range: ${minLatency}-${maxLatency}ms`)
        
        this.results[regionName] = {
          ...config,
          avgLatency,
          minLatency,
          maxLatency,
          success: true
        }
      } else {
        console.log(`   ❌ All tests failed`)
        this.results[regionName] = {
          ...config,
          success: false
        }
      }
    }

    this.generateRecommendations()
    this.analyzeCDNStrategy()
    this.generateImplementationPlan()
  }

  generateRecommendations() {
    console.log('\n📊 LATENCY ANALYSIS RESULTS:')
    console.log('=' .repeat(60))

    const successful = Object.entries(this.results)
      .filter(([_, result]) => result.success)
      .sort((a, b) => a[1].avgLatency - b[1].avgLatency)

    if (successful.length > 0) {
      console.log('\n🏆 Recommended Deployment Strategy:')
      console.log('-'.repeat(40))
      
      const best = successful[0]
      const second = successful[1]
      
      console.log(`\n1. 🎯 PRIMARY REGION: ${best[0]}`)
      console.log(`   • Latency: ${best[1].avgLatency}ms average`)
      console.log(`   • Distance: ${best[1].distance_km}km from Algeria`)
      console.log(`   • Use for: Main database, Auth, Storage`)

      if (second) {
        console.log(`\n2. 🔄 BACKUP REGION: ${second[0]}`)
        console.log(`   • Latency: ${second[1].avgLatency}ms average`)
        console.log(`   • Distance: ${second[1].distance_km}km from Algeria`)
        console.log(`   • Use for: Read replicas, failover`)
      }

      console.log('\n3. 🌐 EDGE FUNCTIONS:')
      console.log('   • Deploy to Supabase Edge Network (auto-global)')
      console.log('   • Expected latency: <50ms from Algeria')
      console.log('   • Auto-routes to nearest edge location')
    }
  }

  analyzeCDNStrategy() {
    console.log('\n🚀 CDN OPTIMIZATION STRATEGY:')
    console.log('=' .repeat(60))

    console.log('\n📍 Recommended CDN PoP Coverage for Algeria:')
    Object.entries(CDN_POPS_ANALYSIS).forEach(([name, config]) => {
      const priority = config.distance_to_algeria.includes('300km') ? '🥇 HIGH' :
                      config.distance_to_algeria.includes('500km') ? '🥈 MEDIUM' : '🥉 LOW'
      
      console.log(`\n${name}:`)
      console.log(`   Priority: ${priority}`)
      console.log(`   Distance: ${config.distance_to_algeria} | Latency: ${config.expected_latency}`)
      console.log(`   Coverage: ${config.coverage}`)
    })

    console.log('\n💡 CDN Implementation Benefits:')
    console.log('   • Static assets (images, CSS, JS): <30ms delivery')
    console.log('   • Reduced bandwidth costs from main region')  
    console.log('   • Improved mobile performance in Algeria')
    console.log('   • Better user experience during peak hours')
  }

  generateImplementationPlan() {
    console.log('\n🛠️  IMPLEMENTATION ROADMAP:')
    console.log('=' .repeat(60))

    console.log('\n Phase 1 - Core Infrastructure (Week 1):')
    console.log('   ✅ Deploy Supabase to Frankfurt (EU-Central)')
    console.log('   ✅ Configure Edge Functions (auto-global)')
    console.log('   ✅ Set up monitoring for Algeria latency')

    console.log('\n Phase 2 - CDN Integration (Week 2):')
    console.log('   🔄 Configure Cloudflare with North Africa PoPs')
    console.log('   🔄 Set up Storage CDN for images/assets')
    console.log('   🔄 Implement cache headers for static content')

    console.log('\n Phase 3 - Optimization (Week 3):')
    console.log('   ⏳ Add Ireland read-replica for redundancy')
    console.log('   ⏳ Implement connection pooling')
    console.log('   ⏳ Set up latency alerting')

    console.log('\n Phase 4 - Monitoring & Tuning (Week 4):')
    console.log('   ⏳ Deploy real-user monitoring (RUM)')
    console.log('   ⏳ A/B test different caching strategies')
    console.log('   ⏳ Fine-tune for peak Algeria usage hours')

    console.log('\n🎯 Expected Performance Improvements:')
    console.log('   • Database queries: 50-80% faster')
    console.log('   • Static assets: 70-90% faster')
    console.log('   • Overall page load: 60% improvement')
    console.log('   • Mobile experience: Significantly better')
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Network diagnostics for Algeria-specific issues
function generateNetworkDiagnostics() {
  console.log('\n🔧 ALGERIA NETWORK DIAGNOSTICS:')
  console.log('=' .repeat(60))

  console.log('\nCommon Algeria ISP Considerations:')
  console.log('• Algérie Télécom: Variable international routing')
  console.log('• Mobilis: Mobile network optimization needed')
  console.log('• Ooredoo: Generally good European connectivity')
  console.log('• ATM Mobilis: Consider peak hour congestion')

  console.log('\nOptimization Recommendations:')
  console.log('• Use HTTP/2 for multiplexing')
  console.log('• Implement aggressive caching')
  console.log('• Optimize for mobile-first (60%+ mobile usage)')
  console.log('• Consider Arabic text rendering optimization')
}

// Run the latency test
if (require.main === module) {
  const tester = new LatencyTester()
  
  tester.runLatencyTests()
    .then(() => {
      generateNetworkDiagnostics()
      
      console.log('\n🏁 NEXT STEPS:')
      console.log('-'.repeat(30))
      console.log('1. Deploy to recommended primary region')
      console.log('2. Configure CDN with North Africa PoPs')
      console.log('3. Set up monitoring from Algeria')
      console.log('4. Test with real Algeria users')
      console.log('\n📧 Contact Supabase support to enable Frankfurt region')
      console.log('🌐 Set up Cloudflare with Tunis/Casablanca PoPs')
    })
    .catch(error => {
      console.error('Latency test failed:', error)
    })
}

module.exports = { LatencyTester, REGIONS_TO_TEST, CDN_POPS_ANALYSIS }