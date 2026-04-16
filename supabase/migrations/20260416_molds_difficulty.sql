-- Add difficulty column to molds table
ALTER TABLE molds
  ADD COLUMN IF NOT EXISTS difficulty TEXT
    CHECK (difficulty IN ('simple', 'moderate', 'difficult', 'sophisticated'));
