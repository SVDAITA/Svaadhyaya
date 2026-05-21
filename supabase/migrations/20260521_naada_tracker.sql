-- ── NAADA SAADHANA TRACKER TABLES ────────────────────────────────────────────

-- Daily practice sequence items
CREATE TABLE IF NOT EXISTS naada_sequence_items (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label          TEXT NOT NULL,
  emoji          TEXT,
  duration_minutes INTEGER,
  frequency      TEXT DEFAULT 'daily' CHECK (frequency IN ('daily','weekly','monthly')),
  frequency_day  INTEGER,
  order_index    INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Daily practice completions (one row per item per day)
CREATE TABLE IF NOT EXISTS naada_sequence_completions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  naada_item_id  UUID REFERENCES naada_sequence_items(id) ON DELETE CASCADE NOT NULL,
  completion_date DATE NOT NULL,
  is_completed   BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, naada_item_id, completion_date)
);

-- Compositions database
CREATE TABLE IF NOT EXISTS naada_compositions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  composer       TEXT,
  ragam          TEXT,
  talam          TEXT,
  language       TEXT DEFAULT 'Telugu',
  type           TEXT DEFAULT 'Krithi',
  status         TEXT DEFAULT 'learning' CHECK (status IN ('learning','polishing','performance_ready','archived')),
  difficulty     SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
  lyrics         TEXT,
  swaras         TEXT,
  reference_url  TEXT,
  guru_who_taught TEXT,
  date_started   DATE,
  date_mastered  DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Raga explorer
CREATE TABLE IF NOT EXISTS naada_ragas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name              TEXT NOT NULL,
  alias             TEXT,
  melakarta_number  INTEGER,
  janya_of          TEXT,
  aarohanam         TEXT,
  avarohanam        TEXT,
  vishesa_prayogam  TEXT,
  similar_ragas     TEXT,
  mood              TEXT,
  time_of_day       TEXT,
  confidence        SMALLINT DEFAULT 3 CHECK (confidence BETWEEN 1 AND 5),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Concerts / events
CREATE TABLE IF NOT EXISTS naada_concerts (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  type           TEXT DEFAULT 'performed' CHECK (type IN ('performed','attended','workshop','recording')),
  date           DATE NOT NULL,
  venue          TEXT,
  duration_minutes INTEGER,
  audience_size  INTEGER,
  organizer      TEXT,
  earnings       DECIMAL(10,2),
  expenses       DECIMAL(10,2),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Finance
CREATE TABLE IF NOT EXISTS naada_finance (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date        DATE NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('income','expense')),
  category    TEXT NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Daily journal / practice diary
CREATE TABLE IF NOT EXISTS naada_journal (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date             DATE NOT NULL,
  content          TEXT,
  mood             TEXT DEFAULT 'Sattvik',
  hours_practiced  DECIMAL(4,2),
  breakthrough     BOOLEAN DEFAULT FALSE,
  guru_feedback    TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Students
CREATE TABLE IF NOT EXISTS naada_students (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  level       TEXT DEFAULT 'beginner' CHECK (level IN ('beginner','intermediate','advanced')),
  instrument  TEXT DEFAULT 'Voice',
  start_date  DATE,
  monthly_fee DECIMAL(10,2),
  notes       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Skills
CREATE TABLE IF NOT EXISTS naada_skills (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category    TEXT NOT NULL,
  name        TEXT NOT NULL,
  proficiency SMALLINT DEFAULT 3 CHECK (proficiency BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, name)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'naada_sequence_items','naada_sequence_completions','naada_compositions',
    'naada_ragas','naada_concerts','naada_finance','naada_journal',
    'naada_students','naada_skills'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "%s_select" ON %I FOR SELECT USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_insert" ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_update" ON %I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY "%s_delete" ON %I FOR DELETE USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;
