#!/usr/bin/env node

/**
 * Arabic RTL Search Testing Script for MarketDZ
 * Tests Unicode normalization, stemming, and search functionality
 */

const { createClient } = require('@supabase/supabase-js');

// Test data with various Arabic text forms
const ARABIC_TEST_LISTINGS = [
  {
    title: 'سيارة مرسيدس للبيع',
    description: 'سيارة مرسيدس بحالة ممتازة، موديل 2020، لون أسود، عدد الكيلومترات قليل',
    category: 'for_sale',
    location_wilaya: 'الجزائر',
    price: 2500000
  },
  {
    title: 'شقة للإيجار في الجزائر العاصمة',
    description: 'شقة جميلة ومفروشة في حي راقي، 3 غرف نوم، مطبخ حديث، إطلالة رائعة على البحر',
    category: 'service', 
    location_wilaya: 'الجزائر',
    price: 50000
  },
  {
    title: 'هاتف أيفون جديد',
    description: 'أيفون 14 برو ماكس، 256 جيجابايت، لون ذهبي، جديد بالكرتونة الأصلية مع كامل الملحقات',
    category: 'for_sale',
    location_wilaya: 'وهران',
    price: 180000
  },
  {
    title: 'خدمات التصميم الجرافيكي', 
    description: 'أقدم خدمات تصميم الشعارات والهوية البصرية والتصميم الإعلاني بجودة عالية وأسعار منافسة',
    category: 'service',
    location_wilaya: 'قسنطينة',
    price: 5000
  },
  {
    title: 'كتب جامعية للبيع',
    description: 'مجموعة كتب في الهندسة المدنية والرياضيات، حالة جيدة، مناسبة لطلاب الجامعة',
    category: 'for_sale', 
    location_wilaya: 'سطيف',
    price: 8000
  }
];

// Test queries with various Arabic forms and diacritics
const SEARCH_TEST_CASES = [
  {
    query: 'سيارة',
    description: 'Basic Arabic word search',
    expectedResults: ['سيارة مرسيدس للبيع']
  },
  {
    query: 'سياره', // Different Teh Marbuta form
    description: 'Alternative spelling with Teh Marbuta',
    expectedResults: ['سيارة مرسيدس للبيع']
  },
  {
    query: 'مرسيدس',
    description: 'Brand name search',
    expectedResults: ['سيارة مرسيدس للبيع']
  },
  {
    query: 'شقه', // Alternative Teh Marbuta
    description: 'Apartment search with different spelling',
    expectedResults: ['شقة للإيجار في الجزائر العاصمة']
  },
  {
    query: 'ايفون', // Without Hamza
    description: 'iPhone search without Hamza',
    expectedResults: ['هاتف أيفون جديد']
  },
  {
    query: 'أيفون', // With Hamza
    description: 'iPhone search with Hamza', 
    expectedResults: ['هاتف أيفون جديد']
  },
  {
    query: 'تصميم',
    description: 'Design services search',
    expectedResults: ['خدمات التصميم الجرافيكي']
  },
  {
    query: 'كتاب', // Singular form
    description: 'Book search (singular)',
    expectedResults: ['كتب جامعية للبيع']
  },
  {
    query: 'جديد',
    description: 'Search for new items',
    expectedResults: ['هاتف أيفون جديد', 'كتب جامعية للبيع']
  },
  {
    query: 'الجزائر',
    description: 'Location-based search',
    expectedResults: ['سيارة مرسيدس للبيع', 'شقة للإيجار في الجزائر العاصمة']
  }
];

class ArabicSearchTester {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    this.testResults = [];
  }

  async setupTestData() {
    console.log('🔄 Setting up Arabic test data...');
    
    // Create test user profile
    const testUserId = '00000000-0000-0000-0000-000000000001';
    
    // Insert test user (if not exists)
    await this.supabase.from('profiles').upsert({
      id: testUserId,
      full_name: 'Arabic Test User',
      wilaya: 'الجزائر',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Clean up existing test data
    await this.supabase
      .from('listings')
      .delete()
      .ilike('title', '%test%');

    // Insert test listings
    for (const listing of ARABIC_TEST_LISTINGS) {
      const { error } = await this.supabase
        .from('listings')
        .insert({
          ...listing,
          seller_id: testUserId,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to insert test listing:', error);
      }
    }

    console.log(`✅ Inserted ${ARABIC_TEST_LISTINGS.length} test listings`);
  }

  async testNormalization() {
    console.log('\n📝 Testing Arabic text normalization...');
    
    const testCases = [
      { input: 'أيفون', expected: 'ايفون', description: 'Alif with Hamza normalization' },
      { input: 'سياره', expected: 'سياره', description: 'Teh Marbuta handling' },
      { input: 'الإسلام', expected: 'الاسلام', description: 'Alif with Hamza under normalization' },
      { input: 'مُحَمَّد', expected: 'محمد', description: 'Diacritics removal' }
    ];

    for (const testCase of testCases) {
      try {
        const { data, error } = await this.supabase.rpc('normalize_arabic_text', {
          input_text: testCase.input
        });

        if (error) {
          console.error(`❌ Normalization failed for "${testCase.input}":`, error);
          continue;
        }

        const success = data === testCase.expected || data.includes(testCase.expected.replace(/ه$/, 'ة'));
        console.log(`${success ? '✅' : '❌'} ${testCase.description}`);
        console.log(`   Input: "${testCase.input}" → Output: "${data}"`);
        
        this.testResults.push({
          test: 'normalization',
          case: testCase.description,
          success,
          input: testCase.input,
          output: data,
          expected: testCase.expected
        });
      } catch (error) {
        console.error(`❌ Error testing normalization for "${testCase.input}":`, error);
      }
    }
  }

  async testSearchFunctionality() {
    console.log('\n🔍 Testing Arabic search functionality...');

    for (const testCase of SEARCH_TEST_CASES) {
      console.log(`\nTesting: ${testCase.description}`);
      console.log(`Query: "${testCase.query}"`);

      try {
        // Test with Arabic search mode
        const { data: arabicResults, error: arabicError } = await this.supabase
          .rpc('search_listings_arabic', {
            search_term: testCase.query,
            search_mode: 'arabic',
            limit_count: 10
          });

        if (arabicError) {
          console.error(`❌ Arabic search failed:`, arabicError);
          continue;
        }

        // Test with mixed search mode  
        const { data: mixedResults, error: mixedError } = await this.supabase
          .rpc('search_listings_arabic', {
            search_term: testCase.query,
            search_mode: 'mixed',
            limit_count: 10
          });

        if (mixedError) {
          console.error(`❌ Mixed search failed:`, mixedError);
          continue;
        }

        // Analyze results
        const arabicTitles = arabicResults?.map(r => r.title) || [];
        const mixedTitles = mixedResults?.map(r => r.title) || [];
        
        const arabicMatch = testCase.expectedResults.some(expected =>
          arabicTitles.some(title => title.includes(expected.split(' ')[0]))
        );
        
        const mixedMatch = testCase.expectedResults.some(expected =>
          mixedTitles.some(title => title.includes(expected.split(' ')[0]))
        );

        console.log(`   Arabic mode: ${arabicResults?.length || 0} results ${arabicMatch ? '✅' : '❌'}`);
        console.log(`   Mixed mode: ${mixedResults?.length || 0} results ${mixedMatch ? '✅' : '❌'}`);
        
        if (arabicResults?.length > 0) {
          console.log(`   Top result: "${arabicResults[0].title}" (rank: ${arabicResults[0].search_rank})`);
        }

        this.testResults.push({
          test: 'search',
          case: testCase.description,
          query: testCase.query,
          arabicSuccess: arabicMatch,
          mixedSuccess: mixedMatch,
          arabicResults: arabicResults?.length || 0,
          mixedResults: mixedResults?.length || 0
        });

      } catch (error) {
        console.error(`❌ Search test failed for "${testCase.query}":`, error);
      }
    }
  }

  async testAutocompleteSuggestions() {
    console.log('\n💡 Testing Arabic autocomplete suggestions...');

    const partialQueries = ['سي', 'هات', 'تص', 'كت'];

    for (const partial of partialQueries) {
      try {
        const { data, error } = await this.supabase
          .rpc('search_arabic_suggestions', {
            partial_term: partial,
            limit_count: 5
          });

        if (error) {
          console.error(`❌ Suggestions failed for "${partial}":`, error);
          continue;
        }

        console.log(`\nSuggestions for "${partial}":`);
        if (data && data.length > 0) {
          data.forEach(suggestion => {
            console.log(`   • ${suggestion.suggestion} (${suggestion.frequency} matches, category: ${suggestion.category})`);
          });
          console.log(`   ✅ ${data.length} suggestions found`);
        } else {
          console.log(`   ❌ No suggestions found`);
        }

        this.testResults.push({
          test: 'autocomplete',
          query: partial,
          suggestions: data?.length || 0,
          success: data && data.length > 0
        });

      } catch (error) {
        console.error(`❌ Autocomplete test failed for "${partial}":`, error);
      }
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing search performance...');

    const queries = ['سيارة', 'شقة', 'هاتف', 'تصميم'];

    for (const query of queries) {
      const startTime = Date.now();
      
      try {
        const { data, error } = await this.supabase
          .rpc('search_listings_arabic', {
            search_term: query,
            search_mode: 'mixed',
            limit_count: 20
          });

        const duration = Date.now() - startTime;

        if (error) {
          console.error(`❌ Performance test failed for "${query}":`, error);
          continue;
        }

        const success = duration < 500; // Should complete in under 500ms
        console.log(`   "${query}": ${duration}ms, ${data?.length || 0} results ${success ? '✅' : '❌'}`);

        this.testResults.push({
          test: 'performance',
          query,
          duration,
          results: data?.length || 0,
          success
        });

      } catch (error) {
        console.error(`❌ Performance test error for "${query}":`, error);
      }
    }
  }

  async generateReport() {
    console.log('\n📊 ARABIC SEARCH TEST REPORT');
    console.log('=' .repeat(50));

    const testTypes = ['normalization', 'search', 'autocomplete', 'performance'];
    
    for (const testType of testTypes) {
      const tests = this.testResults.filter(r => r.test === testType);
      if (tests.length === 0) continue;

      console.log(`\n${testType.toUpperCase()} TESTS:`);
      console.log('-'.repeat(30));

      let successCount = 0;
      tests.forEach(test => {
        const success = test.success || test.arabicSuccess || test.mixedSuccess;
        if (success) successCount++;

        if (testType === 'search') {
          console.log(`${success ? '✅' : '❌'} ${test.case} - "${test.query}"`);
          console.log(`   Arabic: ${test.arabicResults} results, Mixed: ${test.mixedResults} results`);
        } else if (testType === 'performance') {
          console.log(`${success ? '✅' : '❌'} "${test.query}" - ${test.duration}ms (${test.results} results)`);
        } else {
          console.log(`${success ? '✅' : '❌'} ${test.case || test.query}`);
        }
      });

      console.log(`\nSuccess Rate: ${successCount}/${tests.length} (${Math.round(successCount/tests.length*100)}%)`);
    }

    // Overall summary
    const totalTests = this.testResults.length;
    const totalSuccess = this.testResults.filter(r => 
      r.success || r.arabicSuccess || r.mixedSuccess
    ).length;

    console.log('\n🎯 OVERALL RESULTS:');
    console.log('-'.repeat(30)); 
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalSuccess}`);
    console.log(`Failed: ${totalTests - totalSuccess}`);
    console.log(`Success Rate: ${Math.round(totalSuccess/totalTests*100)}%`);

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(30));
    
    const failedNormalization = this.testResults.filter(r => r.test === 'normalization' && !r.success);
    if (failedNormalization.length > 0) {
      console.log('• Improve Unicode normalization for complex diacritics');
    }

    const failedSearches = this.testResults.filter(r => r.test === 'search' && !r.arabicSuccess && !r.mixedSuccess);
    if (failedSearches.length > 0) {
      console.log('• Enhance Arabic stemming dictionary for better word matching');
    }

    const slowQueries = this.testResults.filter(r => r.test === 'performance' && r.duration > 300);
    if (slowQueries.length > 0) {
      console.log('• Optimize indexes for queries taking longer than 300ms');
    }

    console.log('\n🏁 Arabic RTL search testing completed!');
  }

  async runAllTests() {
    try {
      await this.setupTestData();
      await this.testNormalization();
      await this.testSearchFunctionality(); 
      await this.testAutocompleteSuggestions();
      await this.testPerformance();
      await this.generateReport();
    } catch (error) {
      console.error('Test suite failed:', error);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new ArabicSearchTester();
  tester.runAllTests();
}

module.exports = { ArabicSearchTester, ARABIC_TEST_LISTINGS, SEARCH_TEST_CASES };