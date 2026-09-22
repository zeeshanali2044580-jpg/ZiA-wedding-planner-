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

The customer app includes retry-safe profiles, live catalog and packages, registration, persistent order/booking history, Pakistani payment methods, and atomic database-priced checkout through `checkout_cart`. The private admin panel includes Auth/RLS authorization, live metrics, product price/stock management, CRUD for categories/packages/halls/services/payment methods, order and booking statuses, payment verification, customers, and audit logging.

Static repository changes can be reviewed through GitHub. Node, browser, Supabase, lint, and build execution are not available through the GitHub API tools, so this change does not claim runtime verification.
