import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
  Divider,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  keyframes,
  alpha,
} from "@mui/material";
import {
  Close,
  AccessTime,
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
import { SectionLabel } from "../../components/shared/AreaComponents";

// ── ANIMATIONS & STYLING ────────────────────────────────────────────────────
const fadeUp = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
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
  spirit: { label: "Anushthanam", color: "#C07830", colorDark: "#D4A830", emoji: "🪔" },
  music: { label: "Nādam", color: "#7C4DAB", colorDark: "#9B6CC4", emoji: "🎵" },
  health: { label: "Sharīram", color: "#2D7A4F", colorDark: "#5EC98A", emoji: "💪" },
  career: { label: "Vṛtti", color: "#1A5FB0", colorDark: "#6AAEE8", emoji: "🚀" },
  finance: { label: "Artha", color: "#1A7A6E", colorDark: "#4DC4B5", emoji: "💰" },
  reading: { label: "Vidyā", color: "#A0522D", colorDark: "#D4845A", emoji: "📖" },
};

const HABIT_LABELS = {
  anushthanam: "Anushthanam",
  riyaz: "Naada Saadhana",
  walk: "Vyaayamam",
  reading: "Pustaka Pathanam",
  office: "Office Work",
  academics: "Academics",
  logs: "Svaadhyaya Sync",
  gratitude: "Evening SET",
};

const SIDDHI_WEIGHTS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 12, 6: 18, 7: 25, 8: 35 };
const MAX_EXPECTED_MASS = 120;

// Vedic weekday names (0 = Sunday)
const VARA_NAMES = [
  "Ravivāra",
  "Somavāra",
  "Maṅgalavāra",
  "Budhavāra",
  "Guruvāra",
  "Śukravāra",
  "Śanivāra",
];

function calculateDailyMass(dayData) {
  if (!dayData?.habits) return 0;
  const habits = dayData.habits;
  const meta = dayData.habits_data || {};
  let totalMass = 0;
  Object.keys(habits).forEach((id) => {
    if (habits[id]) {
      const siddhiLevel = meta[id]?.satisfaction || 0;
      totalMass += 2 + (SIDDHI_WEIGHTS[siddhiLevel] || 0);
    }
  });
  return totalMass;
}

// FIXED: Handles current day pending state so streaks don't break at 8 AM.
// vacationDateSet: Set of "YYYY-MM-DD" strings from the vacations table date ranges.
function calcStreak(dayMap, habitId, vacationDateSet = new Set()) {
  let streak = 0;
  const todayStr = dayjs().format("YYYY-MM-DD");

  const isExempt = (dateStr) => {
    const day = dayMap[dateStr];
    return (
      day?.disruption_mode === "holiday" ||
      day?.disruption_mode === "vacation" ||
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
  const theme = AREA_THEMES[areaKey] || { label: areaKey, color: "#5C5A52", colorDark: "#9C9A94", emoji: "✨" };
  const safeColor = isDark ? (theme.colorDark || theme.color) : theme.color;
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
              sx={{ fontSize: 12, color: "#E05A2B", animation: `${pulseScale} 3s infinite` }}
            />
          )}
        </Box>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mb: lakshyaTitle ? 0.75 : 0 }}>
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
          <Typography sx={{ fontSize: 10, color: textS, fontWeight: 600, letterSpacing: 0.8 }}>
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

function DayDialog({ date, dayData, onClose, heroColor, isDark }) {
  if (!date) return null;
  const habits = dayData?.habits || {};
  const habitsData = dayData?.habits_data || {};
  const done = Object.entries(habits)
    .filter(([, v]) => v)
    .map(([k]) => k);
  const mass = calculateDailyMass(dayData);
  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";

  const completedData = done.map((k) => habitsData[k]).filter((d) => d?.hours);
  const avgSatisf =
    done.length > 0
      ? Math.round(
          done.reduce((s, k) => s + (habitsData[k]?.satisfaction || 4), 0) /
            done.length,
        )
      : null;
  const currentSiddhi = ASHTA_SIDDHI_SCALE.find((s) => s.value === avgSatisf);

  return (
    <Dialog
      open={!!date}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: "1px solid",
          borderColor: isDark ? alpha(heroColor, 0.2) : alpha(heroColor, 0.2),
          background: isDark ? "#121110" : "#FCFBF9",
          backgroundImage: ashramPattern,
          boxShadow: `0 24px 64px ${alpha(heroColor, isDark ? 0.2 : 0.1)}`,
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 3,
          pb: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontFamily: '"Fraunces",serif',
              fontSize: 22,
              fontWeight: 600,
              color: textP,
              lineHeight: 1.2,
            }}
          >
            {VARA_NAMES[dayjs(date).day()]}
          </Typography>
          <Typography
            sx={{ fontSize: 12, color: textS, fontWeight: 500, mb: 0.25 }}
          >
            {dayjs(date).format("dddd, D MMMM YYYY")}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: textS,
            bgcolor: alpha(textS, 0.1),
            "&:hover": { bgcolor: alpha(textS, 0.2) },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3, pt: 1 }}>
        <Box
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(heroColor, 0.1)} 0%, ${alpha(heroColor, 0.02)} 100%)`,
            border: `1px solid ${alpha(heroColor, 0.2)}`,
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              textTransform: "uppercase",
              letterSpacing: 2.5,
              color: heroColor,
              fontWeight: 800,
              display: "block",
              mb: 0.5,
            }}
          >
            Resonance Mass
          </Typography>
          <Typography
            sx={{
              fontFamily: '"Fraunces", serif',
              fontSize: 42,
              fontWeight: 700,
              color: textP,
              lineHeight: 1,
            }}
          >
            {mass}
          </Typography>
        </Box>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.08)",
                textAlign: "center",
                background: alpha(textS, 0.03),
              }}
            >
              <AccessTime sx={{ fontSize: 18, color: textS, mb: 0.5 }} />
              <Typography
                sx={{
                  fontSize: 10,
                  color: textS,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                Work
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: textP }}>
                {completedData
                  .reduce((s, d) => s + (d.hours || 0), 0)
                  .toFixed(1)}
                h
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                border: "1px solid",
                borderColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.08)",
                textAlign: "center",
                background: alpha(textS, 0.03),
              }}
            >
              <Typography sx={{ fontSize: 18, mb: 0.5 }}>
                {currentSiddhi?.emoji || "—"}
              </Typography>
              <Typography
                sx={{
                  fontSize: 10,
                  color: textS,
                  textTransform: "uppercase",
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                Avg Level
              </Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: textP }}>
                {currentSiddhi?.name || "N/A"}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <SectionLabel>Activities</SectionLabel>
        <Box sx={{ mt: 1 }}>
          {done.length === 0 ? (
            <Typography
              variant="body2"
              sx={{
                fontStyle: "italic",
                color: "text.disabled",
                p: 2,
                textAlign: "center",
                bgcolor: alpha(textS, 0.05),
                borderRadius: 2,
              }}
            >
              No practice recorded.
            </Typography>
          ) : (
            done.map((k) => (
              <Box
                key={k}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  py: 1.5,
                  borderBottom: "1px solid",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(0,0,0,0.05)",
                }}
              >
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: heroColor,
                    boxShadow: `0 0 8px ${heroColor}`,
                  }}
                />
                <Typography
                  sx={{ fontSize: 14, color: textP, flex: 1, fontWeight: 500 }}
                >
                  {HABIT_LABELS[k] || k}
                </Typography>
                {habitsData[k]?.satisfaction && (
                  <Chip
                    label={`${ASHTA_SIDDHI_SCALE.find((s) => s.value === habitsData[k].satisfaction)?.emoji} Level ${habitsData[k].satisfaction}`}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: 11,
                      fontWeight: 600,
                      background: alpha(heroColor, 0.1),
                      color: textP,
                      border: `1px solid ${alpha(heroColor, 0.2)}`,
                    }}
                  />
                )}
              </Box>
            ))
          )}
        </Box>
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

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { heroColor, mode } = useThemeMode();
  const isDark = mode === "dark";
  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [dayMap, setDayMap] = useState({});
  const [dynamicStreaks, setDynamicStreaks] = useState([]);
  const [lakshyas, setLakshyas] = useState([]);
  const [todayAnshs, setTodayAnshs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const textP = isDark ? "#F0EDE8" : "#2C2C2C";
  const textS = isDark ? "#7A7874" : "#9C9A94";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const cardBg = isDark ? "rgba(26,25,22,0.6)" : "rgba(255,255,255,0.7)";

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data: days } = await supabase
      .from("days")
      .select("*")
      .eq("user_id", user.id)
      .order("day_date");
    const map = {};
    days?.forEach((d) => {
      map[d.day_date] = d;
    });
    setDayMap(map);

    const [{ data: lData }, { data: anshData }, { data: vacData }] = await Promise.all([
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
        .select("from_date, to_date")
        .eq("user_id", user.id),
    ]);
    setLakshyas(lData || []);
    setTodayAnshs(anshData || []);

    // Build a Set of every date string covered by any vacation range.
    const vacationDateSet = new Set();
    (vacData || []).forEach(({ from_date, to_date }) => {
      let cur = dayjs(from_date);
      const end = dayjs(to_date);
      while (!cur.isAfter(end)) {
        vacationDateSet.add(cur.format("YYYY-MM-DD"));
        cur = cur.add(1, "day");
      }
    });

    // AREA_HABIT_MAP — maps life pillar to the default habit task ID it tracks.
    // These IDs match the locked task ids defined in DEFAULT_SACRED/CORE on TodayPage.
    const AREA_HABIT_MAP = {
      spirit:  "anushthanam",
      music:   "riyaz",
      health:  "walk",
      career:  "office",
      finance: "logs",
      reading: "reading",
    };
    const activeLakshyas = lData || [];
    setDynamicStreaks(
      Object.entries(AREA_HABIT_MAP).map(([area, habitId]) => {
        const linked = activeLakshyas.find((l) => l.pillar === area);
        return {
          area,
          habitId,
          count: calcStreak(map, habitId, vacationDateSet),
          lakshyaTitle: linked?.title || null,
        };
      }),
    );
    // Artifical delay for smooth aesthetic loading
    setTimeout(() => setLoading(false), 400);
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

          return (
            <Tooltip
              key={dateStr}
              title={`${dayjs(dateStr).format("D MMM")} · Mass ${mass}`}
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
                  aspectRatio: "1/1",
                  width: "100%",
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)",
                  position: "relative",
                  background:
                    mass > 0
                      ? heroColor
                      : isDark
                        ? "rgba(255,255,255,0.03)"
                        : "rgba(0,0,0,0.03)",
                  opacity: mass > 0 ? 0.2 + intensity * 0.8 : 1,
                  boxShadow:
                    mass > 60 ? `0 4px 12px ${alpha(heroColor, 0.4)}` : "none",
                  outline: isToday ? `2px solid ${heroColor}` : "none",
                  outlineOffset: "3px",
                  "&:hover": {
                    transform: "scale(1.15)",
                    zIndex: 10,
                    boxShadow: `0 8px 16px ${alpha(heroColor, 0.5)}`,
                  },
                }}
              >
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
                    border: `1px solid ${isToday ? heroColor : border}`,
                    background: isToday
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
                        bgcolor: heroColor,
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
              <Box component="span" sx={{ fontSize: 14, lineHeight: 1 }}>{greeting.icon}</Box>
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
              Progress
            </Typography>
          </Box>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, v) => v && setViewMode(v)}
            size="small"
            sx={{
              background: isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
              backdropFilter: "blur(10px)",
              p: 0.5,
              borderRadius: 3,
              border: `1px solid ${border}`,
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                color: textS,
                px: 2,
                "&.Mui-selected": {
                  background: alpha(heroColor, 0.15),
                  color: heroColor,
                },
              },
            }}
          >
            <ToggleButton value="week">
              <ViewWeek sx={{ fontSize: 18, mr: 1 }} /> Week
            </ToggleButton>
            <ToggleButton value="month">
              <CalendarMonth sx={{ fontSize: 18, mr: 1 }} /> Month
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

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

        {/* MAIN METRICS */}
        <Grid container spacing={3}>
          {/* CALENDAR/WEEK VIEW */}
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                border: `1px solid ${border}`,
                borderRadius: 2.5,
                background: cardBg,
                boxShadow: "none",
                animation: `${fadeUp} 0.5s ease 0.1s both`,
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 4,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        background: alpha(heroColor, 0.1),
                        color: heroColor,
                      }}
                    >
                      <Insights sx={{ fontSize: 20 }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: '"Lora","Fraunces", serif',
                        fontSize: 16,
                        fontWeight: 600,
                      }}
                    >
                      {viewMode === "month"
                        ? currentDate.format("MMMM YYYY")
                        : "Current Pulse"}
                    </Typography>
                  </Box>
                  {viewMode === "month" && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setCurrentDate(currentDate.subtract(1, "month"))
                        }
                        sx={{ border: `1px solid ${border}` }}
                      >
                        <ChevronLeft />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setCurrentDate(currentDate.add(1, "month"))
                        }
                        sx={{ border: `1px solid ${border}` }}
                      >
                        <ChevronRight />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                {viewMode === "month" ? renderMonthView() : renderWeekView()}
              </CardContent>
            </Card>
          </Grid>

          {/* LAKSHYA (GOALS) CONSTELLATION */}
          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                border: `1px solid ${border}`,
                borderRadius: 2.5,
                background: cardBg,
                boxShadow: "none",
                height: "100%",
                animation: `${fadeUp} 0.5s ease 0.15s both`,
              }}
            >
              <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 4,
                  }}
                >
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      background: alpha(heroColor, 0.1),
                      color: heroColor,
                    }}
                  >
                    <AutoGraph sx={{ fontSize: 20 }} />
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces", serif',
                      fontSize: 22,
                      fontWeight: 600,
                    }}
                  >
                    Constellation
                  </Typography>
                </Box>

                {lakshyas.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 6,
                      px: 2,
                      border: `1px dashed ${border}`,
                      borderRadius: 3,
                      bgcolor: alpha(textS, 0.03),
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: textS, fontStyle: "italic", mb: 2 }}
                    >
                      The sky is empty. Establish a Lakshya to map your stars
                      here.
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    {lakshyas.map((l, idx) => {
                      const siddhis = l.siddhis || [];
                      const activeSiddhis = siddhis.filter((s) => s.status !== "completed");
                      const completedSiddhis = siddhis.filter((s) => s.status === "completed");
                      const avg =
                        siddhis.length > 0
                          ? Math.round(
                              siddhis.reduce(
                                (s, d) => s + (d.progress_percent || 0),
                                0,
                              ) / siddhis.length,
                            )
                          : 0;
                      // Count active Anshs for this Lakshya from today's load
                      const lakshyaAnshs = todayAnshs.filter((a) => a.lakshya_id === l.id);
                      const doneAnshs = lakshyaAnshs.filter((a) => a.status === "completed").length;
                      const pillarTheme = Object.values(AREA_THEMES).find(
                        (t, i) => Object.keys(AREA_THEMES)[i] === l.pillar,
                      ) || { color: heroColor, emoji: "🎯" };

                      return (
                        <Box
                          key={l.id}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            animation: `${fadeUp} 0.4s ease-out ${0.6 + idx * 0.1}s both`,
                          }}
                        >
                          <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
                            <CircularProgress
                              variant="determinate"
                              value={100}
                              size={44}
                              thickness={4}
                              sx={{ color: alpha(textS, 0.1) }}
                            />
                            <CircularProgress
                              variant="determinate"
                              value={avg}
                              size={44}
                              thickness={4}
                              sx={{
                                color: (isDark ? AREA_THEMES[l.pillar]?.colorDark : AREA_THEMES[l.pillar]?.color) || heroColor,
                                position: "absolute",
                                left: 0,
                                strokeLinecap: "round",
                              }}
                            />
                            <Box
                              sx={{
                                top: 0, left: 0, bottom: 0, right: 0,
                                position: "absolute",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontSize: 10, fontWeight: 800, color: textP }}
                              >
                                {avg}%
                              </Typography>
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: textP,
                                mb: 0.4,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {l.title}
                            </Typography>
                            {/* Siddhi progress */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                              {siddhis.length > 0 && (
                                <Typography
                                  sx={{ fontSize: 10, color: textS, fontWeight: 500 }}
                                >
                                  {completedSiddhis.length}/{siddhis.length} milestones
                                </Typography>
                              )}
                              {lakshyaAnshs.length > 0 && (
                                <Typography
                                  sx={{
                                    fontSize: 10,
                                    color: (isDark ? AREA_THEMES[l.pillar]?.colorDark : AREA_THEMES[l.pillar]?.color) || heroColor,
                                    fontWeight: 600,
                                  }}
                                >
                                  · {doneAnshs}/{lakshyaAnshs.length} anshs
                                </Typography>
                              )}
                            </Box>
                            {/* Active Siddhi name — first incomplete one */}
                            {activeSiddhis[0] && (
                              <Typography
                                sx={{
                                  fontSize: 9,
                                  color: textS,
                                  mt: 0.3,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                  fontStyle: "italic",
                                }}
                              >
                                ↳ {activeSiddhis[0].title}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      <DayDialog
        date={selectedDate}
        dayData={dayMap[selectedDate]}
        onClose={() => setSelectedDate(null)}
        heroColor={heroColor}
        isDark={isDark}
      />
    </Box>
  );
}
