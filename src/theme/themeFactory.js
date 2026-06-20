import { createTheme } from '@mui/material/styles'

// ── COLOR MATH (WCAG-compliant contrast engine) ───────────────────────────────

function clamp(val) { return Math.min(255, Math.max(0, Math.round(val))) }

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(c => clamp(c).toString(16).padStart(2, '0')).join('')
}

function toLinear(c) {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1), l2 = getLuminance(hex2)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

export function getContrastText(bgHex) {
  const onWhite = getContrastRatio(bgHex, '#ffffff')
  const onDark = getContrastRatio(bgHex, '#0f172a')
  return onWhite >= onDark ? '#ffffff' : '#0f172a'
}

export function darkenColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r * (1 - amount), g * (1 - amount), b * (1 - amount))
}

export function lightenColor(hex, amount) {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex(r + (255 - r) * amount, g + (255 - g) * amount, b + (255 - b) * amount)
}

function blendColors(hex1, hex2, amount) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2)
  return rgbToHex(c1.r + (c2.r - c1.r) * amount, c1.g + (c2.g - c1.g) * amount, c1.b + (c2.b - c1.b) * amount)
}

// ── PILLAR CONSTANTS ──────────────────────────────────────────────────────────
export const SPIRIT = '#C07830'
export const MUSIC = '#7C4DAB'
export const HEALTH = '#2D7A4F'
export const CAREER = '#1A5FB0'
export const FINANCE = '#1A7A6E'
export const READING = '#A0522D'
export const FAMILY = '#B5446E'
export const pillars = { spirit: SPIRIT, music: MUSIC, health: HEALTH, career: CAREER, finance: FINANCE, reading: READING, family: FAMILY }

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const BG_LIGHT = '#f8fafc'
const PAPER_LIGHT = '#ffffff'
const TEXT_PRIMARY_LIGHT = '#0f172a'
const TEXT_SECONDARY_LIGHT = '#475569'

const BG_DARK = '#0f172a'
const PAPER_DARK = '#1e293b'
const TEXT_PRIMARY_DARK = '#f8fafc'
const TEXT_SECONDARY_DARK = '#94a3b8'

const FLUID_TRANSITION = 'background-color 0.3s ease-in-out, color 0.3s ease-in-out, border-color 0.3s ease-in-out'

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────────
const typography = {
  fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
  h1: { fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, letterSpacing: '-0.5px' },
  h2: { fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, letterSpacing: '-0.5px' },
  h3: { fontFamily: '"Fraunces","Lora",serif', fontWeight: 400 },
  h4: { fontFamily: '"Fraunces","Lora",serif', fontWeight: 400 },
  h5: { fontFamily: '"Fraunces","Lora",serif', fontWeight: 400 },
  h6: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontWeight: 600 },
  subtitle1: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontWeight: 500 },
  subtitle2: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontWeight: 500 },
  body1: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontWeight: 400, fontSize: '0.9rem' },
  body2: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontWeight: 400, fontSize: '0.825rem' },
  button: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontWeight: 500, textTransform: 'none', letterSpacing: 0.2 },
  caption: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontSize: '0.75rem' },
  overline: { fontFamily: '"Plus Jakarta Sans",sans-serif', letterSpacing: 2, fontWeight: 600, fontSize: '0.68rem' },
}

// ── THEME FACTORY ─────────────────────────────────────────────────────────────
export function createAppTheme(
  mode = 'light',
  primaryColor = '#1e3a8a',
  secondaryColor = '#b45309',
  contentBg = null,
) {
  const isDark = mode === 'dark'

  const primary = {
    main: primaryColor,
    light: lightenColor(primaryColor, 0.35),
    dark: darkenColor(primaryColor, 0.25),
    contrastText: getContrastText(primaryColor),
  }

  const secondary = {
    main: secondaryColor,
    light: lightenColor(secondaryColor, 0.35),
    dark: darkenColor(secondaryColor, 0.25),
    contrastText: getContrastText(secondaryColor),
  }

  const backgrounds = isDark
    ? { default: BG_DARK, paper: PAPER_DARK }
    : { default: contentBg || BG_LIGHT, paper: cardBg }

  const text = isDark
    ? { primary: TEXT_PRIMARY_DARK, secondary: TEXT_SECONDARY_DARK, disabled: '#475569' }
    : { primary: TEXT_PRIMARY_LIGHT, secondary: TEXT_SECONDARY_LIGHT, disabled: '#94a3b8' }

  const divider = isDark ? 'rgba(248,250,252,0.08)' : 'rgba(15,23,42,0.1)'

  const cardBorder = isDark ? '1px solid rgba(248,250,252,0.08)' : '1px solid rgba(15,23,42,0.08)'
  const cardBg = isDark
    ? PAPER_DARK
    : (contentBg ? blendColors('#ffffff', contentBg, 0.16) : PAPER_LIGHT)

  return createTheme({
    palette: {
      mode,
      primary,
      secondary,
      background: backgrounds,
      text,
      divider,
      success: { main: HEALTH },
      info: { main: CAREER },
      warning: { main: SPIRIT },
      error: { main: isDark ? '#CF4E4E' : '#C53030' },
    },
    typography,
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { transition: FLUID_TRANSITION },
          '*, *::before, *::after': {
            transitionProperty: 'background-color, color, border-color, box-shadow',
            transitionDuration: '0.25s',
            transitionTimingFunction: 'ease',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            transition: FLUID_TRANSITION,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 500, transition: FLUID_TRANSITION },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: 'none',
            backgroundImage: 'none',
            transition: FLUID_TRANSITION,
            border: cardBorder,
            backgroundColor: cardBg,
          },
        },
      },
      MuiTextField: { defaultProps: { variant: 'outlined', size: 'small' } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: FLUID_TRANSITION,
            ...(isDark
              ? {
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(248,250,252,0.12)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(248,250,252,0.25)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor, borderWidth: '1.5px' },
                }
              : {
                  backgroundColor: BG_LIGHT,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(15,23,42,0.15)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(15,23,42,0.3)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: primaryColor, borderWidth: '1.5px' },
                }),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontFamily: '"Plus Jakarta Sans",sans-serif', fontSize: 11, fontWeight: 600 },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '1px 8px',
            width: 'auto',
            transition: FLUID_TRANSITION,
            '&.Mui-selected': {
              backgroundColor: `${primaryColor}18`,
              '&:hover': { backgroundColor: `${primaryColor}25` },
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontWeight: 500, textTransform: 'none', fontSize: 13 },
        },
      },
      MuiLinearProgress: {
        styleOverrides: { root: { borderRadius: 4, height: 5 } },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12, transition: FLUID_TRANSITION } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            backgroundImage: 'none',
            transition: FLUID_TRANSITION,
            ...(isDark ? { backgroundColor: PAPER_DARK, border: '1px solid rgba(248,250,252,0.08)' } : {}),
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: { root: { fontFamily: '"Plus Jakarta Sans",sans-serif', fontSize: 10 } },
      },
      MuiDivider: {
        styleOverrides: { root: { borderColor: divider, transition: FLUID_TRANSITION } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            transition: FLUID_TRANSITION,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { backgroundImage: 'none', transition: FLUID_TRANSITION },
        },
      },
    },
  })
}
