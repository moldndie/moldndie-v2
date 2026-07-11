-- Engineering calculators: categories, calculators, fields, outputs, runs.
-- These tables already exist in the production database but were never captured
-- in a migration. Everything here is idempotent (IF NOT EXISTS / guarded), so it
-- is a no-op against an existing database and reproduces the schema on a fresh one.
-- Also adds the `field_group` column and seeds the flagship cycle-time calculator.

-- ── Tables ──────────────────────────────────────────────────────────────────────

create table if not exists calculator_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists calculators (
  id                uuid primary key default gen_random_uuid(),
  category_id       uuid references calculator_categories(id) on delete set null,
  title             text not null,
  slug              text not null unique,
  short_description text,
  description       text,
  icon              text,
  cover_image       text,
  is_featured       boolean not null default false,
  is_published      boolean not null default false,
  sort_order        integer not null default 0,
  seo_title         text,
  seo_description   text,
  views_count       integer not null default 0,
  created_by        uuid,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists calculator_fields (
  id            uuid primary key default gen_random_uuid(),
  calculator_id uuid not null references calculators(id) on delete cascade,
  label         text not null,
  field_key     text not null,
  field_type    text not null default 'number',
  unit          text,
  placeholder   text,
  help_text     text,
  is_required   boolean not null default true,
  min_value     numeric,
  max_value     numeric,
  step_value    numeric,
  default_value text,
  options       jsonb,
  field_group   text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists calculator_outputs (
  id            uuid primary key default gen_random_uuid(),
  calculator_id uuid not null references calculators(id) on delete cascade,
  label         text not null,
  output_key    text not null,
  formula       text not null,
  unit          text,
  decimals      integer not null default 2,
  description   text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists calculator_runs (
  id            uuid primary key default gen_random_uuid(),
  calculator_id uuid not null references calculators(id) on delete cascade,
  user_id       uuid,
  inputs        jsonb,
  outputs       jsonb,
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

-- Column added by this feature; safe on the pre-existing production table.
alter table calculator_fields add column if not exists field_group text;

create index if not exists calculator_fields_calculator_id_idx  on calculator_fields(calculator_id);
create index if not exists calculator_outputs_calculator_id_idx on calculator_outputs(calculator_id);
create index if not exists calculator_runs_calculator_id_idx    on calculator_runs(calculator_id);

-- ── Row level security ───────────────────────────────────────────────────────────
-- The app reads through the service-role admin client, so service_all is what the
-- runtime needs; public_read policies mirror the CMS pattern for direct/anon reads.

alter table calculator_categories enable row level security;
alter table calculators           enable row level security;
alter table calculator_fields     enable row level security;
alter table calculator_outputs    enable row level security;
alter table calculator_runs       enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select * from (values
      ('calculator_categories', 'calculator_categories_public_read', 'select', 'is_active = true'),
      ('calculator_categories', 'calculator_categories_service_all', 'all',    e'auth.role() = \'service_role\''),
      ('calculators',           'calculators_public_read',           'select', 'is_published = true'),
      ('calculators',           'calculators_service_all',           'all',    e'auth.role() = \'service_role\''),
      ('calculator_fields',     'calculator_fields_public_read',      'select', 'true'),
      ('calculator_fields',     'calculator_fields_service_all',      'all',    e'auth.role() = \'service_role\''),
      ('calculator_outputs',    'calculator_outputs_public_read',     'select', 'true'),
      ('calculator_outputs',    'calculator_outputs_service_all',     'all',    e'auth.role() = \'service_role\''),
      ('calculator_runs',       'calculator_runs_service_all',        'all',    e'auth.role() = \'service_role\'')
    ) as t(tbl, pol, cmd, expr)
  loop
    if not exists (select 1 from pg_policies where tablename = pol.tbl and policyname = pol.pol) then
      execute format('create policy %I on %I for %s using (%s)', pol.pol, pol.tbl, pol.cmd, pol.expr);
    end if;
  end loop;
end $$;

-- ── updated_at triggers ──────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from information_schema.triggers where trigger_name = 'calculator_categories_updated_at') then
    execute 'create trigger calculator_categories_updated_at before update on calculator_categories for each row execute function set_updated_at()';
  end if;
  if not exists (select 1 from information_schema.triggers where trigger_name = 'calculators_updated_at') then
    execute 'create trigger calculators_updated_at before update on calculators for each row execute function set_updated_at()';
  end if;
end $$;

-- ── increment_calculator_views RPC ───────────────────────────────────────────────

create or replace function increment_calculator_views(calc_id uuid)
returns void language sql as $$
  update calculators set views_count = views_count + 1 where id = calc_id;
$$;

-- ── Seed: Injection Molding Cycle Time calculator ────────────────────────────────
-- Only inserted if the calculator slug does not already exist.

do $$
declare
  cat_id  uuid;
  calc_id uuid;
begin
  -- Ensure an "Engineering" category exists.
  select id into cat_id from calculator_categories where slug = 'engineering';
  if cat_id is null then
    insert into calculator_categories (name, slug, description, icon, sort_order, is_active)
    values ('Engineering', 'engineering', 'Injection molding and tooling design calculators.', 'Calculator', 1, true)
    returning id into cat_id;
  end if;

  if not exists (select 1 from calculators where slug = 'injection-molding-cycle-time') then
    insert into calculators (category_id, title, slug, short_description, description, icon, is_featured, is_published, sort_order, seo_title, seo_description)
    values (
      cat_id,
      'Injection Molding Cycle Time',
      'injection-molding-cycle-time',
      'Estimate total cycle time from part geometry and material thermal properties.',
      e'Estimates the injection molding cycle time as the sum of four phases:\n\n'
        || e'• Mold open/close time (T₀) — machine dry-cycle, scaled by clamping force.\n'
        || e'• Injection time (Tᵢ) — fill time, scaled by shot weight.\n'
        || e'• Holding time (Tₕ) — pack/hold, scaled by wall thickness.\n'
        || e'• Cooling time (Tᶜ) — heat-diffusion time from the selected material''s thermal diffusivity, melt/mold temperature and heat-deflection temperature.\n\n'
        || 'These are theoretical values; actual cycle times vary with part geometry, gate design, material grade and machine conditions.',
      'Timer',
      true,
      true,
      1,
      'Injection Molding Cycle Time Calculator | MoldNDie',
      'Free tool to estimate injection molding cycle time from clamping force, shot weight, wall thickness and material thermal properties.'
    )
    returning id into calc_id;

    insert into calculator_fields (calculator_id, label, field_key, field_type, unit, placeholder, help_text, is_required, default_value, options, field_group, sort_order) values
      (calc_id, 'Material', 'material', 'select', null, null, 'Auto-fills thermal diffusivity, melt/mold temperature and heat-deflection temperature.', true, 'abs',
        '[
          {"label":"ABS","value":"abs","values":{"alpha":0.080,"melt_temp":220,"mold_temp":45,"hdt":85}},
          {"label":"HIPS","value":"hips","values":{"alpha":0.080,"melt_temp":220,"mold_temp":45,"hdt":85}},
          {"label":"PS","value":"ps","values":{"alpha":0.080,"melt_temp":220,"mold_temp":55,"hdt":85}},
          {"label":"PP","value":"pp","values":{"alpha":0.065,"melt_temp":230,"mold_temp":37.5,"hdt":85}},
          {"label":"HDPE","value":"hdpe","values":{"alpha":0.090,"melt_temp":225,"mold_temp":32.5,"hdt":50}},
          {"label":"LDPE","value":"ldpe","values":{"alpha":0.090,"melt_temp":225,"mold_temp":32.5,"hdt":50}},
          {"label":"PMMA","value":"pmma","values":{"alpha":0.075,"melt_temp":220,"mold_temp":55,"hdt":90}},
          {"label":"POM","value":"pom","values":{"alpha":0.060,"melt_temp":220,"mold_temp":57.5,"hdt":115}},
          {"label":"PA6","value":"pa6","values":{"alpha":0.070,"melt_temp":237.5,"mold_temp":90,"hdt":130}},
          {"label":"PA66","value":"pa66","values":{"alpha":0.085,"melt_temp":282.5,"mold_temp":90,"hdt":150}},
          {"label":"PBT","value":"pbt","values":{"alpha":0.090,"melt_temp":245,"mold_temp":100,"hdt":150}},
          {"label":"PET","value":"pet","values":{"alpha":0.090,"melt_temp":275,"mold_temp":100,"hdt":150}},
          {"label":"PC","value":"pc","values":{"alpha":0.105,"melt_temp":290,"mold_temp":85,"hdt":130}},
          {"label":"PC-ABS","value":"pc_abs","values":{"alpha":0.095,"melt_temp":250,"mold_temp":65,"hdt":110}}
        ]'::jsonb,
        'Material Selection', 1),
      (calc_id, 'Clamping Force', 'clamp_force', 'number', 'tons', 'e.g. 100', null, true, '100', null, 'Part & Machine', 2),
      (calc_id, 'Product Weight', 'weight', 'number', 'g', 'e.g. 50', 'Shot weight of the part.', true, '50', null, 'Part & Machine', 3),
      (calc_id, 'Max Wall Thickness', 'wall', 'number', 'mm', 'e.g. 2', 'Thickest wall section of the part.', true, '2', null, 'Part & Machine', 4);

    insert into calculator_outputs (calculator_id, label, output_key, formula, unit, decimals, description, sort_order) values
      (calc_id, 'Mold Open/Close Time (T₀)', 't0', '0.013 * clamp_force + 3.6', 's', 2, 'Machine dry-cycle time, scaled by clamping force.', 1),
      (calc_id, 'Injection Time (Tᵢ)', 'ti', '0.0085 * weight + 0.5', 's', 2, 'Fill time, scaled by shot weight.', 2),
      (calc_id, 'Holding Time (Tₕ)', 'th', '0.6 * wall^2 + 0.3 * wall', 's', 2, 'Pack/hold time, scaled by wall thickness.', 3),
      (calc_id, 'Cooling Time (Tᶜ)', 'tc', 'wall^2 / (alpha * pi^2) * log(8 / pi^2 * (melt_temp - mold_temp) / (hdt - mold_temp))', 's', 2, 'Heat-diffusion cooling time from material properties.', 4),
      (calc_id, 'Total Cycle Time', 'total', 't0 + ti + th + tc', 's', 2, 'Sum of all four phases.', 5);
  end if;
end $$;
