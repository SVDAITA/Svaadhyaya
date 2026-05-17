-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 1: Enable RLS on tables that have none (data currently fully exposed)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.journal_entries    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smartham_learning  ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fix 2: Add missing policies via DO blocks to avoid "already exists" errors
-- ─────────────────────────────────────────────────────────────────────────────

DO $$ BEGIN

  -- journal_entries (all 4 operations)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='journal_entries' AND policyname='journal_entries_select')
  THEN CREATE POLICY "journal_entries_select" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='journal_entries' AND policyname='journal_entries_insert')
  THEN CREATE POLICY "journal_entries_insert" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='journal_entries' AND policyname='journal_entries_update')
  THEN CREATE POLICY "journal_entries_update" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='journal_entries' AND policyname='journal_entries_delete')
  THEN CREATE POLICY "journal_entries_delete" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id); END IF;

  -- reading_sessions (all 4 operations)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_sessions' AND policyname='reading_sessions_select')
  THEN CREATE POLICY "reading_sessions_select" ON public.reading_sessions FOR SELECT USING (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_sessions' AND policyname='reading_sessions_insert')
  THEN CREATE POLICY "reading_sessions_insert" ON public.reading_sessions FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_sessions' AND policyname='reading_sessions_update')
  THEN CREATE POLICY "reading_sessions_update" ON public.reading_sessions FOR UPDATE USING (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='reading_sessions' AND policyname='reading_sessions_delete')
  THEN CREATE POLICY "reading_sessions_delete" ON public.reading_sessions FOR DELETE USING (auth.uid() = user_id); END IF;

  -- smartham_learning (all 4 operations)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='smartham_learning' AND policyname='smartham_learning_select')
  THEN CREATE POLICY "smartham_learning_select" ON public.smartham_learning FOR SELECT USING (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='smartham_learning' AND policyname='smartham_learning_insert')
  THEN CREATE POLICY "smartham_learning_insert" ON public.smartham_learning FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='smartham_learning' AND policyname='smartham_learning_update')
  THEN CREATE POLICY "smartham_learning_update" ON public.smartham_learning FOR UPDATE USING (auth.uid() = user_id); END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='smartham_learning' AND policyname='smartham_learning_delete')
  THEN CREATE POLICY "smartham_learning_delete" ON public.smartham_learning FOR DELETE USING (auth.uid() = user_id); END IF;

  -- days (missing INSERT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='days' AND policyname='days_insert')
  THEN CREATE POLICY "days_insert" ON public.days FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  -- daily_item_completions (missing INSERT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_item_completions' AND policyname='daily_completions_insert')
  THEN CREATE POLICY "daily_completions_insert" ON public.daily_item_completions FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  -- daily_items (missing INSERT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='daily_items' AND policyname='daily_items_insert')
  THEN CREATE POLICY "daily_items_insert" ON public.daily_items FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  -- pillars (missing INSERT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pillars' AND policyname='pillars_insert')
  THEN CREATE POLICY "pillars_insert" ON public.pillars FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  -- area_journals (missing INSERT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='area_journals' AND policyname='area_journals_insert')
  THEN CREATE POLICY "area_journals_insert" ON public.area_journals FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

  -- investments (missing INSERT)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='investments' AND policyname='investments_insert')
  THEN CREATE POLICY "investments_insert" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id); END IF;

END $$;
