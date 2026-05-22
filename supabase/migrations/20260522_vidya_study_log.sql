-- vidya_study_log: daily study session log (mirrors vritti_daily_log)
CREATE TABLE IF NOT EXISTS vidya_study_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  hours         NUMERIC(4,1) NOT NULL DEFAULT 0,
  source_type   TEXT DEFAULT 'other',       -- 'book' | 'course' | 'practice' | 'other'
  source_id     UUID,                        -- optional FK to books.id or vidya_courses.id
  source_title  TEXT,                        -- denormalized for display
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vidya_study_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own study log"
  ON vidya_study_log FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vidya_study_log_user_date
  ON vidya_study_log(user_id, date DESC);
