# ZIA Event and Wedding Planner

Exactly two applications are maintained here:

- `apps/customer` — public ZIA Customer App. Its store section is **Smart Gadget Store**.
- `apps/admin` — authenticated, separate ZIA Private Admin Panel.

The customer app has no admin route, admin button, or admin control. No rider, staff, delivery, calendar, wishlist, reviews, ratings, or third app is included.

## Setup

```bash
npm install
```

Create `.env.local` in both apps with the same Supabase project:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Run `supabase/schema.sql` in the Supabase SQL Editor. Create customer and admin users with Supabase Auth. Add the admin Auth user UUID to `admin_users`; frontend code uses only the publishable anon key and never a service-role secret.

## Run and build

```bash
npm run dev:customer
npm run dev:admin
npm run build:customer
npm run build:admin
```

Customer runs at port 5173 and admin at port 5174.

## Live shared data

Both apps use the same Supabase database. Customer catalog, categories, prices, stock, payment methods, packages, halls and services are loaded from Supabase and the customer app subscribes to relevant Realtime changes. Orders and bookings persist against the authenticated customer and appear in history. Admin authorization is enforced by Supabase Auth plus an active `admin_users` row; RLS protects customer-owned records and requires `is_admin()` for operational changes.

The customer app supports PKR pricing, Smart Watches, Earbuds, Handsfree, Chargers, product catalog/cart/checkout, Cash on Delivery, card, JazzCash, EasyPaisa and bank transfer options, wedding/event packages, hall booking, services, 20% advance and remaining balance display. The private panel manages shared operational data, payment and advance statuses, customer records and audit logs.
