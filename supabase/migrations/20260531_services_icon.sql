-- Add icon column to services table for dynamic icon management
ALTER TABLE services ADD COLUMN IF NOT EXISTS icon text;
