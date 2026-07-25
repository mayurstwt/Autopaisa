import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('watchlist')
      .select(`
        id,
        symbol,
        display_name,
        active
      `)
      .order('symbol')

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching watchlist:', error)
    return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 })
  }
}