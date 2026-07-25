import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const symbol = searchParams.get('symbol') // optional filter by symbol

    let query = supabaseAdmin
      .from('trades')
      .select(`
        id,
        symbol,
        side,
        order_type,
        quantity,
        price,
        trade_value,
        brokerage,
        stt,
        exchange_charges,
        sebi_charges,
        stamp_duty,
        gst,
        total_charges,
        amount,
        reason,
        created_at
      `)
      .order('created_at', { ascending: false })

    // Filter by symbol if provided
    if (symbol) {
      query = query.eq('symbol', symbol.toUpperCase()) // Ensure symbol is uppercase for consistency
    }

    // Apply pagination
    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching trades:', error)
    return NextResponse.json({ error: 'Failed to fetch trades' }, { status: 500 })
  }
}