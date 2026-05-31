-- home_offer_items: powers the "What We Offer" homepage section.
-- Idempotent — safe to run multiple times.

create table if not exists home_offer_items (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  icon        text not null,
  button_text text not null default 'Explore',
  button_url  text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table home_offer_items enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_offer_items' and policyname = 'home_offer_items_public_read'
  ) then
    execute $pol$
      create policy home_offer_items_public_read on home_offer_items
        for select using (is_active = true)
    $pol$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_offer_items' and policyname = 'home_offer_items_service_all'
  ) then
    execute $pol$
      create policy home_offer_items_service_all on home_offer_items
        for all using (auth.role() = 'service_role')
    $pol$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'home_offer_items_updated_at'
  ) then
    execute $t$
      create trigger home_offer_items_updated_at
        before update on home_offer_items
        for each row execute function set_updated_at()
    $t$;
  end if;
end $$;

-- Seed: six cards matching the current homepage content exactly.
-- ON CONFLICT on title is not reliable — use a dedicated seed-guard column approach:
-- we only insert if the table is empty.
do $$
begin
  if not exists (select 1 from home_offer_items limit 1) then
    insert into home_offer_items (title, description, icon, button_text, button_url, sort_order) values
      (
        'Blog',
        'Expert articles and practical guides covering mold and die fundamentals, advanced techniques, and industry innovations — designed to support engineers at every stage while meeting modern tooling standards.',
        'BookOpen',
        'Explore',
        '/blogs',
        1
      ),
      (
        'Academy',
        'Action-oriented tooling design courses covering the full workflow from DFM to final design, delivered through real case studies with downloadable PDFs, native CAD files, and optional step-by-step videos.',
        'GraduationCap',
        'Explore',
        '/courses',
        2
      ),
      (
        'Library',
        'A growing library of proven 3D mold and die designs based on real case studies. Ready-to-use CAD models help accelerate tooling development with accuracy and efficiency.',
        'FolderOpen',
        'Explore',
        '/molds',
        3
      ),
      (
        'Events',
        'A global calendar of key mold and die events, including conferences, trade shows, workshops, and summits — helping you stay informed, learn from experts, and expand your industry network.',
        'Calendar',
        'Explore',
        '/events',
        4
      ),
      (
        'Suppliers',
        'A verified global directory of trusted mold and die suppliers, organized by location and specialization, covering machines, materials, components, software, and tooling services.',
        'Globe',
        'Explore',
        '/suppliers',
        5
      ),
      (
        'Engineering',
        'Our Engineering Calculators section offers free, high-accuracy tools to streamline the design of injection molds, pressure die-casting molds, and sheet metal dies. By bridging the gap between theoretical design and shop-floor reality.',
        'Calculator',
        'Explore',
        '/tools',
        6
      );
  end if;
end $$;
