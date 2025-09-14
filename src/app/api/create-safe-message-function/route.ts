// Create the safe message function in the database
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  try {
    
    // Create the function directly using a simple SQL insert approach
    const { data, error } = await supabase.rpc('create_safe_message_function');
    
    if (error) {
      console.error('Could not create function:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Safe message function created',
      data 
    });
    
  } catch (error) {
    console.error('Create function error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create function'
    }, { status: 500 });
  }
}