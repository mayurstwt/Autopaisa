# Intraday Scalping Bot – Core Ruleset (Paper Trading)

## 1. Global Parameters (Constants)
Define these variables at the bot's initialization:

| Parameter | Value | Description |
| :--- | :--- | :--- |
| `DEFAULT_BALANCE` | ₹10,000,000 (1 Cr) | Starting account balance for scalping. |
| `TP_PERCENT` | 0.0060 (0.60%) | Take Profit target (2:1 Reward-to-Risk ratio). |
| `SL_PERCENT` | 0.0030 (0.30%) | Stop Loss threshold from entry price. |
| `BREAK_EVEN_AT` | 0.50 (50%) | Move SL to entry when price hits 50% of TP (0.30% gain / 1.0R). |
| `RISK_PER_TRADE_PERCENT` | 0.0050 (0.50%) | Fixed fractional risk per scalp (₹50,000 on ₹1 Cr). |
| `MAX_POSITION_ALLOCATION` | 0.25 (25%) | Max trade capital cap per position (₹25,00,000). |
| `VOLUME_MULTIPLIER` | 1.5x | Min ratio of current 1m volume to 20m average. |
| `COOLDOWN_WIN` | 30 seconds | Pause after a winning trade. |
| `COOLDOWN_LOSS` | 120 seconds | Pause after a losing trade. |
| `DAILY_LOSS_LIMIT` | -5.0% | Max daily drawdown (-5% of starting balance / -₹5,00,000 - Aggressive). |
| `TRADING_START` | 09:30 AM IST | Earliest time to enter a trade. |
| `TRADING_END` | 03:15 PM IST | Latest time to enter a trade (auto-squareoff at 3:15 PM). |

---

## 2. Entry Rules (Conditions to OPEN a trade)

### Rule 1: The VWAP Magnet
- **Long Entry:** Current price **must be strictly below** the VWAP (Volume Weighted Average Price).
- **Short Entry:** Current price **must be strictly above** the VWAP.
- *Rationale:* Prevents entering against the dominant intraday fair value gravity.

### Rule 2: Relative Volume Filter (Fuel)
- Fetch the average volume of the last 20 minutes (1-minute candles).
- Fetch the volume of the current 1-minute candle.
- **Condition:** `Current_Volume > (Avg_20min_Volume * VOLUME_MULTIPLIER)`.
- *Action:* If false, **do not open** any trade, regardless of other signals.
- *Rationale:* Scalping requires spike momentum; low volume leads to spread traps.

### Rule 3: Time-of-Day Gate
- **Condition:** Current system time (EST) must be `>= TRADING_START` AND `<= TRADING_END`.
- *Action:* If outside this window, the bot remains idle.
- *Rationale:* Avoids opening gaps (open) and erratic end-of-day squaring (close).

### Rule 4: News Blackout Timer
- Maintain a hard-coded calendar of high-impact events (CPI, FOMC, NFP).
- **Condition:** Current time is within `NEWS_BUFFER` minutes before or after the event.
- *Action:* Immediately cancel all pending orders and disable entry logic.
- *Rationale:* Prevents wild spread-widening and stop-hunting from corrupting backtest stats.

---

## 3. Position Management Rules (While Trade is Active)

### Rule 5: Asymmetric Take-Profit / Stop-Loss
- Upon entry, immediately place:
  - **Take Profit (Limit) Order:** `Entry_Price * (1 + TP_PERCENT)` for longs; `Entry_Price * (1 - TP_PERCENT)` for shorts.
  - **Stop Loss (Stop-Market) Order:** `Entry_Price * (1 - SL_PERCENT)` for longs; `Entry_Price * (1 + SL_PERCENT)` for shorts.
- *Rationale:* Wide SL + tight TP ensures a higher statistical win-rate (>65%).

### Rule 6: Break-Even Trailing (The "Scratch" Protector)
- Continuously monitor `Current_Price` against `Entry_Price`.
- Calculate `Profit_Percentage` = `abs(Current_Price - Entry_Price) / Entry_Price`.
- **Condition:** If `Profit_Percentage >= (TP_PERCENT * BREAK_EVEN_AT)`:
  - *Action:* Immediately cancel the existing Stop Loss and replace it with a new Stop Loss exactly at `Entry_Price` (Break-Even).
- *Rationale:* Locks in the trade so that if it reverses, the bot exits at $0 profit/loss instead of a full loss.

---

## 4. Exit & Cooldown Rules (After Trade Closes)

### Rule 7: Dynamic Cooldown (Speed Bump)
- When a trade closes (either TP, SL, or Break-Even), start a timer.
- **If result == WIN:** Pause scanning for `COOLDOWN_WIN` seconds.
- **If result == LOSS:** Pause scanning for `COOLDOWN_LOSS` seconds.
- *Action:* The bot may not evaluate entry conditions during the cooldown.
- *Rationale:* Prevents overtrading and revenge entries after a sudden adverse move.

### Rule 8: Daily Loss Limit (Circuit Breaker)
- Maintain a running `Daily_PnL` variable (sum of realized PnL for the current day).
- **Condition:** If `Daily_PnL <= (Starting_Daily_Balance * DAILY_LOSS_LIMIT)`:
  - *Action:* **SHUTDOWN** – Cancel all open orders, close all active positions, and disable the bot entirely until the next trading day.
- *Rationale:* Even in simulation, this forces the model to recognize regime changes and stop bleeding.

---

## 5. Optional "Fun Money" Boost (Rule 9 – Conviction Scaling)
*Since this is paper trading, implement this to test edge strength:*

- **Condition:** If a potential trade satisfies **both** Rule 1 (VWAP) **AND** Rule 2 (Volume) simultaneously:
  - *Action:* Double the position size (2x normal lot/contract size) for that specific entry.
- *Rationale:* Identifies if your highest-conviction setups actually yield superior returns over time.

---

## 6. Implementation Logic Flow (Order of Operations)

For the AI model to code correctly, follow this sequential loop:

1. **Pre-Trade Checks:**
   - Check Time-of-Day (Rule 3).
   - Check News Blackout (Rule 4).
   - Check Daily Loss Limit (Rule 8).
   - If any fail → `RETURN` (Do nothing).

2. **Entry Evaluation:**
   - Fetch VWAP (Rule 1).
   - Fetch Volume (Rule 2).
   - If both pass → Determine direction (Long if price < VWAP; Short if price > VWAP).
   - Calculate Position Size (apply Rule 9 if applicable).
   - Place Entry Order + TP + SL (Rule 5).

3. **Active Management:**
   - While position is open, constantly check `Profit_Percentage` against `TP_PERCENT * BREAK_EVEN_AT` (Rule 6).
   - If triggered, modify SL to Entry Price.

4. **Post-Trade:**
   - Log result (Win/Loss/Scratch).
   - Update `Daily_PnL`.
   - Apply Cooldown timer (Rule 7).
   - Resume scanning after timer ends.