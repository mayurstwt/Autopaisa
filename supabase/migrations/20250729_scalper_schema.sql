-- Migration: Create isolated database tables for Intraday Scalping Bot

-- Table: scalper_wallet
create table if not exists scalper_wallet (
  id uuid primary key default gen_random_uuid(),
  balance numeric(12,2) not null default 10000000.00,
  starting_balance numeric(12,2) not null default 10000000.00,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: scalper_positions (Active Open Positions)
create table if not exists scalper_positions (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  side text not null check (side in ('buy', 'sell')),
  entry_price numeric(12,2) not null,
  quantity integer not null,
  invest_amount numeric(12,2) not null,
  tp_price numeric(12,2) not null,
  sl_price numeric(12,2) not null,
  break_even_triggered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Table: scalper_trades (Executed Trades History)
create table if not exists scalper_trades (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  side text not null check (side in ('buy', 'sell')),
  entry_price numeric(12,2) not null,
  exit_price numeric(12,2) not null,
  quantity integer not null,
  trade_value numeric(12,2) not null,
  pnl numeric(12,2) not null,
  pnl_percent numeric(6,4) not null,
  exit_reason text not null, -- 'tp', 'sl', 'break_even', 'eod_squareoff'
  brokerage numeric(12,2) not null default 0.00,
  net_amount numeric(12,2) not null,
  created_at timestamptz not null default now()
);

-- Table: scalper_signals_log (1-minute Scan Logs)
create table if not exists scalper_signals_log (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  signal text not null check (signal in ('buy', 'sell', 'hold')),
  current_price numeric(12,2),
  vwap numeric(12,2),
  current_volume bigint,
  avg_20m_vol bigint,
  volume_ratio numeric(6,2),
  acted_on boolean not null default false,
  reason text,
  created_at timestamptz not null default now()
);

-- Table: scalper_state (Bot State: Circuit breaker & Cooldown)
create table if not exists scalper_state (
  id uuid primary key default gen_random_uuid(),
  daily_pnl numeric(12,2) not null default 0.00,
  starting_daily_balance numeric(12,2) not null default 10000000.00,
  is_disabled_today boolean not null default false,
  cooldown_until timestamptz,
  last_trade_result text, -- 'win', 'loss', 'scratch'
  updated_at timestamptz not null default now()
);

-- Insert initial records if not exists
insert into scalper_wallet (balance, starting_balance)
select 10000000.00, 10000000.00
where not exists (select 1 from scalper_wallet);

insert into scalper_state (daily_pnl, starting_daily_balance, is_disabled_today)
select 0.00, 10000000.00, false
where not exists (select 1 from scalper_state);
