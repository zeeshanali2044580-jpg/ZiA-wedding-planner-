-- ZIA production migration. Run after supabase/schema.sql in Supabase SQL Editor.
-- Idempotent: safe to run again. Frontends use only the publishable anon key.
create extension if not exists pgcrypto;

create table if not exists payment_methods(
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  method_type text not null check(method_type in('cash','card','digital','bank')),
  instructions text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists wedding_halls(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  capacity integer not null check(capacity>0),
  price_from numeric(12,2) not null default 0,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists event_services(
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  price_from numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table electronics_products add column if not exists updated_at timestamptz not null default now();
alter table electronics_products add column if not exists stock integer not null default 0;
alter table electronics_products add column if not exists is_active boolean not null default true;
alter table electronics_products add column if not exists short_description text;
alter table electronics_products add column if not exists category_id uuid references electronics_categories(id);

alter table wedding_packages add column if not exists created_at timestamptz not null default now();
alter table wedding_halls add column if not exists created_at timestamptz not null default now();
alter table event_services add column if not exists created_at timestamptz not null default now();

alter table event_bookings add column if not exists hall_id uuid references wedding_halls(id);
alter table event_bookings add column if not exists payment_method_id uuid references payment_methods(id);
alter table event_bookings add column if not exists advance_amount numeric(12,2) not null default 0;
alter table event_bookings add column if not exists remaining_amount numeric(12,2) not null default 0;
alter table event_bookings add column if not exists payment_status text not null default 'unpaid';
alter table event_bookings add column if not exists total_amount numeric(12,2) not null default 0;
alter table event_bookings add column if not exists created_at timestamptz not null default now();

alter table orders add column if not exists payment_method_id uuid references payment_methods(id);
alter table orders add column if not exists payment_status text not null default 'unpaid';
alter table orders add column if not exists delivery_address text;
alter table orders add column if not exists total_amount numeric(12,2) not null default 0;
alter table orders add column if not exists created_at timestamptz not null default now();

create table if not exists payment_records(
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  booking_id uuid references event_bookings(id) on delete cascade,
  customer_id uuid references profiles(id) on delete cascade,
  payment_method_id uuid references payment_methods(id),
  amount numeric(12,2) not null default 0,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

insert into payment_methods(name, method_type, instructions)
values
  ('Cash on Delivery','cash','Pay when your order arrives'),
  ('Card payment','card','Secure card payment'),
  ('JazzCash','digital','Use your JazzCash account or wallet')
on conflict (name) do nothing;

create or replace function is_admin() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from admin_users where id = auth.uid() and is_active = true);
$$;

create or replace function ensure_customer_profile(p_full_name text default '', p_phone text default '')
returns profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  r profiles;
begin
  insert into profiles(id, full_name, phone, email)
  values (auth.uid(), coalesce(p_full_name, ''), coalesce(p_phone, ''), coalesce((select email from auth.users where id = auth.uid()), ''))
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, profiles.full_name),
        phone = coalesce(excluded.phone, profiles.phone)
  returning * into r;
  return r;
end;
$$;

create or replace function checkout_cart(p_items jsonb, p_payment_method_id uuid, p_delivery_address text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_total numeric(12,2) := 0;
  v_item jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Invalid cart payload';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_total := v_total + (
      (v_item->>'unit_price')::numeric * (v_item->>'quantity')::integer
    );
  end loop;

  insert into orders(id, customer_id, status, payment_method_id, payment_status, delivery_address, total_amount, created_at)
  values (v_order_id, auth.uid(), 'pending', p_payment_method_id, 'pending', p_delivery_address, v_total, now());

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items(order_id, product_id, quantity, unit_price)
    values (
      v_order_id,
      (v_item->>'product_id')::uuid,
      coalesce((v_item->>'quantity')::integer, 1),
      coalesce((v_item->>'unit_price')::numeric, 0)
    );
  end loop;

  insert into payment_records(order_id, customer_id, payment_method_id, amount, status, notes, created_at)
  values (v_order_id, auth.uid(), p_payment_method_id, v_total, 'pending', 'Checkout recorded', now());

  return v_order_id;
end;
$$;

create or replace function admin_verify_payment(p_payment_id uuid, p_status text, p_notes text default '')
returns payment_records
language plpgsql
security definer
set search_path = public
as $$
declare
  rec payment_records;
begin
  if not is_admin() then
    raise exception 'Unauthorized admin action';
  end if;

  update payment_records
  set status = p_status,
      notes = p_notes,
      created_at = now()
  where id = p_payment_id
  returning * into rec;

  return rec;
end;
$$;

revoke all on function ensure_customer_profile(text,text),checkout_cart(jsonb,uuid,text),admin_verify_payment(uuid,text,text) from public;
grant execute on function ensure_customer_profile(text,text),checkout_cart(jsonb,uuid,text),admin_verify_payment(uuid,text,text) to authenticated;

alter table payment_records enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'payment_records' and policyname = 'payment customer read') then
    create policy "payment customer read" on payment_records
      for select using (customer_id = auth.uid() or is_admin());
  end if;
end $$;

do $$
begin
  if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'payment_records') then
    -- realtime publication already includes the table if created earlier
    null;
  else
    begin
      alter publication supabase_realtime add table public.payment_records;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
