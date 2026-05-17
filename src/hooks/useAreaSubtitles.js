import { useState, useEffect } from "react";

const DEFAULTS = {
  spirit:  "Your spiritual practice · daily ritual · long-term commitment",
  music:   "Your art form · skill-building · creative expression",
  health:  "Your health goal · current → target · the practice that sustains you",
  finance: "Your financial vision · debt-free date · wealth milestone",
  career:  "Your role · the level you're growing into · your professional path",
  reading: "Your reading practice · a goal · the habit that feeds your mind",
};

const key = (area) => `sv_subtitle_${area}`;

export const AREA_SUBTITLE_DEFAULTS = DEFAULTS;

export function getAreaSubtitle(area) {
  return localStorage.getItem(key(area)) || DEFAULTS[area] || "";
}

export function saveAreaSubtitles(map) {
  Object.entries(map).forEach(([area, value]) => {
    if (value && value.trim()) {
      localStorage.setItem(key(area), value.trim());
    } else {
      localStorage.removeItem(key(area));
    }
  });
  window.dispatchEvent(new Event("sv_subtitles_updated"));
}

export function useAreaSubtitle(area) {
  const [subtitle, setSubtitle] = useState(() => getAreaSubtitle(area));

  useEffect(() => {
    const sync = () => setSubtitle(getAreaSubtitle(area));
    window.addEventListener("sv_subtitles_updated", sync);
    return () => window.removeEventListener("sv_subtitles_updated", sync);
  }, [area]);

  return subtitle;
}
