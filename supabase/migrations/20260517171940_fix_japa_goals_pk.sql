-- Fix japa_goals primary key: was incorrectly set to user_id alone,
-- preventing multiple japa goals per user. Change PK to id (uuid).
ALTER TABLE public.japa_goals DROP CONSTRAINT IF EXISTS japa_goals_pkey;
ALTER TABLE public.japa_goals ADD CONSTRAINT japa_goals_pkey PRIMARY KEY (id);

-- Ensure area_journals has RLS enabled (was missing)
ALTER TABLE public.area_journals ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_journals' AND policyname = 'area_journals_select'
  ) THEN
    CREATE POLICY "area_journals_select" ON public.area_journals
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_journals' AND policyname = 'area_journals_insert'
  ) THEN
    CREATE POLICY "area_journals_insert" ON public.area_journals
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_journals' AND policyname = 'area_journals_update'
  ) THEN
    CREATE POLICY "area_journals_update" ON public.area_journals
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'area_journals' AND policyname = 'area_journals_delete'
  ) THEN
    CREATE POLICY "area_journals_delete" ON public.area_journals
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
