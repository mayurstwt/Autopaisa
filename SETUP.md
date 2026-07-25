# Autopaisa Complete Setup & Free Deployment Guide (Netlify + GitHub)

This guide covers setting up and deploying **Autopaisa** for 100% FREE using **GitHub**, **Netlify**, and **GitHub Actions / Free Cron** for the automated background worker.

---

## 1. Is the Application Ready for Monday 09:15 IST?

**YES!** 
- The Next.js frontend has passed full build compilation (`npm run build` succeeds with zero errors).
- All UI pages (Dashboard, Portfolio, Executed Trades, Transaction History, Activity Log, and Wallet Manager) are built with a modern dark theme and responsive layout.
- The background trading worker is equipped with:
  - Technical analysis indicators (SMA20, SMA50 crossover & RSI14).
  - Exact Zerodha/Groww fee & tax calculations (Brokerage, STT, Exchange charges, SEBI, Stamp duty, GST).
  - Indian Stock Market trading window check (`09:15` to `15:30` IST, Mon-Fri, excluding official NSE 2026 holidays).
  - Telegram trade notification engine.

---

## 2. Environment Variables Checklist

### Frontend (Netlify & `.env.local` for local dev)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
STARTING_WALLET_BALANCE=100000
```

### Worker (GitHub Secrets & `.env` for local worker)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
```

---

## 3. Step 1: Deploy Frontend on Netlify (100% Free)

1. Push your repository to **GitHub**:
   ```bash
   git add .
   git commit -m "Complete Autopaisa UI & GitHub Actions worker"
   git push origin main
   ```
2. Log in to [Netlify](https://app.netlify.com).
3. Click **Add new site** → **Import from an existing repository**.
4. Select **GitHub** and authorize, then select your `autopaisa` repository.
5. Netlify will auto-detect Next.js:
   - **Build Command:** `npm run build`
   - **Publish directory:** `.next` (or leave as default for Netlify Next.js plugin)
6. Click **Environment Variables** and add the following keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(Required for Next.js backend API routes)*
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
7. Click **Deploy Site**. Your site will be live on a `.netlify.app` URL in seconds!

---

## 4. Step 2: Deploy Background Worker for FREE (Replacing Render/Railway)

Since Render and Railway removed 24/7 un-metered free background workers, use one of the following 100% FREE options:

### Option A: GitHub Actions Cron Workflow (Recommended — 100% FREE & Native)

Your project includes `.github/workflows/worker-cron.yml`, which runs the trading cycle automatically every 5 minutes during Indian market hours (Mon–Fri, 09:15 – 15:30 IST).

**Setup:**
1. Open your GitHub Repository in your browser.
2. Go to **Settings** → **Secrets and variables** → **Actions**.
3. Click **New repository secret** and add the following 4 secrets:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key (from Supabase Settings > API)
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token
   - `TELEGRAM_CHAT_ID`: Your Telegram Chat ID
4. Done! On Monday morning at 09:15 IST, GitHub Actions will automatically execute `worker/src/tick.ts` every 5 minutes, evaluate live stock prices, place simulated paper trades, update wallet balances, and notify your Telegram bot!

> **Manual Test:** Go to GitHub Repo → **Actions** tab → **Autopaisa Automated Trading Cron** → **Run workflow** to test it anytime!

---

### Option B: Free Cloud Container Services (Koyeb)

If you prefer a 24/7 continuous process instead of cron ticks:
1. Sign up at [Koyeb.com](https://www.koyeb.com) (Free Tier available).
2. Create a **New Service** → GitHub Repo.
3. Set build command: `npm install` and start command: `npm run worker:start`.
4. Add worker environment variables (`SUPABASE_SERVICE_ROLE_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`).

---

### Option C: Run Worker Locally on Your Machine

If you are at your laptop during market hours:
```bash
# In project root:
npm run worker:start
```
The worker will log `Market status: OPEN` during 09:15–15:30 IST and process signals every 5 minutes.

---

## 5. Verification & Testing

1. **Verify Database**: Check Supabase Dashboard → Table Editor → `watchlist` has 20 NIFTY 50 symbols seeded, and `wallet` has ₹1,00,000 balance.
2. **Verify Telegram**: Send `/start` to your Telegram bot.
3. **Verify Netlify Site**: Open your Netlify URL and check that Dashboard, Portfolio, Trades, Activity, and Wallet pages load cleanly.
4. **Monday Morning 09:15 IST**: On market open, GitHub Actions or local worker will process ticks. Every buy/sell signal will appear in `/activity`, executed trades in `/trades`, and instant notifications in your Telegram app!