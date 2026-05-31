-- home_why_cards: powers the "Why Choose Us" homepage section.

create table if not exists home_why_cards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  icon        text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table home_why_cards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_why_cards' and policyname = 'home_why_cards_public_read'
  ) then
    execute $pol$
      create policy home_why_cards_public_read on home_why_cards
        for select using (is_active = true)
    $pol$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'home_why_cards' and policyname = 'home_why_cards_service_all'
  ) then
    execute $pol$
      create policy home_why_cards_service_all on home_why_cards
        for all using (auth.role() = 'service_role')
    $pol$;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'home_why_cards_updated_at'
  ) then
    execute $t$
      create trigger home_why_cards_updated_at
        before update on home_why_cards
        for each row execute function set_updated_at()
    $t$;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from home_why_cards limit 1) then
    insert into home_why_cards (title, description, icon, sort_order) values
      (
        'Real-World Expertise',
        'Our content and services are built on hands-on industry experience — not theory. Every resource is crafted to solve real challenges faced by tooling professionals in production environments.',
        'Award',
        1
      ),
      (
        'Complete Tooling Ecosystem',
        'From knowledge resources and structured training to verified suppliers and engineering services, everything you need for mold and die projects is available in one integrated platform.',
        'Layers',
        2
      ),
      (
        'Always at the Forefront',
        'We continuously update our content, publish new courses, and expand our databases to keep you ahead of industry trends and emerging manufacturing technologies.',
        'TrendingUp',
        3
      ),
      (
        'End-to-End Vertical Integration',
        'We cover the full tooling lifecycle — from design and validation through to production and supplier sourcing — giving you a seamless, fully integrated professional workflow.',
        'GitBranch',
        4
      );
  end if;
end $$;
