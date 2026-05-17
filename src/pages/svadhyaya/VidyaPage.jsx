import { Box, Grid, CircularProgress } from "@mui/material";
import {
  AreaBanner,
  StatCard,
  LakshyaSection,
  AreaJournal,
  WeeklyGoals,
} from "../../components/shared/AreaComponents";
import { useAreaData } from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";
import { useAreaSubtitle } from "../../hooks/useAreaSubtitles";

const COLOR = "#A0522D";
const AREA = "reading";

// Scroll / manuscript lines — scholar's motif
function VidyaBg({ isDark }) {
  const op = isDark ? 0.04 : 0.055;
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
      {/* Open book shape */}
      <path
        d="M180 240 Q220 200 260 240"
        stroke={COLOR}
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M180 240 L180 80 Q220 60 260 80 L260 240"
        stroke={COLOR}
        strokeWidth="1"
        fill="none"
      />
      <line
        x1="220"
        y1="65"
        x2="220"
        y2="240"
        stroke={COLOR}
        strokeWidth="1.5"
      />
      {/* Text lines on left page */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={`l${i}`}
          x1="188"
          y1={100 + i * 18}
          x2="216"
          y2={100 + i * 18}
          stroke={COLOR}
          strokeWidth="0.6"
          opacity="0.7"
        />
      ))}
      {/* Text lines on right page */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={`r${i}`}
          x1="224"
          y1={100 + i * 18}
          x2="252"
          y2={100 + i * 18}
          stroke={COLOR}
          strokeWidth="0.6"
          opacity="0.7"
        />
      ))}
      {/* Stacked books bottom right */}
      <rect
        x="310"
        y="220"
        width="80"
        height="12"
        rx="2"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <rect
        x="316"
        y="208"
        width="72"
        height="12"
        rx="2"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <rect
        x="322"
        y="196"
        width="64"
        height="12"
        rx="2"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      {/* Decorative Om / script mark */}
      <circle
        cx="370"
        cy="100"
        r="35"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx="370"
        cy="100"
        r="20"
        stroke={COLOR}
        strokeWidth="0.5"
        fill="none"
      />
      <circle cx="370" cy="100" r="5" fill={COLOR} opacity="0.35" />
    </svg>
  );
}

export default function VidyaPage() {
  const { lakshyas, loading, reload } = useAreaData(AREA);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const subtitle = useAreaSubtitle(AREA);

  const activeLakshyas = lakshyas.filter((l) => l.status === "active").length;
  const totalSiddhis = lakshyas.reduce(
    (acc, l) => acc + (l.siddhis?.length || 0),
    0,
  );

  if (loading)
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
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
        position: "relative",
        overflow: "hidden",
      }}
    >
      <VidyaBg isDark={isDark} />

      <AreaBanner color={COLOR} emoji="📖" title="Vidya" subtitle={subtitle} />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6}>
          <StatCard
            value={activeLakshyas}
            label="Active Visions"
            color={COLOR}
            sub="Education Lakshyas"
          />
        </Grid>
        <Grid item xs={6} sm={6}>
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

      <WeeklyGoals area={AREA} color={COLOR} />
    </Box>
  );
}
