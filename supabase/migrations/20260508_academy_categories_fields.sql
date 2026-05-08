-- Add missing fields to academy_categories for full category management
ALTER TABLE academy_categories
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS sort_order  integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active   boolean NOT NULL DEFAULT true;
