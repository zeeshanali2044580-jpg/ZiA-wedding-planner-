# ZIA Event and Wedding Planner

Exactly two applications remain: `apps/customer` and `apps/admin`. The customer store is **Smart Gadget Store**. No third app, rider/staff/delivery system, calendar, wishlist, reviews, ratings, or customer-facing admin route exists.

## Setup

```bash
npm install
```

Set the same Supabase project in `.env.local` under each app:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Run the existing `supabase/schema.sql`, then `supabase/production.sql`. Create Auth users and add the admin Auth user's UUID to `admin_users`. Never expose a service-role key in frontend code.

## Run/build

```bash
npm run dev:customer
npm run dev:admin
npm run build:customer
npm run build:admin
```

The customer app automatically upserts its auth-linked profile, reads live catalog/package/payment data, persists bookings and uses the atomic `checkout_cart` RPC so prices and stock are trusted by the database. The private admin app requires Auth plus an active `admin_users` row, manages live products, prices, stock, categories, packages, halls, orders and bookings, and records audit entries. RLS and security-definer functions enforce customer ownership and admin-only mutations.
