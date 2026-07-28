import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const { data, error } = await supabaseAdmin
      .from('scalper_signals_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching scalper signals log:', error);
    return NextResponse.json({ error: 'Failed to fetch scalper signals log' }, { status: 500 });
  }
}
