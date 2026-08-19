import { supabaseAdmin } from './supabase';

export interface ScalpEntryParams {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  investAmount: number;
  tpPrice: number;
  slPrice: number;
  entryFees: number;
  walletBalance: number;
  employeeName?: string;
  employeeRole?: string;
}

export interface ScalpExitParams {
  symbol: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  exitReason: 'tp' | 'sl' | 'break_even' | 'eod_squareoff';
  netPnl: number;
  pnlPercent: number;
  roundTripFees: number;
  walletBalance: number;
  employeeName?: string;
  employeeRole?: string;
}

export interface SwingTradeParams {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalCharges: number;
  netAmount: number;
  walletBalance: number;
  reason?: string;
  employeeName?: string;
  employeeRole?: string;
}

export interface CROAlertParams {
  alertType: 'circuit_breaker' | 'drawdown_warning' | 'risk_limit';
  message: string;
  currentDrawdown: number;
  dailyLossLimit: number;
  employeeName?: string;
}

export interface EODReportParams {
  totalTrades: number;
  swingPnL: number;
  scalpPnL: number;
  netTotalPnL: number;
  totalBrokerage: number;
  activeScalpPositions: number;
  activeHoldings: number;
}

/**
 * Utility to escape special HTML characters in dynamic text for Telegram
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Core function to send HTML-formatted Telegram messages
 */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramBotToken || !telegramChatId) {
    console.warn('[Telegram] Credentials missing (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID). Skipping notification.');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('[Telegram] API error:', data);
      return false;
    }
    console.log('[Telegram] Notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Telegram] Error sending notification:', error);
    return false;
  }
}

/**
 * Send notification when an intraday scalp trade position is opened (by Scalper Riya)
 */
export async function sendScalpEntryNotification(params: ScalpEntryParams): Promise<void> {
  const { symbol, side, quantity, entryPrice, investAmount, tpPrice, slPrice, entryFees, walletBalance, employeeName = 'Riya', employeeRole = 'Intraday Scalp Specialist' } = params;

  const emoji = side === 'buy' ? '🟢' : '🔴';
  const action = side === 'buy' ? 'BUY (Long)' : 'SELL (Short)';
  const tpDiffPercent = Math.abs((tpPrice - entryPrice) / entryPrice * 100).toFixed(2);
  const slDiffPercent = Math.abs((slPrice - entryPrice) / entryPrice * 100).toFixed(2);

  const text = [
    `⚡ <b>[SCALPER ENTRY] ${emoji} ${action} ${escapeHtml(symbol)}</b>`,
    `👨‍💼 <i>Executed by <b>${employeeName}</b> (${employeeRole})</i>`,
    ``,
    `• <b>Quantity:</b> ${quantity.toLocaleString('en-IN')} shares @ ₹${entryPrice.toFixed(2)}`,
    `• <b>Invested:</b> ₹${investAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• <b>Take Profit (TP):</b> ₹${tpPrice.toFixed(2)} (+${tpDiffPercent}%)`,
    `• <b>Stop Loss (SL):</b> ₹${slPrice.toFixed(2)} (-${slDiffPercent}%)`,
    `• <b>Entry Charges:</b> ₹${entryFees.toFixed(2)}`,
    `• <b>Wallet Balance:</b> ₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ].join('\n');

  const sent = await sendTelegramMessage(text);

  try {
    await supabaseAdmin.from('notifications_log').insert({
      channel: 'telegram',
      status: sent ? 'sent' : 'failed',
    });
  } catch (err) {
    // Ignore log errors
  }
}

/**
 * Send notification when an intraday scalp trade position is closed (by Scalper Riya)
 */
export async function sendScalpExitNotification(params: ScalpExitParams): Promise<void> {
  const { symbol, side, entryPrice, exitPrice, quantity, exitReason, netPnl, pnlPercent, roundTripFees, walletBalance, employeeName = 'Riya', employeeRole = 'Intraday Scalp Specialist' } = params;

  const pnlEmoji = netPnl > 0 ? '🟢' : netPnl < 0 ? '🔴' : '⚪';
  let reasonFormatted = '';
  switch (exitReason) {
    case 'tp':
      reasonFormatted = '🎯 Take Profit';
      break;
    case 'sl':
      reasonFormatted = '🛑 Stop Loss';
      break;
    case 'break_even':
      reasonFormatted = '⚖️ Break-Even';
      break;
    case 'eod_squareoff':
      reasonFormatted = '🔔 EOD Square-off';
      break;
  }

  const pnlSign = netPnl >= 0 ? '+' : '';
  const text = [
    `⚡ <b>[SCALPER EXIT] ${escapeHtml(symbol)} (${side.toUpperCase()})</b>`,
    `👨‍💼 <i>Managed by <b>${employeeName}</b> (${employeeRole})</i>`,
    ``,
    `• <b>Exit Reason:</b> ${reasonFormatted}`,
    `• <b>Price:</b> ₹${entryPrice.toFixed(2)} ➔ <b>₹${exitPrice.toFixed(2)}</b>`,
    `• <b>Quantity:</b> ${quantity.toLocaleString('en-IN')} shares`,
    `• <b>Net P&L:</b> ${pnlEmoji} ${pnlSign}₹${netPnl.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${(pnlPercent * 100).toFixed(2)}%)`,
    `• <b>Round-trip Fees:</b> ₹${roundTripFees.toFixed(2)}`,
    `• <b>New Wallet Balance:</b> ₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  ].join('\n');

  const sent = await sendTelegramMessage(text);

  try {
    await supabaseAdmin.from('notifications_log').insert({
      channel: 'telegram',
      status: sent ? 'sent' : 'failed',
    });
  } catch (err) {
    // Ignore log errors
  }
}

/**
 * Send notification for standard swing trade executions (by Analyst Vikram)
 */
export async function sendSwingTradeNotification(params: SwingTradeParams): Promise<void> {
  const { symbol, side, quantity, price, totalCharges, netAmount, walletBalance, reason, employeeName = 'Vikram', employeeRole = 'Swing Trading Specialist' } = params;

  const emoji = side === 'buy' ? '🟢' : '🔴';
  const action = side === 'buy' ? 'BUY' : 'SELL';
  const text = [
    `📊 <b>[SWING TRADE] ${emoji} ${action} ${escapeHtml(symbol)}</b>`,
    `👨‍💼 <i>Analyzed & Executed by <b>${employeeName}</b> (${employeeRole})</i>`,
    ``,
    `• <b>Quantity:</b> ${quantity.toLocaleString('en-IN')} shares @ ₹${price.toFixed(2)}`,
    `• <b>Total Charges:</b> ₹${totalCharges.toFixed(2)}`,
    `• <b>${side === 'buy' ? 'Debited' : 'Credited'}:</b> ₹${Math.abs(netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• <b>Wallet Balance:</b> ₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    reason ? `• <b>Reasoning:</b> ${escapeHtml(reason)}` : '',
  ].filter(Boolean).join('\n');

  await sendTelegramMessage(text);
}

/**
 * Send Chief Risk Officer (CRO Dev) Safety & Circuit Breaker Alerts
 */
export async function sendCROAlertNotification(params: CROAlertParams): Promise<void> {
  const { alertType, message, currentDrawdown, dailyLossLimit, employeeName = 'Dev' } = params;

  const header = alertType === 'circuit_breaker' 
    ? '🛑 <b>[CRO CIRCUIT BREAKER ACTIVATED]</b>'
    : '🛡️ <b>[CRO RISK WARNING]</b>';

  const text = [
    header,
    `👨‍💼 <i>Issued by <b>${employeeName}</b> (Chief Risk Officer)</i>`,
    ``,
    `• <b>Message:</b> ${escapeHtml(message)}`,
    `• <b>Current Daily P&L:</b> ₹${currentDrawdown.toFixed(2)}`,
    `• <b>Daily Drawdown Limit:</b> ₹${dailyLossLimit.toFixed(2)}`,
    `• <b>Status:</b> ${alertType === 'circuit_breaker' ? 'BOT TRADING SUSPENDED FOR TODAY' : 'MONITORING POSITIONS'}`,
  ].join('\n');

  await sendTelegramMessage(text);
}

/**
 * Send End of Day (EOD) Compliance & Performance Report (by Reporter Kabir)
 */
export async function sendEODReportNotification(params: EODReportParams): Promise<void> {
  const { totalTrades, swingPnL, scalpPnL, netTotalPnL, totalBrokerage, activeScalpPositions, activeHoldings } = params;

  const pnlEmoji = netTotalPnL >= 0 ? '📈' : '📉';
  const pnlSign = netTotalPnL >= 0 ? '+' : '';

  const text = [
    `📢 <b>[AUTOPAISA CAPITAL - END OF DAY REPORT] ${pnlEmoji}</b>`,
    `👨‍💼 <i>Compiled by <b>Kabir</b> (Telegram Compliance Officer)</i>`,
    ``,
    `• <b>Total Trades Today:</b> ${totalTrades}`,
    `• <b>Swing Delivery P&L:</b> ₹${swingPnL.toFixed(2)}`,
    `• <b>Intraday Scalper P&L:</b> ₹${scalpPnL.toFixed(2)}`,
    `• <b>Total Net P&L:</b> <b>${pnlSign}₹${netTotalPnL.toFixed(2)}</b>`,
    `• <b>Total Brokerage & Taxes:</b> ₹${totalBrokerage.toFixed(2)}`,
    `• <b>Active Scalp Positions:</b> ${activeScalpPositions}`,
    `• <b>Active Swing Holdings:</b> ${activeHoldings}`,
    ``,
    `<i>Firm Status: All active systems operational for next session.</i>`,
  ].join('\n');

  await sendTelegramMessage(text);
}
