-- daily_activity: one row per user per day, tracks steps and km walked
CREATE TABLE IF NOT EXISTS daily_activity (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  steps      INTEGER,
  km_walked  DECIMAL(6,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_activity_select" ON daily_activity FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_activity_insert" ON daily_activity FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_activity_update" ON daily_activity FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_activity_delete" ON daily_activity FOR DELETE USING (auth.uid() = user_id);
