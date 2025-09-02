'use client'

import { useState } from 'react'

export default function TestConnection() {
  const [message, setMessage] = useState('Test page loaded successfully!')
  const [supabaseTest, setSupabaseTest] = useState('Not tested yet')

  const testSupabase = async () => {
    setSupabaseTest('Testing...')
    
    try {
      // First, let's test if we can import the Supabase client
      const { supabase } = await import('@/lib/supabase/client')
      setSupabaseTest('Supabase client imported successfully')
      
      // Now test the actual connection
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (error) {
        setSupabaseTest(`Supabase error: ${error.message}`)
      } else {
        setSupabaseTest('✅ Supabase connection successful!')
      }
    } catch (err) {
      setSupabaseTest(`Import/Connection failed: ${err}`)
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-green-600">MarketDZ Test</h1>
      <p className="text-lg mb-4">{message}</p>
      
      <button 
        onClick={() => setMessage('Button clicked! React is working.')}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2 mb-4"
      >
        Test React
      </button>
      
      <br />
      
      <button 
        onClick={testSupabase}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Test Supabase
      </button>
      
      <p className="mt-4 text-sm">{supabaseTest}</p>
    </div>
  )
}