import { useState } from "react";
import { Box, Grid, CircularProgress, Tabs, Tab } from "@mui/material";
import {
  AreaBanner, StatCard, LakshyaSection, AreaJournal, WeeklyGoals,
} from "../../components/shared/AreaComponents";
import SankalpaPurpose from "../../components/shared/SankalpaPurpose";
import ShariramTracker from "../tracker/ShariramTracker";
import { useAreaData } from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";
import { useAreaSubtitle } from "../../hooks/useAreaSubtitles";

const COLOR = "#2D7A4F";
const AREA = "health";

function ShariramBg({ isDark }) {
  const op = isDark ? 0.04 : 0.055;
  const petals = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * 45 * Math.PI) / 180;
    const cx = 340 + 55 * Math.cos(angle), cy = 140 + 55 * Math.sin(angle);
    return <ellipse key={i} cx={cx} cy={cy} rx="22" ry="10" transform={`rotate(${i*45}, ${cx}, ${cy})`} stroke={COLOR} strokeWidth="0.75" fill="none" />;
  });
  return (
    <svg width="400" height="320" viewBox="0 0 400 320" fill="none"
      style={{ position:"absolute",bottom:0,right:0,pointerEvents:"none",opacity:op }}>
      {petals}
      <circle cx="340" cy="140" r="70" stroke={COLOR} strokeWidth="0.75" fill="none" />
      <circle cx="340" cy="140" r="45" stroke={COLOR} strokeWidth="0.75" fill="none" />
      <circle cx="340" cy="140" r="22" stroke={COLOR} strokeWidth="1" fill="none" />
      <circle cx="340" cy="140" r="6" fill={COLOR} opacity="0.4" />
      <line x1="50" y1="280" x2="50" y2="80" stroke={COLOR} strokeWidth="0.5" strokeDasharray="3 4" />
      <line x1="70" y1="280" x2="70" y2="100" stroke={COLOR} strokeWidth="0.5" strokeDasharray="3 4" />
      <line x1="90" y1="280" x2="90" y2="90" stroke={COLOR} strokeWidth="0.5" strokeDasharray="3 4" />
    </svg>
  );
}

export default function ShariramPage() {
  const { lakshyas, loading, reload } = useAreaData(AREA);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const safeColor = isDark ? "#5EC98A" : COLOR;
  const subtitle = useAreaSubtitle(AREA);
  const [tab, setTab] = useState(0);

  const activeLakshyas = lakshyas.filter((l) => l.status === "active").length;
  const totalSiddhis = lakshyas.reduce((acc,l) => acc + (l.siddhis?.length||0), 0);

  if (loading)
    return (
      <Box sx={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <CircularProgress sx={{ color: safeColor }} />
      </Box>
    );

  return (
    <Box sx={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
      <ShariramBg isDark={isDark} />
      <Box sx={{ p:{xs:2,md:3} }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{
          mb:3,
          "& .MuiTab-root":{ textTransform:"none",fontWeight:600,fontSize:13,letterSpacing:0.3 },
          "& .Mui-selected":{ color:`${safeColor} !important` },
          "& .MuiTabs-indicator":{ bgcolor:safeColor },
        }}>
          <Tab label="🕉 Sankalpa" />
          <Tab label="💪 Tracker" />
        </Tabs>

        {tab === 0 && (
          <>
            <AreaBanner color={safeColor} emoji="💪" title="Sharīram" subtitle={subtitle} />
            <SankalpaPurpose area={AREA} color={safeColor} isDark={isDark} />
            <Grid container spacing={2} sx={{ mb:3 }}>
              <Grid item xs={6}><StatCard value={activeLakshyas} label="Active Visions" color={safeColor} sub="Lakshyas" /></Grid>
              <Grid item xs={6}><StatCard value={totalSiddhis} label="Milestones Set" color={safeColor} sub="Siddhis" /></Grid>
            </Grid>
            <LakshyaSection area={AREA} color={safeColor} lakshyas={lakshyas} onUpdate={reload} />
            <AreaJournal area={AREA} color={safeColor} />
            <WeeklyGoals area={AREA} color={safeColor} />
          </>
        )}

        {tab === 1 && <ShariramTracker embedded />}
      </Box>
    </Box>
  );
}
