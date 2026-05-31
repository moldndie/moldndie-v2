-- Ensure cms_pages table exists with correct schema.
-- Idempotent: safe to run even if the table already exists.

create table if not exists cms_pages (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  content         jsonb,
  seo_title       text,
  seo_description text,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- RLS
alter table cms_pages enable row level security;

-- Public can read published pages
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cms_pages' and policyname = 'cms_pages_public_read'
  ) then
    execute $pol$
      create policy cms_pages_public_read on cms_pages
        for select using (is_published = true)
    $pol$;
  end if;
end $$;

-- Service role bypass (admin client uses service role key)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'cms_pages' and policyname = 'cms_pages_service_all'
  ) then
    execute $pol$
      create policy cms_pages_service_all on cms_pages
        for all using (auth.role() = 'service_role')
    $pol$;
  end if;
end $$;

-- updated_at trigger
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'cms_pages_updated_at'
  ) then
    execute $t$
      create trigger cms_pages_updated_at
        before update on cms_pages
        for each row execute function set_updated_at()
    $t$;
  end if;
end $$;

-- Seed legal pages (do not overwrite existing admin-edited content)
insert into cms_pages (slug, title, content, seo_title, seo_description, is_published)
values
  (
    'privacy-policy', 'Privacy Policy', null,
    'Privacy Policy | MoldNDie',
    'Learn how MoldNDie collects, uses, and protects your personal data.',
    false
  ),
  (
    'terms-of-use', 'Terms of Use', null,
    'Terms of Use | MoldNDie',
    'Read the terms and conditions governing your use of the MoldNDie platform.',
    false
  ),
  (
    'refund-policy', 'Refund Policy', null,
    'Refund Policy | MoldNDie',
    'Learn about MoldNDie''s refund and cancellation policy for digital content purchases.',
    false
  )
on conflict (slug) do nothing;
