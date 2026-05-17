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

const COLOR = "#7C4DAB";
const AREA = "music";

// Nāda — flowing sine wave / sound geometry
function NadamBg({ isDark }) {
  const op = isDark ? 0.045 : 0.06;
  return (
    <svg
      width="420"
      height="280"
      viewBox="0 0 420 280"
      fill="none"
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        pointerEvents: "none",
        opacity: op,
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          d={`M${-20 + i * 20} 240 C${60 + i * 20} ${180 - i * 18}, ${160 + i * 20} ${300 - i * 18}, ${240 + i * 20} 240 S${340 + i * 20} ${180 - i * 18}, ${420 + i * 20} 240`}
          stroke={COLOR}
          strokeWidth="1.5"
          fill="none"
        />
      ))}
      <circle
        cx="340"
        cy="100"
        r="60"
        stroke={COLOR}
        strokeWidth="1"
        fill="none"
      />
      <circle
        cx="340"
        cy="100"
        r="40"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle
        cx="340"
        cy="100"
        r="20"
        stroke={COLOR}
        strokeWidth="0.75"
        fill="none"
      />
      <circle cx="340" cy="100" r="5" fill={COLOR} opacity="0.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
        const r = (Math.PI * deg) / 180;
        return (
          <line
            key={i}
            x1={340 + 22 * Math.cos(r)}
            y1={100 + 22 * Math.sin(r)}
            x2={340 + 58 * Math.cos(r)}
            y2={100 + 58 * Math.sin(r)}
            stroke={COLOR}
            strokeWidth="0.5"
          />
        );
      })}
    </svg>
  );
}

export default function NadamPage() {
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
      <NadamBg isDark={isDark} />

      <AreaBanner
        color={COLOR}
        emoji="🎵"
        title="Nādam"
        subtitle={subtitle}
        quote="Through Nādam, we structure the silence."
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6}>
          <StatCard
            value={activeLakshyas}
            label="Active Visions"
            color={COLOR}
            sub="Lakshyas"
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
