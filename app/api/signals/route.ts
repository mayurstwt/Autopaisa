import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const { data, error } = await supabaseAdmin
      .from('signals_log')
      .select(`
        id,
        symbol,
        signal,
        sma20,
        sma50,
        rsi14,
        acted_on,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching signals:', error)
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 })
  }
}