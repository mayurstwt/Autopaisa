-- Create extensions
create extension if not exists "pgcrypto";

-- Table: watchlist
create table watchlist (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  display_name text not null,
  active boolean not null default true
);

-- Table: wallet
create table wallet (
  id uuid primary key default gen_random_uuid(),
  balance numeric(14,2) not null default 100000.00,
  created_at timestamptz not null default now()
);

-- Table: trades
create table trades (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  side text not null check (side in ('buy','sell')),
  order_type text not null check (order_type in ('delivery','intraday')),
  quantity int not null check (quantity > 0),
  price numeric(12,2) not null,
  trade_value numeric(14,2) not null,
  brokerage numeric(10,2) not null,
  stt numeric(10,2) not null,
  exchange_charges numeric(10,2) not null,
  sebi_charges numeric(10,2) not null,
  stamp_duty numeric(10,2) not null,
  gst numeric(10,2) not null,
  total_charges numeric(10,2) not null,
  amount numeric(14,2) not null,
  reason text,
  created_at timestamptz not null default now()
);

-- Table: wallet_transactions
create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('deposit','withdraw','trade_buy','trade_sell')),
  amount numeric(14,2) not null,
  balance_after numeric(14,2) not null,
  trade_id uuid references trades(id),
  created_at timestamptz not null default now()
);

-- Table: holdings
create table holdings (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  quantity int not null,
  avg_buy_price numeric(12,2) not null,
  updated_at timestamptz not null default now()
);

-- Table: signals_log
create table signals_log (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  signal text not null check (signal in ('buy','sell','hold')),
  sma20 numeric(12,2),
  sma50 numeric(12,2),
  rsi14 numeric(6,2),
  acted_on boolean not null default false,
  created_at timestamptz not null default now()
);

-- Table: notifications_log
create table notifications_log (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid references trades(id),
  channel text not null default 'telegram',
  status text not null check (status in ('sent','failed')),
  sent_at timestamptz not null default now()
);

-- Insert initial watchlist data
insert into watchlist (symbol, display_name, active) values
('RELIANCE.NS', 'Reliance Industries', true),
('TCS.NS', 'Tata Consultancy Services', true),
('HDFCBANK.NS', 'HDFC Bank', true),
('ICICIBANK.NS', 'ICICI Bank', true),
('INFY.NS', 'Infosys', true),
('HINDUNILVR.NS', 'Hindustan Unilever', true),
('ITC.NS', 'ITC Ltd', true),
('SBIN.NS', 'State Bank of India', true),
('BHARTIARTL.NS', 'Bharti Airtel', true),
('KOTAKBANK.NS', 'Kotak Mahindra Bank', true),
('LT.NS', 'Larsen & Toubro', true),
('AXISBANK.NS', 'Axis Bank', true),
('BAJFINANCE.NS', 'Bajaj Finance', true),
('MARUTI.NS', 'Maruti Suzuki', true),
('ASIANPAINT.NS', 'Asian Paints', true),
('TITAN.NS', 'Titan Company', true),
('SUNPHARMA.NS', 'Sun Pharmaceutical', true),
('ULTRACEMCO.NS', 'UltraTech Cement', true),
('WIPRO.NS', 'Wipro', true),
('NESTLEIND.NS', 'Nestle India', true)
on conflict (symbol) do nothing;

-- Insert initial wallet row (if not exists)
insert into wallet (id, balance, created_at)
select gen_random_uuid(), 100000.00, now()
where not exists (select 1 from wallet);