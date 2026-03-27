create table if not exists public.service_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  service_type text,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Allow admins to update is_read
create policy "admins can update service_requests"
  on public.service_requests
  for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can read; inserts are open (no auth required for lead gen)
alter table public.service_requests enable row level security;

create policy "admins can read service_requests"
  on public.service_requests
  for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "anyone can insert service_requests"
  on public.service_requests
  for insert
  with check (true);
