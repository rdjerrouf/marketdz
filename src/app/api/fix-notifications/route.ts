// Temporary API endpoint to fix notification policies
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(request);
    
    // Test connection
    const { error } = await supabase.from('notifications').select('id').limit(1);
    
    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Notification policies checked' });
    
  } catch (error) {
    console.error('Fix notifications error:', error);
    return NextResponse.json({ 
      error: 'Failed to check notifications', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}