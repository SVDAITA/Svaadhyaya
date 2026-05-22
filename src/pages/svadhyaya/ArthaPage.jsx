import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, Grid, CircularProgress, Tabs, Tab } from "@mui/material";
import {
  AreaBanner, StatCard, LakshyaSection, AreaJournal, WeeklyGoals, TrackerLakshyaLink,
} from "../../components/shared/AreaComponents";
import SankalpaPurpose from "../../components/shared/SankalpaPurpose";
import ArthaTracker from "../tracker/ArthaTracker";
import { useAreaData } from "../../hooks/useAreaData";
import { useThemeMode } from "../../hooks/useTheme";
import { useAreaSubtitle } from "../../hooks/useAreaSubtitles";

const COLOR = "#1A7A6E";
const AREA = "finance";

function ArthaBg({ isDark }) {
  const op = isDark ? 0.04 : 0.055;
  const cx = 340, cy = 150, R = 80;
  const triangles = [
    [[cx,cy-R],[cx-R*0.87,cy+R*0.5],[cx+R*0.87,cy+R*0.5]],
    [[cx,cy-R*0.65],[cx-R*0.56,cy+R*0.32],[cx+R*0.56,cy+R*0.32]],
    [[cx,cy+R],[cx-R*0.87,cy-R*0.5],[cx+R*0.87,cy-R*0.5]],
    [[cx,cy+R*0.65],[cx-R*0.56,cy-R*0.32],[cx+R*0.56,cy-R*0.32]],
  ];
  return (
    <svg width="400" height="300" viewBox="0 0 400 300" fill="none"
      style={{ position:"absolute",bottom:0,right:0,pointerEvents:"none",opacity:op }}>
      <circle cx={cx} cy={cy} r={R+12} stroke={COLOR} strokeWidth="0.75" fill="none" />
      <circle cx={cx} cy={cy} r={R+24} stroke={COLOR} strokeWidth="0.5" fill="none" />
      {triangles.map((pts,i) => (
        <polygon key={i} points={pts.map(([x,y])=>`${x},${y}`).join(" ")} stroke={COLOR} strokeWidth="0.75" fill="none" />
      ))}
      <circle cx={cx} cy={cy} r="6" fill={COLOR} opacity="0.4" />
      {[0,1,2].map((i) => (
        <circle key={`c${i}`} cx={50+i*36} cy={250} r={14-i*2} stroke={COLOR} strokeWidth="0.75" fill="none" />
      ))}
    </svg>
  );
}

export default function ArthaPage() {
  const { lakshyas, loading, reload } = useAreaData(AREA);
  const { mode } = useThemeMode();
  const isDark = mode === "dark";
  const safeColor = isDark ? "#4DC4B5" : COLOR;
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
      <ArthaBg isDark={isDark} />
      <Box sx={{ p:{xs:2,md:3} }}>
        <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{
          mb:3,
          "& .MuiTab-root":{ textTransform:"none",fontWeight:600,fontSize:13,letterSpacing:0.3 },
          "& .Mui-selected":{ color:`${safeColor} !important` },
          "& .MuiTabs-indicator":{ bgcolor:safeColor },
        }}>
          <Tab label="🕉 Sankalpa" />
          <Tab label="💰 Tracker" />
        </Tabs>

        {tab === 0 && (
          <>
            <AreaBanner color={safeColor} emoji="💰" title="Artha" subtitle={subtitle} />
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

        {tab === 1 && <ArthaTracker embedded />}
      </Box>
    </Box>
  );
}
