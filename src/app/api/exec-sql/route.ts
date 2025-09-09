// Manual SQL execution endpoint (temporary)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();
    
    if (!sql) {
      return NextResponse.json({ error: 'SQL query required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      db: {
        schema: 'public'
      }
    });

    console.log('Executing SQL:', sql);
    
    // Use direct SQL query
    const { data, error } = await supabase.rpc('exec_raw_sql', { query: sql });

    if (error) {
      console.error('SQL Error:', error);
      return NextResponse.json({ error: 'SQL execution failed', details: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('Exec SQL error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute SQL', 
      details: error 
    }, { status: 500 });
  }
}