-- Adds a per-region column-width ratio for two-column blog sections.
-- Stores the LEFT column width as a percentage (e.g. 50, 60, 40). NULL = 50/50.
-- Stamped on every two-column block in a region; full-width blocks leave it NULL.
ALTER TABLE blog_blocks ADD COLUMN IF NOT EXISTS column_ratio smallint;
