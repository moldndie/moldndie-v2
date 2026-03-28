-- Add sponsored flag to suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS sponsored boolean NOT NULL DEFAULT false;
