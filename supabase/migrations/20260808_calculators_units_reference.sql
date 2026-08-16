-- Calculators: multiple cover images, unit systems, first-class reference tables.

-- ── Multiple images ──────────────────────────────────────────────────────────
-- `cover_image` stays as the single/legacy slot; `images` wins when non-empty.
alter table calculators
  add column if not exists images text[] not null default '{}';

-- ── Unit systems ─────────────────────────────────────────────────────────────
-- NULL / empty = the calculator has no unit switcher (every existing one).
-- Otherwise exactly two entries, e.g.
--   [{"key":"metric","label":"Metric (cm/kg/s)"},
--    {"key":"imperial","label":"Imperial (in/lb/s)"}]
alter table calculators
  add column if not exists unit_systems jsonb;

-- Per-system unit label + conversion factor, on both inputs and outputs:
--   {"metric":{"unit":"cm","factor":1},"imperial":{"unit":"in","factor":0.3937}}
-- Formulas are always authored in ONE base system (the factor-1 one). The
-- runner divides entered values by the factor on the way in and multiplies
-- results by it on the way out, so the engine needs no conditionals.
-- Absent entry ⇒ factor 1 and the existing `unit` string, so nothing changes
-- for calculators that never opt in.
alter table calculator_fields  add column if not exists units jsonb;
alter table calculator_outputs add column if not exists units jsonb;

-- ── Reference tables ─────────────────────────────────────────────────────────
-- Until now a reference table could only exist as a side effect of a preset
-- dropdown. This lets a calculator carry standalone tables, grouped by
-- category and searchable.
create table if not exists calculator_reference_tables (
  id          uuid primary key default gen_random_uuid(),
  calculator_id uuid not null references calculators(id) on delete cascade,
  title       text not null,
  category    text,
  -- [{"key":"material","label":"Material","unit":null}, …]
  columns     jsonb not null default '[]',
  -- [{"material":"ABS","shrinkage":"0.5 - 0.7"}, …] — cells are strings, so a
  -- range or a note is as valid as a number.
  rows        jsonb not null default '[]',
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists calculator_reference_tables_calculator_id_idx
  on calculator_reference_tables (calculator_id, sort_order);

alter table calculator_reference_tables enable row level security;

drop policy if exists "Reference tables are publicly readable" on calculator_reference_tables;
create policy "Reference tables are publicly readable"
  on calculator_reference_tables for select
  using (
    exists (
      select 1 from calculators c
      where c.id = calculator_reference_tables.calculator_id
        and c.is_published = true
    )
  );

drop policy if exists "Service role manages reference tables" on calculator_reference_tables;
create policy "Service role manages reference tables"
  on calculator_reference_tables for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Whether a preset dropdown also renders as a reference table. Defaults true so
-- today's derived tables keep showing; the Unit System / Method / Safety Factor
-- field templates set it false.
alter table calculator_fields
  add column if not exists show_reference boolean not null default true;
