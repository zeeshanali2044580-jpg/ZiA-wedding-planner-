# ZIA Business Platform

Exactly two applications live in this repository:

- `apps/customer` — public, mobile-first ZIA Customer App.
- `apps/admin` — authenticated, private ZIA Admin Panel.

There is intentionally no rider, staff, delivery, calendar, wishlist, review/rating, or third application.

## Install and run

```bash
npm install
npm run dev:customer # http://localhost:5173
npm run dev:admin    # http://localhost:5174
npm run build:customer
npm run build:admin
```

Create `.env.local` in **each** app (never commit it):

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Run `supabase/schema.sql` in the Supabase SQL editor. Create users in Supabase Authentication. To authorize a private admin, insert that Auth user UUID into `admin_users`; no service-role key belongs in either frontend. Customer checkout and bookings require a signed-in customer so RLS can associate records with `auth.uid()`.

## Shared data and security

Both apps use the same Supabase project and subscribe to catalog/order/booking changes with Realtime, so admin price, stock, package, payment-method and status changes appear without rebuilding. Row Level Security exposes only active public records, a customer’s own records, and admin-managed data to active admins. The admin app has no bypass key: authorization is enforced by Supabase Auth and `is_admin()`.

## Included production flows

Customer: live catalog, Smart Watches/Earbuds/Handsfree/Chargers, details, cart, validated checkout, PKR totals, Cash/Card/JazzCash/EasyPaisa/Bank Transfer options, wedding packages, hall/service booking, 20% advance and remaining balance, account, order and booking history, and loading/error/empty/success states.

Admin: private login, dashboard metrics, live catalog editing, product/category/package/hall/service/payment management, stock and prices, order and booking status updates, payment/advance tracking, customer records and audit log support.
