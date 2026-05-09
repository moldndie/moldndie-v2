-- Replace single target_type with target_pages text array.
-- Old values mapped to new standardized page identifiers:
--   blog     → blog
--   mold     → library
--   event    → events
--   supplier → suppliers
--   course   → academy
--   external → global

ALTER TABLE ads ADD COLUMN IF NOT EXISTS target_pages text[] NOT NULL DEFAULT '{}';

UPDATE ads SET target_pages =
  CASE target_type
    WHEN 'blog'     THEN ARRAY['blog']
    WHEN 'mold'     THEN ARRAY['library']
    WHEN 'event'    THEN ARRAY['events']
    WHEN 'supplier' THEN ARRAY['suppliers']
    WHEN 'course'   THEN ARRAY['academy']
    WHEN 'external' THEN ARRAY['global']
    ELSE ARRAY['global']
  END;

ALTER TABLE ads DROP COLUMN IF EXISTS target_type;
