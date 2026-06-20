import { createContext, useContext, useState, useMemo } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { createAppTheme } from '../theme/themeFactory'

// ── DEFAULT ACCENT TOKENS (Digital Ashram spec) ───────────────────────────────
const DEFAULT_PRIMARY = '#1e3a8a'    // Classic Blue
const DEFAULT_SECONDARY = '#b45309'  // Amber/Marigold

export const HERO_COLORS = [
  { name: 'Classic Blue',    value: '#1e3a8a' },
  { name: 'Amber',           value: '#C07830' },
  { name: 'Sienna',          value: '#A65D2E' },
  { name: 'Sage',            value: '#5A7A4F' },
  { name: 'Indigo',          value: '#3D5A9E' },
  { name: 'Teal',            value: '#2A7A6E' },
  { name: 'Plum',            value: '#7C4DAB' },
]

export const SECONDARY_PRESETS = [
  { name: 'Marigold',        value: '#b45309' },
  { name: 'Sienna',          value: '#A65D2E' },
  { name: 'Forest',          value: '#2D7A4F' },
  { name: 'Terracotta',      value: '#C07830' },
  { name: 'Plum',            value: '#7C4DAB' },
  { name: 'Rose',            value: '#B5446E' },
]

export const LAYOUT_THEMES = [
  { id: 'default', name: 'Parchment',        drawerBg: '#FFFFFF', appBg: '#F8F5EF', accent: '#C07830' },
  { id: 'saffron', name: 'Saffron Ashram',   drawerBg: '#2C1A0E', appBg: '#F0D9A8', accent: '#C07830' },
  { id: 'indigo',  name: 'Midnight Indigo',  drawerBg: '#0F1B35', appBg: '#D8E4F5', accent: '#2C4FA3' },
  { id: 'forest',  name: 'Forest Dharma',    drawerBg: '#172B1F', appBg: '#C8E0D0', accent: '#2D7A4F' },
  { id: 'plum',    name: 'Plum Dusk',        drawerBg: '#1E1030', appBg: '#D8CCF0', accent: '#7C4DAB' },
]

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  primaryColor: DEFAULT_PRIMARY,
  setPrimaryColor: () => {},
  secondaryColor: DEFAULT_SECONDARY,
  setSecondaryColor: () => {},
  heroColor: DEFAULT_PRIMARY,
  setHeroColor: () => {},
  layoutThemeId: 'default',
  setLayoutThemeId: () => {},
  HERO_COLORS,
  SECONDARY_PRESETS,
  LAYOUT_THEMES,
})

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('sv_theme') || 'light')

  const [primaryColor, setPrimaryColorState] = useState(
    () => localStorage.getItem('sv_primary') || localStorage.getItem('sv_hero') || DEFAULT_PRIMARY
  )
  const [secondaryColor, setSecondaryColorState] = useState(
    () => localStorage.getItem('sv_secondary') || DEFAULT_SECONDARY
  )
  const [layoutThemeId, setLayoutThemeIdState] = useState(
    () => localStorage.getItem('sv_layout_theme') || 'default'
  )

  const toggleTheme = () => {
    const next = mode === 'dark' ? 'light' : 'dark'
    setMode(next)
    localStorage.setItem('sv_theme', next)
  }

  const setPrimaryColor = (color) => {
    setPrimaryColorState(color)
    localStorage.setItem('sv_primary', color)
    localStorage.setItem('sv_hero', color) // keep legacy key for any cached reads
  }

  const setSecondaryColor = (color) => {
    setSecondaryColorState(color)
    localStorage.setItem('sv_secondary', color)
  }

  const setLayoutThemeId = (id) => {
    setLayoutThemeIdState(id)
    localStorage.setItem('sv_layout_theme', id)
  }

  // Dynamic theme: recreated whenever mode, primaryColor, or secondaryColor changes
  const theme = useMemo(
    () => createAppTheme(mode, primaryColor, secondaryColor),
    [mode, primaryColor, secondaryColor],
  )

  const value = {
    mode,
    toggleTheme,
    primaryColor,
    setPrimaryColor,
    secondaryColor,
    setSecondaryColor,
    heroColor: primaryColor,
    setHeroColor: setPrimaryColor,
    layoutThemeId,
    setLayoutThemeId,
    HERO_COLORS,
    SECONDARY_PRESETS,
    LAYOUT_THEMES,
  }

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export const useThemeMode = () => useContext(ThemeContext)
