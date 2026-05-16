import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography, Grid, useTheme, useMediaQuery } from '@mui/material'
import { useThemeMode } from '../hooks/useTheme'
import { DarkMode, LightMode } from '@mui/icons-material'

const PILLARS = [
  { emoji: '🪔', name: 'Anushthanam', desc: 'Daily spiritual practice. The foundation before all else.' },
  { emoji: '🎵', name: 'Nādam', desc: 'Music as seva. Carnatic practice, composition, teaching.' },
  { emoji: '💪', name: 'Sharīram', desc: 'The body is the first instrument. Walk, nourish, rest.' },
  { emoji: '🚀', name: 'Karma', desc: 'Excellent work. Tech funds the mission.' },
  { emoji: '💰', name: 'Artha', desc: 'Debt-free, corpus-building, conscious wealth.' },
  { emoji: '📖', name: 'Vidyā', desc: 'Read to become, not to know.' },
]

// ── REFLECTION MANDALA SVG LOGO ──
function MandalaSVG({ size = 64, color = '#C07830' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Svaadhyaya mandala logo">
      {/* Outer diamond */}
      <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/>
      {/* Inner circle */}
      <circle cx="32" cy="32" r="16" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7"/>
      {/* Vibration curves */}
      <path d="M20 32 Q32 20 44 32 Q32 44 20 32" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M32 20 Q44 32 32 44 Q20 32 32 20" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
      {/* Bindu — the self */}
      <circle cx="32" cy="32" r="3" fill={color}/>
      {/* Cardinal marks */}
      <circle cx="32" cy="4" r="1.5" fill={color} opacity="0.4"/>
      <circle cx="60" cy="32" r="1.5" fill={color} opacity="0.4"/>
      <circle cx="32" cy="60" r="1.5" fill={color} opacity="0.4"/>
      <circle cx="4" cy="32" r="1.5" fill={color} opacity="0.4"/>
    </svg>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const { mode, toggleTheme, primaryColor } = useThemeMode()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isDark = mode === 'dark'

  const bg = isDark
    ? 'radial-gradient(ellipse at 20% 30%, rgba(192,120,48,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(124,77,171,0.05) 0%, transparent 50%), #0F0E0C'
    : 'radial-gradient(ellipse at 20% 30%, rgba(192,120,48,0.06) 0%, transparent 50%), #FAF9F6'

  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#D1D0CF'
  const cardBg = isDark ? '#1A1916' : '#FCFBF9'
  const textPrimary = isDark ? '#F0EDE8' : '#2C2C2C'
  const textSecondary = isDark ? '#9C9A94' : '#5F5F5F'

  return (
    <Box sx={{ minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <Box sx={{ px: { xs: 2, md: 5 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${borderColor}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MandalaSVG size={32} color={primaryColor} />
          <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 400, fontSize: 18, color: textPrimary }}>Svaadhyaya</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button size="small" onClick={toggleTheme} sx={{ minWidth: 0, p: 1, color: textSecondary }}>
            {isDark ? <LightMode sx={{ fontSize: 18 }} /> : <DarkMode sx={{ fontSize: 18 }} />}
          </Button>
          <Button variant="outlined" size="small" onClick={() => navigate('/auth/login')}
            sx={{ borderColor, color: textPrimary, fontSize: 13, '&:hover': { borderColor: primaryColor, color: primaryColor } }}>
            Sign in
          </Button>
          <Button variant="contained" size="small" onClick={() => navigate('/auth/signup')}
            sx={{ background: primaryColor, '&:hover': { background: primaryColor, opacity: 0.88 }, fontSize: 13 }}>
            Get started
          </Button>
        </Box>
      </Box>

      {/* HERO */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: { xs: 2, md: 4 }, py: { xs: 6, md: 8 }, textAlign: 'center', maxWidth: 760, mx: 'auto', width: '100%' }}>
        <Box sx={{ mb: 3 }}>
          <MandalaSVG size={80} color={primaryColor} />
        </Box>
        <Typography variant="caption" sx={{ letterSpacing: 4, textTransform: 'uppercase', fontSize: 11, color: primaryColor, display: 'block', mb: 1.5 }}>
          स्वाध्याय
        </Typography>
        <Typography variant="h2" sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, fontSize: { xs: 36, md: 52 }, lineHeight: 1.15, color: textPrimary, mb: 2 }}>
          Your daily practice.<br />Your life, witnessed.
        </Typography>
        <Typography sx={{ fontSize: { xs: 15, md: 17 }, color: textSecondary, lineHeight: 1.8, mb: 4, maxWidth: 560 }}>
          Svaadhyaya is a personal intentionality system — a place where your spiritual practice, music, health, career, finances, and reading all find their home. Not a productivity app. A sanctuary.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button variant="contained" size="large" onClick={() => navigate('/auth/signup')}
            sx={{ background: primaryColor, '&:hover': { background: primaryColor, opacity: 0.88 }, px: 4, py: 1.4, fontSize: 15, fontWeight: 500, borderRadius: 2 }}>
            Begin your practice
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/auth/login')}
            sx={{ borderColor, color: textPrimary, px: 4, py: 1.4, fontSize: 15, '&:hover': { borderColor: primaryColor, color: primaryColor, background: 'transparent' } }}>
            Sign in
          </Button>
        </Box>
        <Typography variant="caption" sx={{ mt: 3, color: textSecondary, fontFamily: '"Fraunces","Lora",serif', fontStyle: 'italic', fontSize: 13 }}>
          "स्वाध्यायान्मा प्रमदः — Never neglect self-study." · Taittiriya Upanishad
        </Typography>
      </Box>

      {/* SIX PILLARS */}
      <Box sx={{ px: { xs: 2, md: 5 }, pb: 8 }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Typography variant="caption" sx={{ letterSpacing: 3, textTransform: 'uppercase', fontSize: 10, color: primaryColor, display: 'block', textAlign: 'center', mb: 1 }}>
            Six dimensions of a complete life
          </Typography>
          <Typography variant="h4" sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, textAlign: 'center', color: textPrimary, mb: 4 }}>
            The life areas
          </Typography>
          <Grid container spacing={1.5}>
            {PILLARS.map((p, i) => (
              <Grid item xs={6} sm={4} key={i}>
                <Box sx={{ p: 2, borderRadius: 3, background: cardBg, border: `1px solid ${borderColor}`, height: '100%', transition: 'border-color 0.2s', '&:hover': { borderColor: primaryColor } }}>
                  <Typography sx={{ fontSize: 22, mb: 0.75 }}>{p.emoji}</Typography>
                  <Typography variant="subtitle2" sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 500, color: textPrimary, mb: 0.5, fontSize: 14 }}>{p.name}</Typography>
                  <Typography variant="caption" sx={{ color: textSecondary, fontSize: 12, lineHeight: 1.5 }}>{p.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* FEATURES ROW */}
      <Box sx={{ borderTop: `1px solid ${borderColor}`, px: { xs: 2, md: 5 }, py: 6, background: isDark ? 'rgba(255,255,255,0.01)' : '#FCFBF9' }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Grid container spacing={3}>
            {[
              { emoji: '🌅', title: 'Morning flow', desc: 'Review what you flagged the night before. Approve. Set the one thing. Start.' },
              { emoji: '🌙', title: 'Night flow', desc: 'Three wins. Flag tomorrow. Close the day. Phone down.' },
              { emoji: '🌊', title: 'Grace mode', desc: 'Life happens. Mark the day. Streak preserved. Sacred minimums activated.' },
              { emoji: '📊', title: 'Dashboard', desc: 'Bubble heatmap, area rings, streak counters, active milestones.' },
              { emoji: '🏖', title: 'Vacation mode', desc: 'Three modes: full pause, sacred only, flexible. Goals adjust automatically.' },
              { emoji: '📤', title: 'Data export', desc: 'Your data is yours. JSON and CSV export from Settings.' },
            ].map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                  <Typography sx={{ fontSize: 20, flexShrink: 0, mt: 0.25 }}>{f.emoji}</Typography>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: textPrimary, mb: 0.25, fontSize: 13, fontWeight: 600 }}>{f.title}</Typography>
                    <Typography variant="caption" sx={{ color: textSecondary, lineHeight: 1.6, fontSize: 12 }}>{f.desc}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box sx={{ borderTop: `1px solid ${borderColor}`, px: { xs: 2, md: 5 }, py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MandalaSVG size={20} color={primaryColor} />
          <Typography variant="caption" sx={{ color: textSecondary }}>Svaadhyaya · svaadhyaya.in</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: textSecondary, fontFamily: '"Fraunces","Lora",serif', fontStyle: 'italic' }}>
          Never miss twice. In any area. Ever.
        </Typography>
      </Box>
    </Box>
  )
}
