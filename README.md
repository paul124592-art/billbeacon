# BillBeacon

A bill and subscription tracker: add every bill once, see what you owe and when,
get warned before anything renews, and mark bills paid with one tap.

**Free:** up to 10 bills, 3-day reminders. **Premium ($4/month):** unlimited bills,
custom reminder timing, spending insights, CSV export.

## Live Stripe setup (already done)

- Product: **BillBeacon Premium** — `prod_VcUQuKoM1AK2fs`
- Price: **$4.00/month** — `price_1UbFRrAOAE9UAaZpqefAjNA2`
- Payment link: https://buy.stripe.com/9B6dR8cjYgl81Dq1Qg4Ja00

The app uses the payment link for upgrades (no backend needed). The price has
no tax — same as TimePawz.

## 1. Supabase (database + auth)

1. Create a free project at https://supabase.com
2. In the Supabase dashboard, open **SQL Editor → New query**, paste the whole
   of `supabase/schema.sql`, and run it. This creates `profiles`, `bills`, and
   `payments` with Row Level Security so each user only sees their own data.
3. Copy the project URL and anon key from **Project Settings → API**.
4. Optional: to enable "Continue with Google", go to **Authentication →
   Providers → Google** and add your Google OAuth client ID/secret. Email
   sign-up works without this step.

## 2. Environment variables

```bash
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The Stripe payment
link is already filled in.

## 3. Run it

```bash
npm install
npm run dev
```

## 4. Get it into Bolt (when your tokens reset)

Bolt can open an existing project two ways:

- **Drag and drop:** open https://bolt.new, drag this whole `billbeacon`
  folder into the browser window, and Bolt opens it as a project.
- **GitHub import:** push this folder to a GitHub repo, then in Bolt choose
  **Import** and pick the repo.

Then in Bolt, add the same two environment variables (Supabase URL + anon key)
under the project's environment settings. The payment link is already in the
code — no Stripe keys are needed in the app itself.

## 5. Deploy

In Bolt, hit **Deploy**. Your app gets a `*.bolt.host` link, free. A custom
domain needs Bolt Pro ($25/month) — same as TimePawz.

## How Premium works (simple v1)

The Upgrade button opens the live Stripe payment link. After paying, the
customer comes back to the app, goes to **Settings**, and taps **"I've
upgraded — unlock Premium"**, which flips their `is_premium` flag in the
database. That unlocks unlimited bills, custom reminders, and CSV export.

This trusts the customer to tap the button after paying — fine for a simple
first version. For a stricter setup later, add a Stripe webhook (or a Supabase
Edge Function) that sets `is_premium` automatically when the subscription is
created.

## Tech

React 18 + Vite + Tailwind CSS, Supabase (Postgres + Auth). No backend of its
own — everything runs through Supabase, and payments run through a Stripe
Payment Link.
