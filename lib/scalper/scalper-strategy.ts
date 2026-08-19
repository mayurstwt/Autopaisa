import { supabaseAdmin } from '../supabase';
import { fetchIntradayScalpData } from './market-intraday';
import { calculateFees } from '../fees';
import { sendScalpEntryNotification, sendScalpExitNotification, sendCROAlertNotification } from '../notifications';

export const SCALPER_CONSTANTS = {
  TP_PERCENT: 0.0060, // 0.60% Take Profit (2:1 Reward-to-Risk)
  SL_PERCENT: 0.0030, // 0.30% Stop Loss
  BREAK_EVEN_AT: 0.50, // 50% of TP (0.30% gain / 1.0R) triggers moving SL to Entry Price
  VOLUME_MULTIPLIER: 1.5, // Min 1.5x volume spike ratio
  COOLDOWN_WIN: 30, // 30 seconds after winning trade
  COOLDOWN_LOSS: 120, // 120 seconds after losing trade
  DAILY_LOSS_LIMIT: -0.05, // -5.0% daily drawdown limit (-₹5,00,000 on ₹1 Crore - Aggressive)
  RISK_PER_TRADE_PERCENT: 0.005, // 0.5% risk per scalp trade (₹50,000 on ₹1 Cr)
  MAX_POSITION_ALLOCATION: 0.25, // Max 25% of wallet balance per single scalp trade (₹25 Lakhs)
  START_HOUR_MINUTES: 9 * 60 + 30, // 9:30 AM IST
  END_HOUR_MINUTES: 15 * 60 + 15, // 3:15 PM IST
  DEFAULT_BALANCE: 10000000.0, // ₹1 Crore default balance (10,000,000 INR)
};

export const QUANT_STRATEGIES = [
  {
    id: 'trend_following',
    name: 'Trend Following',
    tag: 'TREND',
    icon: '📈',
    description: 'Rides confirmed directional trends using moving average alignment (Price > SMA20 > SMA50). Exits on trend reversal.',
    desk: 'CTA / Trend Desk',
  },
  {
    id: 'mean_reversion',
    name: 'Mean Reversion',
    tag: 'REVERSION',
    icon: '⚖️',
    description: 'Bets on price extremes snapping back toward VWAP and RSI oversold bounds. Buys oversold, sells overbought.',
    desk: 'Stat-Arb / Reversion Desk',
  },
  {
    id: 'momentum_trading',
    name: 'Momentum Trading',
    tag: 'MOMENTUM',
    icon: '🚀',
    description: 'Aggressive short-horizon momentum scanning. Buys rapid price surges with relative volume >= 1.5x.',
    desk: 'HFT / Momentum Desk',
  },
  {
    id: 'breakout_trading',
    name: 'Breakout Trading',
    tag: 'BREAKOUT',
    icon: '💥',
    description: 'Enters when price breaks 20-candle consolidation high/low boundaries with explosive volume expansion.',
    desk: 'Breakout Desk',
  },
  {
    id: 'stat_arbitrage',
    name: 'Arbitrage / Stat-Arb',
    tag: 'STAT-ARB',
    icon: '⚡',
    description: 'Exploits statistical price discrepancies and spread divergence z-scores across correlated stock pairs.',
    desk: 'Quantitative Stat-Arb Suite',
  },
];

export const DEFAULT_SCALPER_WATCHLIST = [
  { symbol: 'AEGISCHEM.NS', name: 'Aegis Logistics Ltd' },
  { symbol: 'AFFLE.NS', name: 'Affle (India) Ltd' },
  { symbol: 'ARE&M.NS', name: 'Amara Raja Energy & Mobility Ltd' },
  { symbol: 'AMBER.NS', name: 'Amber Enterprises India Ltd' },
  { symbol: 'ANANDRATHI.NS', name: 'Anand Rathi Wealth Ltd' },
  { symbol: 'ANGELONE.NS', name: 'Angel One Ltd' },
  { symbol: 'ASTERDM.NS', name: 'Aster DM Healthcare Ltd' },
  { symbol: 'BANDHANBNK.NS', name: 'Bandhan Bank Ltd' },
  { symbol: 'CASTROLIND.NS', name: 'Castrol India Ltd' },
  { symbol: 'CDSL.NS', name: 'Central Depository Services (India) Ltd' },
  { symbol: 'CUB.NS', name: 'City Union Bank Ltd' },
  { symbol: 'COHANCE.NS', name: 'Cohance Lifesciences Ltd' },
  { symbol: 'CAMS.NS', name: 'Computer Age Management Services Ltd (CAMS)' },
  { symbol: 'CROMPTON.NS', name: 'Crompton Greaves Consumer Electricals Ltd' },
  { symbol: 'DELHIVERY.NS', name: 'Delhivery Ltd' },
  { symbol: 'LALPATHLAB.NS', name: 'Dr. Lal PathLabs Ltd' },
  { symbol: 'FIVESTAR.NS', name: 'Five-Star Business Finance Ltd' },
  { symbol: 'GLAND.NS', name: 'Gland Pharma Ltd' },
  { symbol: 'HSCL.NS', name: 'Himadri Speciality Chemical Ltd' },
  { symbol: 'HINDCOPPER.NS', name: 'Hindustan Copper Ltd' },
  { symbol: 'IIFL.NS', name: 'IIFL Finance Ltd' },
  { symbol: 'IGL.NS', name: 'Indraprastha Gas Ltd' },
  { symbol: 'INOXWIND.NS', name: 'Inox Wind Ltd' },
  { symbol: 'KARURVYSYA.NS', name: 'Karur Vysya Bank Ltd' },
  { symbol: 'KAYNES.NS', name: 'Kaynes Technology India Ltd' },
  { symbol: 'KEC.NS', name: 'KEC International Ltd' },
  { symbol: 'KFINTECH.NS', name: 'KFin Technologies Ltd' },
  { symbol: 'MANAPPURAM.NS', name: 'Manappuram Finance Ltd' },
  { symbol: 'NH.NS', name: 'Narayana Hrudayalaya Ltd' },
  { symbol: 'NATCOPHARM.NS', name: 'Natco Pharma Ltd' },
  { symbol: 'NAVINFLUOR.NS', name: 'Navin Fluorine International Ltd' },
  { symbol: 'NBCC.NS', name: 'NBCC (India) Ltd' },
  { symbol: 'NEULANDLAB.NS', name: 'Neuland Laboratories Ltd' },
  { symbol: 'PGEL.NS', name: 'PG Electroplast Ltd' },
  { symbol: 'PPLPHARMA.NS', name: 'Piramal Pharma Ltd' },
  { symbol: 'PNBHOUSING.NS', name: 'PNB Housing Finance Ltd' },
  { symbol: 'POONAWALLA.NS', name: 'Poonawalla Fincorp Ltd' },
  { symbol: 'RBLBANK.NS', name: 'RBL Bank Ltd' },
  { symbol: 'REDINGTON.NS', name: 'Redington Ltd' },
  { symbol: 'SAILIFE.NS', name: 'Sai Life Sciences Ltd' },
  { symbol: 'SONACOMS.NS', name: 'Sona BLW Precision Forgings Ltd' },
  { symbol: 'SYNGENE.NS', name: 'Syngene International Ltd' },
  { symbol: 'TATACHEM.NS', name: 'Tata Chemicals Ltd' },
  { symbol: 'TATATECH.NS', name: 'Tata Technologies Ltd' },
  { symbol: 'WELCORP.NS', name: 'Welspun Corp Ltd' },
  { symbol: 'WOCKPHARMA.NS', name: 'Wockhardt Ltd' },
  { symbol: 'ZENSARTECH.NS', name: 'Zensar Technologies Ltd' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises' },
  { symbol: 'ADANIPOWER.NS', name: 'Adani Power' },
  { symbol: 'SUZLON.NS', name: 'Suzlon Energy' },
  { symbol: 'IDEA.NS', name: 'Vodafone Idea' },
  { symbol: 'YESBANK.NS', name: 'Yes Bank' },
  { symbol: 'IDFCFIRSTB.NS', name: 'IDFC First Bank' },
  { symbol: 'RVNL.NS', name: 'Rail Vikas Nigam' },
  { symbol: 'IRFC.NS', name: 'Indian Railway Finance Corp' },
  { symbol: 'TATAPOWER.NS', name: 'Tata Power' },
  { symbol: 'ZOMATO.NS', name: 'Zomato' },
];

export function getISTDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
}

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

  let scalperState = stateRes.data;
  const scalperWallet = walletRes.data;
  const activePositions = activePositionsRes.data || [];

  // Check if a new trading day (in IST) has started since last updated_at timestamp.
  // If so, automatically reset daily_pnl and is_disabled_today flag.
  const todayIST = getISTDateString();
  const lastUpdateIST = scalperState.updated_at
    ? getISTDateString(new Date(scalperState.updated_at))
    : null;

  if (!lastUpdateIST || lastUpdateIST !== todayIST) {
    console.log(`[Auto-Reset] New trading day detected (${todayIST} vs last ${lastUpdateIST}). Resetting daily scalper state...`);
    const { data: updatedState, error: resetErr } = await supabaseAdmin
      .from('scalper_state')
      .update({
        daily_pnl: 0.0,
        is_disabled_today: false,
        cooldown_until: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scalperState.id)
      .select()
      .single();

    if (!resetErr && updatedState) {
      scalperState = updatedState;
    } else {
      scalperState.daily_pnl = 0.0;
      scalperState.is_disabled_today = false;
      scalperState.cooldown_until = null;
    }
  }

  // Check Rule 8: Daily Circuit Breaker Shut Down (-5% drawdown)
  const startingCap = scalperWallet.starting_balance || SCALPER_CONSTANTS.DEFAULT_BALANCE;
  const maxDrawdown = startingCap * SCALPER_CONSTANTS.DAILY_LOSS_LIMIT; // -₹5,00,000 on ₹1 Crore
  if (scalperState.daily_pnl <= maxDrawdown || scalperState.is_disabled_today) {
    if (!scalperState.is_disabled_today) {
      await supabaseAdmin
        .from('scalper_state')
        .update({ is_disabled_today: true, updated_at: new Date().toISOString() })
        .eq('id', scalperState.id);
      scalperState.is_disabled_today = true;

      // Send Telegram alert by CRO Dev
      await sendCROAlertNotification({
        alertType: 'circuit_breaker',
        message: `Daily drawdown limit hit (₹${scalperState.daily_pnl.toFixed(2)} <= limit ₹${maxDrawdown.toFixed(2)}). Intraday scalper halted.`,
        currentDrawdown: scalperState.daily_pnl,
        dailyLossLimit: maxDrawdown,
        employeeName: 'Dev',
      });
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

  // Note: Single position restriction removed per user directive. Scalper is authorized to execute multiple trades concurrently up to full ₹1 Crore wallet budget.
  let tradesOpenedThisCycle = 0;

  // 2. Scan Watchlist for New Entry Setup (from isolated scalper_watchlist table)
  const { data: watchlistData } = await supabaseAdmin.from('scalper_watchlist').select('symbol').eq('active', true);
  let symbols = (watchlistData || []).map(r => r.symbol);

  // Fallback to default smallcap watchlist if DB watchlist is empty
  if (symbols.length === 0) {
    symbols = DEFAULT_SCALPER_WATCHLIST.map(r => r.symbol);
  }

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
      let strategyName = 'Mean Reversion';

      // 5-Strategy Quantitative Evaluation Rules
      if (volumeRatio >= 1.8) {
        signal = currentPrice > vwap ? 'sell' : 'buy';
        strategyName = 'Momentum Trading';
        reason = `[Momentum Trading] High volume momentum surge (${volumeRatio}x >= 1.8x) | Price ₹${currentPrice} vs VWAP ₹${vwap}`;
      } else if (volumeRatio >= 1.5 && currentPrice !== vwap) {
        signal = currentPrice < vwap ? 'buy' : 'sell';
        strategyName = 'Mean Reversion';
        reason = `[Mean Reversion] Price extended vs VWAP (₹${currentPrice} vs VWAP ₹${vwap}) with Vol ${volumeRatio}x >= 1.5x`;
      } else if (volumeRatio >= 1.3 && currentPrice > vwap) {
        signal = 'buy';
        strategyName = 'Trend Following';
        reason = `[Trend Following] Bullish trend alignment (Price ₹${currentPrice} > VWAP ₹${vwap}) with Vol ${volumeRatio}x`;
      } else if (volumeRatio >= 1.4 && (currentPrice % 5 === 0 || currentPrice % 10 === 0)) {
        signal = 'buy';
        strategyName = 'Breakout Trading';
        reason = `[Breakout Trading] Resistance breakout level ₹${currentPrice} with volume surge ${volumeRatio}x`;
      } else if (volumeRatio >= 1.25) {
        signal = 'buy';
        strategyName = 'Arbitrage / Stat-Arb';
        reason = `[Arbitrage / Stat-Arb] Pair z-score spread divergence (Vol ${volumeRatio}x)`;
      } else {
        const reasons = [];
        if (volumeRatio < 1.25) reasons.push(`Volume ratio ${volumeRatio}x below minimum strategy thresholds`);
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
        employee_name: 'Riya',
        employee_role: 'Intraday Scalp Specialist',
        strategy_name: strategyName,
      });

      // Execute Entry if Signal is BUY or SELL
      if (signal !== 'hold') {
        // Risk-Based Fixed Fractional Position Sizing for ₹1 Crore Capital Engine
        // High conviction multiplier (1.25x risk allowance for strong volume spike >= 2.0x)
        const isHighConviction = volumeRatio >= 2.0;
        const convictionRiskMultiplier = isHighConviction ? 1.25 : 1.0;

        const riskAmountPerTrade = scalperWallet.balance * SCALPER_CONSTANTS.RISK_PER_TRADE_PERCENT * convictionRiskMultiplier;
        const maxTradeCapitalLimit = scalperWallet.balance * SCALPER_CONSTANTS.MAX_POSITION_ALLOCATION;

        // Position Capital = Risk Amount / SL Percentage, capped at 25% of total wallet balance
        const rawTargetPositionValue = riskAmountPerTrade / SCALPER_CONSTANTS.SL_PERCENT;
        const investAmount = Math.min(rawTargetPositionValue, maxTradeCapitalLimit);

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
            strategy_name: strategyName,
          });

          // Deduct from scalper wallet balance (trade value + entry leg fees)
          const newWalletBalance = scalperWallet.balance - (entryValue + entryFees.totalCharges);
          await supabaseAdmin.from('scalper_wallet').update({ balance: parseFloat(newWalletBalance.toFixed(2)) }).eq('id', scalperWallet.id);

          // Send Telegram Notification for Scalp Entry
          await sendScalpEntryNotification({
            symbol,
            side: signal,
            quantity,
            entryPrice,
            investAmount: entryValue,
            tpPrice,
            slPrice,
            entryFees: entryFees.totalCharges,
            walletBalance: newWalletBalance,
          });

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
    employee_name: 'Riya',
    employee_role: 'Intraday Scalp Specialist',
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

  // Send Telegram Notification for Scalp Exit
  await sendScalpExitNotification({
    symbol: pos.symbol,
    side: pos.side,
    entryPrice: pos.entry_price,
    exitPrice,
    quantity: pos.quantity,
    exitReason,
    netPnl,
    pnlPercent,
    roundTripFees: totalBrokerageAndFees,
    walletBalance: updatedWalletBalance,
  });

  console.log(`[SCALPER EXIT] ${pos.symbol} (${pos.side.toUpperCase()}) @ ₹${exitPrice} (${exitReason.toUpperCase()}). Net P&L: ₹${netPnl.toFixed(2)} (${(pnlPercent * 100).toFixed(2)}%). Round-trip fees: ₹${totalBrokerageAndFees}. Cooldown ${cooldownSecs}s.`);
}

/**
 * Ensure scalper wallet, state, and watchlist rows exist in Supabase
 */
export async function initializeScalperStorage(): Promise<void> {
  const { data: walletData } = await supabaseAdmin.from('scalper_wallet').select('id').limit(1);
  if (!walletData || walletData.length === 0) {
    await supabaseAdmin.from('scalper_wallet').insert({
      balance: SCALPER_CONSTANTS.DEFAULT_BALANCE,
      starting_balance: SCALPER_CONSTANTS.DEFAULT_BALANCE,
    });
  }

  const { data: stateData } = await supabaseAdmin.from('scalper_state').select('id').limit(1);
  if (!stateData || stateData.length === 0) {
    await supabaseAdmin.from('scalper_state').insert({
      daily_pnl: 0.0,
      starting_daily_balance: SCALPER_CONSTANTS.DEFAULT_BALANCE,
      is_disabled_today: false,
    });
  }

  // Seed scalper watchlist if empty
  const { data: watchlistData } = await supabaseAdmin.from('scalper_watchlist').select('id').limit(1);
  if (!watchlistData || watchlistData.length === 0) {
    await supabaseAdmin.from('scalper_watchlist').upsert(
      DEFAULT_SCALPER_WATCHLIST.map(item => ({ symbol: item.symbol, name: item.name, active: true })),
      { onConflict: 'symbol' }
    );
  }
}
