import { FormControl, InputLabel, Select, MenuItem, ListSubheader, Typography, Box } from "@mui/material";
import { useLakshyaSiddhis } from "../../hooks/useLakshyaSiddhis";

const AREA_EMOJIS = {
  anushthanam: "🕉️",
  nadam:       "🎵",
  shariram:    "💪",
  finance:     "💰",
  career:      "🚀",
  vidya:       "📚",
};

const AREA_COLORS = {
  anushthanam: "#C07830",
  nadam:       "#C07830",
  shariram:    "#2D7A4F",
  finance:     "#1A7A6E",
  career:      "#1A5FB0",
  vidya:       "#8B3A2F",
};

/**
 * SiddhiPicker — reusable milestone link selector for tracker item dialogs.
 *
 * Props:
 *   value      — currently selected siddhi_id (string | "")
 *   onChange   — (siddhi_id: string) => void
 *   isDark     — boolean
 *   size       — MUI TextField size ("small" | "medium"), default "small"
 *   label      — field label, default "Link to Milestone"
 *
 * Returns null while loading or if the user has no active Siddhis.
 */
export default function SiddhiPicker({
  value,
  onChange,
  isDark,
  size = "small",
  label = "Link to Milestone",
}) {
  const { lakshyas, siddhis, loading } = useLakshyaSiddhis();

  // Don't render until data is ready; hide if nothing to pick
  if (loading || siddhis.length === 0) return null;

  // Group active siddhis by lakshya
  const groups = lakshyas
    .map((l) => ({
      lakshya: l,
      items: siddhis.filter((s) => s.lakshya_id === l.id && s.status !== "archived"),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <FormControl size={size} fullWidth>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ""}
        label={label}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(v) => {
          if (!v) return <em style={{ opacity: 0.6 }}>— None —</em>;
          const s = siddhis.find((x) => x.id === v);
          if (!s) return v;
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
              <Box component="span" sx={{ fontSize: 13 }}>🎯</Box>
              <Typography sx={{ fontSize: 13, fontWeight: 500 }}>{s.title}</Typography>
              <Typography sx={{ fontSize: 10, color: "text.secondary", ml: 0.5 }}>
                ↳ {s.lakshya_title}
              </Typography>
            </Box>
          );
        }}
        MenuProps={{ PaperProps: { sx: { maxHeight: 340 } } }}
      >
        <MenuItem value="">
          <em style={{ opacity: 0.6, fontSize: 13 }}>— None —</em>
        </MenuItem>

        {groups.map((g) => [
          <ListSubheader key={`h-${g.lakshya.id}`}
            sx={{
              lineHeight: "30px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: AREA_COLORS[g.lakshya.pillar] || "#888",
              bgcolor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            }}>
            {AREA_EMOJIS[g.lakshya.pillar] || "🎯"} {g.lakshya.title}
          </ListSubheader>,
          ...g.items.map((s) => (
            <MenuItem key={s.id} value={s.id} sx={{ pl: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                <Typography sx={{ fontSize: 13, flex: 1 }}>🎯 {s.title}</Typography>
                {s.progress_percent > 0 && (
                  <Typography sx={{ fontSize: 10, color: "text.secondary", flexShrink: 0 }}>
                    {s.progress_percent}%
                  </Typography>
                )}
              </Box>
            </MenuItem>
          )),
        ])}
      </Select>
    </FormControl>
  );
}
