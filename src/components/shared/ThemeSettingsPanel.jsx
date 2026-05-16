import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Tooltip,
  Divider,
  Card,
  CardContent,
} from '@mui/material'
import {
  LightMode,
  DarkMode,
  Palette,
  CheckCircle,
  Contrast,
} from '@mui/icons-material'
import { useThemeMode } from '../../hooks/useTheme'
import { getContrastText, lightenColor, darkenColor } from '../../theme/themeFactory'

// ── PRESET DEFINITIONS ────────────────────────────────────────────────────────

const PRIMARY_PRESETS = [
  { name: 'Classic Blue',   value: '#1e3a8a', icon: '🌊' },
  { name: 'Forest Sage',    value: '#2D7A4F', icon: '🌿' },
  { name: 'Terracotta',     value: '#A65D2E', icon: '🏺' },
  { name: 'Indigo',         value: '#3D5A9E', icon: '💙' },
  { name: 'Teal',           value: '#2A7A6E', icon: '🌊' },
  { name: 'Plum',           value: '#7C4DAB', icon: '🫐' },
]

const SECONDARY_PRESETS = [
  { name: 'Marigold',       value: '#b45309', icon: '🌼' },
  { name: 'Sienna',         value: '#A65D2E', icon: '🏺' },
  { name: 'Amber',          value: '#C07830', icon: '🍂' },
  { name: 'Sage',           value: '#5A7A4F', icon: '🌿' },
  { name: 'Rose',           value: '#B5446E', icon: '🌸' },
  { name: 'Saffron',        value: '#D97706', icon: '🌻' },
]

// ── SMALL COLOR SWATCH ────────────────────────────────────────────────────────

function ColorSwatch({ color, name, icon, selected, onClick, size = 40 }) {
  const textColor = getContrastText(color)
  return (
    <Tooltip title={name} arrow placement="top">
      <Box
        onClick={onClick}
        sx={{
          width: size,
          height: size,
          borderRadius: 2,
          background: color,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: selected ? `3px solid ${textColor === '#ffffff' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)'}` : '2px solid transparent',
          boxShadow: selected ? `0 0 0 2px ${color}, 0 0 0 4px ${color}60` : '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { transform: 'scale(1.1)', boxShadow: `0 4px 12px ${color}60` },
          flexShrink: 0,
        }}
      >
        {selected
          ? <CheckCircle sx={{ fontSize: size * 0.45, color: textColor, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }} />
          : <Typography sx={{ fontSize: size * 0.4, lineHeight: 1, userSelect: 'none' }}>{icon}</Typography>
        }
      </Box>
    </Tooltip>
  )
}

// ── COLOR PICKER ROW ──────────────────────────────────────────────────────────

function ColorRow({ label, description, presets, currentColor, onChange }) {
  const { mode } = useThemeMode()
  const isDark = mode === 'dark'
  const textS = isDark ? '#94a3b8' : '#475569'
  const divClr = isDark ? 'rgba(248,250,252,0.08)' : 'rgba(15,23,42,0.1)'

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: currentColor, flexShrink: 0, boxShadow: `0 0 8px ${currentColor}80` }} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: isDark ? '#f8fafc' : '#0f172a' }}>{label}</Typography>
        <Typography sx={{ fontSize: 11, color: textS }}>{description}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
        {presets.map(p => (
          <ColorSwatch
            key={p.value}
            color={p.value}
            name={p.name}
            icon={p.icon}
            selected={currentColor === p.value}
            onClick={() => onChange(p.value)}
          />
        ))}
        <Tooltip title="Custom colour — click to open picker" arrow>
          <Box
            sx={{
              position: 'relative',
              width: 40,
              height: 40,
              borderRadius: 2,
              border: `2px dashed ${divClr}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'border-color 0.2s',
              '&:hover': { borderColor: currentColor },
            }}
          >
            <Palette sx={{ fontSize: 18, color: textS, pointerEvents: 'none', position: 'absolute' }} />
            <Box
              component="input"
              type="color"
              value={currentColor}
              onChange={e => onChange(e.target.value)}
              sx={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%',
                border: 'none',
                padding: 0,
              }}
            />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
}

// ── LIVE PREVIEW MINI CARD ────────────────────────────────────────────────────

function LivePreview({ primaryColor, secondaryColor, mode }) {
  const isDark = mode === 'dark'
  const bg = isDark ? '#1e293b' : '#ffffff'
  const textP = isDark ? '#f8fafc' : '#0f172a'
  const textS = isDark ? '#94a3b8' : '#475569'
  const border = isDark ? 'rgba(248,250,252,0.08)' : 'rgba(15,23,42,0.1)'
  const primaryContrast = getContrastText(primaryColor)
  const secondaryContrast = getContrastText(secondaryColor)
  const lightPrimary = lightenColor(primaryColor, 0.85)
  const darkPrimary = darkenColor(primaryColor, 0.15)

  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px solid ${border}`,
        background: bg,
        overflow: 'hidden',
        boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 4px 20px rgba(15,23,42,0.08)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Mini header bar */}
      <Box sx={{ px: 2, py: 1.25, background: `${primaryColor}12`, borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: primaryColor }} />
        <Typography sx={{ fontSize: 10, fontWeight: 700, color: primaryColor, letterSpacing: 2, textTransform: 'uppercase' }}>
          Live Preview
        </Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        {/* Heading */}
        <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontSize: 16, fontWeight: 400, color: textP, mb: 0.5, lineHeight: 1.3 }}>
          Digital Ashram
        </Typography>
        <Typography sx={{ fontSize: 11, color: textS, mb: 1.75, lineHeight: 1.6 }}>
          स्वाध्यायान्मा प्रमदः · Faithful to practice
        </Typography>

        {/* Progress bar preview */}
        <Box sx={{ height: 4, borderRadius: 2, background: `${primaryColor}18`, mb: 1.75, overflow: 'hidden' }}>
          <Box sx={{ width: '72%', height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${lightenColor(primaryColor, 0.2)} 0%, ${primaryColor} 100%)` }} />
        </Box>

        {/* Buttons */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ px: 1.75, py: 0.6, borderRadius: 1.5, background: primaryColor, cursor: 'default' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: primaryContrast, letterSpacing: 0.3 }}>Primary</Typography>
          </Box>
          <Box sx={{ px: 1.75, py: 0.6, borderRadius: 1.5, border: `1.5px solid ${primaryColor}`, background: `${primaryColor}10`, cursor: 'default' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: primaryColor, letterSpacing: 0.3 }}>Outlined</Typography>
          </Box>
          <Box sx={{ px: 1.75, py: 0.6, borderRadius: 1.5, background: secondaryColor, cursor: 'default' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: secondaryContrast, letterSpacing: 0.3 }}>Secondary</Typography>
          </Box>
        </Box>

        {/* Chip row */}
        <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
          {['Anushthanam', 'Nādam', 'Sharīram'].map(tag => (
            <Box key={tag} sx={{ px: 1, py: 0.25, borderRadius: 8, background: `${primaryColor}15`, border: `1px solid ${primaryColor}30` }}>
              <Typography sx={{ fontSize: 9, fontWeight: 700, color: primaryColor, letterSpacing: 0.5, textTransform: 'uppercase' }}>{tag}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}

// ── MAIN PANEL ────────────────────────────────────────────────────────────────

export default function ThemeSettingsPanel() {
  const {
    mode, toggleTheme,
    primaryColor, setPrimaryColor,
    secondaryColor, setSecondaryColor,
  } = useThemeMode()

  const isDark = mode === 'dark'
  const textP = isDark ? '#f8fafc' : '#0f172a'
  const textS = isDark ? '#94a3b8' : '#475569'
  const divClr = isDark ? 'rgba(248,250,252,0.08)' : 'rgba(15,23,42,0.1)'
  const inputBg = isDark ? 'rgba(248,250,252,0.03)' : '#f8fafc'

  return (
    <Box sx={{ maxWidth: 560 }}>
      {/* ── Mode Toggle ── */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: textS, mb: 1.5 }}>
          Interface Mode
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            p: 0.5,
            borderRadius: 2,
            background: inputBg,
            border: `1px solid ${divClr}`,
            width: 'fit-content',
          }}
        >
          {[
            { label: 'Parchment Light', val: 'light', Icon: LightMode },
            { label: 'Meditative Dark',  val: 'dark',  Icon: DarkMode  },
          ].map(({ label, val, Icon }) => (
            <Box
              key={val}
              onClick={() => mode !== val && toggleTheme()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: 1.5,
                cursor: mode === val ? 'default' : 'pointer',
                background: mode === val ? (isDark ? 'rgba(248,250,252,0.12)' : '#ffffff') : 'transparent',
                boxShadow: mode === val ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                '&:hover': mode !== val ? { background: isDark ? 'rgba(248,250,252,0.05)' : 'rgba(0,0,0,0.04)' } : {},
              }}
            >
              <Icon sx={{ fontSize: 16, color: mode === val ? primaryColor : textS }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: mode === val ? textP : textS, whiteSpace: 'nowrap' }}>
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Divider sx={{ borderColor: divClr, mb: 4 }} />

      {/* ── Colour Controls + Preview side by side ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        <Box>
          <ColorRow
            label="Primary Colour"
            description="— buttons, links, active states"
            presets={PRIMARY_PRESETS}
            currentColor={primaryColor}
            onChange={setPrimaryColor}
          />
          <ColorRow
            label="Secondary Colour"
            description="— accents & highlights"
            presets={SECONDARY_PRESETS}
            currentColor={secondaryColor}
            onChange={setSecondaryColor}
          />

          {/* WCAG indicator */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Contrast sx={{ fontSize: 14, color: textS }} />
            <Typography sx={{ fontSize: 10, color: textS }}>
              Text contrast auto-calculated to meet WCAG AA
            </Typography>
          </Box>
        </Box>

        {/* Live Preview */}
        <Box>
          <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: textS, mb: 1.5 }}>
            Live Preview
          </Typography>
          <LivePreview primaryColor={primaryColor} secondaryColor={secondaryColor} mode={mode} />
        </Box>
      </Box>
    </Box>
  )
}
