-- Migration: Create isolated scalper_watchlist table for Intraday Scalper Bot

create table if not exists scalper_watchlist (
  id uuid primary key default gen_random_uuid(),
  symbol text not null unique,
  name text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed isolated scalper watchlist with volatile, liquid mid/small-cap NSE stocks
insert into scalper_watchlist (symbol, name, active) values
  ('ADANIENT.NS', 'Adani Enterprises', true),
  ('ADANIPOWER.NS', 'Adani Power', true),
  ('SUZLON.NS', 'Suzlon Energy', true),
  ('IDEA.NS', 'Vodafone Idea', true),
  ('YESBANK.NS', 'Yes Bank', true),
  ('IDFCFIRSTB.NS', 'IDFC First Bank', true),
  ('RVNL.NS', 'Rail Vikas Nigam', true),
  ('IRFC.NS', 'Indian Railway Finance Corp', true),
  ('IEX.NS', 'Indian Energy Exchange', true),
  ('TATAPOWER.NS', 'Tata Power', true),
  ('JSWENERGY.NS', 'JSW Energy', true),
  ('PNB.NS', 'Punjab National Bank', true),
  ('ZOMATO.NS', 'Zomato', true),
  ('PAYTM.NS', 'One 97 Communications', true),
  ('HUDCO.NS', 'Housing & Urban Dev Corp', true),
  ('NHPC.NS', 'NHPC Limited', true)
on conflict (symbol) do nothing;
