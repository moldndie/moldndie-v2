create table if not exists hero_slides (
  id           uuid        primary key default gen_random_uuid(),
  image_url    text        not null,
  mobile_image text,
  title        text,
  subtitle     text,
  button_text  text,
  button_link  text,
  sort_order   integer     not null default 0,
  is_active    boolean     not null default true,
  alt_text     text,
  created_at   timestamptz not null default now()
);

alter table hero_slides enable row level security;

-- Anyone can read active slides (public homepage)
create policy "Public can read active hero slides"
  on hero_slides for select
  using (is_active = true);

-- Service role bypasses RLS for admin operations
