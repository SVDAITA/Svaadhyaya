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

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
  primaryColor: DEFAULT_PRIMARY,
  setPrimaryColor: () => {},
  secondaryColor: DEFAULT_SECONDARY,
  setSecondaryColor: () => {},
  heroColor: DEFAULT_PRIMARY,   // backward-compat alias for primaryColor
  setHeroColor: () => {},
  HERO_COLORS,
  SECONDARY_PRESETS,
})

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => localStorage.getItem('sv_theme') || 'light')

  // Reads old sv_hero key for seamless migration
  const [primaryColor, setPrimaryColorState] = useState(
    () => localStorage.getItem('sv_primary') || localStorage.getItem('sv_hero') || DEFAULT_PRIMARY
  )
  const [secondaryColor, setSecondaryColorState] = useState(
    () => localStorage.getItem('sv_secondary') || DEFAULT_SECONDARY
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
    heroColor: primaryColor,      // backward-compat alias
    setHeroColor: setPrimaryColor, // backward-compat alias
    HERO_COLORS,
    SECONDARY_PRESETS,
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
