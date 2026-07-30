-- Optional contact fields for events and suppliers.
alter table events    add column if not exists phone text;
alter table events    add column if not exists email text;
alter table suppliers add column if not exists phone text;
alter table suppliers add column if not exists email text;
