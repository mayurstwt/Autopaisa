import { supabaseAdmin } from './supabase';
import { fetchMarketData } from './market';
import { sma, rsi } from './ta';
import { calculateFees } from './fees';
import https from 'https';

export type Signal = 'buy' | 'sell' | 'hold'

export interface SignalResult {
  symbol: string
  signal: Signal
  sma20: number | null
  sma50: number | null
  rsi14: number | null
  reason: string
}

/**
 * Generate a signal for a single symbol based on
 */
export async function generateSignal(symbol: string): Promise<SignalResult> {
  // Fetch market data (current price and historical closes)
  const { currentPrice, historicalCloses } = await fetchMarketData(symbol)

  // Debug: log how many days of data we got
  console.log(`[DEBUG] ${symbol}: Got ${historicalCloses.length} days of historical data`)

  // We need at least 50 days of close prices for SMA50
  if (historicalCloses.length < 50) {
    return {
      symbol,
      signal: 'hold',
      sma20: null,
      sma50: null,
      rsi14: null,
      reason: `Insufficient historical data: ${historicalCloses.length} days (need 50+)`,
    }
  }

  // Extract close prices (most recent last)
  const closes = historicalCloses.map((d) => d.close)

  // Calculate indicators
  const sma20Arr = sma(closes, 20)
  const sma50Arr = sma(closes, 50)
  const rsi14Arr = rsi(closes, 14)

  // Get latest values (last element)
  const latestSma20 = sma20Arr[sma20Arr.length - 1]
  const latestSma50 = sma50Arr[sma50Arr.length - 1]
  const latestRsi14 = rsi14Arr[rsi14Arr.length - 1]

  // Get previous day's values for crossover detection
  const prevSma20 = sma20Arr[sma20Arr.length - 2]
  const prevSma50 = sma50Arr[sma50Arr.length - 2]

  // Fetch portfolio data: holdings and wallet balance
  const [holdingsData, walletData] = await Promise.all([
    supabaseAdmin.from('holdings').select('symbol, quantity, avg_buy_price'),
    supabaseAdmin.from('wallet').select('balance').order('created_at', { ascending: false }).limit(1),
  ])

  if (holdingsData.error) throw holdingsData.error
  if (walletData.error) throw walletData.error

  const holdings = holdingsData.data ?? []
  const walletBalance = walletData.data?.[0]?.balance ?? 0

  // Find holding for this symbol
  const holding = holdings.find((h) => h.symbol === symbol)
  const currentlyHolding = holding ? holding.quantity > 0 : false
  const avgBuyPrice = holding ? holding.avg_buy_price : 0

  // Determine signal
  let signal: Signal = 'hold'
  let reason = ''

  // Check for buy signal conditions
  const bullishCross = latestSma20 > latestSma50 && prevSma20 <= prevSma50
  const rsiNotOverbought = latestRsi14 < 70

  // Calculate if we can afford to buy 10% of wallet
  const affordableToBuy = currentPrice * (Math.floor((walletBalance * 0.1) / currentPrice)) > 0

  if (!currentlyHolding && bullishCross && rsiNotOverbought && affordableToBuy) {
    signal = 'buy'
    reason = `SMA20 crossed above SMA50 (${latestSma20.toFixed(2)} > ${latestSma50.toFixed(2)}), RSI ${latestRsi14.toFixed(2)} < 70`
  } else {
    // Check for sell signal conditions (only if we hold the stock)
    if (currentlyHolding) {
      // Calculate unrealized P/L percentage
      const unrealizedPercent = ((currentPrice - avgBuyPrice) / avgBuyPrice) * 100

      const bearishCross = latestSma20 < latestSma50 && prevSma20 >= prevSma50
      const stopLoss = unrealizedPercent <= -5
      const takeProfit = unrealizedPercent >= 10

      if (bearishCross || stopLoss || takeProfit) {
        signal = 'sell'
        const reasons = []
        if (bearishCross) reasons.push(`SMA20 crossed below SMA50 (${latestSma20.toFixed(2)} < ${latestSma50.toFixed(2)})`)
        if (stopLoss) reasons.push(`Unrealized loss ${unrealizedPercent.toFixed(2)}% <= -5%`)
        if (takeProfit) reasons.push(`Unrealized gain ${unrealizedPercent.toFixed(2)}% >= +10%`)
        reason = reasons.join('; ')
      }
    }
  }

  if (signal === 'hold') {
    reason = 'No signal conditions met'
  }

  return {
    symbol,
    signal,
    sma20: Number(latestSma20?.toFixed(2)) ?? null,
    sma50: Number(latestSma50?.toFixed(2)) ?? null,
    rsi14: Number(latestRsi14?.toFixed(2)) ?? null,
    reason,
  }
}

/**
 * Execute a trade based on the signal.
 * This function handles the actual buying/selling, fee calculation,
 * and updates to wallet, trades, holdings, and transaction records.
 */
export async function executeTrade(signalResult: SignalResult): Promise<void> {
  // Only execute buy or sell signals (not hold)
  if (signalResult.signal === 'hold') {
    return
  }

  const { symbol, signal } = signalResult

  // Get current market data for execution
  const { currentPrice } = await fetchMarketData(symbol)

  // Get current wallet balance and holdings
  const [walletData, holdingsData] = await Promise.all([
    supabaseAdmin.from('wallet').select('id, balance').order('created_at', { ascending: false }).limit(1),
    supabaseAdmin.from('holdings').select('quantity, avg_buy_price').eq('symbol', symbol),
  ])

  if (walletData.error) throw walletData.error
  if (holdingsData.error) throw holdingsData.error

  const wallet = walletData.data?.[0]
  if (!wallet) throw new Error('No wallet record found')

  const holding = holdingsData.data?.[0]
  const currentQuantity = holding ? holding.quantity : 0
  const currentAvgPrice = holding ? holding.avg_buy_price : 0

  // Calculate trade quantity based on signal type
  let quantity: number
  const orderType: 'delivery' | 'intraday' = 'delivery' // As per spec, we only do delivery orders

  if (signal === 'buy') {
    // Buy up to 10% of wallet balance
    const investAmount = wallet.balance * 0.1
    quantity = Math.floor(investAmount / currentPrice)

    // Skip if we can't buy at least 1 share
    if (quantity <= 0) {
      console.log(`Skipping buy for ${symbol}: insufficient funds for even 1 share at ₹${currentPrice}`)
      return
    }
  } else if (signal === 'sell') {
    // Sell all holdings of this stock
    quantity = currentQuantity

    // Skip if we don't hold any shares
    if (quantity <= 0) {
      console.log(`Skipping sell for ${symbol}: no holdings to sell`)
      return
    }
  } else {
    return // Should not happen
  }

  // Calculate trade value and fees
  const tradeValue = quantity * currentPrice
  const fees = calculateFees(orderType, signal as 'buy' | 'sell', tradeValue)

  // Update wallet balance
  const newBalance = wallet.balance + fees.netAmount // netAmount is negative for buy, positive for sell

  const { error: walletUpdateError } = await supabaseAdmin
    .from('wallet')
    .update({ balance: newBalance })
    .eq('id', wallet.id)

  if (walletUpdateError) throw walletUpdateError

  // Record the trade
  const { data: tradeData, error: tradeError } = await supabaseAdmin
    .from('trades')
    .insert({
      symbol,
      side: signal,
      order_type: orderType,
      quantity,
      price: currentPrice,
      trade_value: tradeValue,
      brokerage: fees.brokerage,
      stt: fees.stt,
      exchange_charges: fees.exchangeCharges,
      sebi_charges: fees.sebiCharges,
      stamp_duty: fees.stampDuty,
      gst: fees.gst,
      total_charges: fees.totalCharges,
      amount: fees.netAmount, // This is the net amount debited/credited to wallet
      reason: signalResult.reason,
    })
    .select()
    .single()

  if (tradeError) throw tradeError
  const trade = tradeData

  // Send Telegram notification
  await sendTelegramNotification(trade, newBalance)

  // Update holdings
  let newQuantity: number = 0
  let newAvgPrice: number = 0

  if (signal === 'buy') {
    newQuantity = currentQuantity + quantity
    // Calculate new average price: (old_value + new_value) / (old_qty + new_qty)
    const oldValue = currentQuantity * currentAvgPrice
    const newValue = quantity * currentPrice
    newAvgPrice = (oldValue + newValue) / newQuantity
  } else if (signal === 'sell') {
    newQuantity = 0 // Sold all holdings
    newAvgPrice = 0
  }

  const { error: holdingsUpdateError } = await supabaseAdmin
    .from('holdings')
    .upsert(
      {
        symbol,
        quantity: newQuantity,
        avg_buy_price: newQuantity > 0 ? newAvgPrice : 0, // Only set avg price if we have holdings
      },
      { onConflict: 'symbol' }
    )

  if (holdingsUpdateError) throw holdingsUpdateError

  // Record wallet transaction
  const { error: txError } = await supabaseAdmin
    .from('wallet_transactions')
    .insert({
      type: signal === 'buy' ? 'trade_buy' : 'trade_sell',
      amount: fees.netAmount,
      balance_after: newBalance,
      trade_id: trade.id,
    })

  if (txError) throw txError

  // Update signal as acted upon
  const { error: signalUpdateError } = await supabaseAdmin
    .from('signals_log')
    .update({ acted_on: true })
    .eq('symbol', symbol)
    .eq('signal', signal)
    .eq('sma20', signalResult.sma20)
    .eq('sma50', signalResult.sma50)
    .eq('rsi14', signalResult.rsi14)
    .order('created_at', { ascending: false })
    .limit(1) // Update the most recent matching signal

  if (signalUpdateError) throw signalUpdateError

  console.log(`Executed ${signal} for ${quantity} ${symbol} @ ₹${currentPrice.toFixed(2)}`)
  console.log(`  Trade value: ₹${tradeValue.toFixed(2)}`)
  console.log(`  Fees: ₹${fees.totalCharges.toFixed(2)}`)
  console.log(`  Net amount: ₹${fees.netAmount.toFixed(2)}`)
  console.log(`  New wallet balance: ₹${newBalance.toFixed(2)}`)
}

/**
 * Send a trade notification via Telegram.
 * @param trade - The trade object from the trades table
 * @param walletBalance - The wallet balance after the trade
 */
async function sendTelegramNotification(trade: any, walletBalance: number): Promise<void> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    console.warn('Telegram credentials not set. Skipping notification.');
    return;
  }

  // Format the message as per spec
  const emoji = trade.side === 'buy' ? '🟢' : '🔴';
  const action = trade.side === 'buy' ? 'BUY' : 'SELL';
  const formattedMessage = `
${emoji} ${action} ${trade.quantity} ${trade.symbol} @ ₹${trade.price.toFixed(2)}
Charges: ₹${trade.total_charges.toFixed(2)} | ${trade.side === 'buy' ? 'Debited' : 'Credited'}: ₹${Math.abs(trade.amount).toFixed(2)}
Wallet balance: ₹${walletBalance.toFixed(2)}
Reason: ${trade.reason || ''}
`.trim();

  const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
  const payload = {
    chat_id: telegramChatId,
    text: formattedMessage
  };

  const data = JSON.stringify(payload);

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  const req = https.request(url, options, (res) => {
    let data = '';
    res.on('data', chunk => {
      data += chunk;
    });
    res.on('end', () => {
      if (res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300) {
        console.log('Telegram notification sent successfully');
      } else {
        console.error(`Failed to send Telegram notification. Status: ${res.statusCode ?? 'unknown'}, Response: ${data}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('Error sending Telegram notification:', error);
  });

  req.write(data);
  req.end();
}

/**
 * Generate signals for all symbols in the watchlist and execute trades.
 * This is the main function that combines signal generation with trade execution.
 */
export async function processTradingCycle(): Promise<void> {
  // Get active watchlist symbols
  const { data: watchlistData, error: watchlistError } = await supabaseAdmin
    .from('watchlist')
    .select('symbol')
    .eq('active', true)

  if (watchlistError) throw watchlistError;
  const symbols = (watchlistData ?? []).map((row) => row.symbol);

  console.log(`Processing trading cycle for ${symbols.length} symbols...`)

  // For each symbol, generate signal and execute trade if needed
  for (const symbol of symbols) {
    try {
      const signalResult = await generateSignal(symbol)
      console.log(`Signal for ${symbol}: ${signalResult.signal} - ${signalResult.reason}`)

      // Record signal to signals_log table so frontend Activity Log displays recent scan evaluation
      const { error: signalLogError } = await supabaseAdmin
        .from('signals_log')
        .insert({
          symbol: signalResult.symbol,
          signal: signalResult.signal,
          sma20: signalResult.sma20,
          sma50: signalResult.sma50,
          rsi14: signalResult.rsi14,
          acted_on: false,
        })

      if (signalLogError) {
        console.error(`Error logging signal to Supabase for ${symbol}:`, signalLogError)
      }

      // Execute trade if signal is buy or sell
      if (signalResult.signal !== 'hold') {
        await executeTrade(signalResult)
      }
    } catch (error) {
      console.error(`Error processing signal for ${symbol}:`, error)
    }
  }
}