# ZIA Event and Wedding Planner

Exactly two applications are maintained:

- `apps/customer` — public ZIA Customer App with the **Smart Gadget Store**.
- `apps/admin` — separate authenticated ZIA Private Admin Panel.

No third application, rider, staff, delivery, calendar, wishlist, reviews, ratings, or customer-facing admin route is included.

## Setup

```bash
npm install
```

Create `.env.local` in both app directories using the same Supabase project:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Run `supabase/schema.sql`, then `supabase/production.sql` in the Supabase SQL Editor. Create customer Auth users normally. To authorize the private panel, add the Auth user's UUID to `admin_users`. Frontends use only the publishable anon key; never expose a service-role key.

## Commands

```bash
npm install
npm run dev:customer
npm run dev:admin
npm run build:customer
npm run build:admin
```

The customer app includes retry-safe customer profiles, live products/packages/halls/payment methods, persistent order and booking history, Pakistani payment methods, and atomic database-priced checkout via `checkout_cart`. The admin panel uses Supabase Auth plus `is_admin()`/RLS, live metrics, product inventory, CRUD for categories/packages/halls/services/payment methods, order/booking statuses, payment verification, customer records and audit logging.

The GitHub API environment can inspect and commit repository files but cannot execute Node.js, Supabase, browser, lint, or build commands. Build/runtime verification is therefore explicitly not claimed here.
