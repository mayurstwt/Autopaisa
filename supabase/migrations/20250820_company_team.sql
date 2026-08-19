-- Migration: Add Company Team structure and employee attribution to trading logs

-- 1. Create company_team table
create table if not exists company_team (
  id text primary key,
  name text not null,
  role text not null,
  title text not null,
  avatar text not null,
  department text not null,
  bio text,
  desk text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Seed virtual employees
insert into company_team (id, name, role, title, avatar, department, desk, bio) values
  ('vikram', 'Vikram', 'Swing Trading Specialist', 'Senior Delivery Analyst', '📈', 'Delivery Desk', 'Nifty 50 Swing', 'Analyzes daily SMA20/50 golden crosses and RSI momentum for delivery trades.'),
  ('riya', 'Riya', 'Intraday Scalp Specialist', 'HFT Scalping Specialist', '⚡', 'Scalping Desk', 'Nifty Smallcap 50 Intraday', 'Monitors 1-minute VWAP dips and relative volume spikes (>=1.5x) for quick intraday scalps.'),
  ('dev', 'Dev', 'Chief Risk Officer', 'Head of Risk & Safety', '🛡️', 'Risk Management', 'Firm Safety Desk', 'Enforces strict -2.0% daily circuit breakers, max position allocation limits, and stop losses.'),
  ('ananya', 'Ananya', 'Finance & Fee Lead', 'Chief Financial Officer', '💼', 'Finance & Accounting', 'Capital & Ledger', 'Manages Zerodha/Groww fee calculations, tax breakdowns, and wallet balance settlements.'),
  ('kabir', 'Kabir', 'Telegram Compliance Officer', 'Communications Lead', '📢', 'Investor Relations', 'Telegram Alerts', 'Formats live trade signals, CRO alerts, and daily EOD performance summaries for Telegram.')
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  title = excluded.title,
  avatar = excluded.avatar,
  department = excluded.department,
  desk = excluded.desk,
  bio = excluded.bio;

-- 3. Add employee attribution columns to existing tables if not present
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='trades' and column_name='employee_name') then
    alter table trades add column employee_name text default 'Vikram';
    alter table trades add column employee_role text default 'Swing Trading Specialist';
  end if;

  if not exists (select 1 from information_schema.columns where table_name='signals_log' and column_name='employee_name') then
    alter table signals_log add column employee_name text default 'Vikram';
    alter table signals_log add column employee_role text default 'Swing Trading Specialist';
  end if;

  if not exists (select 1 from information_schema.columns where table_name='scalper_trades' and column_name='employee_name') then
    alter table scalper_trades add column employee_name text default 'Riya';
    alter table scalper_trades add column employee_role text default 'Intraday Scalp Specialist';
  end if;

  if not exists (select 1 from information_schema.columns where table_name='scalper_signals_log' and column_name='employee_name') then
    alter table scalper_signals_log add column employee_name text default 'Riya';
    alter table scalper_signals_log add column employee_role text default 'Intraday Scalp Specialist';
  end if;
end $$;
