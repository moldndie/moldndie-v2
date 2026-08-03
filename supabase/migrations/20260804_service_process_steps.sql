-- The "How It Works" steps on /services, previously hardcoded in
-- ServicesContent.tsx. Same shape as home_why_cards.
create table if not exists service_process_steps (
  id          uuid        primary key default gen_random_uuid(),
  label       text        not null,
  description text,                      -- plain text: this is a one-line caption, not a rich body
  sort_order  int         not null default 0,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

alter table service_process_steps enable row level security;

create policy "service_process_steps_public_select"
  on service_process_steps for select
  using (is_active = true);

-- Seed with the four steps that were hardcoded, so the page is unchanged on day one.
insert into service_process_steps (label, description, sort_order)
select * from (values
  ('Consult', 'Share your project requirements',   1),
  ('Analyze', 'We evaluate feasibility & design',  2),
  ('Design',  'Precision tooling engineering',     3),
  ('Deliver', 'On-time, production-ready results', 4)
) as seed(label, description, sort_order)
where not exists (select 1 from service_process_steps);
