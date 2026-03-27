create table if not exists public.cart_items (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  product_id    uuid        not null,
  product_type  text        not null check (product_type in ('mold', 'course')),
  quantity      int         not null default 1 check (quantity > 0),
  title         text        not null,
  price         numeric     not null,
  image         text,
  created_at    timestamptz not null default now(),
  unique (user_id, product_id, product_type)
);

alter table public.cart_items enable row level security;

create policy "Users can manage their own cart"
  on public.cart_items
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
