-- Expand daily_activity with Apple Health fields
ALTER TABLE daily_activity ADD COLUMN IF NOT EXISTS calories_burned INTEGER;
ALTER TABLE daily_activity ADD COLUMN IF NOT EXISTS sleep_hours    DECIMAL(4,2);
ALTER TABLE daily_activity ADD COLUMN IF NOT EXISTS sleep_quality  SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5);
