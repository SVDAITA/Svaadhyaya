import { useState, useEffect } from "react";
import {
  FormControl, InputLabel, Select, MenuItem,
  ListSubheader, Typography, Box,
} from "@mui/material";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

const PILLAR_META = {
  spirit:  { emoji: "🕉️",  name: "Anushthanam" },
  music:   { emoji: "🎵",  name: "Nādam"        },
  health:  { emoji: "💪",  name: "Sharīram"     },
  finance: { emoji: "💰",  name: "Artha"        },
  career:  { emoji: "🚀",  name: "Vṛtti"        },
  reading: { emoji: "📚",  name: "Vidyā"        },
};

/**
 * LakshyaPicker — drop-in replacement for SiddhiPicker.
 *
 * Links a tracker item to a Lakshya (Vision), not a milestone.
 * Shows all active Lakshyas grouped by pillar; the `pillar` prop
 * bubbles the relevant area's group to the top.
 *
 * Props
 *   value    — selected lakshya_id or ""
 *   onChange — (lakshya_id: string) => void
 *   isDark   — boolean
 *   pillar   — preferred pillar key (floated to top), optional
 *   size     — MUI size ("small" | "medium"), default "small"
 *   label    — field label, default "Serves Vision"
 */
export default function LakshyaPicker({
  value,
  onChange,
  isDark,
  pillar,
  size = "small",
  label = "Serves Vision",
}) {
  const { user } = useAuth();
  const [lakshyas, setLakshyas] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("lakshyas")
      .select("id, title, pillar, type")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at")
      .then(({ data }) => setLakshyas(data || []));
  }, [user]);

  if (!lakshyas.length) return null;

  // Float the preferred pillar to the front
  const pillars = [
    ...(pillar ? [pillar] : []),
    ...Object.keys(PILLAR_META).filter((p) => p !== pillar),
  ].filter((p) => lakshyas.some((l) => l.pillar === p));

  const selected = lakshyas.find((l) => l.id === value);
  const meta = selected ? (PILLAR_META[selected.pillar] || {}) : {};

  return (
    <FormControl size={size} fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ""}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(v) => {
          if (!v) return <em style={{ opacity: 0.55, fontSize: 13 }}>— None —</em>;
          if (!selected) return v;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box component="span" sx={{ fontSize: 13 }}>{meta.emoji || "🎯"}</Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{selected.title}</Typography>
            </Box>
          );
        }}
        MenuProps={{ PaperProps: { sx: { maxHeight: 340 } } }}
      >
        <MenuItem value="">
          <em style={{ opacity: 0.55, fontSize: 13 }}>— None —</em>
        </MenuItem>

        {pillars.map((p) => {
          const items = lakshyas.filter((l) => l.pillar === p);
          if (!items.length) return null;
          const pm = PILLAR_META[p] || {};
          return [
            <ListSubheader
              key={`hdr-${p}`}
              sx={{
                lineHeight: "28px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
              }}
            >
              {pm.emoji} {pm.name || p}
            </ListSubheader>,
            ...items.map((l) => (
              <MenuItem key={l.id} value={l.id} sx={{ pl: 3 }}>
                <Typography sx={{ fontSize: 13 }}>{l.title}</Typography>
              </MenuItem>
            )),
          ];
        })}
      </Select>
    </FormControl>
  );
}

// ── Shared link helpers ────────────────────────────────────────────────────────

/**
 * Fetch the Lakshya linked to a specific tracker item.
 * Returns lakshya_id string or null.
 */
export async function fetchItemLakshyaLink(userId, trackerType, trackerItemId) {
  if (!userId || !trackerItemId) return null;
  const { data } = await supabase
    .from("tracker_lakshya_links")
    .select("lakshya_id")
    .eq("user_id", userId)
    .eq("tracker_type", trackerType)
    .eq("tracker_item_id", trackerItemId)
    .maybeSingle();
  return data?.lakshya_id ?? null;
}

/**
 * Upsert (or remove) the Lakshya link for a tracker item.
 * Pass lakshyaId = "" or null to remove.
 */
export async function saveItemLakshyaLink(userId, trackerType, trackerItemId, lakshyaId) {
  if (!userId || !trackerItemId) return;
  // Always clear the old link first (clean upsert)
  await supabase
    .from("tracker_lakshya_links")
    .delete()
    .eq("user_id", userId)
    .eq("tracker_type", trackerType)
    .eq("tracker_item_id", trackerItemId);

  if (lakshyaId) {
    await supabase.from("tracker_lakshya_links").insert({
      user_id: userId,
      tracker_type: trackerType,
      tracker_item_id: trackerItemId,
      lakshya_id: lakshyaId,
    });
  }
}
