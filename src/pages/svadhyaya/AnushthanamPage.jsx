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
import { useAreaData } from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";
import { useAreaSubtitle } from "../../hooks/useAreaSubtitles";

const COLOR = "#C07830";
const AREA = "spirit";

const LOG_TYPES = [
  { id: "purohitam", label: "Purohitam booking", hasValue: false },
  {
    id: "gayatri_count",
    label: "Gayatri count",
    hasValue: true,
    valueLabel: "Count",
    unit: "times",
  },
  {
    id: "ritual_learned",
    label: "Ritual learned",
    hasValue: true,
    valueLabel: "Ritual name",
  },
  {
    id: "abhishekam",
    label: "Special abhishekam",
    hasValue: true,
    valueLabel: "Deity / occasion",
  },
  { id: "mahapuja", label: "Mahapuja performed", hasValue: false },
  {
    id: "purohitam_income",
    label: "Purohitam income",
    hasValue: true,
    valueLabel: "Amount",
    unit: "₹",
  },
  { id: "note", label: "General note", hasValue: true, valueLabel: "Note" },
];

// Yantra — mandala + diamond geometry, spiritual
function AnushthanamBg({ isDark }) {
  const op = isDark ? 0.045 : 0.065;
  const cx = 350,
    cy = 150;
  const spokes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
    (deg, i) => {
      const r = (Math.PI * deg) / 180;
      return (
        <line
          key={i}
          x1={cx + 22 * Math.cos(r)}
          y1={cy + 22 * Math.sin(r)}
          x2={cx + 75 * Math.cos(r)}
          y2={cy + 75 * Math.sin(r)}
          stroke={COLOR}
          strokeWidth="0.5"
          opacity="0.8"
        />
      );
    },
  );
  const dots = [0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
    const r = (Math.PI * deg) / 180;
    return (
      <circle
        key={i}
        cx={cx + 62 * Math.cos(r)}
        cy={cy + 62 * Math.sin(r)}
        r="3"
        fill={COLOR}
        opacity="0.5"
      />
    );
  });
  return (
    <svg
      width="420"
      height="300"
      viewBox="0 0 420 300"
      fill="none"
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        pointerEvents: "none",
        opacity: op,
      }}
    >
      {/* Outer circles */}
      <circle
        cx={cx}
        cy={cy}
        r="88"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx={cx}
        cy={cy}
        r="70"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx={cx}
        cy={cy}
        r="50"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx={cx}
        cy={cy}
        r="30"
        stroke={COLOR}
        strokeWidth="1"
        fill="none"
      />
      <circle
        cx={cx}
        cy={cy}
        r="10"
        stroke={COLOR}
        strokeWidth="1"
        fill="none"
      />
      <circle cx={cx} cy={cy} r="4" fill={COLOR} opacity="0.6" />
      {spokes}
      {dots}
      {/* Diamond / navratna frame */}
      <path
        d={`M${cx} ${cy - 90} L${cx + 90} ${cy} L${cx} ${cy + 90} L${cx - 90} ${cy} Z`}
        stroke={COLOR}
        strokeWidth="0.6"
        fill="none"
      />
      <path
        d={`M${cx} ${cy - 65} L${cx + 65} ${cy} L${cx} ${cy + 65} L${cx - 65} ${cy} Z`}
        stroke={COLOR}
        strokeWidth="0.5"
        fill="none"
      />
      {/* Flame / deepam shape bottom left */}
      <path
        d="M60 260 C60 230 80 220 70 200 C85 215 90 235 80 260 Z"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <ellipse
        cx="70"
        cy="265"
        rx="14"
        ry="5"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
    </svg>
  );
}

export default function AnushthanamPage() {
  const { lakshyas, loading, reload } = useAreaData(AREA);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
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
      <AnushthanamBg isDark={isDark} />

      <AreaBanner
        color={COLOR}
        emoji="🪔"
        title="Anushthanam"
        subtitle={subtitle}
        quote="I am a devotee who shows up for my practice every single day — wherever I am, whatever the day brings."
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <StatCard
            value={activeLakshyas}
            label="Active Visions"
            color={COLOR}
            sub="Lakshyas"
          />
        </Grid>
        <Grid item xs={6} sm={4}>
          <StatCard
            value={totalSiddhis}
            label="Milestones Set"
            color={COLOR}
            sub="Siddhis"
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
            insight="On travel or disrupted days — the 5-minute minimum (Gayatri + deepam) keeps the chain unbroken. Pack the travel bag. Never break the practice."
          />
          <AreaLog area={AREA} color={COLOR} logTypes={LOG_TYPES} />
        </Grid>
      </Grid>
    </Box>
  );
}
