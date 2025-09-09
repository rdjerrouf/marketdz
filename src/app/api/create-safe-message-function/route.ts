// Create the safe message function in the database
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
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