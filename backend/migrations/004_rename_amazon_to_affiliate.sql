-- Rename amazon column to affiliate for flexibility with multiple partners
ALTER TABLE main_games RENAME COLUMN amazon TO affiliate;
