// Temporary API to disable message notifications trigger
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = createSupabaseAdminClient();
  try {
    
    // Disable the message notifications trigger temporarily
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'DROP TRIGGER IF EXISTS on_message_created ON messages;'
    });

    if (error) {
      console.error('SQL Error:', error);
      return NextResponse.json({ error: 'Failed to disable trigger', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Message notification trigger disabled' });
    
  } catch (error) {
    console.error('Disable notifications error:', error);
    return NextResponse.json({ 
      error: 'Failed to disable notifications', 
      details: error 
    }, { status: 500 });
  }
}