import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Chip,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  keyframes,
  alpha,
  LinearProgress,
  Stack,
  Divider,
} from "@mui/material";
import {
  Close,
  CalendarMonth,
  ViewWeek,
  ChevronLeft,
  ChevronRight,
  Insights,
  AutoGraph,
  LocalFireDepartment,
  WbSunny,
  NightsStay,
  Brightness4,
} from "@mui/icons-material";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useTheme";
import { supabase } from "../../lib/supabase";
import dayjs from "dayjs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
  Tooltip as RechTooltip,
  ResponsiveContainer,
} from "recharts";

// ── ANIMATIONS & STYLING ────────────────────────────────────────────────────
const fadeUp = keyframes`
  0% { opacity: 1; }
  100% { opacity: 1; }
`;

const pulseScale = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.04); }
  100% { transform: scale(1); }
`;

// Subtle geometry pattern for the "Digital Ashram" vibe
const ashramPattern = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

// ── DOMAIN LOGIC & CONSTANTS ────────────────────────────────────────────────

const ASHTA_SIDDHI_SCALE = [
  { value: 1, name: "Sthiti", emoji: "🌱", label: "Presence" },
  { value: 2, name: "Prayas", emoji: "🌿", label: "Effort" },
  { value: 3, name: "Nishtha", emoji: "🌳", label: "Steadiness" },
  { value: 4, name: "Bodha", emoji: "💡", label: "Awareness" },
  { value: 5, name: "Saadhana", emoji: "🔥", label: "Practice" },
  { value: 6, name: "Prajna", emoji: "⚡", label: "Insight" },
  { value: 7, name: "Samadhi", emoji: "🌟", label: "Absorption" },
  { value: 8, name: "Siddhi", emoji: "✨", label: "Mastery" },
];

const AREA_THEMES = {
  spirit: {
    label: "Anushthanam",
    color: "#C07830",
    colorDark: "#D4A830",
    emoji: "🪔",
  },
  music: {
    label: "Nādam",
    color: "#7C4DAB",
    colorDark: "#9B6CC4",
    emoji: "🎵",
  },
  health: {
    label: "Sharīram",
    color: "#2D7A4F",
    colorDark: "#5EC98A",
    emoji: "💪",
  },
  career: {
    label: "Vṛtti",
    color: "#1A5FB0",
    colorDark: "#6AAEE8",
    emoji: "🚀",
  },
  finance: {
    label: "Artha",
    color: "#1A7A6E",
    colorDark: "#4DC4B5",
    emoji: "💰",
  },
  reading: {
    label: "Vidyā",
    color: "#A0522D",
    colorDark: "#D4845A",
    emoji: "📖",
  },
};

const HABIT_LABELS = {
  anushthanam: "Anushthanam",
  saadhana: "Naada Saadhana",
  walk: "Vyaayamam",
  reading: "Pustaka Pathanam",
  office: "Office Work",
  academics: "Academics",
  logs: "Svaadhyaya Sync",
  gratitude: "Evening SET",
};

const SIDDHI_WEIGHTS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 12, 6: 18, 7: 25, 8: 35 };
const MAX_EXPECTED_MASS = 145; // increased to accommodate tracker activity bonuses (max ~25 pts)

// Vasara (weekday) names — index 0 = Sunday
const VARA_NAMES = [
  "Bhanu Vasara",
  "Indu / Soma Vasara",
  "Bhowma Vasara",
  "Budha / Soumya Vasara",
  "Guru Vasara",
  "Shukra / Brugu Vasara",
  "Sthira Vasara",
];

function calculateDailyMass(dayData) {
  if (!dayData?.habits) return 0;
  const habits = dayData.habits;
  const meta = dayData.habits_data || {};
  let totalMass = 0;

  // Core: per-habit mass weighted by satisfaction level
  Object.keys(habits).forEach((id) => {
    if (habits[id]) {
      const siddhiLevel = meta[id]?.satisfaction || 0;
      totalMass += 2 + (SIDDHI_WEIGHTS[siddhiLevel] || 0);
    }
  });

  // Phase 5: tracker activity bonus (from _activity enrichment in dayMap)
  const act = dayData._activity;
  if (act) {
    // Steps bonus — up to +8
    const steps = act.steps_count || 0;
    if      (steps >= 10000) totalMass += 8;
    else if (steps >=  7500) totalMass += 5;
    else if (steps >=  5000) totalMass += 2;

    // Sleep bonus — up to +7 (only if recorded; avoids penalising missing data)
    const sleep = act.sleep_hours || 0;
    if      (sleep >= 7.5) totalMass += 7;
    else if (sleep >= 7.0) totalMass += 4;
    else if (sleep >= 6.0) totalMass += 1;

    // Active calories bonus — up to +6
    const cal = act.calories_burned || 0;
    if      (cal >= 500) totalMass += 6;
    else if (cal >= 300) totalMass += 3;
    else if (cal >= 150) totalMass += 1;
  }

  return totalMass;
}

// FIXED: Handles current day pending state so streaks don't break at 8 AM.
// vacationDateSet: Set of "YYYY-MM-DD" strings from the vacations table date ranges.
function calcStreak(dayMap, habitId, vacationDateSet = new Set()) {
  let streak = 0;
  const todayStr = dayjs().format("YYYY-MM-DD");

  const isExempt = (dateStr) => {
    const day = dayMap[dateStr];
    const dm = day?.disruption_mode;
    // Weekends are always exempt
    const jsDay = dayjs(dateStr).day();
    const weekend = jsDay === 0 || jsDay === 6;
    return (
      weekend ||
      dm === "holiday" ||
      dm === "vacation" ||
      dm === "disrupted" ||
      vacationDateSet.has(dateStr)
    );
  };

  const todayDone = dayMap[todayStr]?.habits?.[habitId] || isExempt(todayStr);
  const startIndex = todayDone ? 0 : 1;

  for (let i = startIndex; i < 365; i++) {
    const date = dayjs().subtract(i, "day").format("YYYY-MM-DD");
    if (dayMap[date]?.habits?.[habitId] || isExempt(date)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// Utility: Greeting based on time
function getTimeGreeting() {
  const hour = dayjs().hour();
  if (hour >= 4 && hour < 7)
    return { text: "Brahma Muhurta", icon: <Brightness4 /> };
  if (hour >= 7 && hour < 12) return { text: "Suprabhatam", icon: <WbSunny /> };
  if (hour >= 12 && hour < 17)
    return { text: "Shubha Madhyahnam", icon: <WbSunny /> };
  if (hour >= 17 && hour < 20)
    return { text: "Evening Sandhya", icon: <NightsStay /> };
  return { text: "Shubha Ratri", icon: <NightsStay /> };
}

// ── COMPONENTS ───────────────────────────────────────────────────────────────

function DynamicStreakCard({ areaKey, streak, lakshyaTitle, isDark, delay }) {
  const theme = AREA_THEMES[areaKey] || {
    label: areaKey,
    color: "#5C5A52",
    colorDark: "#9C9A94",
    emoji: "✨",
  };
  const safeColor = isDark ? theme.colorDark || theme.color : theme.color;
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";

  return (
    <Card
      sx={{
        border: `1px solid ${isDark ? alpha(theme.color, 0.18) : alpha(theme.color, 0.22)}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "rgba(255,255,255,0.8)",
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
        height: "100%",
        animation: `${fadeUp} 0.5s ease both`,
        animationDelay: `${delay}s`,
        transition: "border-color 0.2s ease",
        "&:hover": { borderColor: theme.color },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -15,
          right: -15,
          fontSize: 80,
          opacity: isDark ? 0.03 : 0.05,
          transform: "rotate(15deg)",
          pointerEvents: "none",
        }}
      >
        {theme.emoji}
      </Box>
      <CardContent sx={{ p: 2, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.5 }}>
          <Typography sx={{ fontSize: 13 }}>{theme.emoji}</Typography>
          <Typography
            sx={{
              letterSpacing: 1.2,
              fontWeight: 700,
              color: safeColor,
              textTransform: "uppercase",
              fontSize: 9,
              flex: 1,
            }}
          >
            {theme.label}
          </Typography>
          {streak >= 3 && (
            <LocalFireDepartment
              sx={{
                fontSize: 12,
                color: "#E05A2B",
                animation: `${pulseScale} 3s infinite`,
              }}
            />
          )}
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "baseline",
            gap: 0.75,
            mb: lakshyaTitle ? 0.75 : 0,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontSize: 28,
              fontWeight: 600,
              color: textP,
              lineHeight: 1,
            }}
          >
            {streak}
          </Typography>
          <Typography
            sx={{
              fontSize: 10,
              color: textS,
              fontWeight: 600,
              letterSpacing: 0.8,
            }}
          >
            days
          </Typography>
        </Box>
        {lakshyaTitle && (
          <Typography
            sx={{
              fontSize: 9,
              color: safeColor,
              opacity: 0.8,
              fontWeight: 500,
              letterSpacing: 0.2,
              lineHeight: 1.3,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            → {lakshyaTitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// Emoji + full label for every known habit key
const HABIT_META = {
  anushthanam: { emoji: "🪔", label: "Anushthanam" },
  saadhana: { emoji: "🎵", label: "Naada Saadhana" },
  riyaz: { emoji: "🎵", label: "Naada Saadhana" },
  walk: { emoji: "🏃", label: "Vyaayamam" },
  reading: { emoji: "📖", label: "Pustaka Pathanam" },
  eat_healthy: { emoji: "🥗", label: "Eat Healthy" },
  sleep_healthy: { emoji: "🌙", label: "Sleep Healthy" },
  office: { emoji: "🚀", label: "Vṛtti" },
  vidya: { emoji: "📚", label: "Vidyā" },
  academics: { emoji: "📚", label: "Academics" },
  saayam_sandhya: { emoji: "🪔", label: "Sāyam Sandhyā" },
  dinner_before_8: { emoji: "🍽️", label: "Dinner before 8" },
  next_day_prep: { emoji: "📋", label: "Preparing for Next Day" },
  tomorrow_prep: { emoji: "📋", label: "Preparing for Next Day" },
  update_trackers: { emoji: "📊", label: "Update Trackers" },
  logs: { emoji: "📊", label: "Svaadhyaya Sync" },
  gratitude: { emoji: "🌸", label: "Evening Gratitude" },
};

const DISRUPTION_META = {
  holiday: { label: "Grace Mode", emoji: "🌊", color: "#C07830" },
  vacation: { label: "Vacation", emoji: "🏖️", color: "#7C4DAB" },
  disrupted: { label: "Disrupted", emoji: "⚠️", color: "#CF4E4E" },
  working: { label: "Full Day", emoji: "⚡", color: "#5C5A52" },
  "working day": { label: "Full Day", emoji: "⚡", color: "#5C5A52" },
};

function DayDialog({ date, dayData, isVacation, onClose, heroColor, isDark }) {
  if (!date) return null;

  const habits = dayData?.habits || {};
  const habitsData = dayData?.habits_data || {};
  const done = Object.entries(habits)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const total = Object.keys(habits).length;
  const mass = calculateDailyMass(dayData);
  const massPct = Math.min(100, Math.round((mass / MAX_EXPECTED_MASS) * 100));
  const disruption = dayData?.disruption_mode || "working";
  const isClosed = !!dayData?.last_close;
  const oneThing = dayData?.one_thing || "";
  const wins = (dayData?.wins || []).filter(Boolean);

  const deepWorkHrs = done
    .map((k) => habitsData[k]?.hours || 0)
    .reduce((a, b) => a + b, 0);

  const avgSatisf =
    done.length > 0
      ? Math.round(
          done.reduce((s, k) => s + (habitsData[k]?.satisfaction || 4), 0) /
            done.length,
        )
      : null;
  const currentSiddhi = ASHTA_SIDDHI_SCALE.find((s) => s.value === avgSatisf);
  const disruptMeta = DISRUPTION_META[disruption] || DISRUPTION_META.working;

  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const divCol = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  return (
    <Dialog
      open={!!date}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: `1px solid ${alpha(heroColor, 0.2)}`,
          background: isDark ? "#0F0E0C" : "#FDFCF9",
          backgroundImage: ashramPattern,
          boxShadow: `0 28px 72px ${alpha(heroColor, isDark ? 0.25 : 0.12)}`,
        },
      }}
    >
      {/* ── HEADER ── */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          borderBottom: `1px solid ${divCol}`,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"Fraunces",serif',
              fontSize: 24,
              fontWeight: 700,
              color: textP,
              lineHeight: 1.1,
              mb: 0.25,
            }}
          >
            {VARA_NAMES[dayjs(date).day()]}
          </Typography>
          <Typography
            sx={{ fontSize: 12.5, color: textS, fontWeight: 500, mb: 1.25 }}
          >
            {dayjs(date).format("dddd, D MMMM YYYY")}
          </Typography>
          <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
            {isVacation && (
              <Chip
                label="🏖 Vacation · Streaks protected"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  background: "rgba(44,123,182,0.12)",
                  color: "#2C7BB6",
                  border: "1px solid rgba(44,123,182,0.30)",
                }}
              />
            )}
            {isClosed && (
              <Chip
                label="Day Closed"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.4,
                  background: alpha(heroColor, 0.12),
                  color: heroColor,
                  border: `1px solid ${alpha(heroColor, 0.3)}`,
                }}
              />
            )}
            {disruption !== "working" && disruption !== "working day" && (
              <Chip
                label={`${disruptMeta.emoji} ${disruptMeta.label}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  background: alpha(disruptMeta.color, 0.1),
                  color: disruptMeta.color,
                  border: `1px solid ${alpha(disruptMeta.color, 0.25)}`,
                }}
              />
            )}
            {done.length === 0 && (
              <Chip
                label="No practice"
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  color: textS,
                  background: cardBg,
                  border: `1px solid ${divCol}`,
                }}
              />
            )}
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: textS,
            bgcolor: alpha(textS, 0.08),
            mt: 0.5,
            "&:hover": { bgcolor: alpha(textS, 0.15) },
          }}
        >
          <Close sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3, pt: 2.5 }}>
        {/* ── RESONANCE MASS HERO ── */}
        <Box
          sx={{
            mb: 2.5,
            p: "20px 24px",
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(heroColor, isDark ? 0.14 : 0.08)} 0%, transparent 100%)`,
            border: `1px solid ${alpha(heroColor, 0.18)}`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{ display: "flex", alignItems: "baseline", gap: 1.5, mb: 1 }}
          >
            <Typography
              sx={{
                fontFamily: '"Fraunces",serif',
                fontSize: 52,
                fontWeight: 700,
                color: textP,
                lineHeight: 1,
              }}
            >
              {mass}
            </Typography>
            <Box>
              <Typography
                sx={{
                  fontSize: 11,
                  color: heroColor,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Resonance Mass
              </Typography>
              <Typography sx={{ fontSize: 12, color: textS }}>
                out of {MAX_EXPECTED_MASS}
              </Typography>
            </Box>
          </Box>

          {/* Progress bar */}
          <Box
            sx={{
              height: 5,
              borderRadius: 3,
              background: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
              overflow: "hidden",
              mb: 1,
            }}
          >
            <Box
              sx={{
                height: "100%",
                width: `${massPct}%`,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${heroColor}, ${alpha(heroColor, 0.6)})`,
                transition: "width 0.6s ease",
              }}
            />
          </Box>

          {/* Siddhi rank */}
          {currentSiddhi && (
            <Typography sx={{ fontSize: 12, color: textS }}>
              {currentSiddhi.emoji}{" "}
              <span style={{ color: textP, fontWeight: 600 }}>
                {currentSiddhi.name}
              </span>
              {" · "}
              {currentSiddhi.label}
              {" · "}
              {massPct}% of peak
            </Typography>
          )}
          {done.length === 0 && (
            <Typography
              sx={{ fontSize: 12, color: textS, fontStyle: "italic" }}
            >
              No practices recorded for this day
            </Typography>
          )}
        </Box>

        {/* ── STATS ROW ── */}
        {done.length > 0 && (
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            {[
              {
                icon: "✅",
                label: "Habits Done",
                value:
                  total > 0 ? `${done.length} / ${total}` : `${done.length}`,
              },
              {
                icon: "⏱️",
                label: "Deep Work",
                value: deepWorkHrs > 0 ? `${deepWorkHrs.toFixed(1)}h` : "—",
              },
              {
                icon: currentSiddhi?.emoji || "💡",
                label: "Avg Quality",
                value: currentSiddhi
                  ? `${currentSiddhi.name} (${avgSatisf})`
                  : "—",
              },
            ].map(({ icon, label, value }) => (
              <Grid item xs={4} key={label}>
                <Box
                  sx={{
                    p: "10px 12px",
                    borderRadius: 2,
                    border: `1px solid ${divCol}`,
                    background: cardBg,
                    textAlign: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 16, lineHeight: 1, mb: 0.5 }}>
                    {icon}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 9,
                      color: textS,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      fontWeight: 700,
                      mb: 0.25,
                    }}
                  >
                    {label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: textP,
                      lineHeight: 1.2,
                    }}
                  >
                    {value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ── ONE INTENTION ── */}
        {oneThing && (
          <Box
            sx={{
              mb: 2.5,
              p: "14px 18px",
              borderRadius: 2.5,
              border: `1px solid ${divCol}`,
              background: cardBg,
              borderLeft: `3px solid ${heroColor}`,
            }}
          >
            <Typography
              sx={{
                fontSize: 9,
                color: heroColor,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                mb: 0.75,
              }}
            >
              One Intention
            </Typography>
            <Typography
              sx={{
                fontSize: 14,
                color: textP,
                fontFamily: '"Lora","Fraunces",serif',
                fontStyle: "italic",
                lineHeight: 1.6,
              }}
            >
              "{oneThing}"
            </Typography>
          </Box>
        )}

        {/* ── WINS ── */}
        {wins.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontSize: 9,
                color: textS,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                mb: 1,
              }}
            >
              Three Wins
            </Typography>
            {wins.map((w, i) => (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  gap: 1.25,
                  alignItems: "flex-start",
                  mb: 0.75,
                  p: "8px 12px",
                  borderRadius: 1.5,
                  background: cardBg,
                  border: `1px solid ${divCol}`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    color: heroColor,
                    fontWeight: 800,
                    mt: 0.1,
                    flexShrink: 0,
                  }}
                >
                  {i + 1}.
                </Typography>
                <Typography
                  sx={{ fontSize: 13, color: textP, lineHeight: 1.5 }}
                >
                  {w}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* ── PRACTICES ── */}
        <Typography
          sx={{
            fontSize: 9,
            color: textS,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            mb: 1,
          }}
        >
          Practices {done.length > 0 ? `(${done.length})` : ""}
        </Typography>

        {done.length === 0 ? (
          <Box
            sx={{
              py: 3,
              textAlign: "center",
              border: `1px dashed ${divCol}`,
              borderRadius: 2,
            }}
          >
            <Typography sx={{ fontSize: 28, mb: 0.5 }}>🌑</Typography>
            <Typography
              sx={{ fontSize: 13, color: textS, fontStyle: "italic" }}
            >
              No practices were recorded this day.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              border: `1px solid ${divCol}`,
              borderRadius: 2.5,
              overflow: "hidden",
            }}
          >
            {done.map((k, idx) => {
              const meta = HABIT_META[k];
              const sat = habitsData[k]?.satisfaction;
              const hrs = habitsData[k]?.hours;
              const siddhiEntry = ASHTA_SIDDHI_SCALE.find(
                (s) => s.value === sat,
              );
              return (
                <Box
                  key={k}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    px: 2,
                    py: 1.25,
                    borderBottom:
                      idx < done.length - 1 ? `1px solid ${divCol}` : "none",
                    background:
                      idx % 2 === 0 ? "transparent" : alpha(textS, 0.02),
                  }}
                >
                  {/* Emoji */}
                  <Typography
                    sx={{
                      fontSize: 16,
                      flexShrink: 0,
                      width: 24,
                      textAlign: "center",
                    }}
                  >
                    {meta?.emoji || "✦"}
                  </Typography>

                  {/* Label */}
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: textP,
                      fontWeight: 500,
                      flex: 1,
                    }}
                  >
                    {meta?.label || HABIT_LABELS[k] || k}
                  </Typography>

                  {/* Hours badge */}
                  {hrs > 0 && (
                    <Typography
                      sx={{
                        fontSize: 11,
                        color: textS,
                        fontWeight: 600,
                        background: cardBg,
                        border: `1px solid ${divCol}`,
                        borderRadius: 1,
                        px: 0.75,
                        py: 0.25,
                        flexShrink: 0,
                      }}
                    >
                      {hrs}h
                    </Typography>
                  )}

                  {/* Satisfaction chip */}
                  {siddhiEntry && (
                    <Chip
                      label={`${siddhiEntry.emoji} ${siddhiEntry.name}`}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: 10,
                        fontWeight: 600,
                        background: alpha(heroColor, 0.1),
                        color: textP,
                        border: `1px solid ${alpha(heroColor, 0.2)}`,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── SVG AREA CHART COMPONENT ────────────────────────────────────────────────
function WeeklyMassChart({ weekDays, dayMap, heroColor }) {
  const maxVal = Math.max(
    ...weekDays.map((d) => calculateDailyMass(dayMap[d])),
    50,
  ); // Min scale of 50

  // Calculate coordinates
  const points = weekDays.map((dateStr, i) => {
    const mass = calculateDailyMass(dayMap[dateStr]);
    const x = (i / 6) * 100;
    const y = 100 - (mass / maxVal) * 90; // Leave 10% padding at top
    return `${x},${y}`;
  });

  // Smooth curve approximation (Catmull-Rom to SVG path concept simplified for React)
  const pathD =
    `M 0,100 L ${points[0]} ` +
    points
      .slice(1)
      .map((p) => `L ${p}`)
      .join(" ") +
    ` L 100,100 Z`;
  const lineD = `M ${points.join(" L ")}`;

  return (
    <Box sx={{ width: "100%", height: 100, position: "relative", mb: 3 }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={heroColor} stopOpacity={0.4} />
            <stop offset="100%" stopColor={heroColor} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <path d={pathD} fill="url(#chartFill)" />
        <path
          d={lineD}
          fill="none"
          stroke={heroColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data Points */}
        {weekDays.map((dateStr, i) => {
          const mass = calculateDailyMass(dayMap[dateStr]);
          const x = (i / 6) * 100;
          const y = 100 - (mass / maxVal) * 90;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="#FFF"
              stroke={heroColor}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    </Box>
  );
}

// ── HERO STAT CARD ──────────────────────────────────────────────────────────
function HeroStatCard({ emoji, label, value, sub, color, isDark, delay = 0 }) {
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  return (
    <Card
      sx={{
        border: `1px solid ${alpha(color, 0.22)}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "rgba(255,255,255,0.85)",
        boxShadow: "none",
        position: "relative",
        overflow: "hidden",
        animation: `${fadeUp} 0.4s ease ${delay}s both`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -8,
          right: -6,
          fontSize: 54,
          opacity: isDark ? 0.04 : 0.06,
          pointerEvents: "none",
        }}
      >
        {emoji}
      </Box>
      <CardContent
        sx={{ p: "14px 16px !important", position: "relative", zIndex: 1 }}
      >
        <Typography
          sx={{
            fontSize: 8.5,
            fontWeight: 800,
            letterSpacing: 1.4,
            textTransform: "uppercase",
            color,
            mb: 0.75,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Fraunces",serif',
            fontSize: 28,
            fontWeight: 700,
            color: textP,
            lineHeight: 1,
            mb: 0.3,
          }}
        >
          {value}
        </Typography>
        {sub && (
          <Typography
            sx={{
              fontSize: 10,
              color: textS,
              lineHeight: 1.35,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── READING RHYTHM CARD ─────────────────────────────────────────────────────
function ReadingCard({ books, readingSessions, isDark, days = 30 }) {
  const rc = isDark ? "#D4845A" : "#8B3A2F";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const today = dayjs();

  const readingBooks = books.filter((b) => b.status === "reading");
  const booksRead = books.filter((b) => b.status === "completed").length;

  const chartData = Array.from({ length: days }, (_, i) => {
    const d = today.subtract(days - 1 - i, "day").format("YYYY-MM-DD");
    const pages = readingSessions
      .filter((s) => s.session_date === d)
      .reduce((s, r) => s + (r.pages_read || 0), 0);
    return { day: today.subtract(29 - i, "day").format("D"), pages };
  });

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(rc, 0.25)}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "#fff",
        boxShadow: "none",
        height: "100%",
        animation: `${fadeUp} 0.5s ease 0.2s both`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: 14 }}>📖</Typography>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: rc,
            }}
          >
            Reading Rhythm
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 10, color: textS }}>
            {booksRead} completed
          </Typography>
        </Box>
        {readingBooks.length === 0 ? (
          <Typography
            sx={{ fontSize: 12, color: textS, mb: 2, fontStyle: "italic" }}
          >
            No book in progress
          </Typography>
        ) : (
          <Box
            sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 2 }}
          >
            {readingBooks.map((book) => {
              const pct =
                book.total_pages > 0
                  ? Math.round((book.pages_read / book.total_pages) * 100)
                  : 0;
              const recentBook = readingSessions.filter(
                (s) =>
                  s.book_id === book.id &&
                  dayjs(s.session_date).isAfter(today.subtract(7, "day")),
              );
              const vel =
                recentBook.length > 0
                  ? Math.round(
                      recentBook.reduce((s, r) => s + (r.pages_read || 0), 0) /
                        7,
                    )
                  : 0;
              const rem = Math.max(
                0,
                (book.total_pages || 0) - (book.pages_read || 0),
              );
              const eta = vel > 0 ? Math.ceil(rem / vel) : null;
              return (
                <Box
                  key={book.id}
                  sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      display: "inline-flex",
                      flexShrink: 0,
                    }}
                  >
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={48}
                      thickness={4}
                      sx={{ color: alpha(rc, 0.12) }}
                    />
                    <CircularProgress
                      variant="determinate"
                      value={pct}
                      size={48}
                      thickness={4}
                      sx={{
                        color: rc,
                        position: "absolute",
                        left: 0,
                        strokeLinecap: "round",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 9.5, fontWeight: 800, color: rc }}
                      >
                        {pct}%
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: textP,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {book.title}
                    </Typography>
                    <Typography sx={{ fontSize: 10, color: textS, mt: 0.15 }}>
                      {book.pages_read} / {book.total_pages || "?"} pages
                    </Typography>
                    {eta != null && (
                      <Typography sx={{ fontSize: 10, color: rc, mt: 0.1 }}>
                        ~{eta}d · {vel} pg/day
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
        <Typography
          sx={{
            fontSize: 9,
            color: textS,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            mb: 0.75,
          }}
        >
          Pages · Last 30 days
        </Typography>
        <ResponsiveContainer width="100%" height={75}>
          <AreaChart
            data={chartData}
            margin={{ top: 2, right: 0, left: -32, bottom: 0 }}
          >
            <defs>
              <linearGradient id="readGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={rc} stopOpacity={0.5} />
                <stop offset="100%" stopColor={rc} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tick={{ fontSize: 7.5, fill: textS }}
              interval={5}
            />
            <YAxis tick={{ fontSize: 7.5, fill: textS }} />
            <RechTooltip
              contentStyle={{
                fontSize: 11,
                background: isDark ? "#1A1916" : "#fff",
                border: `1px solid ${alpha(rc, 0.3)}`,
                borderRadius: 8,
              }}
            />
            <Area
              type="monotone"
              dataKey="pages"
              stroke={rc}
              fill="url(#readGrad)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── JAPA MAHASANKALPAM CARD ─────────────────────────────────────────────────
function JapaCard({ japaLogs, japaGoals, isDark, days = 14 }) {
  const jc = isDark ? "#D4A830" : "#C07830";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const today = dayjs().format("YYYY-MM-DD");
  const [activeGoal, setActiveGoal] = useState(null);

  useEffect(() => {
    if (japaGoals.length > 0 && !activeGoal) setActiveGoal(japaGoals[0]);
  }, [japaGoals]);

  const totalLogged = activeGoal
    ? japaLogs
        .filter((l) => l.japa_name === activeGoal.japa_name)
        .reduce((s, l) => s + l.count, 0)
    : 0;
  const pct = activeGoal
    ? Math.min((totalLogged / activeGoal.target_count) * 100, 100)
    : 0;
  const todayCount = activeGoal
    ? japaLogs
        .filter(
          (l) => l.japa_name === activeGoal.japa_name && l.day_date === today,
        )
        .reduce((s, l) => s + l.count, 0)
    : 0;

  const daysLogged = activeGoal
    ? japaLogs.filter((l) => l.japa_name === activeGoal.japa_name).length
    : 1;
  const remaining = activeGoal
    ? Math.max(0, activeGoal.target_count - totalLogged)
    : 0;
  const deadlineDays = activeGoal?.deadline_years
    ? activeGoal.deadline_years * 365 - daysLogged
    : null;
  const dailyPace =
    deadlineDays > 0 ? Math.round(remaining / deadlineDays) : null;
  const dailyTarget = activeGoal?.deadline_years > 0
    ? Math.max(1, Math.round(activeGoal.target_count / (activeGoal.deadline_years * 365)))
    : 0;
  const todayTargetPct = dailyTarget > 0 ? Math.min(100, Math.round((todayCount / dailyTarget) * 100)) : 0;

  const chartData = Array.from({ length: days }, (_, i) => {
    const d = dayjs()
      .subtract(days - 1 - i, "day")
      .format("YYYY-MM-DD");
    const count = activeGoal
      ? japaLogs
          .filter(
            (l) => l.japa_name === activeGoal.japa_name && l.day_date === d,
          )
          .reduce((s, l) => s + l.count, 0)
      : 0;
    return { day: dayjs(d).format("D"), count };
  });

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(jc, 0.25)}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "#fff",
        boxShadow: "none",
        height: "100%",
        animation: `${fadeUp} 0.5s ease 0.25s both`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: 14 }}>🕉️</Typography>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: jc,
            }}
          >
            Japa Mahasankalpam
          </Typography>
        </Box>
        {japaGoals.length === 0 ? (
          <Typography
            sx={{ fontSize: 12, color: textS, fontStyle: "italic", mb: 2 }}
          >
            No active Mahasankalpam
          </Typography>
        ) : (
          <>
            {activeGoal && (
              <Typography sx={{ fontSize: 11, fontWeight: 600, color: jc, mb: 1.5, letterSpacing: 0.3 }}>
                📿 {activeGoal.japa_name}
              </Typography>
            )}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Box
                sx={{
                  position: "relative",
                  display: "inline-flex",
                  flexShrink: 0,
                }}
              >
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={56}
                  thickness={4}
                  sx={{ color: alpha(jc, 0.12) }}
                />
                <CircularProgress
                  variant="determinate"
                  value={pct}
                  size={56}
                  thickness={4}
                  sx={{
                    color: jc,
                    position: "absolute",
                    left: 0,
                    strokeLinecap: "round",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography sx={{ fontSize: 10, fontWeight: 800, color: jc }}>
                    {Math.round(pct)}%
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontSize: 10, color: textS }}>
                  Total logged
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Fraunces",serif',
                    fontSize: 22,
                    fontWeight: 700,
                    color: textP,
                    lineHeight: 1.1,
                  }}
                >
                  {totalLogged.toLocaleString()}
                </Typography>
                <Typography sx={{ fontSize: 10, color: textS }}>
                  of {(activeGoal?.target_count || 0).toLocaleString()}
                </Typography>
                {dailyTarget > 0 && (
                  <Typography sx={{ fontSize: 10, color: todayTargetPct >= 100 ? jc : textS, fontWeight: 600, mt: 0.25 }}>
                    Today: {todayTargetPct >= 100 ? "✓ target met" : `${todayCount.toLocaleString()} / ${dailyTarget.toLocaleString()}`}
                  </Typography>
                )}
              </Box>
            </Box>
            {dailyTarget > 0 && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography sx={{ fontSize: 9, color: textS, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>Today's target</Typography>
                  <Typography sx={{ fontSize: 9, color: todayTargetPct >= 100 ? jc : textS, fontWeight: 700 }}>{todayTargetPct}%</Typography>
                </Box>
                <Box sx={{ height: 5, borderRadius: 3, background: alpha(jc, 0.12), overflow: "hidden" }}>
                  <Box sx={{ height: "100%", width: `${todayTargetPct}%`, borderRadius: 3, background: `linear-gradient(90deg, ${jc}, ${alpha(jc, 0.7)})`, transition: "width 0.5s ease" }} />
                </Box>
              </Box>
            )}
          </>
        )}
        <Typography
          sx={{
            fontSize: 9,
            color: textS,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            mb: 0.75,
          }}
        >
          Daily count · Last 14 days
        </Typography>
        <ResponsiveContainer width="100%" height={75}>
          <ComposedChart
            data={chartData}
            margin={{ top: 2, right: 0, left: -32, bottom: 0 }}
          >
            <XAxis dataKey="day" tick={{ fontSize: 7.5, fill: textS }} />
            <YAxis tick={{ fontSize: 7.5, fill: textS }} />
            <RechTooltip
              contentStyle={{
                fontSize: 11,
                background: isDark ? "#1A1916" : "#fff",
                border: `1px solid ${alpha(jc, 0.3)}`,
                borderRadius: 8,
              }}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={alpha(jc, 0.65)} />
              ))}
            </Bar>
            {dailyPace != null && (
              <ReferenceLine
                y={dailyPace}
                stroke={jc}
                strokeDasharray="4 3"
                strokeWidth={1.5}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        {dailyPace != null && (
          <Typography sx={{ fontSize: 9.5, color: textS, mt: 0.75 }}>
            ── pace needed: {dailyPace.toLocaleString()} / day
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// ── FINANCE PULSE CARD ──────────────────────────────────────────────────────
function FinanceCard({ financeLogs, financeBudgets, isDark, days = 30 }) {
  const fc = isDark ? "#4DC4B5" : "#1A7A6E";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const thisMonth = dayjs().format("YYYY-MM");

  const monthlyData = Array.from(
    { length: Math.max(1, Math.round(days / 30)) },
    (_, i) => {
      const m = dayjs().subtract(
        Math.max(1, Math.round(days / 30)) - 1 - i,
        "month",
      );
      const key = m.format("YYYY-MM");
      const entries = financeLogs.filter((l) => (l.date || "").startsWith(key));
      const income = entries
        .filter((l) => l.income_flag)
        .reduce((s, l) => s + l.amount, 0);
      const expense = entries
        .filter((l) => !l.income_flag)
        .reduce((s, l) => s + l.amount, 0);
      return {
        month: m.format("MMM"),
        income,
        expense,
        savings: Math.max(0, income - expense),
      };
    },
  );

  const thisMonthLogs = financeLogs.filter(
    (l) => (l.date || "").startsWith(thisMonth) && !l.income_flag,
  );
  const spendByCat = thisMonthLogs.reduce((acc, l) => {
    acc[l.category] = (acc[l.category] || 0) + l.amount;
    return acc;
  }, {});
  const budgetRows = financeBudgets
    .map((b) => ({
      category: b.category,
      limit: b.limit_amt,
      spent: spendByCat[b.category] || 0,
      pct: Math.min(
        100,
        Math.round(((spendByCat[b.category] || 0) / b.limit_amt) * 100),
      ),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(fc, 0.25)}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "#fff",
        boxShadow: "none",
        height: "100%",
        animation: `${fadeUp} 0.5s ease 0.3s both`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Typography sx={{ fontSize: 14 }}>💰</Typography>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: fc,
            }}
          >
            Finance Pulse
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 10, color: textS }}>
            {dayjs().format("MMM YYYY")}
          </Typography>
        </Box>
        {budgetRows.length > 0 ? (
          <Box sx={{ mb: 2 }}>
            {budgetRows.map((row) => (
              <Box key={row.category} sx={{ mb: 1.25 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.4,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10.5,
                      color: textP,
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {row.category}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: row.pct >= 90 ? "#E05A2B" : textS,
                    }}
                  >
                    ₹{row.spent.toLocaleString()} / ₹
                    {row.limit.toLocaleString()}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 5,
                    borderRadius: 3,
                    background: alpha(fc, 0.12),
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      height: "100%",
                      borderRadius: 3,
                      width: `${row.pct}%`,
                      background:
                        row.pct >= 90
                          ? "#E05A2B"
                          : row.pct >= 75
                            ? "#E0A02B"
                            : fc,
                      transition: "width 0.6s ease",
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            sx={{ fontSize: 11, color: textS, fontStyle: "italic", mb: 2 }}
          >
            No budgets set for this month
          </Typography>
        )}
        <Typography
          sx={{
            fontSize: 9,
            color: textS,
            fontWeight: 700,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            mb: 0.75,
          }}
        >
          Income vs Expense · 3 months
        </Typography>
        <ResponsiveContainer width="100%" height={75}>
          <ComposedChart
            data={monthlyData}
            margin={{ top: 2, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis dataKey="month" tick={{ fontSize: 7.5, fill: textS }} />
            <YAxis tick={{ fontSize: 7.5, fill: textS }} />
            <RechTooltip
              contentStyle={{
                fontSize: 11,
                background: isDark ? "#1A1916" : "#fff",
                border: `1px solid ${alpha(fc, 0.3)}`,
                borderRadius: 8,
              }}
            />
            <Bar
              dataKey="expense"
              fill={alpha("#E05A2B", 0.55)}
              radius={[3, 3, 0, 0]}
              name="Expense"
            />
            <Bar
              dataKey="income"
              fill={alpha(fc, 0.65)}
              radius={[3, 3, 0, 0]}
              name="Income"
            />
            <Line
              type="monotone"
              dataKey="savings"
              stroke={fc}
              strokeWidth={2}
              dot={{ fill: fc, r: 3 }}
              name="Savings"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── MOVEMENT CARD ────────────────────────────────────────────────────────────
function estimateCalories(steps, weightKg) {
  if (!steps || !weightKg) return null;
  return Math.round(steps * weightKg * 0.000571);
}

function SleepStars({ quality, color }) {
  return (
    <Box sx={{ display: "flex", gap: 0.25 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Box
          key={n}
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: n <= quality ? color : alpha(color, 0.2),
          }}
        />
      ))}
    </Box>
  );
}

function MovementCard({ activityLogs, latestWeightKg, isDark, days = 14 }) {
  const mc = isDark ? "#5EC98A" : "#2D7A4F";
  const sc = isDark ? "#9B6CC4" : "#7C4DAB";
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const todayStr = dayjs().format("YYYY-MM-DD");
  const todayEntry = activityLogs.find((a) => a.date === todayStr);
  const yEntry = activityLogs.find(
    (a) => a.date === dayjs().subtract(1, "day").format("YYYY-MM-DD"),
  );

  const todaySteps = todayEntry?.steps || 0;
  const todayKm = todayEntry?.km_walked || 0;
  // Sleep is logged in morning flow for *last night* (yesterday) — read from yEntry
  const todaySleep = yEntry?.sleep_hours ?? null;
  const todaySleepQ = yEntry?.sleep_quality ?? null;
  const manualCals = todayEntry?.calories_burned ?? null;
  const estCals = estimateCalories(todaySteps, latestWeightKg);
  const displayCals = manualCals ?? estCals;
  const calsIsEst = manualCals == null && estCals != null;

  const stepTrend =
    todaySteps > 0 ? (todaySteps >= (yEntry?.steps || 0) ? "↑" : "↓") : null;

  const chartData = Array.from({ length: days }, (_, i) => {
    const d = dayjs()
      .subtract(days - 1 - i, "day")
      .format("YYYY-MM-DD");
    const e = activityLogs.find((a) => a.date === d);
    return {
      day: dayjs(d).format("D"),
      steps: e?.steps || 0,
      calories:
        e?.calories_burned ?? estimateCalories(e?.steps, latestWeightKg) ?? 0,
      isToday: d === todayStr,
    };
  });
  const activeDays = chartData.filter((d) => d.steps > 0);
  const avgSteps =
    activeDays.length > 0
      ? Math.round(
          activeDays.reduce((s, d) => s + d.steps, 0) / activeDays.length,
        )
      : 0;
  const avgSleep =
    activityLogs.filter((a) => a.sleep_hours > 0).length > 0
      ? (
          activityLogs
            .filter((a) => a.sleep_hours > 0)
            .reduce((s, a) => s + a.sleep_hours, 0) /
          activityLogs.filter((a) => a.sleep_hours > 0).length
        ).toFixed(1)
      : null;

  return (
    <Card
      sx={{
        border: `1px solid ${alpha(mc, 0.25)}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "#fff",
        boxShadow: "none",
        animation: `${fadeUp} 0.5s ease 0.35s both`,
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <Typography sx={{ fontSize: 14 }}>🏃</Typography>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: mc,
            }}
          >
            Movement & Recovery
          </Typography>
          <Box sx={{ flex: 1 }} />
          {avgSteps > 0 && (
            <Typography sx={{ fontSize: 10, color: textS }}>
              avg {avgSteps.toLocaleString()} steps/day
            </Typography>
          )}
          {avgSleep && (
            <Typography sx={{ fontSize: 10, color: textS, ml: 1.5 }}>
              avg {avgSleep}h sleep
            </Typography>
          )}
        </Box>

        <Grid container spacing={3} alignItems="flex-start">
          {/* Today's big stats */}
          <Grid item xs={12} sm={5}>
            <Grid container spacing={1.5}>
              {/* Steps */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(mc, 0.2)}`,
                    background: alpha(mc, 0.04),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 8.5,
                      color: textS,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    Steps
                  </Typography>
                  <Box
                    sx={{ display: "flex", alignItems: "baseline", gap: 0.4 }}
                  >
                    <Typography
                      sx={{
                        fontFamily: '"Fraunces",serif',
                        fontSize: 26,
                        fontWeight: 700,
                        color: todaySteps > 0 ? mc : textS,
                        lineHeight: 1,
                      }}
                    >
                      {todaySteps > 0 ? todaySteps.toLocaleString() : "—"}
                    </Typography>
                    {stepTrend && (
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: stepTrend === "↑" ? mc : "#E05A2B",
                          fontWeight: 700,
                        }}
                      >
                        {stepTrend}
                      </Typography>
                    )}
                  </Box>
                  {todayKm > 0 && (
                    <Typography sx={{ fontSize: 10, color: mc, mt: 0.25 }}>
                      {todayKm} km
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Calories */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha("#E05A2B", 0.2)}`,
                    background: alpha("#E05A2B", 0.04),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 8.5,
                      color: textS,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    Calories
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces",serif',
                      fontSize: 26,
                      fontWeight: 700,
                      color: displayCals ? "#E05A2B" : textS,
                      lineHeight: 1,
                    }}
                  >
                    {displayCals ? displayCals.toLocaleString() : "—"}
                  </Typography>
                  {displayCals && (
                    <Typography
                      sx={{
                        fontSize: 9.5,
                        color: calsIsEst ? textS : "#E05A2B",
                        mt: 0.25,
                      }}
                    >
                      {calsIsEst ? "est. from steps" : "kcal"}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Sleep */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(sc, 0.2)}`,
                    background: alpha(sc, 0.04),
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 8.5,
                      color: textS,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    Sleep
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces",serif',
                      fontSize: 26,
                      fontWeight: 700,
                      color: todaySleep ? sc : textS,
                      lineHeight: 1,
                    }}
                  >
                    {todaySleep ? `${todaySleep}h` : "—"}
                  </Typography>
                  {todaySleepQ && (
                    <Box sx={{ mt: 0.5 }}>
                      <SleepStars quality={todaySleepQ} color={sc} />
                    </Box>
                  )}
                </Box>
              </Grid>

              {/* Net balance placeholder (calories burned vs consumed) */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: `1px solid ${alpha(mc, 0.15)}`,
                    background: alpha(mc, 0.03),
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 8.5,
                      color: textS,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    Active days
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces",serif',
                      fontSize: 26,
                      fontWeight: 700,
                      color: mc,
                      lineHeight: 1,
                    }}
                  >
                    {activeDays.length}
                  </Typography>
                  <Typography sx={{ fontSize: 9.5, color: textS, mt: 0.25 }}>
                    last 14 days
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {todaySteps === 0 && !todaySleep && (
              <Typography
                sx={{
                  fontSize: 10,
                  color: textS,
                  mt: 1.5,
                  fontStyle: "italic",
                }}
              >
                Log in Sharīram tracker
              </Typography>
            )}
          </Grid>

          {/* Charts */}
          <Grid item xs={12} sm={7}>
            <Typography
              sx={{
                fontSize: 9,
                color: textS,
                fontWeight: 700,
                letterSpacing: 1.2,
                textTransform: "uppercase",
                mb: 0.75,
              }}
            >
              Steps & Calories · Last 14 days
            </Typography>
            <ResponsiveContainer width="100%" height={110}>
              <ComposedChart
                data={chartData}
                margin={{ top: 2, right: 0, left: -28, bottom: 0 }}
              >
                <XAxis dataKey="day" tick={{ fontSize: 7.5, fill: textS }} />
                <YAxis yAxisId="steps" tick={{ fontSize: 7.5, fill: textS }} />
                <YAxis
                  yAxisId="cals"
                  orientation="right"
                  tick={{ fontSize: 7.5, fill: textS }}
                />
                <RechTooltip
                  contentStyle={{
                    fontSize: 11,
                    background: isDark ? "#1A1916" : "#fff",
                    border: `1px solid ${alpha(mc, 0.3)}`,
                    borderRadius: 8,
                  }}
                />
                <Bar
                  yAxisId="steps"
                  dataKey="steps"
                  radius={[3, 3, 0, 0]}
                  name="Steps"
                >
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.steps > 0
                          ? entry.isToday
                            ? mc
                            : alpha(mc, 0.5)
                          : alpha(mc, 0.1)
                      }
                    />
                  ))}
                </Bar>
                <Line
                  yAxisId="cals"
                  type="monotone"
                  dataKey="calories"
                  stroke="#E05A2B"
                  strokeWidth={1.5}
                  dot={false}
                  name="Calories"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ── LIFE RHYTHM HEATMAP ──────────────────────────────────────────────────────
const HEATMAP_AREAS = [
  {
    key: "spirit",
    habitId: "anushthanam",
    label: "Spirit",
    emoji: "🪔",
    color: "#C07830",
    colorDark: "#D4A830",
  },
  {
    key: "music",
    habitId: "saadhana",
    label: "Music",
    emoji: "🎵",
    color: "#7C4DAB",
    colorDark: "#9B6CC4",
  },
  {
    key: "health",
    habitId: "walk",
    label: "Body",
    emoji: "💪",
    color: "#2D7A4F",
    colorDark: "#5EC98A",
  },
  {
    key: "career",
    habitId: "office",
    label: "Career",
    emoji: "🚀",
    color: "#1A5FB0",
    colorDark: "#6AAEE8",
  },
  {
    key: "finance",
    habitId: "logs",
    label: "Finance",
    emoji: "💰",
    color: "#1A7A6E",
    colorDark: "#4DC4B5",
  },
  {
    key: "reading",
    habitId: "reading",
    label: "Vidyā",
    emoji: "📖",
    color: "#A0522D",
    colorDark: "#D4845A",
  },
];

function LifeRhythmHeatmap({ dayMap, isDark, onDayClick, japaLogs = [] }) {
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const DAYS = 35;
  const todayStr = dayjs().format("YYYY-MM-DD");
  const dates = Array.from({ length: DAYS }, (_, i) =>
    dayjs()
      .subtract(DAYS - 1 - i, "day")
      .format("YYYY-MM-DD"),
  );
  const weekStarts = [0, 7, 14, 21, 28].map((i) =>
    dayjs(dates[i]).format("D MMM"),
  );

  return (
    <Card
      sx={{
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "#fff",
        boxShadow: "none",
        animation: `${fadeUp} 0.5s ease 0.1s both`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <Typography
            sx={{
              fontFamily: '"Fraunces",serif',
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Life Rhythm
          </Typography>
          <Typography
            sx={{
              fontSize: 9.5,
              color: textS,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            · Last 5 Weeks
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontSize: 8.5, color: textS }}>Less</Typography>
            {[0.1, 0.3, 0.55, 0.75, 1].map((op, i) => (
              <Box
                key={i}
                sx={{
                  width: 9,
                  height: 9,
                  borderRadius: "2px",
                  background: alpha("#C07830", op),
                }}
              />
            ))}
            <Typography sx={{ fontSize: 8.5, color: textS }}>More</Typography>
          </Box>
        </Box>

        {/* Week column headers */}
        <Box sx={{ display: "flex", ml: "90px", mb: 0.75 }}>
          {weekStarts.map((w, i) => (
            <Typography
              key={i}
              sx={{ fontSize: 8, color: textS, flex: 7, textAlign: "center" }}
            >
              {w}
            </Typography>
          ))}
        </Box>

        {HEATMAP_AREAS.map((area) => {
          const color = isDark ? area.colorDark : area.color;
          return (
            <Box
              key={area.key}
              sx={{ display: "flex", alignItems: "center", mb: 1.25 }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  width: 90,
                  flexShrink: 0,
                }}
              >
                <Typography sx={{ fontSize: 14 }}>{area.emoji}</Typography>
                <Typography
                  sx={{ fontSize: 9.5, color: textS, fontWeight: 600 }}
                >
                  {area.label}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: "3px", flex: 1 }}>
                {dates.map((date) => {
                  const d = dayMap[date];
                  const done = d?.habits?.[area.habitId];
                  const sat = d?.habits_data?.[area.habitId]?.satisfaction || 0;
                  const isToday = date === todayStr;
                  const bg = done
                    ? alpha(color, sat > 0 ? 0.25 + (sat / 8) * 0.75 : 0.6)
                    : isDark
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(0,0,0,0.05)";
                  return (
                    <Box
                      key={date}
                      onClick={() => onDayClick(date)}
                      title={`${dayjs(date).format("D MMM")} · ${area.label}: ${done ? (sat > 0 ? `Level ${sat}` : "Done") : "—"}`}
                      sx={{
                        flex: 1,
                        aspectRatio: "1",
                        borderRadius: "3px",
                        background: bg,
                        border: isToday
                          ? `2px solid ${color}`
                          : "1px solid transparent",
                        cursor: "pointer",
                        transition: "transform 0.1s",
                        "&:hover": { transform: "scale(1.5)", zIndex: 2 },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          );
        })}

        {/* Japam row — presence-based, intensity by count */}
        {japaLogs.length > 0 && (() => {
          const jc = isDark ? "#D4A830" : "#C07830";
          return (
            <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, width: 90, flexShrink: 0 }}>
                <Typography sx={{ fontSize: 14 }}>📿</Typography>
                <Typography sx={{ fontSize: 9.5, color: textS, fontWeight: 600 }}>Japam</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: "3px", flex: 1 }}>
                {dates.map((date) => {
                  const count = japaLogs
                    .filter((l) => l.day_date === date)
                    .reduce((s, l) => s + l.count, 0);
                  const isToday = date === todayStr;
                  const intensity = count > 0 ? Math.min(1, 0.25 + (count / 500) * 0.75) : 0;
                  const bg = count > 0
                    ? alpha(jc, intensity)
                    : isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";
                  return (
                    <Box
                      key={date}
                      onClick={() => onDayClick(date)}
                      title={`${dayjs(date).format("D MMM")} · Japam: ${count > 0 ? count.toLocaleString() : "—"}`}
                      sx={{
                        flex: 1, aspectRatio: "1", borderRadius: "3px", background: bg,
                        border: isToday ? `2px solid ${jc}` : "1px solid transparent",
                        cursor: "pointer", transition: "transform 0.1s",
                        "&:hover": { transform: "scale(1.5)", zIndex: 2 },
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
          );
        })()}
      </CardContent>
    </Card>
  );
}

// ── LIFE BALANCE RADAR ───────────────────────────────────────────────────────
function LifeBalanceRadar({ dynamicStreaks, isDark, heroColor }) {
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const AREA_ORDER = [
    "spirit",
    "music",
    "health",
    "career",
    "finance",
    "reading",
  ];
  const AREA_COLORS = {
    spirit: isDark ? "#D4A830" : "#C07830",
    music: isDark ? "#9B6CC4" : "#7C4DAB",
    health: isDark ? "#5EC98A" : "#2D7A4F",
    career: isDark ? "#6AAEE8" : "#1A5FB0",
    finance: isDark ? "#4DC4B5" : "#1A7A6E",
    reading: isDark ? "#D4845A" : "#A0522D",
  };
  const EMOJIS = {
    spirit: "🪔",
    music: "🎵",
    health: "💪",
    career: "🚀",
    finance: "💰",
    reading: "📖",
  };

  const cx = 100,
    cy = 105,
    r = 72;
  const MAX_STREAK = 21;
  const angles = AREA_ORDER.map((_, i) => (i / 6) * 2 * Math.PI - Math.PI / 2);

  const vals = AREA_ORDER.map((area) => {
    const s = dynamicStreaks.find((d) => d.area === area);
    return Math.min(1, (s?.count || 0) / MAX_STREAK);
  });

  const poly = (scale) =>
    angles
      .map(
        (a) =>
          `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`,
      )
      .join(" ");

  const dataPts = angles.map((a, i) => ({
    x: cx + r * vals[i] * Math.cos(a),
    y: cy + r * vals[i] * Math.sin(a),
  }));

  const labelPts = angles.map((a) => ({
    x: cx + (r + 22) * Math.cos(a),
    y: cy + (r + 22) * Math.sin(a),
  }));

  return (
    <Card
      sx={{
        border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
        borderRadius: 2.5,
        background: isDark ? "rgba(26,25,22,0.7)" : "#fff",
        boxShadow: "none",
        height: "100%",
        animation: `${fadeUp} 0.5s ease 0.15s both`,
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Typography
          sx={{
            fontFamily: '"Fraunces",serif',
            fontSize: 16,
            fontWeight: 600,
            mb: 0.25,
          }}
        >
          Life Balance
        </Typography>
        <Typography
          sx={{
            fontSize: 9,
            color: textS,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
            mb: 2,
          }}
        >
          Streak Radar · {MAX_STREAK}d scale
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <svg
            width="200"
            height="210"
            viewBox="0 0 200 210"
            style={{ overflow: "visible" }}
          >
            {/* Grid rings */}
            {[0.25, 0.5, 0.75, 1].map((lvl) => (
              <polygon
                key={lvl}
                points={poly(lvl)}
                fill="none"
                stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}
                strokeWidth="1"
              />
            ))}
            {/* Axis lines */}
            {angles.map((a, i) => (
              <line
                key={i}
                x1={cx}
                y1={cy}
                x2={cx + r * Math.cos(a)}
                y2={cy + r * Math.sin(a)}
                stroke={isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}
                strokeWidth="1"
              />
            ))}
            {/* Data fill */}
            <polygon
              points={dataPts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill={alpha(heroColor, 0.18)}
              stroke={heroColor}
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {/* Area dots */}
            {dataPts.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={vals[i] > 0 ? 4 : 2.5}
                fill={AREA_COLORS[AREA_ORDER[i]]}
                stroke={isDark ? "#1A1916" : "#fff"}
                strokeWidth="1.5"
              />
            ))}
            {/* Emoji labels */}
            {labelPts.map((p, i) => (
              <text
                key={i}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                style={{ userSelect: "none" }}
              >
                {EMOJIS[AREA_ORDER[i]]}
              </text>
            ))}
          </svg>
        </Box>

        {/* Streak counts */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
            mt: 0.5,
          }}
        >
          {AREA_ORDER.map((area) => {
            const s = dynamicStreaks.find((d) => d.area === area);
            const count = s?.count || 0;
            return (
              <Box
                key={area}
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: AREA_COLORS[area],
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 9.5,
                    color: textS,
                    fontWeight: count > 0 ? 700 : 400,
                  }}
                >
                  {count}d
                </Typography>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── TODAY'S VITALS HERO ──────────────────────────────────────────────────────
function VitalsHero({
  massPct,
  mass,
  oneThing,
  todayJapa,
  japaGoal,
  todayActivity,
  yesterdayActivity,
  readingBooks = [],
  heroColor,
  isDark,
}) {
  const textP = isDark ? "#F0EDE8" : "#1C1C1C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const bg = isDark
    ? `linear-gradient(135deg, rgba(18,16,12,0.98) 0%, rgba(26,22,14,0.96) 100%)`
    : `linear-gradient(135deg, #fffef9 0%, #fff8ee 100%)`;

  const japaDailyTarget = japaGoal && japaGoal.deadline_years > 0
    ? Math.max(1, Math.round(japaGoal.target_count / (japaGoal.deadline_years * 365)))
    : 0;
  const japaTargetMet = japaDailyTarget > 0 && todayJapa >= japaDailyTarget;

  const stats = [
    {
      emoji: "🕉️",
      label: "Japa",
      value: japaTargetMet ? "✓" : todayJapa > 0 ? todayJapa.toLocaleString() : "—",
      sub: japaGoal
        ? japaTargetMet
          ? `${japaGoal.japa_name} · target met`
          : todayJapa > 0 && japaDailyTarget > 0
            ? `of ${japaDailyTarget.toLocaleString()} daily`
            : japaDailyTarget > 0
              ? `${japaDailyTarget.toLocaleString()} daily · ${japaGoal.japa_name}`
              : japaGoal.japa_name
        : null,
    },
    {
      emoji: "🏃",
      label: "Steps",
      value: todayActivity?.steps ? todayActivity.steps.toLocaleString() : "—",
      sub: todayActivity?.km_walked ? `${todayActivity.km_walked} km` : null,
    },
    {
      emoji: "😴",
      label: "Sleep",
      value: yesterdayActivity?.sleep_hours ? `${yesterdayActivity.sleep_hours}h` : "—",
      sub: yesterdayActivity?.sleep_quality
        ? ["Poor", "Fair", "Good", "Great", "Excellent"][
            yesterdayActivity.sleep_quality - 1
          ]
        : null,
    },
    {
      emoji: "📖",
      label: "Reading",
      value:
        readingBooks.length === 0
          ? "—"
          : readingBooks.length > 1
            ? `${readingBooks.length} books`
            : readingBooks[0].total_pages > 0
              ? `${Math.round((readingBooks[0].pages_read / readingBooks[0].total_pages) * 100)}%`
              : "—",
      sub:
        readingBooks.length > 1
          ? readingBooks
              .map(
                (b) =>
                  (b.title ?? "").slice(0, 14) +
                  ((b.title?.length ?? 0) > 14 ? "…" : ""),
              )
              .join(" · ")
          : readingBooks[0]
            ? (readingBooks[0].title ?? "").slice(0, 18) +
              ((readingBooks[0].title?.length ?? 0) > 18 ? "…" : "")
            : null,
    },
  ];

  return (
    <Card
      sx={{
        borderRadius: 3,
        border: `1px solid ${alpha(heroColor, 0.22)}`,
        background: bg,
        boxShadow: `0 8px 48px ${alpha(heroColor, 0.1)}, 0 1px 0 ${alpha(heroColor, 0.12)}`,
        overflow: "hidden",
        position: "relative",
        mb: 2.5,
        animation: `${fadeUp} 0.5s ease both`,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(heroColor, 0.09)}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -40,
          left: -40,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(heroColor, 0.05)}, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <CardContent sx={{ p: { xs: 2.5, md: 3.5 }, position: "relative" }}>
        <Grid container spacing={3} alignItems="center">
          {/* Resonance gauge */}
          <Grid item xs={12} sm={3} sx={{ textAlign: "center" }}>
            <Box sx={{ position: "relative", display: "inline-flex" }}>
              <CircularProgress
                variant="determinate"
                value={100}
                size={148}
                thickness={2.5}
                sx={{ color: alpha(heroColor, 0.1) }}
              />
              <CircularProgress
                variant="determinate"
                value={massPct}
                size={148}
                thickness={2.5}
                sx={{
                  color: heroColor,
                  position: "absolute",
                  left: 0,
                  strokeLinecap: "round",
                  filter: `drop-shadow(0 0 10px ${alpha(heroColor, 0.45)})`,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Fraunces",serif',
                    fontSize: 40,
                    fontWeight: 700,
                    color: heroColor,
                    lineHeight: 1,
                  }}
                >
                  {massPct}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 9,
                    color: textS,
                    fontWeight: 800,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    mt: 0.25,
                  }}
                >
                  Resonance
                </Typography>
              </Box>
            </Box>
            <Typography sx={{ fontSize: 10, color: textS, mt: 1 }}>
              {mass} / {MAX_EXPECTED_MASS} mass pts
            </Typography>
          </Grid>

          {/* Intention */}
          <Grid item xs={12} sm={5}>
            <Box
              sx={{ borderLeft: `3px solid ${alpha(heroColor, 0.4)}`, pl: 2.5 }}
            >
              <Typography
                sx={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  color: heroColor,
                  mb: 1.5,
                }}
              >
                Today's Intention
              </Typography>
              {oneThing ? (
                <Typography
                  sx={{
                    fontFamily: '"Fraunces",serif',
                    fontSize: { xs: 17, md: 21 },
                    color: textP,
                    lineHeight: 1.5,
                    fontWeight: 400,
                    fontStyle: "italic",
                  }}
                >
                  "{oneThing}"
                </Typography>
              ) : (
                <Typography
                  sx={{ fontSize: 13, color: textS, fontStyle: "italic" }}
                >
                  Set your intention in Today's page →
                </Typography>
              )}
            </Box>
          </Grid>

          {/* Live stats */}
          <Grid item xs={12} sm={4}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {stats.map((s) => (
                <Box
                  key={s.label}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                    p: "7px 12px",
                    borderRadius: 1.5,
                    background: alpha(heroColor, isDark ? 0.07 : 0.04),
                    border: `1px solid ${alpha(heroColor, 0.09)}`,
                  }}
                >
                  <Typography
                    sx={{ fontSize: 17, lineHeight: 1, flexShrink: 0 }}
                  >
                    {s.emoji}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 8.5,
                        color: textS,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {s.label}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: s.value === "—" ? textS : textP,
                        lineHeight: 1.2,
                      }}
                    >
                      {s.value}
                    </Typography>
                  </Box>
                  {s.sub && (
                    <Typography
                      sx={{
                        fontSize: 9.5,
                        color: textS,
                        textAlign: "right",
                        maxWidth: 72,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.sub}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ── ACTIVE MILESTONES CARD ───────────────────────────────────────────────────
function parseMilestoneTarget(title) {
  if (!title) return null;
  const kw = title.match(/(?:reach|level|save|hit|complete|finish|achieve|days?|sessions?|books?|hours?|months?|weeks?|courses?|times?)\s+[₹$£€]?([\d.]+)/i);
  if (kw) return parseFloat(kw[1]);
  const all = [...title.matchAll(/[\d.]+/g)];
  return all.length ? parseFloat(all[all.length - 1][0]) : null;
}

const PILLAR_META = {
  spirit:  { color: "#C07830", colorDark: "#D4A830", emoji: "🪔", label: "Anushthanam" },
  music:   { color: "#7C4DAB", colorDark: "#9B6CC4", emoji: "🎵", label: "Nādam" },
  health:  { color: "#2D7A4F", colorDark: "#5EC98A", emoji: "💪", label: "Sharīram" },
  career:  { color: "#1A5FB0", colorDark: "#6AAEE8", emoji: "🚀", label: "Vṛtti" },
  finance: { color: "#1A7A6E", colorDark: "#4DC4B5", emoji: "💰", label: "Artha" },
  reading: { color: "#A0522D", colorDark: "#D4845A", emoji: "📖", label: "Vidyā" },
};

const TYPE_META = {
  habit:   { icon: "🔥", label: "Habit" },
  outcome: { icon: "🎯", label: "Outcome" },
  mastery: { icon: "⚡", label: "Mastery" },
};

function ActiveMilestonesCard({ lakshyas, isDark }) {
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const bg = isDark ? "rgba(26,25,22,0.7)" : "#fff";

  const lakshyaRows = useMemo(() =>
    lakshyas.map((l) => {
      const all = l.siddhis || [];
      const active = all.filter((s) => s.status !== "achieved");
      const achieved = all.filter((s) => s.status === "achieved").length;
      // Pick the milestone with the most progress to show as the "hero" bar
      const withProgress = active
        .map((s) => {
          const target = s.target_value > 0 ? s.target_value : parseMilestoneTarget(s.title);
          const current = s.current_value ?? 0;
          const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : null;
          return { ...s, _target: target, _current: current, _pct: pct };
        })
        .filter((s) => s._pct !== null)
        .sort((a, b) => b._pct - a._pct);
      const hero = withProgress[0] || null;
      return { ...l, _active: active, _achieved: achieved, _hero: hero };
    }),
    [lakshyas]
  );

  if (lakshyaRows.length === 0) return null;

  const totalActive = lakshyaRows.reduce((s, l) => s + l._active.length, 0);

  return (
    <Card sx={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`, borderRadius: 2.5, background: bg, boxShadow: "none", mb: 3, animation: `${fadeUp} 0.5s ease 0.08s both` }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
          <Box sx={{ p: 0.75, borderRadius: 1.5, background: "rgba(192,120,48,0.12)", color: "#C07830" }}>
            <AutoGraph sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontFamily: '"Fraunces",serif', fontSize: 18, fontWeight: 600, color: textP, lineHeight: 1.2 }}>
              Vision Pipeline
            </Typography>
            <Typography sx={{ fontSize: 11, color: textS, mt: 0.1 }}>
              {lakshyaRows.length} active visions · {totalActive} milestones in progress
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" }, gap: 1.5 }}>
          {lakshyaRows.map((l) => {
            const pillar = PILLAR_META[l.pillar] || { color: "#5C5A52", colorDark: "#9C9A94", emoji: "✦", label: l.pillar || "—" };
            const color = isDark ? pillar.colorDark : pillar.color;
            const hero = l._hero;

            return (
              <Box key={l.id} sx={{
                p: 1.75, borderRadius: 2,
                border: `1px solid ${alpha(color, 0.22)}`,
                background: alpha(color, isDark ? 0.05 : 0.03),
                position: "relative", overflow: "hidden",
              }}>
                {/* Colour accent left bar */}
                <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: color, borderRadius: "2px 0 0 2px" }} />

                {/* Pillar label */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.75, pl: 0.5 }}>
                  <Typography sx={{ fontSize: 12 }}>{pillar.emoji}</Typography>
                  <Typography sx={{ fontSize: 8.5, color, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", flex: 1 }}>
                    {pillar.label}
                  </Typography>
                  {l._achieved > 0 && (
                    <Typography sx={{ fontSize: 9, color: textS }}>✓{l._achieved}</Typography>
                  )}
                </Box>

                {/* Lakshya title */}
                <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: textP, lineHeight: 1.35, mb: 0.75, pl: 0.5 }} noWrap>
                  {l.title}
                </Typography>

                {/* Active milestone count */}
                <Typography sx={{ fontSize: 10, color: textS, mb: hero ? 1 : 0, pl: 0.5 }}>
                  {l._active.length > 0
                    ? `${l._active.length} milestone${l._active.length > 1 ? "s" : ""} active`
                    : "No milestones set"}
                </Typography>

                {/* Hero milestone progress */}
                {hero && (
                  <>
                    <Typography sx={{ fontSize: 10.5, color: textP, fontWeight: 500, mb: 0.5, pl: 0.5 }} noWrap>
                      {hero.title}
                    </Typography>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4, pl: 0.5 }}>
                      <Typography sx={{ fontSize: 9, color: textS }}>
                        {hero._current > 0 ? `${hero._current.toLocaleString()} / ${hero._target.toLocaleString()}` : `Target: ${hero._target.toLocaleString()}`}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color, fontWeight: 700 }}>{hero._pct}%</Typography>
                    </Box>
                    <Box sx={{ height: 3, borderRadius: 2, background: alpha(color, 0.15), overflow: "hidden" }}>
                      <Box sx={{ height: "100%", width: `${hero._pct}%`, borderRadius: 2, background: color, transition: "width 0.5s ease" }} />
                    </Box>
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────────

let _dashCache = null;

export default function DashboardPage() {
  const { user } = useAuth();
  const { heroColor, mode } = useThemeMode();
  const isDark = mode === "dark";
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [dayMap, setDayMap] = useState(_dashCache?.dayMap || {});
  const [dynamicStreaks, setDynamicStreaks] = useState(
    _dashCache?.dynamicStreaks || [],
  );
  const [lakshyas, setLakshyas] = useState(_dashCache?.lakshyas || []);
  const [todayAnshs, setTodayAnshs] = useState(_dashCache?.todayAnshs || []);
  const [weeklyGoals, setWeeklyGoals] = useState(_dashCache?.weeklyGoals || []);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(_dashCache === null);
  const [japaLogs, setJapaLogs] = useState(_dashCache?.japaLogs || []);
  const [japaGoals, setJapaGoals] = useState(_dashCache?.japaGoals || []);
  const [books, setBooks] = useState(_dashCache?.books || []);
  const [readingSessions, setReadingSessions] = useState(
    _dashCache?.readingSessions || [],
  );
  const [financeLogs, setFinanceLogs] = useState(_dashCache?.financeLogs || []);
  const [financeBudgets, setFinanceBudgets] = useState(
    _dashCache?.financeBudgets || [],
  );
  const [activityLogs, setActivityLogs] = useState(
    _dashCache?.activityLogs || [],
  );
  const [latestWeightKg, setLatestWeightKg] = useState(_dashCache?.latestWeightKg ?? null);
  const [analyticsRange, setAnalyticsRange] = useState("month");
  const [vacRows, setVacRows] = useState(_dashCache?.vacRows || []);

  // Derived set of all vacation day strings (YYYY-MM-DD)
  const vacationDays = useMemo(() => {
    const s = new Set();
    vacRows.forEach(({ start_date, end_date }) => {
      let cur = dayjs(start_date);
      const end = dayjs(end_date);
      while (!cur.isAfter(end)) {
        s.add(cur.format("YYYY-MM-DD"));
        cur = cur.add(1, "day");
      }
    });
    return s;
  }, [vacRows]);

  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const cardBg = isDark ? "rgba(26,25,22,0.6)" : "rgba(255,255,255,0.7)";

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (_dashCache === null) setLoading(true);
    try {
      const thirtyAgo = dayjs().subtract(30, "day").format("YYYY-MM-DD");
      const ninetyAgo = dayjs().subtract(90, "day").format("YYYY-MM-DD");
      const thisMonth = dayjs().format("YYYY-MM");
      const weekStart = dayjs().startOf("week").format("YYYY-MM-DD");

      const [
        { data: days },
        { data: lData },
        { data: anshData },
        { data: vacData },
        { data: wgData },
        { data: japaLogsData },
        { data: japaGoalsData },
        { data: booksData },
        { data: sessionsData },
        { data: finLogsData },
        { data: budgetsData },
        { data: activityData },
        { data: weightData },
      ] = await Promise.all([
        supabase
          .from("days")
          .select(
            "day_date,habits,habits_data,disruption_mode,last_close,wins,one_thing,morning_flow_done",
          )
          .eq("user_id", user.id)
          .order("day_date"),
        supabase
          .from("lakshyas")
          .select("*, siddhis(*)")
          .eq("user_id", user.id)
          .eq("status", "active"),
        supabase
          .from("anshs")
          .select("id, lakshya_id, status")
          .eq("user_id", user.id),
        supabase
          .from("vacations")
          .select("start_date, end_date")
          .eq("user_id", user.id),
        supabase
          .from("weekly_goals")
          .select("*")
          .eq("user_id", user.id)
          .eq("week_start", weekStart)
          .order("created_at"),
        supabase
          .from("japa_logs")
          .select("japa_name,count,day_date")
          .eq("user_id", user.id),
        supabase
          .from("japa_goals")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true),
        supabase
          .from("books")
          .select("id,title,pages_read,total_pages,status")
          .eq("user_id", user.id),
        supabase
          .from("reading_sessions")
          .select("session_date,pages_read,book_id")
          .eq("user_id", user.id)
          .gte("session_date", thirtyAgo),
        supabase
          .from("finance_logs")
          .select("amount,date,income_flag,category")
          .eq("user_id", user.id)
          .gte("date", ninetyAgo),
        supabase
          .from("budgets")
          .select("category,limit_amt,month")
          .eq("user_id", user.id)
          .eq("month", thisMonth),
        supabase
          .from("daily_activity")
          .select("*")
          .eq("user_id", user.id)
          .gte("date", thirtyAgo),
        supabase
          .from("health_logs")
          .select("value,date")
          .eq("user_id", user.id)
          .eq("type", "weight")
          .order("date", { ascending: false })
          .limit(1),
      ]);

      // Build activity lookup keyed by date
      const actMap = {};
      (activityData || []).forEach((a) => { actMap[a.date] = a; });

      // Enrich dayMap entries with _activity so calculateDailyMass can use tracker signals
      const map = {};
      (days || []).forEach((d) => {
        map[d.day_date] = { ...d, _activity: actMap[d.day_date] || null };
      });
      setDayMap(map);
      setLakshyas(lData || []);
      setTodayAnshs(anshData || []);
      setWeeklyGoals(wgData || []);
      setJapaLogs(japaLogsData || []);
      setJapaGoals(japaGoalsData || []);
      setBooks(booksData || []);
      setReadingSessions(sessionsData || []);
      setFinanceLogs(finLogsData || []);
      setFinanceBudgets(budgetsData || []);
      setActivityLogs(activityData || []);
      setLatestWeightKg(weightData?.[0]?.value ?? null);
      _dashCache = {
        dayMap: map,
        lakshyas: lData || [],
        todayAnshs: anshData || [],
        weeklyGoals: wgData || [],
        japaLogs: japaLogsData || [],
        japaGoals: japaGoalsData || [],
        books: booksData || [],
        readingSessions: sessionsData || [],
        financeLogs: finLogsData || [],
        financeBudgets: budgetsData || [],
        activityLogs: activityData || [],
        latestWeightKg: weightData?.[0]?.value ?? null,
        vacRows: vacData || [],
        dynamicStreaks: [], // filled below after vacation set is built
      };

      const vacationDateSet = new Set();
      (vacData || []).forEach(({ start_date, end_date }) => {
        let cur = dayjs(start_date);
        const end = dayjs(end_date);
        while (!cur.isAfter(end)) {
          vacationDateSet.add(cur.format("YYYY-MM-DD"));
          cur = cur.add(1, "day");
        }
      });
      setVacRows(vacData || []);

      const AREA_HABIT_MAP = {
        spirit: "anushthanam",
        music: "saadhana",
        health: "walk",
        career: "office",
        finance: "logs",
        reading: "reading",
      };
      const activeLakshyas = lData || [];
      const computedStreaks = Object.entries(AREA_HABIT_MAP).map(
        ([area, habitId]) => {
          const linked = activeLakshyas.find((l) => l.pillar === area);
          return {
            area,
            habitId,
            count: calcStreak(map, habitId, vacationDateSet),
            lakshyaTitle: linked?.title || null,
          };
        },
      );
      if (_dashCache) _dashCache.dynamicStreaks = computedStreaks;
      setDynamicStreaks(computedStreaks);
      setLoading(false);
    } catch (err) {
      console.error("DashboardPage load error:", err.message);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const renderMonthView = () => {
    const startOfMonth = currentDate.startOf("month");
    const daysInMonth = currentDate.daysInMonth();
    const offset = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1;

    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: { xs: 1, sm: 2 },
          animation: `${fadeUp} 0.5s ease-out both`,
        }}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <Typography
            key={d}
            align="center"
            variant="caption"
            sx={{
              fontWeight: 800,
              fontSize: 10,
              color: textS,
              mb: 1.5,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {d}
          </Typography>
        ))}
        {Array.from({ length: offset }).map((_, i) => (
          <Box key={`e-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dateStr = startOfMonth.add(i, "day").format("YYYY-MM-DD");
          const dayData = dayMap[dateStr];
          const mass = calculateDailyMass(dayData);
          const intensity = Math.min(mass / MAX_EXPECTED_MASS, 1);
          const isToday = dateStr === dayjs().format("YYYY-MM-DD");
          const dm = dayData?.disruption_mode;
          const isVacation = vacationDays.has(dateStr) || dm === "vacation";
          const isDisrupted = dm === "disrupted";
          const isHoliday = dm === "holiday";
          const statusEmoji = isVacation ? "🏖" : isDisrupted ? "⚠" : isHoliday ? "✦" : null;
          const statusColor = isVacation ? "#2C7BB6" : isDisrupted ? "#CF4E4E" : isHoliday ? "#9B6AC8" : null;

          return (
            <Tooltip
              key={dateStr}
              title={`${dayjs(dateStr).format("D MMM")} · Mass ${mass}${isVacation ? " · Vacation" : isDisrupted ? " · Disrupted" : isHoliday ? " · Holiday" : ""}`}
              arrow
              placement="top"
            >
              <Box
                component="span"
                onClick={() => setSelectedDate(dateStr)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  aspectRatio: "1/1",
                  width: "100%",
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  position: "relative",
                  background: statusColor
                    ? `${statusColor}18`
                    : mass > 0
                      ? heroColor
                      : isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.03)",
                  opacity: mass > 0 && !statusColor ? 0.2 + intensity * 0.8 : 1,
                  boxShadow: statusColor
                    ? `0 0 0 1.5px ${statusColor}50`
                    : mass > 60 ? `0 4px 12px ${alpha(heroColor, 0.4)}` : "none",
                  outline: isToday ? `2px solid ${heroColor}` : "none",
                  outlineOffset: "3px",
                  "&:hover": {
                    transform: "scale(1.15)",
                    zIndex: 10,
                    boxShadow: `0 8px 16px ${alpha(heroColor, 0.5)}`,
                  },
                }}
              >
                {statusEmoji ? (
                  <Typography sx={{ fontSize: { xs: 8, sm: 10 }, lineHeight: 1, userSelect: "none" }}>
                    {statusEmoji}
                  </Typography>
                ) : (
                  <Typography
                    sx={{
                      fontSize: { xs: 10, sm: 12 },
                      fontWeight: isToday ? 900 : mass > 0 ? 700 : 500,
                      color: mass > 0 && intensity > 0.3 ? "#fff" : textS,
                      userSelect: "none",
                    }}
                  >
                    {i + 1}
                  </Typography>
                )}
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    );
  };

  const renderWeekView = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) =>
      dayjs()
        .startOf("week")
        .add(i + 1, "day")
        .format("YYYY-MM-DD"),
    );

    return (
      <Box sx={{ animation: `${fadeUp} 0.5s ease-out both` }}>
        {/* SVG Chart replaces the plain circles overview */}
        <WeeklyMassChart
          weekDays={weekDays}
          dayMap={dayMap}
          heroColor={heroColor}
        />

        <Grid container spacing={2}>
          {weekDays.map((dateStr, index) => {
            const dayData = dayMap[dateStr];
            const done = Object.entries(dayData?.habits || {}).filter(
              ([, v]) => v,
            ).length;
            const mass = calculateDailyMass(dayData);
            const isToday = dateStr === dayjs().format("YYYY-MM-DD");
            const dm = dayData?.disruption_mode;
            const isVacation = vacationDays.has(dateStr) || dm === "vacation";
            const isDisrupted = dm === "disrupted";
            const isHoliday = dm === "holiday";
            const weekStatusColor = isVacation ? "#2C7BB6" : isDisrupted ? "#CF4E4E" : isHoliday ? "#9B6AC8" : null;
            const weekStatusLabel = isVacation ? "🏖 Vacation" : isDisrupted ? "⚠ Disrupted" : isHoliday ? "✦ Holiday" : null;

            return (
              <Grid
                item
                xs={12}
                sm={6}
                md={12 / 7 > 1 ? 12 / 7 : true}
                key={dateStr}
                sx={{ flexGrow: 1 }}
              >
                <Box
                  onClick={() => setSelectedDate(dateStr)}
                  sx={{
                    p: 1.5,
                    borderRadius: 3,
                    border: `1px solid ${weekStatusColor ? weekStatusColor + "50" : isToday ? heroColor : border}`,
                    background: weekStatusColor
                      ? alpha(weekStatusColor, 0.06)
                      : isToday
                        ? alpha(heroColor, 0.05)
                        : "transparent",
                    cursor: "pointer",
                    textAlign: "center",
                    position: "relative",
                    overflow: "hidden",
                    "&:hover": {
                      borderColor: heroColor,
                      transform: "translateY(-3px)",
                      background: alpha(heroColor, 0.02),
                    },
                    transition: "all 0.3s ease",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      color: textS,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      mb: 0.5,
                    }}
                  >
                    {dayjs(dateStr).format("ddd")}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: textP,
                      fontFamily: '"Fraunces", serif',
                      mb: 1,
                    }}
                  >
                    {dayjs(dateStr).date()}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                    }}
                  >
                    <LocalFireDepartment
                      sx={{
                        fontSize: 12,
                        color: mass > 0 ? heroColor : textS,
                        opacity: mass > 0 ? 1 : 0.3,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: mass > 0 ? heroColor : textS,
                        opacity: mass > 0 ? 1 : 0.5,
                      }}
                    >
                      {mass}
                    </Typography>
                  </Box>

                  {/* Vacation / disruption badge */}
                  {weekStatusLabel && (
                    <Typography sx={{
                      fontSize: 9, fontWeight: 700, mt: 0.75,
                      color: weekStatusColor,
                      letterSpacing: 0.3,
                      textTransform: "uppercase",
                    }}>
                      {weekStatusLabel}
                    </Typography>
                  )}

                  {/* Subtle Progress Bar per day */}
                  <Box
                    sx={{
                      height: 3,
                      width: "100%",
                      bgcolor: alpha(textS, 0.1),
                      mt: 1.5,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${Math.min((mass / MAX_EXPECTED_MASS) * 100, 100)}%`,
                        bgcolor: weekStatusColor || heroColor,
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // ── derived state — must stay BEFORE any early return (Rules of Hooks) ──
  const todayStr = dayjs().format("YYYY-MM-DD");
  const todayMass = useMemo(
    () => calculateDailyMass(dayMap[todayStr]),
    [dayMap, todayStr],
  );
  const todayMassPct = Math.min(
    100,
    Math.round((todayMass / MAX_EXPECTED_MASS) * 100),
  );
  const readingBooks = useMemo(
    () => books.filter((b) => b.status === "reading"),
    [books],
  );
  const todayJapa = useMemo(
    () =>
      japaLogs
        .filter((l) => l.day_date === todayStr)
        .reduce((s, l) => s + l.count, 0),
    [japaLogs, todayStr],
  );
  const todayActivity = useMemo(
    () => activityLogs.find((a) => a.date === todayStr),
    [activityLogs, todayStr],
  );
  // Sleep is last night's data — morning flow writes to yesterday's daily_activity row
  const yesterdayStr = useMemo(() => dayjs().subtract(1, "day").format("YYYY-MM-DD"), []);
  const yesterdayActivity = useMemo(
    () => activityLogs.find((a) => a.date === yesterdayStr),
    [activityLogs, yesterdayStr],
  );

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress
          size={60}
          thickness={2}
          sx={{ color: heroColor, mb: 3 }}
        />
        <Typography
          sx={{
            fontFamily: '"Fraunces", serif',
            color: textS,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontSize: 12,
          }}
        >
          Entering Ashram...
        </Typography>
      </Box>
    );

  const greeting = getTimeGreeting();

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        pb: 10,
        minHeight: "100vh",
        color: textP,
      }}
    >
      <Box sx={{ maxWidth: 1150, mx: "auto" }}>
        {/* HEADER */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 3,
            animation: `${fadeUp} 0.5s ease both`,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 10,
                letterSpacing: 2,
                textTransform: "uppercase",
                color: heroColor,
                fontWeight: 700,
                mb: 0.5,
                display: "flex",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>
                {greeting.icon}
              </Box>
              {greeting.text}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Lora","Fraunces",serif',
                fontSize: { xs: 26, md: 32 },
                fontWeight: 600,
                color: textP,
                lineHeight: 1.15,
              }}
            >
              Dashboard
            </Typography>
          </Box>
        </Box>

        {/* VITALS HERO */}
        <VitalsHero
          massPct={todayMassPct}
          mass={todayMass}
          oneThing={dayMap[todayStr]?.one_thing || ""}
          todayJapa={todayJapa}
          japaGoal={japaGoals[0] || null}
          todayActivity={todayActivity}
          yesterdayActivity={yesterdayActivity}
          readingBooks={readingBooks}
          heroColor={heroColor}
          isDark={isDark}
        />

        {/* HEATMAP + RADAR */}
        <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
          <Grid item xs={12} lg={8}>
            <LifeRhythmHeatmap
              dayMap={dayMap}
              isDark={isDark}
              onDayClick={setSelectedDate}
              japaLogs={japaLogs}
            />
          </Grid>
          <Grid item xs={12} lg={4}>
            <LifeBalanceRadar
              dynamicStreaks={dynamicStreaks}
              isDark={isDark}
              heroColor={heroColor}
            />
          </Grid>
        </Grid>

        {/* STREAKS GRID */}
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {dynamicStreaks.map((s, idx) => (
            <Grid item xs={6} sm={4} md={2} key={s.area}>
              <DynamicStreakCard
                areaKey={s.area}
                streak={s.count}
                lakshyaTitle={s.lakshyaTitle}
                isDark={isDark}
                delay={0.1 * idx}
              />
            </Grid>
          ))}
        </Grid>

        {/* ACTIVE MILESTONES */}
        <ActiveMilestonesCard lakshyas={lakshyas} isDark={isDark} />

        {/* THIS WEEK'S FOCUS */}
        {weeklyGoals.length > 0 &&
          (() => {
            const byArea = {};
            weeklyGoals.forEach((g) => {
              if (!byArea[g.area]) byArea[g.area] = [];
              byArea[g.area].push(g);
            });
            const areas = Object.keys(byArea);
            const totalGoals = weeklyGoals.length;
            const doneGoals = weeklyGoals.filter((g) => g.done).length;
            const pct =
              totalGoals > 0 ? Math.round((doneGoals / totalGoals) * 100) : 0;
            return (
              <Card
                sx={{
                  border: `1px solid ${border}`,
                  borderRadius: 2.5,
                  background: cardBg,
                  boxShadow: "none",
                  mb: 3,
                  animation: `${fadeUp} 0.4s ease 0.05s both`,
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mb: 2,
                      flexWrap: "wrap",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                    >
                      <Box
                        sx={{
                          p: 0.75,
                          borderRadius: 1.5,
                          background: alpha(heroColor, 0.12),
                          color: heroColor,
                        }}
                      >
                        <Insights sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: '"Fraunces", serif',
                          fontSize: 18,
                          fontWeight: 600,
                        }}
                      >
                        This Week's Focus
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography sx={{ fontSize: 12, color: textS }}>
                        {doneGoals}/{totalGoals} done
                      </Typography>
                      <Box sx={{ width: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{
                            height: 5,
                            borderRadius: 4,
                            bgcolor: alpha(heroColor, 0.12),
                            "& .MuiLinearProgress-bar": {
                              background: heroColor,
                              borderRadius: 4,
                            },
                          }}
                        />
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: heroColor,
                          fontWeight: 700,
                          minWidth: 32,
                        }}
                      >
                        {pct}%
                      </Typography>
                    </Box>
                  </Box>
                  <Grid container spacing={1.5}>
                    {areas.map((area) => {
                      const theme = AREA_THEMES[area];
                      const aColor = isDark ? theme?.colorDark : theme?.color;
                      return (
                        <Grid item xs={12} sm={6} md={4} key={area}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: `1px solid ${alpha(aColor || heroColor, 0.2)}`,
                              background: alpha(aColor || heroColor, 0.04),
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: aColor || heroColor,
                                letterSpacing: 0.6,
                                textTransform: "uppercase",
                                mb: 1,
                              }}
                            >
                              {theme?.emoji} {theme?.label || area}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 0.5,
                              }}
                            >
                              {byArea[area].map((g) => (
                                <Typography
                                  key={g.id}
                                  sx={{
                                    fontSize: 12,
                                    color: g.done ? textS : textP,
                                    textDecoration: g.done
                                      ? "line-through"
                                      : "none",
                                    opacity: g.done ? 0.55 : 1,
                                    lineHeight: 1.5,
                                    "&::before": {
                                      content: '"·  "',
                                      color: aColor || heroColor,
                                    },
                                  }}
                                >
                                  {g.title}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </CardContent>
              </Card>
            );
          })()}

        {/* ANALYTICS SECTION */}
        {(() => {
          const today = dayjs();
          const analyticsRangeDays =
            analyticsRange === "today"
              ? 1
              : analyticsRange === "week"
                ? today.diff(today.startOf("week").add(1, "day"), "day") + 1
                : analyticsRange === "month"
                  ? today.date()
                  : analyticsRange === "3m"
                    ? 90
                    : analyticsRange === "6m"
                      ? 180
                      : analyticsRange === "1y"
                        ? 365
                        : 30;
          return (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 2,
                  mt: 1,
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Fraunces",serif',
                    fontSize: 18,
                    fontWeight: 600,
                  }}
                >
                  Analytics
                </Typography>
                <ToggleButtonGroup
                  value={analyticsRange}
                  exclusive
                  onChange={(_, v) => v && setAnalyticsRange(v)}
                  size="small"
                  sx={{
                    background: isDark
                      ? "rgba(0,0,0,0.3)"
                      : "rgba(255,255,255,0.6)",
                    backdropFilter: "blur(8px)",
                    p: 0.4,
                    borderRadius: 2.5,
                    border: `1px solid ${border}`,
                    "& .MuiToggleButton-root": {
                      border: "none",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: 11,
                      color: textS,
                      px: 1.25,
                      py: 0.4,
                      "&.Mui-selected": {
                        background: alpha(heroColor, 0.15),
                        color: heroColor,
                      },
                    },
                  }}
                >
                  <ToggleButton value="today">Today</ToggleButton>
                  <ToggleButton value="week">This Week</ToggleButton>
                  <ToggleButton value="month">This Month</ToggleButton>
                  <ToggleButton value="3m">3 Months</ToggleButton>
                  <ToggleButton value="6m">6 Months</ToggleButton>
                  <ToggleButton value="1y">1 Year</ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <ReadingCard
                    books={books}
                    readingSessions={readingSessions}
                    isDark={isDark}
                    days={analyticsRangeDays}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <JapaCard
                    japaLogs={japaLogs}
                    japaGoals={japaGoals}
                    isDark={isDark}
                    days={analyticsRangeDays}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FinanceCard
                    financeLogs={financeLogs}
                    financeBudgets={financeBudgets}
                    isDark={isDark}
                    days={analyticsRangeDays}
                  />
                </Grid>
                <Grid item xs={12}>
                  <MovementCard
                    activityLogs={activityLogs}
                    latestWeightKg={latestWeightKg}
                    isDark={isDark}
                    days={analyticsRangeDays}
                  />
                </Grid>
              </Grid>
            </>
          );
        })()}
      </Box>

      <DayDialog
        date={selectedDate}
        dayData={dayMap[selectedDate]}
        isVacation={selectedDate ? vacationDays.has(selectedDate) : false}
        onClose={() => setSelectedDate(null)}
        heroColor={heroColor}
        isDark={isDark}
      />
    </Box>
  );
}
