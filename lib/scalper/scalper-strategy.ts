import { supabaseAdmin } from '../supabase';
import { fetchIntradayScalpData } from './market-intraday';
import { calculateFees } from '../fees';

export const SCALPER_CONSTANTS = {
  TP_PERCENT: 0.0030, // 0.30% Take Profit
  SL_PERCENT: 0.0075, // 0.75% Stop Loss
  BREAK_EVEN_AT: 0.60, // 60% of TP (0.18%) triggers moving SL to Entry Price
  VOLUME_MULTIPLIER: 1.5, // Min 1.5x volume spike ratio
  COOLDOWN_WIN: 30, // 30 seconds after winning trade
  COOLDOWN_LOSS: 120, // 120 seconds after losing trade
  DAILY_LOSS_LIMIT: -0.02, // -2.0% daily drawdown limit (-₹2,000 on ₹100,000)
  START_HOUR_MINUTES: 9 * 60 + 30, // 9:30 AM IST
  END_HOUR_MINUTES: 15 * 60 + 15, // 3:15 PM IST
};

export function getISTTimeInMinutes(): { totalMinutes: number; timeString: string } {
  const now = new Date();
  const hoursStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hourCycle: 'h23' }).format(now);
  const minutesStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', minute: 'numeric' }).format(now);

  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  const totalMinutes = hours * 60 + minutes;

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { totalMinutes, timeString };
}

/**
 * Main Scalper Execution Cycle (1-Minute Tick)
 */
export async function processScalperCycle(): Promise<{ status: string; message: string }> {
  console.log(`[${new Date().toISOString()}] Running Intraday Scalper Cycle...`);

  // Ensure scalper state & wallet exist
  await initializeScalperStorage();

  const { totalMinutes, timeString } = getISTTimeInMinutes();

  // Fetch current bot state & wallet
  const [stateRes, walletRes, activePositionsRes] = await Promise.all([
    supabaseAdmin.from('scalper_state').select('*').limit(1).single(),
    supabaseAdmin.from('scalper_wallet').select('*').limit(1).single(),
    supabaseAdmin.from('scalper_positions').select('*'),
  ]);

  if (stateRes.error || walletRes.error || activePositionsRes.error) {
    throw new Error('Failed to load Scalper state or wallet from Supabase');
  }

  const scalperState = stateRes.data;
  const scalperWallet = walletRes.data;
  const activePositions = activePositionsRes.data || [];

  // Check Rule 8: Daily Circuit Breaker Shut Down (-2% drawdown)
  const maxDrawdown = scalperWallet.starting_balance * SCALPER_CONSTANTS.DAILY_LOSS_LIMIT; // -₹2,000
  if (scalperState.daily_pnl <= maxDrawdown || scalperState.is_disabled_today) {
    if (!scalperState.is_disabled_today) {
      await supabaseAdmin.from('scalper_state').update({ is_disabled_today: true }).eq('id', scalperState.id);
    }
    return {
      status: 'circuit_breaker',
      message: `Daily loss limit reached (${scalperState.daily_pnl.toFixed(2)} <= ${maxDrawdown.toFixed(2)}). Scalper disabled today.`,
    };
  }

  // Check Rule 3: Time-of-day Gate (9:30 AM to 3:15 PM IST)
  const isWithinTradingHours = totalMinutes >= SCALPER_CONSTANTS.START_HOUR_MINUTES && totalMinutes <= SCALPER_CONSTANTS.END_HOUR_MINUTES;

  // Auto Square-off at 3:15 PM IST
  if (totalMinutes > SCALPER_CONSTANTS.END_HOUR_MINUTES) {
    if (activePositions.length > 0) {
      console.log(`Market close reached (3:15 PM IST). Squaring off ${activePositions.length} open scalp positions...`);
      for (const pos of activePositions) {
        await exitScalpPosition(pos, pos.entry_price, 'eod_squareoff', scalperWallet, scalperState);
      }
    }
    return {
      status: 'market_closed',
      message: `Outside trading hours (${timeString} IST). Scalper is idle.`,
    };
  }

  if (!isWithinTradingHours) {
    return {
      status: 'idle',
      message: `Waiting for trading start time (9:30 AM IST). Current time: ${timeString} IST`,
    };
  }

  // 1. Manage Active Positions (Break-even trailing, TP & SL exits)
  for (const pos of activePositions) {
    try {
      const scalpData = await fetchIntradayScalpData(pos.symbol);
      const currentPrice = scalpData.currentPrice;

      const profitPercent = pos.side === 'buy'
        ? (currentPrice - pos.entry_price) / pos.entry_price
        : (pos.entry_price - currentPrice) / pos.entry_price;

      // Rule 6: Break-even trailing (60% of TP = +0.18%)
      const breakEvenTriggerPct = SCALPER_CONSTANTS.TP_PERCENT * SCALPER_CONSTANTS.BREAK_EVEN_AT;
      if (!pos.break_even_triggered && profitPercent >= breakEvenTriggerPct) {
        console.log(`[Scratch Protector] ${pos.symbol} (${pos.side.toUpperCase()}) profit +${(profitPercent * 100).toFixed(2)}% >= ${(breakEvenTriggerPct * 100).toFixed(2)}%. Moving SL to Entry Price ₹${pos.entry_price}`);
        await supabaseAdmin
          .from('scalper_positions')
          .update({
            sl_price: pos.entry_price,
            break_even_triggered: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', pos.id);
        pos.sl_price = pos.entry_price;
        pos.break_even_triggered = true;
      }

      // Rule 5: Check Take Profit & Stop Loss Exits (branched on position side)
      const hitTP = pos.side === 'buy' ? currentPrice >= pos.tp_price : currentPrice <= pos.tp_price;
      const hitSL = pos.side === 'buy' ? currentPrice <= pos.sl_price : currentPrice >= pos.sl_price;

      if (hitTP) {
        console.log(`[TP Hit] ${pos.symbol} (${pos.side.toUpperCase()}) @ ₹${currentPrice} (TP ₹${pos.tp_price})`);
        await exitScalpPosition(pos, currentPrice, 'tp', scalperWallet, scalperState);
        continue;
      }

      if (hitSL) {
        const reason = pos.break_even_triggered ? 'break_even' : 'sl';
        console.log(`[SL Hit] ${pos.symbol} (${pos.side.toUpperCase()}) @ ₹${currentPrice} (SL ₹${pos.sl_price}) (${reason})`);
        await exitScalpPosition(pos, currentPrice, reason, scalperWallet, scalperState);
        continue;
      }
    } catch (err) {
      console.error(`Error managing open position for ${pos.symbol}:`, err);
    }
  }

  // Check Rule 7: Cooldown Gate
  if (scalperState.cooldown_until && new Date(scalperState.cooldown_until) > new Date()) {
    const remainingSecs = Math.ceil((new Date(scalperState.cooldown_until).getTime() - Date.now()) / 1000);
    return {
      status: 'cooldown',
      message: `Scalper in cooldown for ${remainingSecs} seconds after previous trade.`,
    };
  }

  // If we already hold an active position, skip opening new entries (max 1 active scalp trade at a time)
  if (activePositions.length > 0) {
    return {
      status: 'managing_position',
      message: `Currently managing ${activePositions.length} active scalp position (${activePositions[0].symbol}).`,
    };
  }

  // 2. Scan Watchlist for New Entry Setup (from isolated scalper_watchlist table)
  const { data: watchlistData } = await supabaseAdmin.from('scalper_watchlist').select('symbol').eq('active', true);
  const symbols = (watchlistData || []).map(r => r.symbol);

  for (const symbol of symbols) {
    try {
      const scalpData = await fetchIntradayScalpData(symbol);
      const { currentPrice, vwap, currentVolume, avg20mVolume, volumeRatio } = scalpData;

      // Rule 1: VWAP Magnet
      // Long Entry: Price strictly below VWAP
      // Short Entry: Price strictly above VWAP
      const isLongSetup = currentPrice < vwap;
      const isShortSetup = currentPrice > vwap;

      // Rule 2: Relative Volume Filter (Current Volume >= 1.5x 20m Average)
      const volumeCondition = volumeRatio >= SCALPER_CONSTANTS.VOLUME_MULTIPLIER;

      let signal: 'buy' | 'sell' | 'hold' = 'hold';
      let reason = '';

      if (volumeCondition && (isLongSetup || isShortSetup)) {
        signal = isLongSetup ? 'buy' : 'sell';
        const sideText = isLongSetup ? 'Long (Price < VWAP)' : 'Short (Price > VWAP)';
        reason = `${sideText} | Price ₹${currentPrice} vs VWAP ₹${vwap} & Vol ${volumeRatio}x >= 1.5x`;
      } else {
        const reasons = [];
        if (!volumeCondition) reasons.push(`Volume ratio ${volumeRatio}x < 1.5x`);
        if (!isLongSetup && !isShortSetup) reasons.push(`Price exactly at VWAP`);
        reason = reasons.join('; ');
      }

      // Record 1-minute scan log
      await supabaseAdmin.from('scalper_signals_log').insert({
        symbol,
        signal,
        current_price: currentPrice,
        vwap,
        current_volume: currentVolume,
        avg_20m_vol: avg20mVolume,
        volume_ratio: volumeRatio,
        acted_on: signal !== 'hold',
        reason,
      });

      // Execute Entry if Signal is BUY or SELL
      if (signal !== 'hold') {
        // Conviction Scaling (97% ratio if volume ratio >= 2.0x, else 90%)
        const isHighConviction = volumeRatio >= 2.0;
        const investRatio = isHighConviction ? 0.97 : 0.90;
        const investAmount = scalperWallet.balance * investRatio;

        let quantity = Math.floor(investAmount / currentPrice);

        // Cash-safety clamp: ensure trade value + entry fees do not exceed wallet balance
        while (quantity > 0) {
          const entryVal = quantity * currentPrice;
          const entryFees = calculateFees('intraday', signal, entryVal);
          if (entryVal + entryFees.totalCharges <= scalperWallet.balance) {
            break;
          }
          quantity--;
        }

        if (quantity > 0) {
          const entryPrice = currentPrice;
          const entryValue = quantity * entryPrice;
          const entryFees = calculateFees('intraday', signal, entryValue);
          let tpPrice: number;
          let slPrice: number;

          if (signal === 'buy') {
            tpPrice = parseFloat((entryPrice * (1 + SCALPER_CONSTANTS.TP_PERCENT)).toFixed(2));
            slPrice = parseFloat((entryPrice * (1 - SCALPER_CONSTANTS.SL_PERCENT)).toFixed(2));
          } else {
            // Short Entry
            tpPrice = parseFloat((entryPrice * (1 - SCALPER_CONSTANTS.TP_PERCENT)).toFixed(2));
            slPrice = parseFloat((entryPrice * (1 + SCALPER_CONSTANTS.SL_PERCENT)).toFixed(2));
          }

          // Insert active scalper position
          await supabaseAdmin.from('scalper_positions').insert({
            symbol,
            side: signal,
            entry_price: entryPrice,
            quantity,
            invest_amount: entryValue,
            tp_price: tpPrice,
            sl_price: slPrice,
            break_even_triggered: false,
          });

          // Deduct from scalper wallet balance (trade value + entry leg fees)
          const newWalletBalance = scalperWallet.balance - (entryValue + entryFees.totalCharges);
          await supabaseAdmin.from('scalper_wallet').update({ balance: parseFloat(newWalletBalance.toFixed(2)) }).eq('id', scalperWallet.id);

          console.log(`[SCALPER ${signal.toUpperCase()}] ${symbol}: ${quantity} shares @ ₹${entryPrice} (TP: ₹${tpPrice}, SL: ₹${slPrice}, Entry Fees: ₹${entryFees.totalCharges})`);
          return {
            status: 'trade_opened',
            message: `Opened ${signal.toUpperCase()} scalp position for ${quantity} ${symbol} @ ₹${entryPrice}`,
          };
        }
      }
    } catch (err) {
      console.error(`Error scanning scalp setup for ${symbol}:`, err);
    }
  }

  return {
    status: 'scan_complete',
    message: `Completed 1-minute scalp scan across ${symbols.length} symbols. No entry setups triggered.`,
  };
}

/**
 * Exit an active scalp position, calculate P&L, charges for both legs, update wallet & state
 */
export async function exitScalpPosition(
  pos: any,
  exitPrice: number,
  exitReason: 'tp' | 'sl' | 'break_even' | 'eod_squareoff',
  wallet: any,
  state: any
): Promise<void> {
  const grossTradeValue = pos.quantity * exitPrice;
  const rawPnl = pos.side === 'buy'
    ? (exitPrice - pos.entry_price) * pos.quantity
    : (pos.entry_price - exitPrice) * pos.quantity;

  const pnlPercent = pos.side === 'buy'
    ? (exitPrice - pos.entry_price) / pos.entry_price
    : (pos.entry_price - exitPrice) / pos.entry_price;

  // Calculate fees for entry leg and exit leg
  const entryLegFees = calculateFees('intraday', pos.side, pos.quantity * pos.entry_price);
  const exitSide = pos.side === 'buy' ? 'sell' : 'buy';
  const exitLegFees = calculateFees('intraday', exitSide, grossTradeValue);

  const totalBrokerageAndFees = parseFloat((entryLegFees.totalCharges + exitLegFees.totalCharges).toFixed(2));
  const netPnl = rawPnl - totalBrokerageAndFees;
  const returnCapital = pos.quantity * pos.entry_price + netPnl;

  // 1. Delete from active positions
  await supabaseAdmin.from('scalper_positions').delete().eq('id', pos.id);

  // 2. Record executed trade in scalper_trades
  await supabaseAdmin.from('scalper_trades').insert({
    symbol: pos.symbol,
    side: pos.side,
    entry_price: pos.entry_price,
    exit_price: exitPrice,
    quantity: pos.quantity,
    trade_value: grossTradeValue,
    pnl: parseFloat(netPnl.toFixed(2)),
    pnl_percent: parseFloat(pnlPercent.toFixed(4)),
    exit_reason: exitReason,
    brokerage: totalBrokerageAndFees,
    net_amount: parseFloat(returnCapital.toFixed(2)),
  });

  // 3. Update scalper wallet balance
  const updatedWalletBalance = wallet.balance + returnCapital;
  await supabaseAdmin
    .from('scalper_wallet')
    .update({ balance: parseFloat(updatedWalletBalance.toFixed(2)), updated_at: new Date().toISOString() })
    .eq('id', wallet.id);

  // 4. Update daily PnL & cooldown in scalper_state
  const isWin = netPnl > 0;
  const isScratch = exitReason === 'break_even' || Math.abs(netPnl) < 1;
  const resultType = isWin ? 'win' : isScratch ? 'scratch' : 'loss';

  const cooldownSecs = isWin || isScratch ? SCALPER_CONSTANTS.COOLDOWN_WIN : SCALPER_CONSTANTS.COOLDOWN_LOSS;
  const cooldownUntil = new Date(Date.now() + cooldownSecs * 1000).toISOString();

  const newDailyPnL = state.daily_pnl + netPnl;

  await supabaseAdmin
    .from('scalper_state')
    .update({
      daily_pnl: parseFloat(newDailyPnL.toFixed(2)),
      cooldown_until: cooldownUntil,
      last_trade_result: resultType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', state.id);

  console.log(`[SCALPER EXIT] ${pos.symbol} (${pos.side.toUpperCase()}) @ ₹${exitPrice} (${exitReason.toUpperCase()}). Net P&L: ₹${netPnl.toFixed(2)} (${(pnlPercent * 100).toFixed(2)}%). Round-trip fees: ₹${totalBrokerageAndFees}. Cooldown ${cooldownSecs}s.`);
}

/**
 * Ensure scalper wallet and state rows exist in Supabase
 */
export async function initializeScalperStorage(): Promise<void> {
  const { data: walletData } = await supabaseAdmin.from('scalper_wallet').select('id').limit(1);
  if (!walletData || walletData.length === 0) {
    await supabaseAdmin.from('scalper_wallet').insert({ balance: 100000.0, starting_balance: 100000.0 });
  }

  const { data: stateData } = await supabaseAdmin.from('scalper_state').select('id').limit(1);
  if (!stateData || stateData.length === 0) {
    await supabaseAdmin.from('scalper_state').insert({ daily_pnl: 0.0, starting_daily_balance: 100000.0, is_disabled_today: false });
  }
}
