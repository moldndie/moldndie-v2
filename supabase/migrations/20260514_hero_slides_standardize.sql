-- Standardize hero_slides image column: merge legacy 'image' into 'image_url', then drop it.
-- Wrapped in a do-block so it is a no-op on environments where 'image' never existed.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'hero_slides'
      and column_name = 'image'
  ) then

    -- Backfill: rows that have a value in 'image' but not in 'image_url'
    update hero_slides
       set image_url = image
     where (image_url is null or image_url = '')
       and image is not null
       and image <> '';

    -- Remove the legacy column permanently
    alter table hero_slides drop column image;

  end if;
end $$;
