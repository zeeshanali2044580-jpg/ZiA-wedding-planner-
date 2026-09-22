# ZIA Business Platform

Exactly two applications are included:

- `apps/customer`: public ZIA Customer App for electronics, orders, weddings and event bookings.
- `apps/admin`: authenticated ZIA Private Admin Panel for catalog, inventory, orders, bookings, payments and analytics.

There is no rider, staff, delivery, or third application.

## Local development

```bash
npm install
npm run dev:customer # http://localhost:5173
npm run dev:admin    # http://localhost:5174
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for each app to enable shared live data. Without environment variables, each app uses safe demo data for UI development. Run `supabase/schema.sql` in the Supabase SQL editor, create an Auth user, then add that user's UUID to `admin_users` to authorize the private panel.

The customer app exposes no admin routes, links, or controls. Admin authorization is enforced by Supabase Auth plus the `is_admin()` RLS function; public catalog reads are limited to active records, while admin mutations require an active `admin_users` row.
