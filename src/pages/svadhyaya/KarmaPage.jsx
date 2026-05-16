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

const COLOR = "#1A5FB0";
const AREA = "career";

const LOG_TYPES = [
  {
    id: "learning",
    label: "Learning captured today",
    hasValue: true,
    valueLabel: "What I learned",
  },
  {
    id: "adr",
    label: "ADR written",
    hasValue: true,
    valueLabel: "Decision title",
  },
  { id: "friday_note", label: "Friday Architecture Note", hasValue: false },
  {
    id: "cert_progress",
    label: "Certification progress",
    hasValue: true,
    valueLabel: "Cert + % done",
  },
  {
    id: "project_win",
    label: "Project win",
    hasValue: true,
    valueLabel: "What I built + impact",
  },
  {
    id: "junior_coaching",
    label: "Junior coached",
    hasValue: true,
    valueLabel: "What was discussed",
  },
  {
    id: "client_feedback",
    label: "Client feedback received",
    hasValue: true,
    valueLabel: "Feedback",
  },
];

// Circuit / tech grid geometry
function VrttiBg({ isDark }) {
  const op = isDark ? 0.04 : 0.055;
  const nodes = [
    [300, 80],
    [360, 120],
    [320, 170],
    [380, 200],
    [340, 250],
    [290, 190],
    [260, 130],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [2, 5],
    [5, 6],
    [6, 0],
    [1, 5],
    [3, 5],
  ];
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
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a][0]}
          y1={nodes[a][1]}
          x2={nodes[b][0]}
          y2={nodes[b][1]}
          stroke={COLOR}
          strokeWidth="0.75"
        />
      ))}
      {nodes.map(([x, y], i) => (
        <rect
          key={i}
          x={x - 4}
          y={y - 4}
          width="8"
          height="8"
          fill={COLOR}
          opacity="0.5"
          rx="1"
        />
      ))}
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`h${i}`}
          x1="40"
          y1={60 + i * 50}
          x2="200"
          y2={60 + i * 50}
          stroke={COLOR}
          strokeWidth="0.4"
          strokeDasharray="4 6"
          opacity="0.6"
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <line
          key={`v${i}`}
          x1={60 + i * 46}
          y1="40"
          x2={60 + i * 46}
          y2="290"
          stroke={COLOR}
          strokeWidth="0.4"
          strokeDasharray="4 6"
          opacity="0.6"
        />
      ))}
    </svg>
  );
}

export default function VruttiPage() {
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
      <VrttiBg isDark={isDark} />

      <AreaBanner
        color={COLOR}
        emoji="🚀"
        title="Vṛtti"
        subtitle={subtitle}
        quote="I am a great manager and leader — who develops people, creates opportunities, and leaves every team better than I found it."
      />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4}>
          <StatCard
            value={activeLakshyas}
            label="Active Horizons"
            color={COLOR}
            sub="Career Lakshyas"
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
            insight="Think like the person you want to be promoted to — starting today. The title follows the behaviour. Write an ADR for every significant decision. Send the Friday Architecture Note every week without exception."
          />
          <AreaLog area={AREA} color={COLOR} logTypes={LOG_TYPES} />
        </Grid>
      </Grid>
    </Box>
  );
}
