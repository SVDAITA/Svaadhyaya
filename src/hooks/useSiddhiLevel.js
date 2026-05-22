import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";
import dayjs from "dayjs";

export const ASHTA_SIDDHI_SCALE = [
  { value: 1, name: "Sthiti",   emoji: "🌱", label: "Presence"    },
  { value: 2, name: "Prayas",   emoji: "🌿", label: "Effort"       },
  { value: 3, name: "Nishtha",  emoji: "🌳", label: "Steadiness"   },
  { value: 4, name: "Bodha",    emoji: "💡", label: "Awareness"    },
  { value: 5, name: "Saadhana", emoji: "🔥", label: "Practice"     },
  { value: 6, name: "Prajna",   emoji: "⚡", label: "Insight"      },
  { value: 7, name: "Samadhi",  emoji: "🌟", label: "Absorption"   },
  { value: 8, name: "Siddhi",   emoji: "✨", label: "Mastery"      },
];

const ENOUGH_DAYS = 30; // threshold to switch from "yesterday" to rolling average

// Module-level cache — persists across navigation, resets on page refresh
let _cache = null;

function daySatisfaction(dayRecord) {
  const habits = dayRecord.habits || {};
  const habitsData = dayRecord.habits_data || {};
  const done = Object.keys(habits).filter((k) => habits[k] === true);
  if (done.length === 0) return null;
  const total = done.reduce((s, k) => s + (habitsData[k]?.satisfaction || 4), 0);
  return Math.min(8, Math.max(1, Math.round(total / done.length)));
}

function rollingAverage(validDays) {
  let totalSat = 0, count = 0;
  validDays.forEach((d) => {
    const habits = d.habits || {};
    const habitsData = d.habits_data || {};
    Object.keys(habits).forEach((k) => {
      if (habits[k] === true && habitsData[k]?.satisfaction) {
        totalSat += habitsData[k].satisfaction;
        count++;
      }
    });
  });
  return count > 0 ? Math.min(8, Math.max(1, Math.round(totalSat / count))) : null;
}

/**
 * Returns the user's current Ashtasiddhi level.
 *
 * Logic:
 *  - < 30 days of data  → use yesterday's satisfaction average
 *  - >= 30 days of data → use 30-day rolling average
 *  - No today data yet  → falls back to yesterday automatically
 *  - No data at all     → returns null (UI shows "Sādhaka" fallback)
 */
export function useSiddhiLevel() {
  const { user } = useAuth();
  const [level, setLevel]   = useState(_cache?.level   ?? null);
  const [siddhi, setSiddhi] = useState(_cache?.siddhi  ?? null);

  useEffect(() => {
    if (!user) return;
    if (_cache) return; // warm

    const fetch = async () => {
      const thirtyAgo  = dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const yesterday  = dayjs().subtract(1,  "day").format("YYYY-MM-DD");

      const { data, error } = await supabase
        .from("days")
        .select("day_date, habits, habits_data")
        .eq("user_id", user.id)
        .neq("day_date", "2000-01-01")   // exclude settings sentinel
        .gte("day_date", thirtyAgo)
        .order("day_date", { ascending: false });

      if (error || !data?.length) return;

      // Only days where at least one habit was ticked
      const validDays = data.filter((d) =>
        Object.values(d.habits || {}).some((v) => v === true)
      );
      if (!validDays.length) return;

      let avgLevel;
      if (validDays.length >= ENOUGH_DAYS) {
        avgLevel = rollingAverage(validDays);
      } else {
        // Use yesterday's record; fall back to the most recent available day
        const yRecord = validDays.find((d) => d.day_date === yesterday) || validDays[0];
        avgLevel = daySatisfaction(yRecord);
      }

      if (!avgLevel) return;

      const siddhiEntry = ASHTA_SIDDHI_SCALE.find((s) => s.value === avgLevel)
        ?? ASHTA_SIDDHI_SCALE[3]; // default Bodha

      _cache = { level: avgLevel, siddhi: siddhiEntry };
      setLevel(avgLevel);
      setSiddhi(siddhiEntry);
    };

    fetch();
  }, [user]);

  return { level, siddhi };
}
