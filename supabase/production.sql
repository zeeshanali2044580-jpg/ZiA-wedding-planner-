-- ZIA production migration. Run after supabase/schema.sql in Supabase SQL Editor.
-- Idempotent: safe to run again. Frontends use only the publishable anon key.
create extension if not exists pgcrypto;

create table if not exists payment_methods (
  id uuid primary key default gen_random_uuid(), name text unique not null,
  method_type text not null check (method_type in ('cash','card','digital','bank')),
  instructions text, is_enabled boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists wedding_halls (
  id uuid primary key default gen_random_uuid(), name text not null, city text not null,
  capacity integer not null check (capacity > 0), price_from numeric(12,2) not null default 0,
  description text, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists event_services (
  id uuid primary key default gen_random_uuid(), name text unique not null, description text,
  price_from numeric(12,2) not null default 0, is_active boolean not null default true, created_at timestamptz not null default now()
);

alter table event_bookings add column if not exists hall_id uuid references wedding_halls(id);
alter table event_bookings add column if not exists payment_method_id uuid references payment_methods(id);
alter table event_bookings add column if not exists advance_amount numeric(12,2) not null default 0;
alter table event_bookings add column if not exists remaining_amount numeric(12,2) not null default 0;
alter table event_bookings add column if not exists payment_status text not null default 'unpaid';
alter table orders add column if not exists payment_method_id uuid references payment_methods(id);
alter table orders add column if not exists payment_status text not null default 'unpaid';
alter table orders add column if not exists delivery_address text;

create table if not exists payment_records (
  id uuid primary key default gen_random_uuid(), order_id uuid references orders(id) on delete cascade,
  booking_id uuid references event_bookings(id) on delete cascade, payment_method_id uuid references payment_methods(id),
  reference text, amount numeric(12,2) not null check (amount >= 0),
  payment_kind text not null check (payment_kind in ('order','advance','remaining')),
  payment_status text not null default 'pending' check (payment_status in ('pending','verified','rejected')),
  verified_by uuid references auth.users(id), verified_at timestamptz, notes text, created_at timestamptz not null default now(),
  check ((order_id is not null) <> (booking_id is not null))
);

insert into payment_methods(name,method_type,instructions) values
 ('Cash on Delivery','cash','Pay when your order arrives'),('Card payment','card','Secure card payment'),
 ('JazzCash','digital','Use your JazzCash mobile account'),('EasyPaisa','digital','Use your EasyPaisa mobile account'),
 ('Bank transfer','bank','Transfer to the ZIA business account') on conflict(name) do nothing;

create or replace function is_admin() returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from admin_users where id=auth.uid() and is_active=true) $$;

create or replace function ensure_customer_profile(p_full_name text default '',p_phone text default '') returns profiles
language plpgsql security definer set search_path=public
as $$ declare r profiles; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into profiles(id,full_name,email,phone)
 values(auth.uid(),coalesce(nullif(trim(p_full_name),''),coalesce(auth.jwt()->'user_metadata'->>'full_name','')),auth.jwt()->>'email',nullif(trim(p_phone),''))
 on conflict(id) do update set email=excluded.email,full_name=case when excluded.full_name<>'' then excluded.full_name else profiles.full_name end,phone=coalesce(excluded.phone,profiles.phone)
 returning * into r; return r;
end $$;

create or replace function checkout_cart(p_items jsonb,p_payment_method_id uuid,p_delivery_address text) returns uuid
language plpgsql security definer set search_path=public
as $$ declare i jsonb; p electronics_products%rowtype; oid uuid; q integer; subtotal numeric:=0; begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 perform ensure_customer_profile();
 if p_payment_method_id is null or not exists(select 1 from payment_methods where id=p_payment_method_id and is_enabled) then raise exception 'Select a valid payment method'; end if;
 if p_items is null or jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
 insert into orders(customer_id,payment_method_id,status,payment_status,delivery_address) values(auth.uid(),p_payment_method_id,'pending','unpaid',p_delivery_address) returning id into oid;
 for i in select * from jsonb_array_elements(p_items) loop
   if (i->>'product_id') is null or (i->>'quantity') is null then raise exception 'Invalid cart item'; end if;
   q:=(i->>'quantity')::integer; if q<1 then raise exception 'Invalid quantity'; end if;
   select * into p from electronics_products where id=(i->>'product_id')::uuid and is_active=true for update;
   if not found then raise exception 'Product unavailable'; end if;
   if p.stock_quantity<q then raise exception 'Insufficient stock for %',p.name; end if;
   insert into order_items(order_id,product_id,item_name,quantity,price) values(oid,p.id,p.name,q,p.price);
   update electronics_products set stock_quantity=stock_quantity-q,updated_at=now() where id=p.id;
   subtotal:=subtotal+(p.price*q);
 end loop;
 update orders set subtotal=checkout_cart.subtotal,total=checkout_cart.subtotal where id=oid; return oid;
end $$;

create or replace function admin_verify_payment(p_payment_id uuid,p_status text,p_notes text default '') returns payment_records
language plpgsql security definer set search_path=public
as $$ declare r payment_records; begin
 if not is_admin() then raise exception 'Admin authorization required'; end if;
 if p_status not in('pending','verified','rejected') then raise exception 'Invalid payment status'; end if;
 update payment_records set payment_status=p_status,notes=p_notes,verified_by=auth.uid(),verified_at=case when p_status='verified' then now() else null end where id=p_payment_id returning * into r;
 if not found then raise exception 'Payment record not found'; end if; return r;
end $$;

revoke all on function ensure_customer_profile(text,text),checkout_cart(jsonb,uuid,text),admin_verify_payment(uuid,text,text) from public;
grant execute on function ensure_customer_profile(text,text),checkout_cart(jsonb,uuid,text),admin_verify_payment(uuid,text,text) to authenticated;

alter table payment_records enable row level security;
do $$ begin
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='payment_records' and policyname='payment customer read') then
  create policy "payment customer read" on payment_records for select using(is_admin() or exists(select 1 from orders where orders.id=order_id and orders.customer_id=auth.uid()) or exists(select 1 from event_bookings where event_bookings.id=booking_id and event_bookings.customer_id=auth.uid()));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='payment_records' and policyname='payment customer create') then
  create policy "payment customer create" on payment_records for insert with check(payment_status='pending' and (exists(select 1 from orders where orders.id=order_id and orders.customer_id=auth.uid()) or exists(select 1 from event_bookings where event_bookings.id=booking_id and event_bookings.customer_id=auth.uid())));
 end if;
 if not exists(select 1 from pg_policies where schemaname='public' and tablename='payment_records' and policyname='payment admin manage') then
  create policy "payment admin manage" on payment_records for all using(is_admin()) with check(is_admin());
 end if;
end $$;

do $$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='payment_records') then alter publication supabase_realtime add table payment_records; end if;
end $$;
