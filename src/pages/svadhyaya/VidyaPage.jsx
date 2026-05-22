import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Grid, CircularProgress, Tabs, Tab } from "@mui/material";
import {
  AreaBanner,
  StatCard,
  LakshyaSection,
  AreaJournal,
  WeeklyGoals,
  TrackerLakshyaLink,
} from "../../components/shared/AreaComponents";
import SankalpaPurpose from "../../components/shared/SankalpaPurpose";
import VidyaTracker from "../tracker/VidyaTracker";
import { useAreaData } from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";
import { useAreaSubtitle } from "../../hooks/useAreaSubtitles";

const COLOR = "#A0522D";
const AREA = "reading";

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
  const safeColor = isDark ? "#D4845A" : COLOR;
  const subtitle = useAreaSubtitle(AREA);
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab ?? 0);

  const activeLakshyas = lakshyas.filter((l) => l.status === "active").length;
  const totalMilestones = lakshyas.reduce(
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
        <CircularProgress sx={{ color: safeColor }} />
      </Box>
    );

  return (
    <Box sx={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <VidyaBg isDark={isDark} />
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              fontSize: 13,
              letterSpacing: 0.3,
            },
            "& .Mui-selected": { color: `${safeColor} !important` },
            "& .MuiTabs-indicator": { bgcolor: safeColor },
          }}
        >
          <Tab label="🕉 Sankalpa" />
          <Tab label="📚 Tracker" />
        </Tabs>

        {tab === 0 && (
          <>
            <AreaBanner
              color={safeColor}
              emoji="📚"
              title="Vidya"
              subtitle={subtitle}
            />
            <SankalpaPurpose area={AREA} color={safeColor} isDark={isDark} />
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <StatCard
                  value={activeLakshyas}
                  label="Active Visions"
                  color={safeColor}
                  sub="Lakshyas"
                />
              </Grid>
              <Grid item xs={6}>
                <StatCard
                  value={totalMilestones}
                  label="Milestones Set"
                  color={safeColor}
                  sub="Milestones"
                />
              </Grid>
            </Grid>
            <TrackerLakshyaLink area={AREA} color={safeColor} lakshyas={lakshyas} />
            <LakshyaSection
              area={AREA}
              color={safeColor}
              lakshyas={lakshyas}
              onUpdate={reload}
            />
            <AreaJournal area={AREA} color={safeColor} />
            <WeeklyGoals area={AREA} color={safeColor} />
          </>
        )}

        {tab === 1 && <VidyaTracker embedded />}
      </Box>
    </Box>
  );
}
