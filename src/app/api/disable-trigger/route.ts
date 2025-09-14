// API to disable the problematic message trigger
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  try {
    
    // Since we can't execute raw SQL directly, let's try a different approach
    // Let's create a simple function in the database first
    console.log('Attempting to disable message notification trigger...');
    
    // Try to call a simple function or use a workaround
    const { data, error } = await supabase.rpc('disable_message_trigger');
    
    if (error) {
      console.log('RPC call failed:', error);
      // Return success anyway since we'll handle this differently
      return NextResponse.json({ 
        success: false, 
        message: 'Could not disable trigger directly - will handle in message API',
        error: error.message 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Trigger disabled successfully',
      data 
    });
    
  } catch (error) {
    console.error('Disable trigger error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'API call failed',
      details: error 
    }, { status: 500 });
  }
}