import { useNavigate } from 'react-router-dom'
import { Box, Button, Typography, Grid } from '@mui/material'
import { useThemeMode } from '../hooks/useTheme'
import MandalaSVG from '../components/shared/MandalaSVG'

const FEATURES = [
  { emoji: '🌅', title: 'Morning flow', desc: 'Review what you flagged the night before. Approve. Set the one thing. Start.' },
  { emoji: '🌙', title: 'Night flow', desc: 'Three wins. Flag tomorrow. Close the day. Phone down.' },
  { emoji: '🌊', title: 'Grace mode', desc: 'Life happens. Mark the day. Streak preserved. Sacred minimums activated.' },
  { emoji: '📊', title: 'Dashboard', desc: 'Bubble heatmap, area rings, streak counters, active milestones.' },
  { emoji: '🏖', title: 'Vacation mode', desc: 'Three modes: full pause, sacred only, flexible. Goals adjust automatically.' },
  { emoji: '📤', title: 'Data export', desc: 'Your data is yours. JSON and CSV export from Settings.' },
]

const BG = '#F8FAFC'
const BORDER = '#E2E8F0'
const TEXT = '#0f172a'
const SUBTEXT = '#475569'


export default function LandingPage() {
  const navigate = useNavigate()
  const { primaryColor } = useThemeMode()

  return (
    <Box sx={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column' }}>

      {/* NAV */}
      <Box sx={{ px: { xs: 2, md: 5 }, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}`, background: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <MandalaSVG size={32} color={primaryColor} />
          <Box>
            <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 400, fontSize: 18, lineHeight: 1.1, color: TEXT }}>Svādhyāya</Typography>
            <Typography variant="caption" sx={{ display: 'block', fontSize: 10, fontFamily: '"Noto Sans Devanagari","Mangal",sans-serif', color: primaryColor, fontWeight: 600, letterSpacing: 0 }}>स्वाध्याय</Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => navigate('/auth/login')}
            sx={{ borderColor: BORDER, color: TEXT, fontSize: 13, textTransform: 'none', '&:hover': { borderColor: primaryColor, color: primaryColor, background: 'transparent' } }}>
            Sign in
          </Button>
          <Button variant="contained" size="small" onClick={() => navigate('/auth/signup')}
            sx={{ background: primaryColor, '&:hover': { background: primaryColor, opacity: 0.88 }, fontSize: 13, textTransform: 'none', boxShadow: 'none' }}>
            Get started
          </Button>
        </Box>
      </Box>

      {/* HERO */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', px: { xs: 2, md: 4 }, py: { xs: 8, md: 10 }, textAlign: 'center', maxWidth: 760, mx: 'auto', width: '100%' }}>
        <Box sx={{ mb: 3, opacity: 0.9 }}>
          <MandalaSVG size={72} color={primaryColor} />
        </Box>
        <Typography variant="caption" sx={{ letterSpacing: 0, fontSize: 13, color: primaryColor, display: 'block', mb: 2, fontWeight: 600, whiteSpace: 'nowrap', fontFamily: '"Noto Sans Devanagari", sans-serif' }}>
          स्वाध्याय
        </Typography>
        <Typography variant="h2" sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, fontSize: { xs: 34, md: 50 }, lineHeight: 1.18, color: TEXT, mb: 2.5 }}>
          Your daily practice.<br />Your life, witnessed.
        </Typography>
        <Typography sx={{ fontSize: { xs: 15, md: 17 }, color: SUBTEXT, lineHeight: 1.85, mb: 4.5, maxWidth: 540 }}>
          Svaadhyaya is a personal intentionality system — a place where your spiritual practice, music, health, career, finances, and reading all find their home. Not a productivity app. A sanctuary.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', alignItems: 'center', width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="contained" size="large" onClick={() => navigate('/auth/signup')}
            sx={{ background: primaryColor, '&:hover': { background: primaryColor, opacity: 0.88 }, px: 4, py: 1.4, fontSize: 15, fontWeight: 500, borderRadius: 2, textTransform: 'none', boxShadow: '0 2px 12px rgba(30,58,138,0.18)', width: { xs: '100%', sm: 'auto' } }}>
            Begin your practice
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate('/auth/login')}
            sx={{ borderColor: BORDER, color: TEXT, px: 4, py: 1.4, fontSize: 15, textTransform: 'none', borderRadius: 2, '&:hover': { borderColor: primaryColor, color: primaryColor, background: 'transparent' }, width: { xs: '100%', sm: 'auto' } }}>
            Sign in
          </Button>
        </Box>
        <Typography variant="caption" sx={{ mt: 4, color: SUBTEXT, fontFamily: '"Fraunces","Lora",serif', fontStyle: 'italic', fontSize: 13, opacity: 0.8 }}>
          "स्वाध्यायान्मा प्रमदः — Never neglect self-study." · Taittiriya Upanishad
        </Typography>
      </Box>

      {/* FEATURES */}
      <Box sx={{ borderTop: `1px solid ${BORDER}`, px: { xs: 2, md: 5 }, py: 7, background: '#ffffff' }}>
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Typography variant="caption" sx={{ letterSpacing: 3, textTransform: 'uppercase', fontSize: 10, color: primaryColor, display: 'block', textAlign: 'center', mb: 4, fontWeight: 600 }}>
            What's inside
          </Typography>
          <Grid container spacing={4}>
            {FEATURES.map((f, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ flexShrink: 0, width: 36, height: 36, borderRadius: 2, background: `${primaryColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: 17 }}>{f.emoji}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ color: TEXT, mb: 0.5, fontSize: 13, fontWeight: 600 }}>{f.title}</Typography>
                    <Typography variant="caption" sx={{ color: SUBTEXT, lineHeight: 1.7, fontSize: 12 }}>{f.desc}</Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box sx={{ borderTop: `1px solid ${BORDER}`, px: { xs: 2, md: 5 }, py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, background: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MandalaSVG size={18} color={primaryColor} />
          <Typography variant="caption" sx={{ color: SUBTEXT }}>Svaadhyaya · svaadhyaya.in</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: SUBTEXT, fontFamily: '"Fraunces","Lora",serif', fontStyle: 'italic' }}>
          Never miss twice. In any area. Ever.
        </Typography>
      </Box>
    </Box>
  )
}
