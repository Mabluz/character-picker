-- Add a column for tabs (some games use tabs instead of flat characters)
ALTER TABLE main_games ADD COLUMN IF NOT EXISTS tabs JSONB DEFAULT NULL;

-- Clear existing game data so it can be reloaded with correct structure
DELETE FROM main_games;
