import { useState, useEffect } from "react";

const STORAGE_KEY = "sv_visibility";

const DEFAULTS = {
  areas: {
    spirit: true,
    music: true,
    health: true,
    finance: true,
    career: true,
    reading: true,
  },
  trackers: {
    finance: true,
    health: true,
    diet: true,
    reading: true,
    career: true,
    sacred: true,
    journey: true,
  },
};

export function getVisibility() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!stored) return DEFAULTS;
    return {
      areas: { ...DEFAULTS.areas, ...stored.areas },
      trackers: { ...DEFAULTS.trackers, ...stored.trackers },
    };
  } catch {
    return DEFAULTS;
  }
}

export function saveVisibility(vis) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vis));
  window.dispatchEvent(new Event("sv_visibility_updated"));
}

export function useVisibility() {
  const [vis, setVis] = useState(getVisibility);
  useEffect(() => {
    const sync = () => setVis(getVisibility());
    window.addEventListener("sv_visibility_updated", sync);
    return () => window.removeEventListener("sv_visibility_updated", sync);
  }, []);
  return vis;
}
