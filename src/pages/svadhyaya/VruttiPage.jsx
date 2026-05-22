import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Grid, CircularProgress, Tabs, Tab } from "@mui/material";
import {
  AreaBanner, StatCard, LakshyaSection, AreaJournal, WeeklyGoals, TrackerLakshyaLink,
} from "../../components/shared/AreaComponents";
import SankalpaPurpose from "../../components/shared/SankalpaPurpose";
import VrittiTracker from "../tracker/VrittiTracker";
import { useAreaData } from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";
import { useAreaSubtitle } from "../../hooks/useAreaSubtitles";

const COLOR = "#1A5FB0";
const AREA = "career";

function VrttiBg({ isDark }) {
  const op = isDark ? 0.04 : 0.055;
  const nodes = [[300,80],[360,120],[320,170],[380,200],[340,250],[290,190],[260,130]];
  const edges = [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,0],[1,5],[3,5]];
  return (
    <svg width="420" height="300" viewBox="0 0 420 300" fill="none"
      style={{ position:"absolute",bottom:0,right:0,pointerEvents:"none",opacity:op }}>
      {edges.map(([a,b],i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={COLOR} strokeWidth="0.75" />
      ))}
      {nodes.map(([x,y],i) => (
        <rect key={i} x={x-4} y={y-4} width="8" height="8" fill={COLOR} opacity="0.5" rx="1" />
      ))}
      {[0,1,2,3,4].map((i) => (
        <line key={`h${i}`} x1="40" y1={60+i*50} x2="200" y2={60+i*50} stroke={COLOR} strokeWidth="0.4" strokeDasharray="4 6" opacity="0.6" />
      ))}
      {[0,1,2,3].map((i) => (
        <line key={`v${i}`} x1={60+i*46} y1="40" x2={60+i*46} y2="290" stroke={COLOR} strokeWidth="0.4" strokeDasharray="4 6" opacity="0.6" />
      ))}
    </svg>
  );
}

export default function VruttiPage() {
  const { lakshyas, loading, reload } = useAreaData(AREA);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const safeColor = isDark ? "#6AAEE8" : COLOR;
  const subtitle = useAreaSubtitle(AREA);
  const location = useLocation();
  const [tab, setTab] = useState(location.state?.tab ?? 0);

  const activeLakshyas = lakshyas.filter((l) => l.status === "active").length;
  const totalMilestones = lakshyas.reduce((acc,l) => acc + (l.siddhis?.length||0), 0);

  if (loading)
    return (
      <Box sx={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <CircularProgress sx={{ color: safeColor }} />
      </Box>
    );

  return (
    <Box sx={{ minHeight:"100vh",position:"relative",overflow:"hidden" }}>
      <VrttiBg isDark={isDark} />
      <Box sx={{ p:{xs:2,md:3} }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{
          mb:3,
          "& .MuiTab-root":{ textTransform:"none",fontWeight:600,fontSize:13,letterSpacing:0.3 },
          "& .Mui-selected":{ color:`${safeColor} !important` },
          "& .MuiTabs-indicator":{ bgcolor:safeColor },
        }}>
          <Tab label="🕉 Sankalpa" />
          <Tab label="🚀 Tracker" />
        </Tabs>

        {tab === 0 && (
          <>
            <AreaBanner color={safeColor} emoji="🚀" title="Vṛtti" subtitle={subtitle} />
            <SankalpaPurpose area={AREA} color={safeColor} isDark={isDark} />
            <Grid container spacing={2} sx={{ mb:3 }}>
              <Grid item xs={6}><StatCard value={activeLakshyas} label="Active Visions" color={safeColor} sub="Lakshyas" /></Grid>
              <Grid item xs={6}><StatCard value={totalMilestones} label="Milestones Set" color={safeColor} sub="Milestones" /></Grid>
            </Grid>
            <TrackerLakshyaLink area={AREA} color={safeColor} lakshyas={lakshyas} />
            <LakshyaSection area={AREA} color={safeColor} lakshyas={lakshyas} onUpdate={reload} />
            <AreaJournal area={AREA} color={safeColor} />
            <WeeklyGoals area={AREA} color={safeColor} />
          </>
        )}

        {tab === 1 && <VrittiTracker embedded />}
      </Box>
    </Box>
  );
}
