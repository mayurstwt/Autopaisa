import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('wallet')
      .select('id, balance, created_at')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) throw error

    // If no wallet exists, create one with default balance
    if (!data || data.length === 0) {
      const { data: newWallet, error: insertError } = await supabaseAdmin
        .from('wallet')
        .insert([
          {
            balance: parseInt(process.env.STARTING_WALLET_BALANCE || '100000', 10),
          },
        ])
        .select()

      if (insertError) throw insertError

      return NextResponse.json({ balance: newWallet[0].balance })
    }

    return NextResponse.json({ balance: data[0].balance })
  } catch (error: any) {
    console.error('Error fetching wallet:', error)
    return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
  }
}