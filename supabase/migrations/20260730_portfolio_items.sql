-- Portfolio / previous works (سابقة الأعمال) shown on the Services page.
-- Everything except the title is optional.
create table if not exists portfolio_items (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,                          -- Tiptap JSON string, same convention as courses.description
  images      text[]      not null default '{}',  -- R2 object keys
  video_path  text,                          -- R2 object key
  video_url   text,                          -- external link (YouTube etc.)
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- RLS: public can read active items; all writes go through the service_role key.
alter table portfolio_items enable row level security;

create policy "portfolio_items_public_select"
  on portfolio_items for select
  using (is_active = true);
