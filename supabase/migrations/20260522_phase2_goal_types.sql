-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 2: Goal Types + Milestone cleanup + Tracker-Lakshya linking
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. LAKSHYAS — add goal type ───────────────────────────────────────────────
--  habit      : streak / consistency (e.g. daily practice for 1 year)
--  completion : finish X of Y things (e.g. read 12 books this year)
--  outcome    : hit a number (e.g. reach 70 kg, earn ₹1Cr)
--  mastery    : reach a quality level on the Ashtasiddhi scale

ALTER TABLE lakshyas
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'habit'
  CHECK (type IN ('habit', 'completion', 'outcome', 'mastery'));

-- ── 2. LAKSHYAS — outcome-type fields ────────────────────────────────────────
--  outcome_target  : the number to reach (weight, income, count, etc.)
--  outcome_current : manually updated current value
--  outcome_unit    : display unit — "kg", "₹", "books", "km", etc.

ALTER TABLE lakshyas ADD COLUMN IF NOT EXISTS outcome_target  numeric;
ALTER TABLE lakshyas ADD COLUMN IF NOT EXISTS outcome_current numeric DEFAULT 0;
ALTER TABLE lakshyas ADD COLUMN IF NOT EXISTS outcome_unit    text;

-- ── 3. SIDDHIS — add achieved_at, drop progress_percent ──────────────────────
--  achieved_at is stamped when status flips to 'completed'
--  progress_percent was the old fake-% field — milestones are now binary

ALTER TABLE siddhis ADD COLUMN IF NOT EXISTS achieved_at timestamptz;
ALTER TABLE siddhis DROP COLUMN IF EXISTS progress_percent;

-- ── 4. TRACKER_LAKSHYA_LINKS — new table ─────────────────────────────────────
--  Connects a tracker (or a specific item inside a tracker) to a Lakshya.
--  tracker_type   : 'anushthanam' | 'nadam' | 'health' | 'artha' | 'vritti' | 'vidya'
--  tracker_item_id: specific sequence/task/course ID inside that tracker
--                   NULL means the whole tracker is linked
--  lakshya_id     : the Lakshya this tracker feeds

CREATE TABLE IF NOT EXISTS tracker_lakshya_links (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tracker_type    text        NOT NULL,
  tracker_item_id uuid,
  lakshya_id      uuid        NOT NULL REFERENCES lakshyas(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tracker_type, tracker_item_id, lakshya_id)
);

-- RLS
ALTER TABLE tracker_lakshya_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'tracker_lakshya_links' AND policyname = 'owner_all'
  ) THEN
    CREATE POLICY owner_all ON tracker_lakshya_links
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ── 5. Stamp achieved_at on existing completed milestones ─────────────────────
--  Back-fill so any siddhi already marked completed gets a timestamp (now).
--  This is a one-time best-effort fill — exact time is unknown.

UPDATE siddhis
SET achieved_at = now()
WHERE status = 'completed' AND achieved_at IS NULL;
