-- Adds an optional thumbnail image (R2 object key) and an optional plain-text
-- description to academy lessons ("sessions"). Both nullable.
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS description text;
