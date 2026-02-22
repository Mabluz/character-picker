-- Add amazon affiliate data column to main_games
ALTER TABLE main_games ADD COLUMN IF NOT EXISTS amazon JSONB DEFAULT NULL;