import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Alert,
  Snackbar,
  Collapse,
  CircularProgress,
  Fade,
} from "@mui/material";
import {
  Add,
  Check,
  Delete,
  Edit,
  Flag,
  CheckCircle,
  RadioButtonUnchecked,
  FlashOn,
  AutoAwesome,
  Timeline,
  Insights,
  SelfImprovement,
  MenuBook,
  Loop,
  CheckBox,
  TrendingUp,
  Stars,
  Close,
  ExpandMore,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";
import dayjs from "dayjs";

import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";

// Module-level caches — survive re-renders and back-navigation
const _journalCache = {} // { [area]: { content: string, updated_at: string } }

export function MilestoneRow() {
  return null;
}
export function AddMilestoneButton() {
  return null;
}

// ── THE ASHTA SIDDHI RESONANCE SCALE ───────────────────────────────────────────
export const ASHTA_SIDDHI_SCALE = [
  {
    value: 1,
    name: "Aṇimā",
    label: "Minimal focus, fragmented effort",
    emoji: "🌱",
  },
  {
    value: 2,
    name: "Mahimā",
    label: "Found rhythm, expanded effort",
    emoji: "🌿",
  },
  {
    value: 3,
    name: "Garimā",
    label: "Heavy, grounded, solid work",
    emoji: "🌳",
  },
  {
    value: 4,
    name: "Laghimā",
    label: "Effortless, light, flowing",
    emoji: "🍃",
  },
  { value: 5, name: "Prāpti", label: "Target state reached", emoji: "🎯" },
  {
    value: 6,
    name: "Prākāmya",
    label: "Overcame immense resistance",
    emoji: "🔥",
  },
  { value: 7, name: "Īśitva", label: "Total command and mastery", emoji: "👑" },
  {
    value: 8,
    name: "Vaśitva",
    label: "Perfect resonance, transcended",
    emoji: "✨",
  },
];

// ── ANIMATIONS & THEME UTILS ───────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// A subtle noise pattern that works on both light and dark modes by using opacity
const ashramBgPattern = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`;

const cardBaseStyles = {
  mb: 2,
  boxShadow: "0 4px 24px -8px rgba(0,0,0,0.04)",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 4,
  backgroundImage: ashramBgPattern,
  backgroundBlendMode: "overlay",
  transition: "transform 0.2s ease, box-shadow 0.2s ease",
  "&:hover": {
    boxShadow: "0 8px 32px -8px rgba(0,0,0,0.08)",
  },
};

// ── SECTION LABEL ──────────────────────────────────────────────────────────────
export function SectionLabel({ children, icon: Icon, color }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
      {Icon && <Icon sx={{ fontSize: 16, color: color || "text.secondary" }} />}
      <Typography
        variant="caption"
        sx={{
          textTransform: "uppercase",
          letterSpacing: 2.5,
          fontSize: 10,
          fontWeight: 700,
          color: color || "text.secondary",
          fontFamily: '"Inter", sans-serif',
        }}
      >
        {children}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: "1px",
          background: `linear-gradient(90deg, ${color || "#ccc"}30 0%, transparent 100%)`,
        }}
      />
    </Box>
  );
}

// ── AREA BANNER ────────────────────────────────────────────────────────────────
export function AreaBanner({ color, emoji, title, subtitle, quote }) {
  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${color}22`,
          borderTop: `3px solid ${color}`,
          background: `linear-gradient(135deg, ${color}08 0%, transparent 80%)`,
          p: { xs: 2, md: 2.5 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle watermark glow */}
        <Box sx={{
          position: "absolute", top: -20, right: -20,
          width: 100, height: 100, borderRadius: "50%",
          background: `${color}18`, filter: "blur(30px)", pointerEvents: "none",
        }} />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, position: "relative" }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 2,
            background: `${color}14`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, flexShrink: 0,
            border: `1px solid ${color}20`,
          }}>
            {emoji}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontFamily: '"Fraunces","Lora",serif',
              fontWeight: 400,
              fontSize: { xs: 18, md: 20 },
              color,
              lineHeight: 1.2,
              letterSpacing: "-0.2px",
            }}>
              {title}
            </Typography>
            <Typography sx={{
              fontSize: 11,
              color: "text.secondary",
              letterSpacing: 0.3,
              mt: 0.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
              {subtitle}
            </Typography>
          </Box>
        </Box>

        {quote && (
          <Typography sx={{
            mt: 1.75,
            pt: 1.75,
            borderTop: `1px solid ${color}15`,
            fontSize: 13,
            fontFamily: '"Lora","Fraunces",serif',
            fontStyle: "italic",
            color: "text.secondary",
            lineHeight: 1.65,
            opacity: 0.9,
            position: "relative",
          }}>
            "{quote}"
          </Typography>
        )}
      </Box>
    </Fade>
  );
}

// ── STAT CARD ──────────────────────────────────────────────────────────────────
export function StatCard({ value, label, color, sub }) {
  return (
    <Box sx={{
      p: { xs: 1.5, md: 2 },
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: "0 3px 12px rgba(0,0,0,0.06)" },
    }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: 2,
        background: `${color}12`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <Typography sx={{
          fontFamily: '"Fraunces",serif',
          fontSize: 20,
          fontWeight: 400,
          color: color || "text.primary",
          lineHeight: 1,
        }}>
          {value}
        </Typography>
      </Box>
      <Box>
        <Typography sx={{
          fontSize: 12,
          fontWeight: 600,
          color: "text.primary",
          letterSpacing: 0.3,
          lineHeight: 1.3,
        }}>
          {label}
        </Typography>
        {sub && (
          <Typography sx={{
            fontSize: 10,
            color: "text.disabled",
            fontStyle: "italic",
            mt: 0.25,
          }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

// ── SHARED HELPERS ─────────────────────────────────────────────────────────────
function relDate(dateStr) {
  if (!dateStr) return null;
  const diff = dayjs().startOf("day").diff(dayjs(dateStr).startOf("day"), "day");
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff}d ago`;
}

// Maps tracker_type → the table that actually records daily activity
// `filter` = extra eq() conditions applied to the query (e.g. exclude un-ticked rows)
const TRACKER_ACTIVITY = {
  spirit:  { table: "daily_item_completions",      col: "completion_date", filter: { is_completed: true } },
  music:   { table: "naada_sequence_completions", col: "completion_date", filter: { is_completed: true } },
  health:  { table: "health_logs",                col: "date",            filter: null },
  finance: { table: "finance_logs",               col: "date",            filter: null },
  career:  { table: "vritti_daily_log",           col: "date",            filter: null },
  reading: { table: "vidya_study_log",            col: "date",            filter: null },
};

async function fetchActivityDates(user, trackerTypes) {
  const since = dayjs().subtract(60, "day").format("YYYY-MM-DD");
  const all = new Set();
  await Promise.all(
    trackerTypes.map(async (type) => {
      const m = TRACKER_ACTIVITY[type];
      if (!m) return;
      let q = supabase.from(m.table).select(m.col)
        .eq("user_id", user.id).gte(m.col, since);
      if (m.filter) Object.entries(m.filter).forEach(([k, v]) => { q = q.eq(k, v); });
      const { data } = await q;
      (data || []).forEach(d => all.add(d[m.col]));
    })
  );
  return [...all].sort().reverse();
}

function calcStreak(datesDesc) {
  if (!datesDesc.length) return 0;
  let streak = 0;
  let cursor = dayjs().startOf("day");
  for (const d of datesDesc) {
    const dd = dayjs(d).startOf("day");
    if (dd.isSame(cursor)) { streak++; cursor = cursor.subtract(1, "day"); }
    else if (streak === 0 && dd.isSame(cursor.subtract(1, "day"))) {
      cursor = cursor.subtract(1, "day"); streak++; cursor = cursor.subtract(1, "day");
    } else if (dd.isBefore(cursor)) break;
  }
  return streak;
}

// ── GOAL TYPE CONFIG ───────────────────────────────────────────────────────────
export const GOAL_TYPES = [
  { id: "habit",      label: "Habit",      desc: "Build consistency over time — streaks, daily practice",  Icon: Loop,      color: "#7C6AF7" },
  { id: "completion", label: "Completion", desc: "Finish X out of Y things — books, courses, projects",    Icon: CheckBox,  color: "#2D9E6B" },
  { id: "outcome",    label: "Outcome",    desc: "Hit a measurable number — weight, income, distance",     Icon: TrendingUp, color: "#E07A2F" },
  { id: "mastery",    label: "Mastery",    desc: "Reach a quality level on the Ashtasiddhi scale",         Icon: Stars,     color: "#C9A24A" },
];

function GoalTypeChip({ type, small = false }) {
  const gt = GOAL_TYPES.find(g => g.id === type) || GOAL_TYPES[0];
  const { Icon, label, color } = gt;
  return (
    <Chip
      icon={<Icon sx={{ fontSize: small ? 11 : 13, color: `${color} !important` }} />}
      label={label}
      size="small"
      sx={{
        height: small ? 18 : 22,
        fontSize: small ? 9 : 11,
        fontWeight: 700,
        bgcolor: `${color}12`,
        color,
        border: `1px solid ${color}28`,
        "& .MuiChip-icon": { ml: "4px" },
      }}
    />
  );
}

// ── PROGRESS HINT HELPERS ──────────────────────────────────────────────────────

/**
 * Extract a target number from a milestone title.
 * First tries to find a number after a meaningful keyword (reach, level, save, hit,
 * complete, finish, achieve, days, sessions, books, hours, etc.).
 * Falls back to the last number in the title.
 * Supports decimals (e.g. 4.5, 10.5L).
 */
function parseMilestoneTarget(title) {
  if (!title) return null;
  const keyword = title.match(
    /(?:reach|level|save|hit|complete|finish|achieve|days?|sessions?|books?|hours?|months?|weeks?|courses?|times?)\s+[₹$£€]?([\d.]+)/i
  );
  if (keyword) return parseFloat(keyword[1]);
  // Fall back: last number in the title
  const all = [...title.matchAll(/[\d.]+/g)];
  return all.length ? parseFloat(all[all.length - 1][0]) : null;
}

/**
 * Returns a short progress sentence for a single milestone, or null if we
 * can't say anything useful. Driven by the parent Lakshya's type + live data.
 *
 * progress = { type, streak, outcomeCurrent, outcomeTarget, outcomeUnit }
 */
export function milestoneProgressHint(milestone, progress = {}) {
  if (!milestone || milestone.status === "completed") return null;
  const { type, streak, outcomeCurrent, outcomeUnit } = progress;

  if (type === "habit" && streak != null) {
    const target = parseMilestoneTarget(milestone.title);
    if (target == null) return null;
    const remaining = Math.ceil(target - streak);
    if (remaining <= 0)  return "You've reached this — mark it done ✓";
    if (remaining === 1) return "Just 1 more day — you're almost there!";
    if (remaining <= 7)  return `Only ${remaining} more days — so close!`;
    if (remaining <= 30) return `${remaining} more days to go`;
    return `${streak} of ${target} days done`;
  }

  if (type === "outcome" && outcomeCurrent != null) {
    const target = parseMilestoneTarget(milestone.title);
    if (target == null) return null;
    const unit = outcomeUnit ? ` ${outcomeUnit}` : "";
    const remaining = parseFloat((target - outcomeCurrent).toFixed(2));
    if (remaining <= 0) return `You've hit ${target}${unit} — mark it done ✓`;
    return `At ${outcomeCurrent}${unit} now — ${remaining}${unit} to go`;
  }

  if (type === "mastery" && outcomeCurrent != null) {
    const target = parseMilestoneTarget(milestone.title);
    if (target == null) return null;
    const current = Math.round(outcomeCurrent);
    const remaining = Math.ceil(target) - current;
    if (remaining <= 0) return `Level reached — mark it done ✓`;
    return `At level ${current} — ${remaining} level${remaining !== 1 ? "s" : ""} to go`;
  }

  return null;
}

/**
 * Returns a one-line progress sentence for the Lakshya card header, or null.
 * For Habit type, streak/consistency come from HabitHero via the onStreakLoaded
 * callback — so they might be null on first render until the fetch completes.
 */
function lakshyaProgressSentence({ type, streak, consistency, outcomeCurrent, outcomeTarget, outcomeUnit, achievedCount, totalCount }) {
  if (type === "habit") {
    if (streak == null) return null;
    const s = streak > 0 ? `${streak}-day streak` : "No streak yet";
    const c = consistency != null ? `${consistency}% this month` : "";
    return [s, c].filter(Boolean).join(" · ");
  }
  if (type === "completion") {
    if (totalCount === 0) return null;
    const remaining = totalCount - achievedCount;
    if (remaining === 0) return "All milestones achieved 🎉";
    return `${achievedCount} of ${totalCount} done — ${remaining} to go`;
  }
  if (type === "outcome") {
    const unit = outcomeUnit ? ` ${outcomeUnit}` : "";
    const cur  = outcomeCurrent ?? 0;
    const tgt  = outcomeTarget  ?? 0;
    if (tgt === 0) return cur > 0 ? `Currently at ${cur}${unit}` : null;
    const pct = Math.round((cur / tgt) * 100);
    return `${cur}${unit} of ${tgt}${unit} — ${pct}% of the way there`;
  }
  if (type === "mastery") {
    const level = Math.round(outcomeCurrent ?? 0);
    if (level === 0) return "Tap a level segment to record where you are";
    const info = ASHTA_SIDDHI_SCALE[level - 1];
    const rem  = 8 - level;
    return `Level ${level} — ${info?.name ?? ""} · ${rem} level${rem !== 1 ? "s" : ""} to the peak`;
  }
  return null;
}

// ── HABIT HERO ─────────────────────────────────────────────────────────────────
// Shows streak + 30-day consistency + today's signal for Habit-type Lakshyas.
// Fetches its own data: linked trackers -> activity dates.
function HabitHero({ lakshyaId, color, onStreakLoaded }) {
  const { user } = useAuth();
  const [data, setData] = useState(null); // null = loading

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // 1. Get linked tracker types for this Lakshya
      const { data: links } = await supabase
        .from("tracker_lakshya_links")
        .select("tracker_type")
        .eq("lakshya_id", lakshyaId)
        .eq("user_id", user.id);

      const trackerTypes = (links || []).map(l => l.tracker_type);

      if (!trackerTypes.length) {
        setData({ linked: false });
        return;
      }

      // 2. Get activity dates
      const datesDesc = await fetchActivityDates(user, trackerTypes);

      // 3. Streak
      const streak = calcStreak(datesDesc);

      // 4. 30-day consistency
      const cutoff = dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const last30 = new Set(datesDesc.filter(d => d >= cutoff));
      const consistency = Math.round((last30.size / 30) * 100);

      // 5. Last practiced
      const lastDate = datesDesc[0] || null;

      setData({ linked: true, streak, consistency, lastDate, trackerTypes });
      if (onStreakLoaded) onStreakLoaded(streak, consistency);
    };
    load();
  }, [user, lakshyaId]);

  // Loading — render nothing while fetching (avoids layout flash)
  if (!data) return null;

  if (!data.linked) {
    return (
      <Box sx={{ px: 2.5, pt: 0.5, pb: 0, mb: 2 }}>
        <Box sx={{ p: 2, borderRadius: 2.5, background: `${color}06`, border: `1px solid ${color}15` }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary", fontStyle: "italic" }}>
            Open a tracker, add or edit an item, and set "Serves Vision" to this Lakshya to start tracking consistency.
          </Typography>
        </Box>
      </Box>
    );
  }

  const { streak, consistency, lastDate } = data;
  const practicedToday = lastDate === dayjs().format("YYYY-MM-DD");
  const GREEN = "#2D9E6B";

  return (
    <Box sx={{ px: 2.5, pt: 0.5, pb: 0, mb: 2 }}>
      <Box sx={{ p: 2, borderRadius: 2.5, background: `${color}06`, border: `1px solid ${color}15` }}>
        {/* Streak + Consistency row */}
        <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
          {/* Streak */}
          <Box sx={{
            flex: 1, textAlign: "center", py: 1.25, px: 1, borderRadius: 2,
            bgcolor: streak > 0 ? `${color}10` : "rgba(0,0,0,0.02)",
            border: `1px solid ${streak > 0 ? color + "22" : "transparent"}`,
          }}>
            <Typography sx={{ fontSize: 22, lineHeight: 1, mb: 0.5 }}>
              {streak > 6 ? "🔥" : streak > 0 ? "✨" : "💤"}
            </Typography>
            <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 400, color, lineHeight: 1 }}>
              {streak}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: 1, display: "block", mt: 0.4 }}>
              day streak
            </Typography>
          </Box>

          {/* 30-day consistency */}
          <Box sx={{ flex: 1, textAlign: "center", py: 1.25, px: 1, borderRadius: 2, border: `1px solid ${color}15` }}>
            <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 400, color, lineHeight: 1, mb: 0.75 }}>
              {consistency}%
            </Typography>
            <LinearProgress variant="determinate" value={consistency}
              sx={{ height: 4, borderRadius: 2, bgcolor: `${color}18`, mb: 0.5,
                "& .MuiLinearProgress-bar": { bgcolor: consistency > 70 ? GREEN : consistency > 40 ? color : "#CF4E4E", borderRadius: 2 } }} />
            <Typography variant="caption" sx={{ fontSize: 10, color: "text.disabled", textTransform: "uppercase", letterSpacing: 1, display: "block" }}>
              30-day consistency
            </Typography>
          </Box>
        </Box>

        {/* Today's signal */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pt: 1.25, borderTop: `1px solid ${color}12` }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
            bgcolor: practicedToday ? GREEN : "text.disabled",
            boxShadow: practicedToday ? `0 0 6px ${GREEN}80` : "none",
            transition: "all 0.3s",
          }} />
          <Typography sx={{ fontSize: 12, color: practicedToday ? GREEN : "text.secondary", fontWeight: practicedToday ? 600 : 400 }}>
            {practicedToday
              ? "Practiced today ✓"
              : lastDate
              ? `Last practiced ${relDate(lastDate)}`
              : "No activity recorded yet"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── LAKSHYA HIERARCHY (Lakshya -> Milestone) ───────────────────────────────────
function MilestoneCard({ milestone, color, onUpdate, progress }) {
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const GREEN = isDark ? "#5EC98A" : "#2D7A4F";
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: milestone.title, target_date: milestone.target_date || "" });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "error" });

  const isAchieved = milestone.status === "completed";
  const overdue = milestone.target_date && dayjs(milestone.target_date).isBefore(dayjs(), "day") && !isAchieved;

  const toggleAchieved = async () => {
    setToggling(true);
    const { error } = await supabase.from("siddhis")
      .update({ status: isAchieved ? "active" : "completed" })
      .eq("id", milestone.id);
    if (error) setSnack({ open: true, msg: "Failed to update", severity: "error" });
    else if (onUpdate) onUpdate();
    setToggling(false);
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("siddhis").update({
      title: editForm.title.trim(),
      target_date: editForm.target_date || null,
    }).eq("id", milestone.id);
    if (error) setSnack({ open: true, msg: "Failed to save", severity: "error" });
    else { setEditing(false); if (onUpdate) onUpdate(); }
    setSaving(false);
  };

  const remove = async () => {
    const { error } = await supabase.from("siddhis").delete().eq("id", milestone.id);
    if (!error && onUpdate) onUpdate();
    setConfirmDelete(false);
  };

  return (
    <>
      {editing ? (
        <Box sx={{ p: 2, background: `${color}07`, borderBottom: "1px solid", borderColor: `${color}15` }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <TextField size="small" fullWidth label="Milestone title" autoFocus
              value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
            <TextField size="small" fullWidth type="date" label="Target date (optional)"
              value={editForm.target_date} onChange={(e) => setEditForm(f => ({ ...f, target_date: e.target.value }))}
              InputLabelProps={{ shrink: true }} />
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button size="small" color="inherit" sx={{ fontSize: 12, textTransform: "none" }}
                onClick={() => { setEditing(false); setEditForm({ title: milestone.title, target_date: milestone.target_date || "" }); }}>
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={saveEdit} disabled={saving || !editForm.title.trim()}
                sx={{ fontSize: 12, background: color, boxShadow: "none", textTransform: "none" }}>
                Save
              </Button>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{
          display: "flex", alignItems: "flex-start", gap: 1.25,
          px: 1.75, py: 1.1,
          borderBottom: "1px solid", borderColor: `${color}10`,
          transition: "background 0.12s",
          bgcolor: isAchieved
            ? isDark ? "rgba(45,158,107,0.03)" : "rgba(45,158,107,0.025)"
            : "transparent",
          "&:hover": { bgcolor: isAchieved ? "rgba(45,158,107,0.06)" : `${color}07` },
          "& .ms-actions": { opacity: 0, transition: "opacity 0.15s" },
          "&:hover .ms-actions": { opacity: 1 },
        }}>
          <IconButton onClick={toggleAchieved} disabled={toggling} size="small"
            sx={{ p: 0.25, mt: 0.2, flexShrink: 0,
              color: isAchieved ? GREEN : `${color}70`,
              "&:hover": { color: isAchieved ? "#CF4E4E" : color },
              transition: "color 0.15s, transform 0.15s",
              "&:active": { transform: "scale(0.82)" } }}>
            {isAchieved
              ? <CheckCircle sx={{ fontSize: 17 }} />
              : <RadioButtonUnchecked sx={{ fontSize: 17 }} />}
          </IconButton>

          <Box sx={{ flex: 1, minWidth: 0, py: 0.1 }}>
            <Typography sx={{
              fontSize: 13, fontWeight: isAchieved ? 400 : 500,
              color: isAchieved ? "text.disabled" : "text.primary",
              textDecoration: isAchieved ? "line-through" : "none",
              lineHeight: 1.45,
            }}>
              {milestone.title}
            </Typography>
            {!isAchieved && (() => {
              const hint = milestoneProgressHint(milestone, progress);
              if (!hint) return null;
              const isReady = hint.includes("mark it done");
              return (
                <Typography sx={{
                  fontSize: 10.5, mt: 0.2,
                  color: isReady ? GREEN : "text.secondary",
                  fontWeight: isReady ? 600 : 400,
                  fontStyle: isReady ? "normal" : "italic",
                  lineHeight: 1.3,
                }}>
                  {isReady ? "✓ " : ""}{hint}
                </Typography>
              );
            })()}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0, mt: 0.2 }}>
            {!isAchieved && milestone.target_date && (
              <Typography sx={{
                fontSize: 10, fontWeight: overdue ? 700 : 400,
                color: overdue ? "#CF4E4E" : "text.disabled",
              }}>
                {overdue ? "⚠ " : ""}{dayjs(milestone.target_date).format("D MMM YYYY")}
              </Typography>
            )}
            <Box className="ms-actions" sx={{ display: "flex", gap: 0 }}>
              <IconButton size="small" onClick={() => setEditing(true)}
                sx={{ p: 0.4, color: "text.disabled", "&:hover": { color } }}>
                <Edit sx={{ fontSize: 12 }} />
              </IconButton>
              <IconButton size="small" onClick={() => setConfirmDelete(true)}
                sx={{ p: 0.4, color: "text.disabled", "&:hover": { color: "#CF4E4E" } }}>
                <Delete sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
          </Box>
        </Box>
      )}

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif', fontWeight: 400, fontSize: 20 }}>Delete Milestone?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Permanently delete <strong>"{milestone.title}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDelete(false)} color="inherit">Cancel</Button>
          <Button onClick={remove} variant="contained"
            sx={{ bgcolor: "#CF4E4E", "&:hover": { bgcolor: "#b03535" }, boxShadow: "none" }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSnack(p => ({ ...p, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </>
  );
}

function LakshyaCard({ lakshya, color, onUpdate }) {
  const { user } = useAuth();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(lakshya.title);
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({ title: "", target_date: "" });
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [outcomeEdit, setOutcomeEdit] = useState(false);
  const [outcomeVal, setOutcomeVal] = useState(String(lakshya.outcome_current ?? 0));
  const [habitStreak, setHabitStreak] = useState(null);
  const [habitConsistency, setHabitConsistency] = useState(null);
  const [achievedOpen, setAchievedOpen] = useState(false);
  const [showAllActive, setShowAllActive] = useState(false);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";

  const type = lakshya.type || "habit";
  const milestones = lakshya.siddhis || [];
  const activeMilestones = milestones.filter(m => m.status !== "completed");
  const achievedMilestones = milestones.filter(m => m.status === "completed");
  const ACTIVE_CAP = 4;
  const visibleActive = showAllActive ? activeMilestones : activeMilestones.slice(0, ACTIVE_CAP);
  const hiddenActiveCount = activeMilestones.length - ACTIVE_CAP;
  const completionPct = milestones.length > 0 ? Math.round((achievedMilestones.length / milestones.length) * 100) : 0;

  const saveTitle = async () => {
    if (!titleVal.trim()) return;
    const { error } = await supabase.from("lakshyas").update({ title: titleVal.trim() }).eq("id", lakshya.id);
    if (error) { setSnack({ open: true, msg: "Failed to save title", severity: "error" }); return; }
    setEditingTitle(false);
    if (onUpdate) onUpdate();
  };

  const addMilestone = async () => {
    if (!milestoneForm.title.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("siddhis").insert({
      user_id: user.id,
      lakshya_id: lakshya.id,
      title: milestoneForm.title.trim(),
      target_date: milestoneForm.target_date || null,
      status: "active",
    });
    if (error) { setSnack({ open: true, msg: error.message || "Failed to add milestone", severity: "error" }); setSaving(false); return; }
    setMilestoneForm({ title: "", target_date: "" });
    setAddingMilestone(false);
    setSaving(false);
    if (onUpdate) onUpdate();
  };

  const saveOutcomeCurrent = async () => {
    const val = parseFloat(outcomeVal);
    if (isNaN(val)) return;
    const { error } = await supabase.from("lakshyas").update({ outcome_current: val }).eq("id", lakshya.id);
    if (!error) { setOutcomeEdit(false); if (onUpdate) onUpdate(); }
    else setSnack({ open: true, msg: "Failed to update", severity: "error" });
  };

  const saveMasteryLevel = async (level) => {
    await supabase.from("lakshyas").update({ outcome_current: level }).eq("id", lakshya.id);
    if (onUpdate) onUpdate();
  };

  const archiveLakshya = async () => {
    await supabase.from("lakshyas").update({ status: "archived" }).eq("id", lakshya.id);
    setConfirmArchive(false);
    if (onUpdate) onUpdate();
  };

  const deleteLakshya = async () => {
    await supabase.from("lakshyas").delete().eq("id", lakshya.id);
    setConfirmDelete(false);
    if (onUpdate) onUpdate();
  };

  // ── Type-specific hero section ──────────────────────────────────────────────
  const renderTypeHero = () => {
    if (type === "completion") {
      return (
        <Box sx={{ px: 2.5, pt: 0.5, pb: 0, mb: 2 }}>
          <Box sx={{ p: 2, borderRadius: 2.5, background: `${color}06`, border: `1px solid ${color}15` }}>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, mb: 1 }}>
              <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: 34, fontWeight: 400, color, lineHeight: 1 }}>
                {achievedMilestones.length}
              </Typography>
              <Typography sx={{ fontSize: 16, color: "text.disabled" }}>
                / {milestones.length || "?"} complete
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={completionPct}
              sx={{ height: 7, borderRadius: 3, bgcolor: `${color}18`, "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
            <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary", mt: 0.75, display: "block" }}>
              {milestones.length === 0 ? "Add milestones below to track completion" : `${completionPct}% of milestones achieved`}
            </Typography>
          </Box>
        </Box>
      );
    }

    if (type === "outcome") {
      const current = lakshya.outcome_current ?? 0;
      const target = lakshya.outcome_target ?? 0;
      const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
      const unit = lakshya.outcome_unit || "";
      return (
        <Box sx={{ px: 2.5, pt: 0.5, pb: 0, mb: 2 }}>
          <Box sx={{ p: 2, borderRadius: 2.5, background: `${color}06`, border: `1px solid ${color}15` }}>
            {outcomeEdit ? (
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.5 }}>
                <TextField size="small" type="number" autoFocus
                  value={outcomeVal} onChange={e => setOutcomeVal(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveOutcomeCurrent(); if (e.key === "Escape") { setOutcomeEdit(false); setOutcomeVal(String(lakshya.outcome_current ?? 0)); } }}
                  sx={{ width: 130, "& input": { fontSize: 14, py: "6px" } }}
                  InputProps={{ endAdornment: unit ? <Typography variant="caption" sx={{ mr: 1, color: "text.secondary", whiteSpace: "nowrap" }}>{unit}</Typography> : null }} />
                <Button size="small" variant="contained" onClick={saveOutcomeCurrent}
                  sx={{ fontSize: 12, py: 0.5, background: color, boxShadow: "none", textTransform: "none" }}>Save</Button>
                <Button size="small" color="inherit" sx={{ fontSize: 12, py: 0.5, minWidth: 0 }}
                  onClick={() => { setOutcomeEdit(false); setOutcomeVal(String(lakshya.outcome_current ?? 0)); }}>✕</Button>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mb: 1.25 }}>
                <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: 32, fontWeight: 400, color, lineHeight: 1 }}>
                  {current}{unit ? ` ${unit}` : ""}
                </Typography>
                <Typography sx={{ fontSize: 14, color: "text.disabled" }}>
                  → {target > 0 ? `${target}${unit ? ` ${unit}` : ""}` : "no target set"}
                </Typography>
                <IconButton size="small" onClick={() => setOutcomeEdit(true)}
                  sx={{ p: 0.25, ml: 0.25, color: "text.disabled", "&:hover": { color } }}>
                  <Edit sx={{ fontSize: 13 }} />
                </IconButton>
              </Box>
            )}
            {target > 0 && (
              <>
                <LinearProgress variant="determinate" value={pct}
                  sx={{ height: 7, borderRadius: 3, bgcolor: `${color}18`, "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
                <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary", mt: 0.75, display: "block" }}>
                  {Math.round(pct)}% toward target
                </Typography>
              </>
            )}
          </Box>
        </Box>
      );
    }

    if (type === "mastery") {
      const currentLevel = Math.max(0, Math.min(8, Math.round(lakshya.outcome_current ?? 0)));
      const levelInfo = currentLevel > 0 ? ASHTA_SIDDHI_SCALE[currentLevel - 1] : null;
      return (
        <Box sx={{ px: 2.5, pt: 0.5, pb: 0, mb: 2 }}>
          <Box sx={{ p: 2, borderRadius: 2.5, background: `${color}06`, border: `1px solid ${color}15` }}>
            {levelInfo ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Typography sx={{ fontSize: 30, lineHeight: 1 }}>{levelInfo.emoji}</Typography>
                <Box>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1.3 }}>
                    Level {currentLevel} — {levelInfo.name}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}>{levelInfo.label}</Typography>
                </Box>
              </Box>
            ) : (
              <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 1.5, fontStyle: "italic" }}>
                Tap a level to record your current state
              </Typography>
            )}
            {/* 8-segment bar */}
            <Box sx={{ display: "flex", gap: "3px" }}>
              {ASHTA_SIDDHI_SCALE.map(lvl => (
                <Tooltip key={lvl.value} title={`${lvl.value}. ${lvl.name} — ${lvl.label}`}>
                  <Box onClick={() => saveMasteryLevel(lvl.value)}
                    sx={{
                      flex: 1, height: 28, borderRadius: 1, cursor: "pointer",
                      bgcolor: currentLevel >= lvl.value ? color : `${color}18`,
                      border: currentLevel === lvl.value ? `2px solid ${color}` : "2px solid transparent",
                      transition: "all 0.15s ease",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11,
                      "&:hover": { bgcolor: `${color}60`, transform: "scaleY(1.08)" },
                    }}>
                    {currentLevel >= lvl.value ? lvl.emoji : ""}
                  </Box>
                </Tooltip>
              ))}
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
              <Typography variant="caption" sx={{ fontSize: 9, color: "text.disabled" }}>Aṇimā</Typography>
              <Typography variant="caption" sx={{ fontSize: 9, color: "text.disabled" }}>Vaśitva ✨</Typography>
            </Box>
          </Box>
        </Box>
      );
    }

    // habit — streak + consistency from linked trackers
    return (
      <HabitHero
        lakshyaId={lakshya.id}
        color={color}
        onStreakLoaded={(s, c) => { setHabitStreak(s); setHabitConsistency(c); }}
      />
    );
  };

  return (
    <Box sx={{
      border: "1px solid", borderColor: `${color}22`,
      borderTop: `3px solid ${color}`,
      borderRadius: 3, overflow: "hidden", bgcolor: "background.paper",
      boxShadow: `0 2px 16px ${color}12`,
      transition: "box-shadow 0.2s",
      "&:hover": { boxShadow: `0 6px 28px ${color}20` },
    }}>
      {/* ── Header ── */}
      <Box sx={{ px: 2.5, pt: 2.25, pb: 2, background: `linear-gradient(to right, ${color}08, transparent)`, display: "flex", alignItems: "flex-start", gap: 1.5 }}>
        <Box sx={{ p: 0.75, borderRadius: 1.5, background: `${color}14`, display: "flex", mt: 0.25, flexShrink: 0 }}>
          <Flag sx={{ fontSize: 18, color }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {editingTitle ? (
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <TextField size="small" value={titleVal} autoFocus
                onChange={e => setTitleVal(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") { setEditingTitle(false); setTitleVal(lakshya.title); } }}
                sx={{ flex: 1, "& input": { fontSize: 15, py: "6px", fontFamily: '"Fraunces", serif' } }} />
              <Button size="small" variant="contained" onClick={saveTitle}
                sx={{ py: 0.5, fontSize: 12, background: color, minWidth: 0, px: 1.5, boxShadow: "none", textTransform: "none" }}>
                Save
              </Button>
              <Button size="small" color="inherit" sx={{ py: 0.5, fontSize: 12, minWidth: 0 }}
                onClick={() => { setEditingTitle(false); setTitleVal(lakshya.title); }}>✕</Button>
            </Box>
          ) : (
            <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: 17, fontWeight: 500, color: "text.primary", lineHeight: 1.3 }}>
              {lakshya.title}
            </Typography>
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
            <Chip icon={<Timeline sx={{ fontSize: 11 }} />} label={`${lakshya.timeline_years}yr`}
              size="small" sx={{ height: 19, fontSize: 10, fontWeight: 700, textTransform: "uppercase", background: `${color}15`, color, border: `1px solid ${color}30` }} />
            <GoalTypeChip type={type} small />
            {type === "habit" && milestones.length > 0 && (
              <Typography variant="caption" sx={{ fontSize: 11, color: "text.secondary" }}>
                {achievedMilestones.length}/{milestones.length} milestones achieved
              </Typography>
            )}
          </Box>
          {(() => {
            const sentence = lakshyaProgressSentence({
              type,
              streak: habitStreak,
              consistency: habitConsistency,
              outcomeCurrent: lakshya.outcome_current ?? 0,
              outcomeTarget:  lakshya.outcome_target  ?? 0,
              outcomeUnit:    lakshya.outcome_unit    || "",
              achievedCount:  achievedMilestones.length,
              totalCount:     milestones.length,
            });
            if (!sentence) return null;
            return (
              <Typography sx={{
                fontSize: 12, mt: 0.75, color: "text.secondary",
                fontStyle: "italic", lineHeight: 1.4,
              }}>
                {sentence}
              </Typography>
            );
          })()}
        </Box>
        <Tooltip title="Edit title">
          <IconButton size="small" onClick={() => setEditingTitle(true)} sx={{ p: 0.5, color: "text.disabled", mt: 0.25, "&:hover": { color: "text.primary" } }}>
            <Edit sx={{ fontSize: 15 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Type-specific hero ── */}
      {renderTypeHero()}

      {/* ── Milestones ── */}
      <Box sx={{ px: 2.5, pb: 2.5, pt: 0.5 }}>

        {milestones.length > 0 && (
          <Box sx={{
            borderRadius: 2, border: `1px solid ${color}18`,
            overflow: "hidden", mb: 1.75,
            boxShadow: `0 1px 6px ${color}08`,
          }}>
            {/* List header */}
            <Box sx={{
              px: 1.75, py: 0.9,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: isDark
                ? `linear-gradient(to right, ${color}14, ${color}08)`
                : `linear-gradient(to right, ${color}10, ${color}05)`,
              borderBottom: `1px solid ${color}15`,
            }}>
              <Typography variant="caption" sx={{
                fontSize: 10, fontWeight: 700, color,
                textTransform: "uppercase", letterSpacing: 1.5,
              }}>
                {type === "completion" ? "Items" : type === "mastery" ? "Checkpoints" : "Milestones"}
                {" · "}{achievedMilestones.length}/{milestones.length}
              </Typography>
              {completionPct > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 48, height: 4, borderRadius: 2, bgcolor: `${color}18`, overflow: "hidden" }}>
                    <Box sx={{ width: `${completionPct}%`, height: "100%", bgcolor: completionPct === 100 ? "#2D9E6B" : color, borderRadius: 2, transition: "width 0.4s ease" }} />
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 700, color: completionPct === 100 ? "#2D9E6B" : color }}>
                    {completionPct}%
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Active milestones */}
            {visibleActive.map(m => (
              <MilestoneCard key={m.id} milestone={m} color={color} onUpdate={onUpdate}
                progress={{ type, streak: habitStreak, outcomeCurrent: lakshya.outcome_current ?? 0, outcomeTarget: lakshya.outcome_target ?? 0, outcomeUnit: lakshya.outcome_unit || "" }}
              />
            ))}

            {/* Show more active */}
            {!showAllActive && hiddenActiveCount > 0 && (
              <Box onClick={() => setShowAllActive(true)} sx={{
                px: 1.75, py: 0.85, cursor: "pointer",
                borderBottom: achievedMilestones.length > 0 ? `1px solid ${color}10` : "none",
                display: "flex", alignItems: "center", gap: 0.75,
                "&:hover": { bgcolor: `${color}07` }, transition: "background 0.12s",
              }}>
                <Typography sx={{ fontSize: 11, color: "text.secondary", fontStyle: "italic" }}>
                  + {hiddenActiveCount} more {type === "completion" ? "item" : "milestone"}{hiddenActiveCount !== 1 ? "s" : ""}
                </Typography>
              </Box>
            )}

            {/* Achieved collapse toggle */}
            {achievedMilestones.length > 0 && (
              <>
                <Box onClick={() => setAchievedOpen(p => !p)} sx={{
                  px: 1.75, py: 0.85, cursor: "pointer",
                  background: isDark ? "rgba(45,158,107,0.07)" : "rgba(45,158,107,0.045)",
                  borderTop: activeMilestones.length > 0 || (!showAllActive && hiddenActiveCount > 0) ? `1px solid ${color}10` : "none",
                  display: "flex", alignItems: "center", gap: 1,
                  "&:hover": { background: isDark ? "rgba(45,158,107,0.12)" : "rgba(45,158,107,0.08)" },
                  transition: "background 0.12s",
                }}>
                  <CheckCircle sx={{ fontSize: 13, color: "#2D9E6B" }} />
                  <Typography sx={{ fontSize: 11, color: "#2D9E6B", fontWeight: 600 }}>
                    {achievedMilestones.length} achieved
                  </Typography>
                  <ExpandMore sx={{
                    fontSize: 15, color: "#2D9E6B", ml: "auto",
                    transform: achievedOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }} />
                </Box>
                <Collapse in={achievedOpen}>
                  <Box sx={{ borderTop: `1px solid ${color}10` }}>
                    {achievedMilestones.map(m => (
                      <MilestoneCard key={m.id} milestone={m} color={color} onUpdate={onUpdate} progress={{}} />
                    ))}
                  </Box>
                </Collapse>
              </>
            )}
          </Box>
        )}

        {milestones.length === 0 && !addingMilestone && (
          <Box sx={{ py: 2.5, textAlign: "center", background: `${color}04`, borderRadius: 2, border: `1px dashed ${color}22`, mb: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: "text.disabled", fontStyle: "italic" }}>
              {type === "completion"
                ? "Add the things you need to complete — books, projects, courses…"
                : type === "mastery"
                ? "Add checkpoints that mark your progress toward mastery."
                : type === "outcome"
                ? "Add milestones — waypoints on your journey to the target."
                : "No milestones yet. Break this vision into concrete checkpoints."}
            </Typography>
          </Box>
        )}

        {/* Add milestone form */}
        {addingMilestone ? (
          <Fade in>
            <Box sx={{ mt: 1.5, p: 2, borderRadius: 2.5, bgcolor: "background.paper", border: `1px solid ${color}25`, boxShadow: `0 4px 16px ${color}10` }}>
              <TextField fullWidth size="small" autoFocus label="Milestone title"
                placeholder="e.g. First 30-day unbroken streak"
                value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addMilestone()}
                sx={{ mb: 1.5 }} />
              <TextField fullWidth size="small" type="date" label="Target date (optional)"
                value={milestoneForm.target_date} onChange={e => setMilestoneForm(p => ({ ...p, target_date: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={{ mb: 1.5 }} />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" variant="contained" onClick={addMilestone} disabled={saving || !milestoneForm.title.trim()}
                  sx={{ flex: 1, fontSize: 13, background: color, "&:hover": { background: color, opacity: 0.9 }, boxShadow: "none", py: 0.9, textTransform: "none" }}>
                  {type === "completion" ? "Add Item" : type === "mastery" ? "Add Checkpoint" : "Add Milestone"}
                </Button>
                <Button size="small" color="inherit" sx={{ fontSize: 13, px: 2, textTransform: "none" }}
                  onClick={() => { setAddingMilestone(false); setMilestoneForm({ title: "", target_date: "" }); }}>
                  Cancel
                </Button>
              </Box>
            </Box>
          </Fade>
        ) : (
          <Button size="small" startIcon={<Add sx={{ fontSize: 15 }} />} onClick={() => setAddingMilestone(true)}
            sx={{
              mt: milestones.length > 0 ? 1.5 : 0, fontSize: 12.5, color, textTransform: "none",
              border: `1px dashed ${color}35`, borderRadius: 2, px: 2, py: 0.75,
              "&:hover": { background: `${color}06`, borderStyle: "solid" },
            }}>
            {type === "completion" ? "Add Item" : type === "mastery" ? "Add Checkpoint" : "Add Milestone"}
          </Button>
        )}

        {/* Archive / Delete */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, mt: 2, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
          <Button size="small" onClick={() => setConfirmArchive(true)}
            sx={{ fontSize: 11, color: "text.disabled", textTransform: "none", px: 1.5, "&:hover": { color: "#ED8C00" } }}>
            Archive
          </Button>
          <Button size="small" onClick={() => setConfirmDelete(true)}
            sx={{ fontSize: 11, color: "text.disabled", textTransform: "none", px: 1.5, "&:hover": { color: "#CF4E4E" } }}>
            Delete
          </Button>
        </Box>
      </Box>

      <Dialog open={confirmArchive} onClose={() => setConfirmArchive(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif', fontWeight: 400, fontSize: 20 }}>Archive this Vision?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Archive <strong>"{lakshya.title}"</strong>? Hidden from active views but preserved in history.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmArchive(false)} color="inherit">Cancel</Button>
          <Button onClick={archiveLakshya} variant="contained" sx={{ bgcolor: "#ED8C00", "&:hover": { bgcolor: "#c97700" }, boxShadow: "none" }}>Archive</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif', fontWeight: 400, fontSize: 20 }}>Delete this Vision?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Permanently delete <strong>"{lakshya.title}"</strong> and all its milestones? Cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDelete(false)} color="inherit">Cancel</Button>
          <Button onClick={deleteLakshya} variant="contained" sx={{ bgcolor: "#CF4E4E", "&:hover": { bgcolor: "#b03535" }, boxShadow: "none" }}>Delete Permanently</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(p => ({ ...p, open: false }))} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert onClose={() => setSnack(p => ({ ...p, open: false }))} severity={snack.severity} sx={{ width: "100%" }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}


// Which goal type to pre-select when opening "New Vision" on each area page
const AREA_DEFAULT_TYPE = {
  spirit:  "habit",
  music:   "habit",
  health:  "habit",
  reading: "habit",
  finance: "outcome",
  career:  "completion",
};

export function LakshyaSection({ area, color, lakshyas, onUpdate }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const defaultType = AREA_DEFAULT_TYPE[area] || "habit";
  const [form, setForm] = useState({
    title: "",
    description: "",
    timeline_years: 1,
    reward_note: "",
    type: defaultType,
    outcome_target: "",
    outcome_unit: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const PILLAR_MAP = {
    spirit: "Spiritual",
    music: "Nādam",
    health: "Sharīram",
    career: "Vṛtti",
    finance: "Artha",
    reading: "Vidyā",
  };

  const save = async () => {
    if (!form.title.trim() || !user) return;
    setSaving(true);
    setError("");
    const { error: err } = await supabase.from("lakshyas").insert({
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      pillar: area,
      timeline_years: form.timeline_years,
      reward_note: form.reward_note.trim() || null,
      status: "active",
      type: form.type,
      outcome_target: form.type === "outcome" && form.outcome_target ? Number(form.outcome_target) : null,
      outcome_current: form.type === "outcome" ? 0 : null,
      outcome_unit: form.type === "outcome" && form.outcome_unit ? form.outcome_unit.trim() : null,
    });
    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    setForm({ title: "", description: "", timeline_years: 1, reward_note: "", type: defaultType, outcome_target: "", outcome_unit: "" });
    setOpen(false);
    setSaving(false);
    if (onUpdate) onUpdate();
  };

  return (
    <Card sx={cardBaseStyles}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <SectionLabel icon={Flag} color={color}>
              Lakshyas (Visions)
            </SectionLabel>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 14, fontFamily: '"Lora", serif' }}
            >
              Your long-term anchor points for this pillar.
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color,
              borderColor: `${color}40`,
              border: "1px solid",
              borderRadius: 3,
              py: 1,
              px: 2.5,
              background: `${color}08`,
              "&:hover": { background: `${color}15` },
            }}
          >
            New Vision
          </Button>
        </Box>

        {lakshyas.length === 0 ? (
          <Box
            sx={{
              py: 6,
              textAlign: "center",
              background: `${color}04`,
              borderRadius: 3,
              border: `1px dashed ${color}30`,
            }}
          >
            <AutoAwesome sx={{ fontSize: 40, color: `${color}60`, mb: 2 }} />
            <Typography
              sx={{
                fontSize: 16,
                color: "text.primary",
                fontWeight: 500,
                mb: 1,
                fontFamily: '"Fraunces", serif',
              }}
            >
              No Lakshyas defined for {PILLAR_MAP[area] || area}.
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: "text.secondary",
                maxWidth: 360,
                mx: "auto",
                lineHeight: 1.6,
              }}
            >
              Plant the seed. Define a 1 to 10 year vision. What is the ultimate
              state of resonance you seek here?
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: 2.5,
            alignItems: "start",
          }}>
            {lakshyas.map((l) => (
              <LakshyaCard key={l.id} lakshya={l} color={color} onUpdate={onUpdate} />
            ))}
          </Box>
        )}

        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 4, p: 1, backgroundImage: ashramBgPattern },
          }}
        >
          <DialogTitle
            sx={{
              fontFamily: '"Fraunces", serif',
              fontWeight: 400,
              pb: 1,
              fontSize: 24,
            }}
          >
            Define a Lakshya
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 14, mt: 1, fontFamily: '"Lora", serif' }}
            >
              A grand, far-reaching vision for {PILLAR_MAP[area] || area}.
            </Typography>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2, fontSize: 13, borderRadius: 2 }}>{error}</Alert>
            )}

            {/* Goal type picker */}
            <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 1.5, display: "block", mb: 1, mt: 1 }}>
              Goal Type
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mb: 3 }}>
              {GOAL_TYPES.map(({ id, label, desc, Icon, color: gtColor }) => {
                const selected = form.type === id;
                return (
                  <Box key={id} onClick={() => setForm(p => ({ ...p, type: id }))}
                    sx={{
                      p: 1.5, borderRadius: 2, cursor: "pointer", border: "1.5px solid",
                      borderColor: selected ? `${gtColor}70` : "divider",
                      bgcolor: selected ? `${gtColor}10` : "transparent",
                      transition: "all 0.15s ease",
                      "&:hover": { borderColor: `${gtColor}50`, bgcolor: `${gtColor}07` },
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
                      <Icon sx={{ fontSize: 15, color: gtColor }} />
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: selected ? gtColor : "text.primary" }}>{label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 11, color: "text.secondary", lineHeight: 1.4 }}>{desc}</Typography>
                  </Box>
                );
              })}
            </Box>

            <TextField fullWidth autoFocus label="Vision Title"
              placeholder="e.g. Sangeeta Visharada, Financial Independence"
              value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              sx={{ mb: 3 }} size="medium" />

            {/* Outcome-specific fields */}
            {form.type === "outcome" && (
              <Box sx={{ display: "flex", gap: 1.5, mb: 3 }}>
                <TextField fullWidth size="medium" type="number" label="Target Number"
                  placeholder="e.g. 70, 1000000, 52"
                  value={form.outcome_target} onChange={(e) => setForm(p => ({ ...p, outcome_target: e.target.value }))}
                  inputProps={{ min: 0 }} />
                <TextField size="medium" label="Unit" placeholder="kg, ₹, books"
                  value={form.outcome_unit} onChange={(e) => setForm(p => ({ ...p, outcome_unit: e.target.value }))}
                  sx={{ width: 120 }} />
              </Box>
            )}

            <TextField fullWidth size="medium" type="number" label="Horizon (Years)"
              value={form.timeline_years}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) setForm((p) => ({ ...p, timeline_years: val }));
              }}
              inputProps={{ min: 1, step: 1 }}
              helperText="Enter any number of years (minimum 1)"
              sx={{ mb: 3 }} />

            <TextField fullWidth multiline rows={3} label="The Deeper Why (Optional)"
              placeholder="What fundamentally shifts within you when this is achieved?"
              value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              sx={{ mb: 1 }} size="medium" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
            <Button
              onClick={() => setOpen(false)}
              color="inherit"
              sx={{ fontSize: 14, px: 2 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={save}
              disabled={saving || !form.title.trim()}
              sx={{
                background: color,
                "&:hover": { background: color, opacity: 0.9 },
                px: 4,
                py: 1,
                fontSize: 14,
                borderRadius: 2,
                boxShadow: "none",
              }}
            >
              Manifest Vision
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ── WEEKLY MICRO GOALS ─────────────────────────────────────────────────────────
export function WeeklyGoals({ area, color }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const weekStart = dayjs().startOf("week").format("YYYY-MM-DD");

  const showSnack = (msg, severity = "success") => setSnack({ open: true, msg, severity });

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("weekly_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("area", area)
      .eq("week_start", weekStart)
      .order("created_at");
    setGoals(data || []);
  }, [user, area, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!newGoal.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("weekly_goals").insert({
      user_id: user.id,
      area,
      week_start: weekStart,
      title: newGoal.trim(),
    });
    if (error) { showSnack("Failed to add goal", "error"); setLoading(false); return; }
    setNewGoal("");
    await load();
    setLoading(false);
  };

  const toggle = async (goal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, done: !g.done } : g)));
    const { error } = await supabase
      .from("weekly_goals")
      .update({ done: !goal.done })
      .eq("id", goal.id);
    if (error) { showSnack("Failed to update goal", "error"); await load(); return; }
    await load();
  };

  const remove = async (id) => {
    const { error } = await supabase.from("weekly_goals").delete().eq("id", id);
    if (error) { showSnack("Failed to delete goal", "error"); return; }
    setConfirmDeleteId(null);
    await load();
  };

  return (
    <Card sx={cardBaseStyles}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <SectionLabel icon={SelfImprovement} color={color}>
          This Week's Focus
        </SectionLabel>

        <Box sx={{ mt: 2 }}>
          {goals.length === 0 && (
            <Typography
              variant="body2"
              color="text.disabled"
              sx={{
                mb: 2,
                fontSize: 14,
                fontStyle: "italic",
                fontFamily: '"Lora", serif',
              }}
            >
              No immediate focus set for this week. Flow gracefully into action.
            </Typography>
          )}

          {goals.map((g) => (
            <Box
              key={g.id}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mb: 1,
                p: 1,
                borderRadius: 2,
                transition: "all 0.2s",
                "&:hover": { background: "rgba(0,0,0,0.02)" },
              }}
            >
              <IconButton
                size="small"
                onClick={() => toggle(g)}
                sx={{ p: 0.5, color: g.done ? color : "text.disabled" }}
              >
                {g.done ? (
                  <CheckCircle sx={{ fontSize: 20 }} />
                ) : (
                  <RadioButtonUnchecked sx={{ fontSize: 20 }} />
                )}
              </IconButton>
              <Typography
                variant="body1"
                sx={{
                  flex: 1,
                  textDecoration: g.done ? "line-through" : "none",
                  color: g.done ? "text.disabled" : "text.primary",
                  fontSize: 15,
                  transition: "all 0.3s ease",
                }}
              >
                {g.title}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setConfirmDeleteId(g.id)}
                sx={{
                  p: 0.5,
                  opacity: 0,
                  transition: "opacity 0.2s",
                  ".MuiBox-root:hover &": { opacity: 0.6 },
                  "&:hover": { opacity: "1 !important", color: "#CF4E4E" },
                }}
              >
                <Delete sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}

          <Box sx={{ display: "flex", gap: 1.5, mt: 3 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Add a focused intent for the week..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              sx={{
                "& input": { fontSize: 14, py: "10px", px: "14px" },
                bgcolor: "background.paper",
                borderRadius: 2,
              }}
            />
            <Button
              variant="contained"
              onClick={add}
              disabled={loading || !newGoal.trim()}
              sx={{
                px: 3,
                flexShrink: 0,
                background: color,
                "&:hover": { background: color, opacity: 0.9 },
                boxShadow: "none",
                borderRadius: 2,
              }}
            >
              <Add sx={{ fontSize: 22 }} />
            </Button>
          </Box>
        </Box>
      </CardContent>

      {/* Delete goal confirmation */}
      <Dialog open={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily: '"Fraunces", serif', fontWeight: 400, fontSize: 20 }}>
          Remove this Goal?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            This weekly focus will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmDeleteId(null)} color="inherit">Cancel</Button>
          <Button
            onClick={() => remove(confirmDeleteId)} variant="contained"
            sx={{ bgcolor: "#CF4E4E", "&:hover": { bgcolor: "#b03535" }, boxShadow: "none" }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Card>
  );
}

// ── AREA JOURNAL (AUTO-SAVING RICH TEXT FIELD) ─────────────────────────────────
export function AreaJournal({ area, color }) {
  const { user } = useAuth();
  const [content, setContent] = useState(_journalCache[area]?.content ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(_journalCache[area]?.updated_at ?? null);
  const [loading, setLoading] = useState(!(area in _journalCache));
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "error" });

  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (area in _journalCache) return; // cache warm
    const fetchJournal = async () => {
      const { data } = await supabase
        .from("area_journals")
        .select("content, updated_at")
        .eq("user_id", user.id)
        .eq("area", area)
        .maybeSingle();
      if (data) {
        _journalCache[area] = { content: data.content || "", updated_at: data.updated_at };
        setContent(data.content || "");
        setLastSaved(data.updated_at);
      } else {
        _journalCache[area] = { content: "", updated_at: null };
      }
      setLoading(false);
    };
    fetchJournal();
  }, [user, area]);

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsSaving(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(async () => {
      if (!user) return;
      const now = new Date().toISOString();

      const { error } = await supabase.from("area_journals").upsert(
        {
          user_id: user.id,
          area: area,
          content: newContent,
          updated_at: now,
        },
        { onConflict: "user_id,area" },
      );

      if (error) {
        setSnack({ open: true, msg: "Failed to save journal entry", severity: "error" });
      } else {
        _journalCache[area] = { content: newContent, updated_at: now }; // update cache
        setLastSaved(now);
      }
      setIsSaving(false);
    }, 1500);
  };

  return (
    <Card
      sx={{
        ...cardBaseStyles,
        background: `linear-gradient(to bottom right, background.paper, ${color}05)`,
      }}
    >
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
            borderBottom: "1px solid",
            borderColor: "divider",
            pb: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <MenuBook sx={{ color, fontSize: 22 }} />
            <Typography
              variant="caption"
              sx={{
                textTransform: "uppercase",
                letterSpacing: 2,
                fontSize: 11,
                fontWeight: 700,
                color,
                fontFamily: '"Inter", sans-serif',
              }}
            >
              Chronicles & Reflections
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {isSaving && <CircularProgress size={12} sx={{ color }} />}
            <Typography
              variant="caption"
              sx={{
                fontSize: 11,
                color: "text.disabled",
                fontStyle: "italic",
                fontFamily: '"Lora", serif',
              }}
            >
              {isSaving
                ? "Engraving..."
                : lastSaved
                  ? `Preserved ${dayjs(lastSaved).format("h:mm A")}`
                  : "Awaiting ink"}
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={24} sx={{ color }} />
          </Box>
        ) : (
          <Box sx={{ position: "relative" }}>
            {/* Subtle notebook lines effect via background */}
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                zIndex: 0,
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 31px, rgba(0,0,0,0.03) 31px, rgba(0,0,0,0.03) 32px)",
                backgroundSize: "100% 32px",
                mt: "4px", // align with text line height
              }}
            />
            <TextField
              fullWidth
              multiline
              minRows={6}
              placeholder="Document the ripples of your journey. What resistances did you face? What insights arose?..."
              variant="standard"
              value={content}
              onChange={handleContentChange}
              InputProps={{ disableUnderline: true }}
              sx={{
                position: "relative",
                zIndex: 1,
                "& textarea": {
                  fontFamily: '"Lora", serif',
                  fontSize: 16,
                  lineHeight: "32px", // matches the background lines
                  color: "text.primary",
                  "&::placeholder": {
                    color: "text.disabled",
                    fontStyle: "italic",
                    opacity: 0.7,
                  },
                },
              }}
            />
          </Box>
        )}
      </CardContent>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnack((p) => ({ ...p, open: false }))}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Card>
  );
}

// ── AREA LOG & INSIGHTS ────────────────────────────────────────────────────────
export function AreaLog({ area, color, logTypes }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: logTypes[0]?.id || "",
    value: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("logs")
      .select("*")
      .eq("user_id", user.id)
      .eq("area", area)
      .order("created_at", { ascending: false })
      .limit(15);
    setLogs(data || []);
  }, [user, area]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!form.type || !user) return;
    setSaving(true);
    await supabase
      .from("logs")
      .insert({
        user_id: user.id,
        area,
        type: form.type,
        value: form.value || null,
        note: form.note || null,
        date: dayjs().format("YYYY-MM-DD"),
      });
    setForm({ type: logTypes[0]?.id || "", value: "", note: "" });
    setSaved(true);
    await load();
    setSaving(false);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1500);
  };

  const currentType = logTypes.find((t) => t.id === form.type);

  // Custom Mini Sparkline Logic for numerical logs
  const numericalLogs = logs
    .filter((l) => l.value && !isNaN(Number(l.value)))
    .slice(0, 7)
    .reverse();
  const hasNumericalData = numericalLogs.length > 2;
  const maxVal = hasNumericalData
    ? Math.max(...numericalLogs.map((l) => Number(l.value)))
    : 1;

  return (
    <Card sx={cardBaseStyles}>
      <CardContent sx={{ p: { xs: 3, md: 4 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <SectionLabel icon={Insights} color={color}>
            Telemetry & Logs
          </SectionLabel>
          <Button
            size="small"
            startIcon={<Add />}
            onClick={() => setOpen((p) => !p)}
            sx={{
              fontSize: 12,
              fontWeight: 600,
              color,
              borderColor: `${color}40`,
              border: "1px solid",
              borderRadius: 2,
              py: 0.75,
              px: 2,
              transition: "all 0.2s",
              "&:hover": { background: `${color}10` },
            }}
          >
            {open ? "Close" : "Record Entry"}
          </Button>
        </Box>

        <Collapse in={open}>
          <Box
            sx={{
              mb: 4,
              p: 2.5,
              borderRadius: 3,
              background: `${color}06`,
              border: `1px solid ${color}20`,
              boxShadow: `inset 0 2px 10px rgba(0,0,0,0.02)`,
            }}
          >
            {saved && (
              <Alert
                severity="success"
                sx={{ mb: 2, fontSize: 13, borderRadius: 2 }}
              >
                Entry recorded successfully into the annals.
              </Alert>
            )}

            <FormControl fullWidth size="medium" sx={{ mb: 2.5 }}>
              <InputLabel>Nature of Entry</InputLabel>
              <Select
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
                label="Nature of Entry"
              >
                {logTypes.map((t) => (
                  <MenuItem key={t.id} value={t.id} sx={{ py: 1.5 }}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentType?.hasValue && (
              <TextField
                fullWidth
                label={currentType.valueLabel || "Magnitude / Value"}
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
                sx={{ mb: 2.5 }}
                size="medium"
                type="number"
                InputProps={{
                  endAdornment: currentType.unit ? (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 1, fontWeight: 600 }}
                    >
                      {currentType.unit}
                    </Typography>
                  ) : null,
                }}
              />
            )}

            <TextField
              fullWidth
              label="Annotations (optional)"
              placeholder="Context matters. What surrounded this entry?"
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              size="medium"
              multiline
              rows={2}
              sx={{ mb: 2.5 }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={save}
              disabled={saving}
              sx={{
                background: color,
                "&:hover": { background: color, opacity: 0.9 },
                fontSize: 14,
                py: 1.25,
                borderRadius: 2,
                boxShadow: "none",
              }}
            >
              Seal Entry
            </Button>
          </Box>
        </Collapse>

        {/* Mini Sparkline Visualization */}
        {hasNumericalData && !open && (
          <Box
            sx={{
              mb: 4,
              height: 60,
              display: "flex",
              alignItems: "flex-end",
              gap: "4px",
              p: 1.5,
              borderRadius: 2,
              background: "rgba(0,0,0,0.02)",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mr: 2,
                height: "100%",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: 9,
                  color: "text.disabled",
                  textTransform: "uppercase",
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
              >
                Trend
              </Typography>
            </Box>
            {numericalLogs.map((log, i) => {
              const heightPct = Math.max(
                10,
                (Number(log.value) / maxVal) * 100,
              );
              return (
                <Tooltip
                  key={i}
                  title={`${log.value} on ${dayjs(log.created_at).format("D MMM YYYY")}`}
                >
                  <Box
                    sx={{
                      flex: 1,
                      background: `linear-gradient(to top, ${color}90, ${color})`,
                      height: `${heightPct}%`,
                      borderRadius: "3px 3px 0 0",
                      opacity: 0.7,
                      transition: "opacity 0.2s",
                      "&:hover": { opacity: 1 },
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        )}

        {logs.length === 0 && !open && (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{
              fontSize: 14,
              fontStyle: "italic",
              fontFamily: '"Lora", serif',
            }}
          >
            The record is pristine. Awaiting your first mark.
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {logs.slice(0, 7).map((log) => (
            <Box
              key={log.id}
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2,
                p: 1.5,
                borderRadius: 2,
                "&:hover": { background: "rgba(0,0,0,0.02)" },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  mt: 0.75,
                  opacity: 0.5,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "text.primary",
                    fontFamily: '"Inter", sans-serif',
                  }}
                >
                  {logTypes.find((t) => t.id === log.type)?.label || log.type}
                  {log.value && (
                    <span style={{ fontWeight: 600, color }}>
                      {" "}
                      · {log.value}{" "}
                      {logTypes.find((t) => t.id === log.type)?.unit || ""}
                    </span>
                  )}
                </Typography>
                {log.note && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: 13,
                      mt: 0.5,
                      fontFamily: '"Lora", serif',
                      lineHeight: 1.5,
                    }}
                  >
                    {log.note}
                  </Typography>
                )}
              </Box>
              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ fontSize: 11, fontWeight: 500, flexShrink: 0, pt: 0.5 }}
              >
                {dayjs(log.created_at).format("D MMM YYYY")}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

export function InsightCard({ color, insight }) {
  if (!insight) return null;
  return (
    <Fade in timeout={1000}>
      <Box
        sx={{
          p: 3,
          borderRadius: 4,
          mb: 3,
          background: `linear-gradient(145deg, ${color}15 0%, transparent 100%)`,
          borderLeft: `4px solid ${color}`,
          borderTop: `1px solid ${color}20`,
          borderRight: `1px solid ${color}05`,
          borderBottom: `1px solid ${color}05`,
          boxShadow: `0 8px 24px -10px ${color}20`,
          position: "relative",
        }}
      >
        <AutoAwesome
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: `${color}30`,
            fontSize: 40,
          }}
        />
        <Typography
          variant="caption"
          sx={{
            textTransform: "uppercase",
            letterSpacing: 2,
            fontSize: 10,
            fontWeight: 800,
            color,
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 1.5,
          }}
        >
          <FlashOn sx={{ fontSize: 14 }} /> Crucial Insight
        </Typography>
        <Typography
          variant="body1"
          sx={{
            fontSize: 16,
            lineHeight: 1.7,
            fontFamily: '"Lora", serif',
            color: "text.primary",
            pr: 4,
          }}
        >
          {insight}
        </Typography>
      </Box>
    </Fade>
  );
}
