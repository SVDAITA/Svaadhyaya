import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Skeleton } from "@mui/material";
import { Edit, Check } from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { supabase } from "../../lib/supabase";

// Module-level cache — keyed by area, survives re-renders and navigation
const _sankalpCache = {} // { [area]: string }

/**
 * Editable "My Sankalpa / Purpose" card for each life area.
 * Persists to the `area_sankalpa` table.
 */
export default function SankalpaPurpose({ area, color, isDark }) {
  const { user } = useAuth();
  const [purpose, setPurpose] = useState(_sankalpCache[area] ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(!(area in _sankalpCache));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (area in _sankalpCache) return; // cache warm
    supabase
      .from("area_sankalpa")
      .select("purpose")
      .eq("user_id", user.id)
      .eq("area", area)
      .maybeSingle()
      .then(({ data }) => {
        const val = data?.purpose || "";
        _sankalpCache[area] = val;
        setPurpose(val);
        setLoading(false);
      });
  }, [user, area]);

  const save = async () => {
    setSaving(true);
    await supabase.from("area_sankalpa").upsert(
      { user_id: user.id, area, purpose: draft, updated_at: new Date().toISOString() },
      { onConflict: "user_id,area" }
    );
    _sankalpCache[area] = draft; // update cache on save
    setPurpose(draft);
    setSaving(false);
    setEditing(false);
  };

  const cardBg   = isDark ? `${color}14` : `${color}0D`;
  const borderC  = isDark ? `${color}35` : `${color}30`;
  const textP    = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS    = isDark ? "#9C9A94" : "#6C6A64";
  const placeholder = "Write your sankalpa — why does this area of life matter to you? What do you aspire to become through this practice?";

  return (
    <Box
      sx={{
        mb: 3,
        p: 2.5,
        borderRadius: 3,
        background: cardBg,
        border: `1px solid ${borderC}`,
        position: "relative",
      }}
    >
      {/* Label row */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color,
          }}
        >
          🕉 My Sankalpa
        </Typography>
        {!editing && (
          <Button
            size="small"
            startIcon={<Edit sx={{ fontSize: 12 }} />}
            onClick={() => { setDraft(purpose); setEditing(true); }}
            sx={{ textTransform: "none", fontSize: 11, color, py: 0.3, px: 1, minWidth: 0, opacity: 0.8 }}
          >
            {purpose ? "Edit" : "Add"}
          </Button>
        )}
      </Box>

      {loading ? (
        <Skeleton variant="text" width="80%" sx={{ bgcolor: `${color}20` }} />
      ) : editing ? (
        <Box>
          <TextField
            multiline
            minRows={2}
            maxRows={5}
            fullWidth
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            variant="standard"
            InputProps={{ disableUnderline: false }}
            sx={{
              "& .MuiInputBase-input": {
                fontSize: 14,
                color: textP,
                lineHeight: 1.65,
                fontFamily: '"Lora", serif',
                fontStyle: draft ? "normal" : "italic",
              },
              "& .MuiInput-underline:before": { borderBottomColor: borderC },
              "& .MuiInput-underline:after": { borderBottomColor: color },
            }}
            autoFocus
          />
          <Box sx={{ display: "flex", gap: 1, mt: 1.5, justifyContent: "flex-end" }}>
            <Button
              size="small"
              onClick={() => setEditing(false)}
              sx={{ textTransform: "none", fontSize: 12, color: textS }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="contained"
              startIcon={<Check sx={{ fontSize: 13 }} />}
              onClick={save}
              disabled={saving}
              sx={{
                textTransform: "none",
                fontSize: 12,
                fontWeight: 600,
                bgcolor: color,
                "&:hover": { bgcolor: color, opacity: 0.9 },
                borderRadius: 2,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </Box>
        </Box>
      ) : purpose ? (
        <Typography
          sx={{
            fontSize: 14,
            color: textP,
            lineHeight: 1.7,
            fontFamily: '"Lora", "Georgia", serif',
            fontStyle: "italic",
          }}
        >
          "{purpose}"
        </Typography>
      ) : (
        <Typography
          sx={{
            fontSize: 13,
            color: textS,
            fontStyle: "italic",
            lineHeight: 1.6,
          }}
        >
          {placeholder}
        </Typography>
      )}
    </Box>
  );
}
