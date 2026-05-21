-- ── AREA SANKALPA ─────────────────────────────────────────────────────────────
-- Stores the user's stated purpose/intention per life domain
CREATE TABLE IF NOT EXISTS area_sankalpa (
  user_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  area     TEXT NOT NULL,
  purpose  TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, area)
);

-- ── VRITTI TRACKER TABLES ─────────────────────────────────────────────────────

-- Clients / employers
CREATE TABLE IF NOT EXISTS vritti_clients (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  company     TEXT,
  type        TEXT DEFAULT 'client' CHECK (type IN ('employer','client','collaborator')),
  role        TEXT,
  start_date  DATE,
  notes       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE IF NOT EXISTS vritti_projects (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  client_id    UUID REFERENCES vritti_clients(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  tech_stack   TEXT,
  start_date   DATE,
  target_date  DATE,
  priority     SMALLINT DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  notes        TEXT,
  order_index  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Daily work log
CREATE TABLE IF NOT EXISTS vritti_daily_log (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  project_id UUID REFERENCES vritti_projects(id) ON DELETE SET NULL,
  hours      DECIMAL(4,2),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Professional skills
CREATE TABLE IF NOT EXISTS vritti_skills (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL,
  name        TEXT NOT NULL,
  proficiency SMALLINT DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, name)
);

-- Career journal
CREATE TABLE IF NOT EXISTS vritti_journal (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  content    TEXT,
  mood       TEXT DEFAULT 'Focused',
  wins       TEXT,
  challenges TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ── VIDYA TRACKER TABLES ──────────────────────────────────────────────────────

-- Courses / certifications
CREATE TABLE IF NOT EXISTS vidya_courses (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  platform       TEXT,
  instructor     TEXT,
  url            TEXT,
  status         TEXT DEFAULT 'in_progress' CHECK (status IN ('wishlist','in_progress','completed','dropped')),
  progress_pct   SMALLINT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  rating         SMALLINT CHECK (rating BETWEEN 1 AND 5),
  start_date     DATE,
  completed_date DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Insights / learnings journal
CREATE TABLE IF NOT EXISTS vidya_insights (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date       DATE NOT NULL,
  content    TEXT NOT NULL,
  source     TEXT,
  source_type TEXT DEFAULT 'book' CHECK (source_type IN ('book','course','article','podcast','video','experience','other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily practice sequence (what to study each day)
CREATE TABLE IF NOT EXISTS vidya_practice_items (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label            TEXT NOT NULL,
  emoji            TEXT,
  duration_minutes INTEGER,
  frequency        TEXT DEFAULT 'daily' CHECK (frequency IN ('daily','weekly','monthly')),
  frequency_day    INTEGER,
  order_index      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Vidya skills
CREATE TABLE IF NOT EXISTS vidya_skills (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL,
  name        TEXT NOT NULL,
  proficiency SMALLINT DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, name)
);

-- Daily practice completions
CREATE TABLE IF NOT EXISTS vidya_practice_completions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vidya_item_id    UUID REFERENCES vidya_practice_items(id) ON DELETE CASCADE NOT NULL,
  completion_date  DATE NOT NULL,
  is_completed     BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, vidya_item_id, completion_date)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'area_sankalpa',
    'vritti_clients','vritti_projects','vritti_daily_log','vritti_skills','vritti_journal',
    'vidya_courses','vidya_insights','vidya_practice_items','vidya_practice_completions','vidya_skills'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;
