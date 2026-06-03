/**
 * useVacation — fetch, create, and delete vacation periods.
 *
 * Required DB migration (run once in Supabase SQL editor):
 * ─────────────────────────────────────────────────────────
 * CREATE TABLE IF NOT EXISTS vacations (
 *   id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *   user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 *   start_date    date NOT NULL,
 *   end_date      date NOT NULL,
 *   reason        text,
 *   minimal_task_ids text[] DEFAULT '{}',
 *   created_at    timestamptz DEFAULT now()
 * );
 * ALTER TABLE vacations ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Users manage own vacations"
 *   ON vacations FOR ALL USING (auth.uid() = user_id);
 * GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vacations TO authenticated;
 * GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vacations TO anon;
 * NOTIFY pgrst, 'reload schema';
 * ─────────────────────────────────────────────────────────
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

// Explicit column list — avoids PGRST204 schema-cache errors on newly added columns
const VACATION_COLS = "id, user_id, start_date, end_date, reason, created_at";

/**
 * Returns true if a given YYYY-MM-DD string falls within any vacation period.
 */
export function isDateOnVacation(dateStr, vacations = []) {
  return vacations.some((v) =>
    dayjs(dateStr).isBetween(v.start_date, v.end_date, "day", "[]")
  );
}

/**
 * Returns the active vacation (if today is within a vacation period), or null.
 */
export function getActiveVacation(vacations = []) {
  const today = dayjs().format("YYYY-MM-DD");
  return vacations.find((v) =>
    dayjs(today).isBetween(v.start_date, v.end_date, "day", "[]")
  ) ?? null;
}

export function useVacation() {
  const { user } = useAuth();
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("vacations")
        .select(VACATION_COLS)
        .order("start_date", { ascending: false });
      // Silently ignore errors (schema cache may still be warming up)
      setVacations(error ? [] : (data || []));
    } catch (_) {
      setVacations([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const declareVacation = async ({ start_date, end_date, reason }) => {
    if (!user) return { error: "Not authenticated" };
    try {
      const { error } = await supabase.from("vacations").insert({
        user_id: user.id,
        start_date,
        end_date,
        reason: reason || null,
        // minimal_task_ids uses DB default '{}' — omitted to avoid schema-cache issues
      });
      if (!error) await load();
      return { error: error?.message || null };
    } catch (e) {
      return { error: e.message };
    }
  };

  const deleteVacation = async (id) => {
    if (!user) return;
    await supabase.from("vacations").delete().eq("id", id);
    await load();
  };

  const activeVacation = getActiveVacation(vacations);

  return { vacations, loading, declareVacation, deleteVacation, activeVacation, reload: load };
}
