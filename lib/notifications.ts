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
 * Send notification when an intraday scalp trade position is opened
 */
export async function sendScalpEntryNotification(params: ScalpEntryParams): Promise<void> {
  const { symbol, side, quantity, entryPrice, investAmount, tpPrice, slPrice, entryFees, walletBalance } = params;

  const emoji = side === 'buy' ? '🟢' : '🔴';
  const action = side === 'buy' ? 'BUY (Long)' : 'SELL (Short)';
  const tpDiffPercent = Math.abs((tpPrice - entryPrice) / entryPrice * 100).toFixed(2);
  const slDiffPercent = Math.abs((slPrice - entryPrice) / entryPrice * 100).toFixed(2);

  const text = [
    `⚡ <b>[SCALPER ENTRY] ${emoji} ${action} ${escapeHtml(symbol)}</b>`,
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
 * Send notification when an intraday scalp trade position is closed
 */
export async function sendScalpExitNotification(params: ScalpExitParams): Promise<void> {
  const { symbol, side, entryPrice, exitPrice, quantity, exitReason, netPnl, pnlPercent, roundTripFees, walletBalance } = params;

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
 * Send notification for standard swing trade executions
 */
export async function sendSwingTradeNotification(params: SwingTradeParams): Promise<void> {
  const { symbol, side, quantity, price, totalCharges, netAmount, walletBalance, reason } = params;

  const emoji = side === 'buy' ? '🟢' : '🔴';
  const action = side === 'buy' ? 'BUY' : 'SELL';
  const text = [
    `📊 <b>[SWING TRADE] ${emoji} ${action} ${escapeHtml(symbol)}</b>`,
    ``,
    `• <b>Quantity:</b> ${quantity.toLocaleString('en-IN')} shares @ ₹${price.toFixed(2)}`,
    `• <b>Total Charges:</b> ₹${totalCharges.toFixed(2)}`,
    `• <b>${side === 'buy' ? 'Debited' : 'Credited'}:</b> ₹${Math.abs(netAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    `• <b>Wallet Balance:</b> ₹${walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    reason ? `• <b>Reason:</b> ${escapeHtml(reason)}` : '',
  ].filter(Boolean).join('\n');

  await sendTelegramMessage(text);
}
