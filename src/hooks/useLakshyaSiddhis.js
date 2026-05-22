import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

// Module-level cache — one fetch per session across all trackers
let _lsCache = null;

/**
 * Returns all active Lakshyas + their Siddhis for the current user.
 *
 * siddhis is a FLAT array enriched with:
 *   lakshya_id, lakshya_title, pillar
 *
 * Usage in trackers:
 *   const { lakshyas, siddhis } = useLakshyaSiddhis();
 *   const label = siddhis.find(s => s.id === siddhi_id)?.title;
 */
export function useLakshyaSiddhis() {
  const { user } = useAuth();
  const [lakshyas, setLakshyas] = useState(_lsCache?.lakshyas ?? []);
  const [siddhis,  setSiddhis]  = useState(_lsCache?.siddhis  ?? []);
  const [loading,  setLoading]  = useState(_lsCache === null);

  useEffect(() => {
    if (!user) return;
    if (_lsCache) return; // warm

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("lakshyas")
        .select("id, title, pillar, siddhis(id, title, status, progress_percent)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at");

      if (error || !data) { setLoading(false); return; }

      // Build flat siddhis array enriched with parent lakshya info
      const flatSiddhis = [];
      data.forEach((l) => {
        (l.siddhis || []).forEach((s) => {
          flatSiddhis.push({
            ...s,
            lakshya_id:    l.id,
            lakshya_title: l.title,
            pillar:        l.pillar,
          });
        });
      });

      _lsCache = { lakshyas: data, siddhis: flatSiddhis };
      setLakshyas(data);
      setSiddhis(flatSiddhis);
      setLoading(false);
    };

    fetch();
  }, [user]);

  return { lakshyas, siddhis, loading };
}

/** Call after creating/editing a Siddhi so the picker re-fetches */
export function bustLakshyaSiddhisCache() {
  _lsCache = null;
}
