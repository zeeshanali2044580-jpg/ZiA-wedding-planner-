# ZIA Event and Wedding Planner

This repository contains exactly two applications:

1. `apps/customer` — the public, mobile-first **ZIA Event and Wedding Planner** customer app.
2. `apps/admin` — the separate, authenticated **ZIA Private Admin Panel**.

The store section inside the customer app is named **Smart Gadget Store**. The customer app contains no admin route, admin button, or admin control. This repository intentionally contains no rider, staff, delivery, calendar, wishlist, review, rating, or third application.

## Setup

```bash
npm install
```

Create `.env.local` in both `apps/customer` and `apps/admin` using the same Supabase project:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Run `supabase/schema.sql` in the Supabase SQL Editor. Create users with Supabase Auth. Add an authorized admin user UUID to `admin_users`; the admin frontend uses only the publishable anon key and never contains a service-role secret.

## Development and production builds

```bash
npm run dev:customer
npm run dev:admin
npm run build:customer
npm run build:admin
```

Customer runs on port 5173 and the private admin panel on port 5174.

## Shared data and security

Both apps use the same Supabase database. Products, categories, prices, stock, payment methods, wedding packages, halls, services, orders, bookings, and payment/advance statuses are stored centrally. The customer app reads active records and subscribes to relevant Realtime changes, so catalog and package updates appear without rebuilding. The admin panel requires Supabase Auth and an active `admin_users` record. RLS policies in `supabase/schema.sql` protect customer-owned records and require `is_admin()` for operational mutations.

Customer features include PKR pricing, Smart Watches, Earbuds, Handsfree and Chargers, product detail/cart/checkout, Cash on Delivery, card, JazzCash, EasyPaisa and bank transfer options, wedding/event package and hall booking, 20% advance and remaining balance display, account, order history, booking history, loading/error/empty/success states and form validation.

Admin features include private login, dashboard analytics, product/category/package/hall/service/payment management, price and stock controls, order and booking status updates, payment and advance tracking, customer records and audit-log schema support.
