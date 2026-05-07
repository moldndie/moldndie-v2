-- Dynamic services offerings table
create table if not exists services (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  slug         text        not null unique,
  tagline      text,
  description  text,
  highlights   text[]      not null default '{}',
  image        text,
  is_active    boolean     not null default true,
  is_egypt_only boolean    not null default true,
  sort_order   int         not null default 0,
  created_at   timestamptz not null default now()
);

-- RLS: public can read active services; admin bypass via service_role key
alter table services enable row level security;

create policy "services_public_select"
  on services for select
  using (is_active = true);

-- Seed: Turnkey Project Management
insert into services (title, slug, tagline, description, highlights, is_active, is_egypt_only, sort_order)
values (
  'Turnkey Project Management',
  'turnkey-project-management',
  'One team. Start to finish.',
  'We manage your tooling project end-to-end — from initial requirements gathering and design through prototyping, validation, and final production handover. One point of contact, one streamlined process.',
  array[
    'Requirements gathering & scoping',
    'Design review & prototyping',
    'Transparent milestone tracking',
    'Production handover & support'
  ],
  true,
  true,
  1
);
