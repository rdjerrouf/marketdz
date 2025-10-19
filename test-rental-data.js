// Quick script to check rental listings data
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vrlzwxoiglzwmhndpolj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybHp3eG9pZ2x6d21obmRwb2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2Njk0NzYsImV4cCI6MjA3MjI0NTQ3Nn0.DruSeHiWeojHKIIWJzcf9jdS8DNjRZyC-2zOxLh70ao'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRentalData() {
  console.log('\n🔍 Checking rental listings in database...\n')

  // Check all for_rent listings
  const { data: rentals, error } = await supabase
    .from('listings')
    .select('id, title, category, price, rental_period')
    .eq('category', 'for_rent')
    .limit(10)

  if (error) {
    console.error('❌ Error fetching rentals:', error)
    return
  }

  if (!rentals || rentals.length === 0) {
    console.log('⚠️  No rental listings found in database')
    return
  }

  console.log(`✅ Found ${rentals.length} rental listings:\n`)

  rentals.forEach((listing, index) => {
    console.log(`${index + 1}. ${listing.title}`)
    console.log(`   Category: ${listing.category}`)
    console.log(`   Price: ${listing.price}`)
    console.log(`   Rental Period: ${listing.rental_period || 'NOT SET ⚠️'}`)
    console.log('')
  })

  const withoutPeriod = rentals.filter(r => !r.rental_period)
  if (withoutPeriod.length > 0) {
    console.log(`\n⚠️  WARNING: ${withoutPeriod.length} rental listings are missing rental_period!`)
    console.log('These listings will only show the price without /day, /week, /month, etc.')
  }
}

checkRentalData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
