import { useState, useEffect } from "react";

const DEFAULTS = {
  spirit:  "Daily practice · Purohitam · Gayatri · 10-year commitment",
  music:   "Carnatic vocal · Sangeeta Visharada · Composer · Teacher",
  health:  "91kg → 80kg · Visceral fat 13 → 9 · Body age 42 → 37",
  finance: "Debt-free May 2028 · ₹70L+ corpus by 2031 · Conscious Wealth",
  career:  "Salesforce Lead → Application Architect · AI Practitioner · Ethical Leader",
  reading: "300-book Library · UGC NET · 10 pages every night",
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
