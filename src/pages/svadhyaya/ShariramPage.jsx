import { Box, Grid, CircularProgress } from "@mui/material";
import {
  AreaBanner,
  StatCard,
  LakshyaSection,
  AreaJournal,
  WeeklyGoals,
  AreaLog,
  InsightCard,
} from "../../components/shared/AreaComponents";
import {
  useAreaData,
  useHabitStreak,
  useWeekCompletion,
} from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";
import { useAreaSubtitle } from "../../hooks/useAreaSubtitles";

const COLOR = "#2D7A4F";
const AREA = "health";

const LOG_TYPES = [
  {
    id: "weight",
    label: "Weight",
    hasValue: true,
    valueLabel: "Weight",
    unit: "kg",
  },
  {
    id: "belly",
    label: "Belly girth (navel)",
    hasValue: true,
    valueLabel: "Measurement",
    unit: "inches",
  },
  {
    id: "waist",
    label: "Waist",
    hasValue: true,
    valueLabel: "Measurement",
    unit: "inches",
  },
  {
    id: "visceral_fat",
    label: "Visceral fat score",
    hasValue: true,
    valueLabel: "Score",
  },
  {
    id: "body_age",
    label: "Body age",
    hasValue: true,
    valueLabel: "Age shown",
  },
  {
    id: "workout",
    label: "Cult Home workout",
    hasValue: true,
    valueLabel: "Session type + duration",
  },
  { id: "diet_compliance", label: "Diet compliance today", hasValue: false },
  { id: "ate_by_9pm", label: "Finished eating by 9pm", hasValue: false },
  {
    id: "note",
    label: "General health note",
    hasValue: true,
    valueLabel: "Note",
  },
];

// Lotus / radial body geometry
function ShariramBg({ isDark }) {
  const op = isDark ? 0.04 : 0.055;
  const petals = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    const cx = 340 + 55 * Math.cos(angle),
      cy = 140 + 55 * Math.sin(angle);
    return (
      <ellipse
        key={i}
        cx={cx}
        cy={cy}
        rx="22"
        ry="10"
        transform={`rotate(${i * 45}, ${cx}, ${cy})`}
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
    );
  });
  return (
    <svg
      width="400"
      height="320"
      viewBox="0 0 400 320"
      fill="none"
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        pointerEvents: "none",
        opacity: op,
      }}
    >
      {petals}
      <circle
        cx="340"
        cy="140"
        r="70"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx="340"
        cy="140"
        r="45"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx="340"
        cy="140"
        r="22"
        stroke={COLOR}
        strokeWidth="1"
        fill="none"
      />
      <circle cx="340" cy="140" r="6" fill={COLOR} opacity="0.4" />
      {/* Body silhouette lines */}
      <line
        x1="50"
        y1="280"
        x2="50"
        y2="80"
        stroke={COLOR}
        strokeWidth="0.5"
        strokeDasharray="3 4"
      />
      <line
        x1="70"
        y1="280"
        x2="70"
        y2="100"
        stroke={COLOR}
        strokeWidth="0.5"
        strokeDasharray="3 4"
      />
      <line
        x1="90"
        y1="280"
        x2="90"
        y2="90"
        stroke={COLOR}
        strokeWidth="0.5"
        strokeDasharray="3 4"
      />
    </svg>
  );
}

export default function ShariramPage() {
  const { lakshyas, loading, reload } = useAreaData(AREA);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const walkStreak = useHabitStreak("walk");
  const weekPct = useWeekCompletion(["walk", "healthy_eating"]);
  const subtitle = useAreaSubtitle(AREA);

  const activeLakshyas = lakshyas.filter((l) => l.status === "active").length;
  const totalSiddhis = lakshyas.reduce(
    (acc, l) => acc + (l.siddhis?.length || 0),
    0,
  );

  const bg = isDark
    ? `radial-gradient(ellipse 90% 35% at 50% -5%, ${COLOR}08 0%, #0D0C0A 65%)`
    : `radial-gradient(ellipse 90% 35% at 50% -5%, ${COLOR}10 0%, #F8FAFC 65%)`;

  if (loading)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: bg,
        }}
      >
        <CircularProgress sx={{ color: COLOR }} />
      </Box>
    );

  return (
    <Box
      sx={{
        p: { xs: 2, md: 4 },
        maxWidth: 900,
        mx: "auto",
        minHeight: "100vh",
        background: bg,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <ShariramBg isDark={isDark} />

      <AreaBanner
        color={COLOR}
        emoji="💪"
        title="Sharīram"
        subtitle={subtitle}
        quote="The body is the primary instrument of dharma. Treat it with the same devotion you give your riyaz."
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            value={`${walkStreak}d`}
            label="Walk Streak"
            color={COLOR}
            sub="3km daily"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            value={activeLakshyas}
            label="Active Visions"
            color={COLOR}
            sub="Lakshyas"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            value={totalSiddhis}
            label="Milestones Set"
            color={COLOR}
            sub="Siddhis"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            value={`${weekPct}%`}
            label="This Week"
            color={weekPct >= 80 ? COLOR : "#C07830"}
          />
        </Grid>
      </Grid>

      <LakshyaSection
        area={AREA}
        color={COLOR}
        lakshyas={lakshyas}
        onUpdate={reload}
      />
      <AreaJournal area={AREA} color={COLOR} />

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <WeeklyGoals area={AREA} color={COLOR} />
        </Grid>
        <Grid item xs={12} md={6}>
          <InsightCard
            color={COLOR}
            insight="Muscle mass is exceptional — the goal is purely fat reduction. The 10-min core routine directly targets visceral fat. Walk streak is your identity anchor; even 10 mins on hard days keeps the chain."
          />
          <AreaLog area={AREA} color={COLOR} logTypes={LOG_TYPES} />
        </Grid>
      </Grid>
    </Box>
  );
}
