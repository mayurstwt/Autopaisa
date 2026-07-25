// lib/fees.ts
/**
 * Calculate fees and charges for a trade according to Zerodha/Groww-style pricing
 * @param orderType Either 'delivery' or 'intraday'
 * @param side Either 'buy' or 'sell'
 * @param tradeValue The trade value in rupees (quantity * price)
 * @returns Object containing all fee components and net amount
 */
export function calculateFees(
  orderType: 'delivery' | 'intraday',
  side: 'buy' | 'sell',
  tradeValue: number
) {
  // Validate inputs
  if (tradeValue <= 0) {
    throw new Error('Trade value must be positive');
  }

  // Initialize all charges to 0
  let brokerage = 0;
  let stt = 0;
  let exchangeCharges = 0;
  let sebiCharges = 0;
  let stampDuty = 0;
  let gst = 0;

  // Brokerage
  if (orderType === 'delivery') {
    brokerage = 0;
  } else if (orderType === 'intraday') {
    brokerage = Math.min(20, tradeValue * 0.0003); // min of ₹20 or 0.03%
  }

  // STT (Securities Transaction Tax)
  if (orderType === 'delivery') {
    // Delivery: 0.1% on both buy and sell
    stt = tradeValue * 0.001;
  } else if (orderType === 'intraday') {
    // Intraday: 0.025% on sell only
    stt = side === 'sell' ? tradeValue * 0.00025 : 0;
  }

  // Exchange transaction charges (NSE)
  // 0.00297% on both buy and sell
  exchangeCharges = tradeValue * 0.0000297;

  // SEBI charges
  // ₹10 per crore = 0.000001 on both buy and sell
  sebiCharges = tradeValue * 0.000001;

  // Stamp duty (buy side only)
  if (side === 'buy') {
    if (orderType === 'delivery') {
      // Delivery buy: 0.015%
      stampDuty = tradeValue * 0.00015;
    } else if (orderType === 'intraday') {
      // Intraday buy: 0.003%
      stampDuty = tradeValue * 0.00003;
    }
  }
  // Sell side: stamp duty = 0

  // GST
  // 18% on (brokerage + exchange_charges)
  gst = (brokerage + exchangeCharges) * 0.18;

  // Total charges
  const totalCharges = brokerage + stt + exchangeCharges + sebiCharges + stampDuty + gst;

  // Net amount
  let netAmount = 0;
  if (side === 'buy') {
    // Buy: negative amount (money leaves wallet)
    netAmount = -(tradeValue + totalCharges);
  } else {
    // Sell: positive amount (money enters wallet)
    netAmount = tradeValue - totalCharges;
  }

  return {
    brokerage: parseFloat(brokerage.toFixed(2)),
    stt: parseFloat(stt.toFixed(2)),
    exchangeCharges: parseFloat(exchangeCharges.toFixed(4)),
    sebiCharges: parseFloat(sebiCharges.toFixed(4)),
    stampDuty: parseFloat(stampDuty.toFixed(4)),
    gst: parseFloat(gst.toFixed(4)),
    totalCharges: parseFloat(totalCharges.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2))
  };
}