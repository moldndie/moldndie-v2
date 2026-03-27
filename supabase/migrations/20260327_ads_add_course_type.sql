ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_target_type_check;
ALTER TABLE ads ADD CONSTRAINT ads_target_type_check
  CHECK (target_type IN ('blog', 'mold', 'event', 'supplier', 'course', 'external'));
