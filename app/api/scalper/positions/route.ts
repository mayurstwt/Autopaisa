import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('scalper_positions').select('*').order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error fetching scalper positions:', error);
    return NextResponse.json({ error: 'Failed to fetch active scalp positions' }, { status: 500 });
  }
}
