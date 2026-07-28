# Autopaisa - Automated Paper Trading Simulator for the Indian Stock Market

Autopaisa is a Next.js web application that simulates automated paper trading for the Indian stock market (NSE). It uses real market data (via Yahoo Finance) to execute paper trades based on a technical analysis strategy, with realistic fee calculations matching Zerodha/Groww pricing.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup Installation](#setup--installation)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Usage](#usage)
- [Development Phases](#development-phases)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Disclaimer](#disclaimer)

## 🎯 Overview

Autopaisa is an educational simulation that:
- Uses fake money (no real money involved)
- Connects to real NSE stock prices via Yahoo Finance
- Executes trades automatically during market hours (9:15 AM - 3:30 PM IST)
- Applies realistic brokerage charges and taxes
- Provides a web dashboard to monitor performance
- Sends Telegram notifications for executed trades

## ✨ Features

### Core Trading Engine
- **Automated Trading**: Runs unattended during market hours
- **Technical Strategy**: SMA20/SMA50 crossover with RSI14 filter
- **Position Sizing**: Invests up to 10% of wallet per trade
- **Risk Management**: Stop-loss (-5%) and take-profit (+10%) triggers
- **Delivery Trades Only**: No intraday, leverage, or derivatives

### Intraday Scalping Bot Workspace ⚡
- **Isolated Workspace & Wallet**: Completely separate ₹100,000 scalper paper wallet at `/scalper`.
- **Intraday Scalp Engine**: Evaluates 1-minute intraday candles via VWAP & Relative Volume Filters.
- **Ruleset Implementation**:
  - **Rule 1 (VWAP Magnet)**: Long entry if price < VWAP; Short entry if price > VWAP.
  - **Rule 2 (Relative Volume Filter)**: Current 1-minute volume $\ge 1.5\times$ 20-minute average volume.
  - **Rule 3 (Time Gate)**: Active between 9:30 AM and 3:15 PM IST (Auto square-off at 3:15 PM IST).
  - **Rule 5 (Asymmetric TP/SL)**: +0.20% Take Profit / -0.50% Stop Loss.
  - **Rule 6 (Break-Even Trailing)**: Moves Stop Loss to Entry Price ($0 Risk) when profit hits +0.12% (60% of TP).
  - **Rule 7 (Dynamic Cooldown)**: 30s pause after win/scratch; 120s pause after loss.
  - **Rule 8 (Circuit Breaker)**: Automatically shuts down bot for the day if daily drawdown hits -2.0% (-₹2,000).
  - **Rule 9 (Conviction Scaling)**: Doubles lot size (20% of wallet) on strong volume spikes ($\ge 2.0\times$).

### Realistic Financial Modeling
- **Exact Fee Calculation**: Matches Zerodha/Groww pricing structure
- **Brokerage**: ₹0 for delivery, min(₹20, 0.03%) for intraday
- **Taxes**: STT, exchange charges, SEBI fees, stamp duty, GST
- **P&L Tracking**: Realized and unrealized profit/loss

### User Interface
- **Dashboard**: Wallet balance, today's P&L, portfolio value chart
- **Portfolio**: Current holdings with current values and P&L
- **Trades**: Execution history with detailed fee breakdown
- **Activity Log**: All trading signals (including holds) with reasoning
- **Wallet**: Add/withdraw fake money
- **Mobile Responsive**: Optimized for small screens

### Notifications & Monitoring
- **Telegram Alerts**: Real-time trade notifications
- **Activity Logging**: All signals logged with execution status
- **Market Hours Awareness**: Only trades during NSE hours (9:15 AM - 3:30 PM IST)
- **Holiday Support**: Hardcoded NSE 2026 holiday calendar

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| **Charts** | Recharts |
| **Backend Worker** | Node.js + TypeScript (separate service) |
| **Database** | Supabase (PostgreSQL) - Free tier |
| **Authentication** | Supabase Auth (email/password) |
| **Market Data** | yahoo-finance2 npm package |
| **Scheduling** | node-cron |
| **Notifications** | Telegram Bot API |
| **Hosting** | Frontend: Vercel, Worker: Render/Railway |

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Worker Service     │    │   Supabase DB   │
│  (Vercel)       │    │  (Render/Railway)    │    │   (PostgreSQL)  │
└─────────┬───────┘    └──────────┬───────────┘    └─────────┬────────┘
          │                       │                          │
          │ HTTP API Requests     │ Direct DB Access         │
          ▼                       ▼                          ▼
    ┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
    │   Wallet API    │    │  Trading Engine      │    │   Tables:       │
    │   Holdings API  │    │  Signal Generation   │    │  • wallets      │
    │   Trades API    │    │  Trade Execution     │    │  • holdings     │
    │   Signals API   │    │  Fee Calculation     │    │  • trades       │
    └─────────────────┘    │  Telegram Notifier   │    │  • transactions │
                           │  Scheduler           │    │  • watchlist    │
                           └──────────────────────┘    │  • signals_log  │
                                                       │  • notifications │
                                                       └──────────────────┘
```

### Data Flow
1. **Worker Service** runs every 5 minutes during market hours
2. For each stock in watchlist:
   - Fetch historical data & calculate indicators (SMA20, SMA50, RSI14)
   - Generate BUY/SELL/HOLD signal based on strategy
   - If BUY/SELL: execute trade (calculate fees, update DB)
   - Send Telegram notification for executed trades
   - Log signal to database (with execution flag)
3. **Next.js App** provides UI to:
   - View wallet balance and transaction history
   - Monitor current holdings and P&L
   - Review trade history with fee breakdown
   - See activity log of all signals
   - Add/withdraw funds

## 🗄️ Database Schema

The application uses these key tables:

### `wallet`
- Stores current balance (starts at ₹1,00,000)
- One row only (singleton pattern)

### `watchlist`
- 20 liquid Nifty 50 stocks (RELIANCE.NS, TCS.NS, etc.)
- Active/inactive flag

### `signals_log`
- Every signal generated (BUY/SELL/HOLD)
- Includes SMA20, SMA50, RSI14 values
- `acted_on` flag indicates if trade was executed

### `trades`
- Every executed trade
- Complete fee breakdown (brokerage, STT, taxes, etc.)
- Net amount credited/debited to wallet

### `holdings`
- Current stock positions
- Quantity and average buy price

### `wallet_transactions`
- All wallet movements (deposits, withdrawals, trades)
- Running balance after each transaction

### `notifications_log`
- Telegram notification attempts (success/failure)

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Telegram Bot token (from @BotFather)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd autopaisa
```

### 2. Install Dependencies
```bash
# Install main app dependencies
npm install

# Install worker dependencies
cd worker
npm install
cd ..
```

### 3. Set Up Environment Variables

Create `.env.local` for the Next.js app:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `.env` for the worker:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
STARTING_WALLET_BALANCE=100000
```

### 4. Set Up Supabase
1. Create a new Supabase project
2. Enable the pgcrypto extension
3. Run the migration SQL from `supabase/migrations/20250724_init_schema.sql`
4. The migration will:
   - Create all required tables
   - Insert the initial watchlist (20 Nifty 50 stocks)
   - Create an initial wallet with ₹1,00,000 balance

### 5. Set Up Telegram Bot
1. Message @BotFather on Telegram
2. Use `/newbot` to create a bot
3. Get the bot token
4. Message your bot to get a chat ID
5. Add both to your `.env` file

## 📁 Project Structure

```
autopaisa/
├── app/                         # Next.js app (App Router)
│   ├── api/                     # API routes
│   │   ├── holdings/            # GET /api/holdings
│   │   ├── signals/             # GET /api/signals
│   │   ├── trades/              # GET /api/trades
│   │   ├── transactions/        # GET /api/transactions
│   │   ├── wallet/              # Wallet endpoints
│   │   ├── watchlist/           # GET /api/watchlist
│   │   └── trade/               # POST /api/trade (manual trigger)
│   ├── activity/                # Activity log page
│   ├── portfolio/               # Portfolio page
│   ├── trades/                  # Trades history page
│   ├── wallet/                  # Wallet management
│   ├── page.tsx                 # Dashboard/home page
│   └── layout.tsx               # Root layout
├── worker/                      # Background worker service
│   ├── src/
│   │   ├── fees.ts             # Fee calculation logic
│   │   ├── market-hours.ts     # IST market hours/holiday logic
│   │   ├── market.ts           # Yahoo Finance data fetching
│   │   ├── strategy.ts         # Trading signal generation & execution
│   │   ├── supabase.ts         # Supabase client setup
│   │   ├── ta.ts               # Technical indicators (SMA, RSI)
│   │   ├── notifications.ts    # Telegram integration
│   │   └── index.ts            # Worker entry point with cron scheduler
│   ├── .env                    # Worker environment variables
│   ├── package.json
│   └── tsconfig.json
├── supabase/                   # Supabase migration files
│   └── migrations/
│       ├── 20250724_init_schema.sql
│       └── 20250724_add_reason_to_signals_log.sql
├── lib/                        # Shared library code (next.js)
│   ├── fees.ts                 # Fee calculation (shared with worker)
│   ├── market.ts               # Market data fetching
│   ├── strategy.ts             # Strategy interface
│   ├── supabase.ts             # Supabase client
│   └── ta.ts                   # Technical indicators
├── scripts/                    # Utility scripts
│   └── test-market-data.ts     # Market data testing
├── public/                     # Static assets
├── styles/                     # Global styles
├── autopaisa.md                # Detailed product specification
└── README.md                   # This file
```

## 🔌 API Endpoints

### Wallet Management
- `GET /api/wallet` - Get current wallet balance
- `POST /api/wallet/deposit` - Add funds (`{ amount: number }`)
- `POST /api/wallet/withdraw` - Remove funds (`{ amount: number }`)

### Trading Data
- `GET /api/holdings` - Get current holdings with live prices & P&L
- `GET /api/trades?limit=&offset=&symbol=` - Get trade history (filterable)
- `GET /api/signals?limit=` - Get recent trading signals
- `GET /api/watchlist` - Get active watchlist symbols
- `POST /api/trade` - Manually trigger a trading cycle (for testing)

## 🚀 Usage

### Development Mode
```bash
# Start the Next.js dev server
npm run dev

# In another terminal, start the worker
cd worker
npm run dev  # or just node dist/index.js after building
```

The app will be available at [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Worker Only (for testing trading logic)
```bash
cd worker
npm start
```

## 📈 Development Phases

The project was built in 8 phases as outlined in `autopaisa.md`:

### ✅ Phase 0: Scaffolding
- Next.js + TypeScript + Tailwind setup
- Supabase project creation
- Schema migration
- Basic Vercel deployment

### ✅ Phase 1: Wallet CRUD
- `/api/wallet`, `/api/wallet/deposit`, `/api/wallet/withdraw` endpoints
- Wallet UI with deposit/withdraw forms
- Proper transaction logging

### ✅ Phase 2: Market Data
- Integrated `yahoo-finance2` package
- `fetchMarketData()` function with retry logic
- Historical data fetching (60 days)

### ✅ Phase 3: Strategy Engine (Dry Run)
- SMA20/SMA50/RSI14 calculation
- Signal generation logic
- Signals logged to DB (with `acted_on = false`)

### ✅ Phase 4: Fee Engine + Trade Execution
- Exact `calculateFees()` implementation per spec
- Trade execution logic
- Wallet, trades, holdings, transactions updates
- Unit tests passing

### ✅ Phase 5: Worker Deployment & Scheduling
- Standalone worker service
- IST market hours detection (9:15 AM - 3:30 PM)
- NSE 2026 holiday calendar
- 5-minute cron schedule during market hours
- Deployed to Render/Railway

### ✅ Phase 6: Notifications
- Telegram Bot API integration
- Formatted trade notifications
- Success/failure logging to `notifications_log`

### ✅ Phase 7: UI Polish
- Dashboard with balance, P&L, and portfolio chart
- Portfolio page with holdings table
- Trades page with fee breakdown
- Activity log with signal reasoning
- Mobile-responsive design

### 🔜 Phase 8: Stretch Goals (Future Work)
- Stop-loss/take-profit refinement
- Multiple strategy switching
- Performance analytics page
- CSV export functionality

## 🔑 Environment Variables

### Next.js App (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Worker Service (`.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
STARTING_WALLET_BALANCE=100000
```

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Worker Service (Render/Railway)
1. Create new service
2. Connect GitHub repository
3. Set build command: `cd worker && npm install && npm run build`
4. Set start command: `cd worker && npm start`
5. Add environment variables from `.env` file
6. Deploy

## 📝 Important Notes

### Paper Trading Only
⚠️ **This is a simulation only** - No real money is involved, and no actual trades are placed on any exchange.

### Market Hours
The worker only executes trades during NSE trading hours:
- **Monday-Friday**: 9:15 AM to 3:30 PM IST
- **Weekends**: No trading
- **Holidays**: No trading (using 2026 NSE holiday calendar)

### Fee Calculation
All fees are calculated exactly as specified:
- Uses Tier 1 brokerage rates (₹0 for delivery, min(₹20, 0.03%) for intraday)
- Includes all taxes and charges as per Zerodha/Groww structure
- GST applied to (brokerage + exchange charges) at 18%

## 📜 Disclaimer

> "Autopaisa is an educational simulation using fake money and real market prices. It is not investment advice and must never be connected to a real brokerage account or real funds."

This application is intended for educational and learning purposes only. Past performance (even in simulation) does not guarantee future results. The developers are not liable for any losses incurred if this software is misused with real money or connected to actual brokerage accounts.

---

*Built with ❤️ for learning algorithmic trading concepts*