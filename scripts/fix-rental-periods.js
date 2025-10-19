// Script to fix rental listings that are missing rental_period
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://vrlzwxoiglzwmhndpolj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZybHp3eG9pZ2x6d21obmRwb2xqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjY2OTQ3NiwiZXhwIjoyMDcyMjQ1NDc2fQ.VxNa2WISH0Sr6eY_Y9UAckC8LxXcO_UtgKTQ0wVdjT8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRentalPeriods() {
  console.log('\n🔧 Fixing rental listings without rental_period...\n')

  // Find all for_rent listings without rental_period
  const { data: rentals, error: fetchError } = await supabase
    .from('listings')
    .select('id, title, category, price, rental_period')
    .eq('category', 'for_rent')
    .is('rental_period', null)

  if (fetchError) {
    console.error('❌ Error fetching rentals:', fetchError)
    return
  }

  if (!rentals || rentals.length === 0) {
    console.log('✅ All rental listings already have rental_period set!')
    return
  }

  console.log(`⚠️  Found ${rentals.length} rental listings without rental_period\n`)

  // Update each listing to have 'monthly' as default
  let successCount = 0
  let errorCount = 0

  for (const rental of rentals) {
    const { error: updateError } = await supabase
      .from('listings')
      .update({ rental_period: 'monthly' })
      .eq('id', rental.id)

    if (updateError) {
      console.error(`❌ Failed to update listing ${rental.id}:`, updateError.message)
      errorCount++
    } else {
      console.log(`✅ Updated: ${rental.title} (${rental.id}) → monthly`)
      successCount++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successfully updated: ${successCount}`)
  if (errorCount > 0) {
    console.log(`   ❌ Failed: ${errorCount}`)
  }
  console.log(`\n💡 All rental listings now display with "/month" period`)
}

fixRentalPeriods()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
