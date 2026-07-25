import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { amount } = await request.json()

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Get the most recent wallet record
    const { data: walletData, error: walletError } = await supabaseAdmin
      .from('wallet')
      .select('id, balance')
      .order('created_at', { ascending: false })
      .limit(1)

    if (walletError) throw walletError

    let walletId: string
    let currentBalance: number

    if (walletData && walletData.length > 0) {
      walletId = walletData[0].id
      currentBalance = walletData[0].balance
    } else {
      // No wallet exists, create one with initial balance
      const initialBalance = parseInt(process.env.STARTING_WALLET_BALANCE || '100000', 10)
      const { data: newWallet, error: insertError } = await supabaseAdmin
        .from('wallet')
        .insert([
          {
            balance: initialBalance,
          },
        ])
        .select()

      if (insertError) throw insertError

      walletId = newWallet[0].id
      currentBalance = initialBalance
    }

    if (amount > currentBalance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    const newBalance = currentBalance - amount

    // Update wallet balance
    const { error: updateError } = await supabaseAdmin
      .from('wallet')
      .update({ balance: newBalance })
      .eq('id', walletId)

    if (updateError) throw updateError

    // Record transaction
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert([
        {
          type: 'withdraw',
          amount: amount,
          balance_after: newBalance,
        },
      ])

    if (txError) throw txError

    return NextResponse.json({ balance: newBalance }
)
  } catch (error: any) {
    console.error('Error processing withdrawal:', error)
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 })
  }
}