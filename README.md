# ZIA Event and Wedding Planner

Exactly two applications exist: `apps/customer` and `apps/admin`. The customer store is **Smart Gadget Store**. No third application or prohibited feature has been added.

## Setup

```bash
npm install
```

Set the same Supabase project in both apps' `.env.local` files:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Run `supabase/schema.sql` followed by `supabase/production.sql` in the Supabase SQL editor. Create Auth users and add the admin Auth user's UUID to `admin_users`. Never use a service-role key in frontend code.

## Commands

```bash
npm run dev:customer
npm run dev:admin
npm run build:customer
npm run build:admin
```

Customer authentication includes registration and retry-safe profile upsert. Checkout calls the database `checkout_cart` RPC, which locks products, validates stock, uses trusted prices, creates order items, and decrements stock atomically. Booking advance submissions create pending payment records. The admin panel is Auth/RLS protected and provides CRUD for categories, packages, halls, services and payment methods, plus product inventory, order/booking status, payment verification, customer records and audit logging.
