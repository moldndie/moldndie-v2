alter table orders
  add column if not exists cart_hash text,
  add column if not exists amount_cents integer,
  add column if not exists payment_url text;

update orders
set amount_cents = round(total_amount * 100)::integer
where amount_cents is null;

create index if not exists orders_user_cart_hash_status_idx
  on orders(user_id, cart_hash, status);

create or replace function complete_order_and_clear_cart(
  p_order_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set status = 'completed'
  where id = p_order_id;

  delete from cart_items
  where user_id = p_user_id;
end;
$$;
