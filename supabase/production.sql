-- Production migration for the existing ZIA Supabase schema.
-- Run after the base schema. All functions are callable only by authenticated users.

alter table if exists orders add column if not exists payment_reference text;
alter table if exists event_bookings add column if not exists payment_reference text;
alter table if exists event_bookings add column if not exists remaining_amount numeric(12,2) not null default 0;
create table if not exists payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  booking_id uuid references event_bookings(id) on delete cascade,
  payment_method_id uuid references payment_methods(id),
  reference text,
  amount numeric(12,2) not null check(amount >= 0),
  payment_kind text not null check(payment_kind in ('order','advance','remaining')),
  payment_status text not null default 'pending' check(payment_status in ('pending','verified','rejected')),
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  check ((order_id is not null) <> (booking_id is not null))
);
alter table payment_records enable row level security;
create policy "customers read own payments" on payment_records for select using (
  exists(select 1 from orders o where o.id=order_id and o.customer_id=auth.uid()) or
  exists(select 1 from event_bookings b where b.id=booking_id and b.customer_id=auth.uid()) or is_admin()
);
create policy "admins manage payments" on payment_records for all using(is_admin()) with check(is_admin());

create or replace function ensure_customer_profile(p_full_name text default '', p_phone text default '')
returns profiles language plpgsql security definer set search_path=public as $$
declare result profiles;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into profiles(id, full_name, email, phone)
  values(auth.uid(), coalesce(nullif(trim(p_full_name),''), coalesce((auth.jwt()->'user_metadata'->>'full_name'),'')), auth.jwt()->>'email', nullif(trim(p_phone),''))
  on conflict(id) do update set email=excluded.email, full_name=case when excluded.full_name<>'' then excluded.full_name else profiles.full_name end, phone=coalesce(excluded.phone, profiles.phone)
  returning * into result;
  return result;
end; $$;
revoke all on function ensure_customer_profile(text,text) from public;
grant execute on function ensure_customer_profile(text,text) to authenticated;

create or replace function checkout_cart(p_items jsonb, p_payment_method_id uuid, p_delivery_address text)
returns uuid language plpgsql security definer set search_path=public as $$
declare item jsonb; product electronics_products%rowtype; order_id uuid; subtotal numeric:=0; qty integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  perform ensure_customer_profile();
  if jsonb_array_length(p_items)=0 then raise exception 'Cart is empty'; end if;
  insert into orders(customer_id,payment_method_id,status,payment_status,delivery_address) values(auth.uid(),p_payment_method_id,'pending','unpaid',p_delivery_address) returning id into order_id;
  for item in select * from jsonb_array_elements(p_items) loop
    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 then raise exception 'Invalid quantity'; end if;
    select * into product from electronics_products where id=(item->>'product_id')::uuid and is_active for update;
    if not found then raise exception 'Product is unavailable'; end if;
    if product.stock_quantity < qty then raise exception 'Insufficient stock for %', product.name; end if;
    subtotal := subtotal + product.price * qty;
    insert into order_items(order_id,product_id,item_name,quantity,price) values(order_id,product.id,product.name,qty,product.price);
    update electronics_products set stock_quantity=stock_quantity-qty,updated_at=now() where id=product.id;
  end loop;
  update orders set subtotal=subtotal,total=subtotal where id=order_id;
  return order_id;
exception when others then raise;
end; $$;
revoke all on function checkout_cart(jsonb,uuid,text) from public;
grant execute on function checkout_cart(jsonb,uuid,text) to authenticated;

create or replace function admin_verify_payment(p_payment_id uuid, p_status text, p_notes text default '')
returns payment_records language plpgsql security definer set search_path=public as $$
declare result payment_records;
begin
 if not is_admin() then raise exception 'Admin authorization required'; end if;
 update payment_records set payment_status=p_status, notes=p_notes, verified_by=auth.uid(), verified_at=case when p_status='verified' then now() else null end where id=p_payment_id returning * into result;
 return result;
end; $$;
revoke all on function admin_verify_payment(uuid,text,text) from public;
grant execute on function admin_verify_payment(uuid,text,text) to authenticated;

alter publication supabase_realtime add table payment_records;
