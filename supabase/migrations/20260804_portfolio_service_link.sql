-- Let a portfolio item belong to a service, so /services/[slug] can show that
-- service's previous works. Nullable on purpose: existing items stay unassigned
-- and keep showing in the general portfolio section on /services.
alter table portfolio_items
  add column if not exists service_id uuid references services(id) on delete set null;

create index if not exists portfolio_items_service_id_idx
  on portfolio_items(service_id);
