# ZIA Event and Wedding Planner

Exactly two apps are included: `apps/customer` (public customer app) and `apps/admin` (private admin panel). The customer store is named **Smart Gadget Store**. No admin route or control exists in the customer app, and there is no rider, staff, delivery, calendar, wishlist, review, rating, or third app.

## Setup

```bash
npm install
```

Create `.env.local` in both app directories using the same Supabase project:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_anon_key
```

Run `supabase/schema.sql` in the Supabase SQL Editor. Create users with Supabase Auth; add an authorized admin user's UUID to `admin_users`. Never put a service-role key in frontend code.

## Run and build

```bash
npm run dev:customer
npm run dev:admin
npm run build:customer
npm run build:admin
```

The customer app uses live products/categories/packages/halls/payment methods, authenticated order and booking persistence, PKR totals, and Pakistani payment methods (Cash on Delivery, card, JazzCash, EasyPaisa and bank transfer). The admin panel uses Supabase Auth, admin authorization, shared product/stock/price and order/booking status controls, customer records and audit logging. RLS ensures customers access only their own records and only authorized admins can mutate operational data.
