-- Add exercise_type to daily_activity
ALTER TABLE daily_activity
  ADD COLUMN IF NOT EXISTS exercise_type TEXT CHECK (exercise_type IN ('walk', 'strength', 'both'));
