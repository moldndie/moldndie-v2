-- Orders table
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  total_amount  numeric(10, 2) not null,
  status        text not null default 'pending',  -- pending | completed | failed
  paymob_order_id text,
  created_at    timestamptz not null default now()
);

-- Order items table
create table if not exists order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    uuid not null,
  product_type  text not null,  -- mold | course
  price         numeric(10, 2) not null,
  created_at    timestamptz not null default now()
);

-- Indexes
create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists order_items_order_id_idx on order_items(order_id);

-- RLS
alter table orders enable row level security;
alter table order_items enable row level security;

-- Users can read their own orders
create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

-- Service role handles inserts (API routes use admin client)
