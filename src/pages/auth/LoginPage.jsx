import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom'
import MandalaSVG from '../../components/shared/MandalaSVG'
import {
  Box, TextField, Button, Typography,
  InputAdornment, IconButton, Alert, CircularProgress, Link, Divider
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useThemeMode } from '../../hooks/useTheme'
import { getAllQuotes } from '../../lib/quotes'
const QUOTES = getAllQuotes()

const BG = '#F8FAFC'
const PANEL_BG = 'linear-gradient(160deg, #EEF2FF 0%, #F0F9FF 100%)'
const BORDER = '#E2E8F0'
const TEXT = '#0f172a'
const SUBTEXT = '#475569'


function QuotePanel({ primaryColor }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [visible, setVisible] = useState(true)
  const q = QUOTES[idx]

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % QUOTES.length)
        setVisible(true)
      }, 500)
    }, 7000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Box sx={{
      flex: 1, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'flex-start',
      background: PANEL_BG, p: { md: 6, lg: 8 },
      borderRight: `1px solid ${BORDER}`,
      position: 'relative', overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.06 }}>
        <MandalaSVG size={320} color={primaryColor} />
      </Box>

      <MandalaSVG size={48} color={primaryColor} />
      <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, fontSize: 26, color: TEXT, mt: 3, mb: 1, lineHeight: 1.2, letterSpacing: '-0.3px' }}>
        Svaadhyaya
      </Typography>
      <Typography variant="caption" sx={{ color: primaryColor, letterSpacing: 3, textTransform: 'uppercase', fontSize: 10, display: 'block', mb: 5, fontWeight: 600, whiteSpace: 'nowrap' }}>
        स्वाध्याय · Self-study
      </Typography>

      <Box sx={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.5s ease, transform 0.5s ease', mt: 'auto' }}>
        {q.text && (
          <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontStyle: 'italic', fontWeight: 400, fontSize: 17, color: TEXT, lineHeight: 1.75, mb: 1 }}>
            "{q.text}"
          </Typography>
        )}
        {q.translation && (
          <Typography sx={{ fontSize: 13, color: primaryColor, mb: 0.75, fontStyle: 'italic' }}>{q.translation}</Typography>
        )}
        <Typography variant="caption" sx={{ color: SUBTEXT, letterSpacing: 1, fontSize: 11 }}>— {q.source}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, mt: 3 }}>
        {[...Array(5)].map((_, i) => (
          <Box key={i} sx={{ width: i === idx % 5 ? 16 : 5, height: 4, borderRadius: 3, background: i === idx % 5 ? primaryColor : BORDER, transition: 'width 0.3s ease' }} />
        ))}
      </Box>
    </Box>
  )
}

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { primaryColor } = useThemeMode()
  const from = location.state?.from?.pathname || '/svadhyaya'
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return }
    setError(''); setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally { setLoading(false) }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', background: BG }}>
      {/* Left quote panel — desktop only */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, width: '50%', maxWidth: 520 }}>
        <QuotePanel primaryColor={primaryColor} />
      </Box>

      {/* Right form panel */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 }, background: '#fff' }}>

        {/* Mobile logo */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <MandalaSVG size={44} color={primaryColor} />
          <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, fontSize: 20, lineHeight: 1.1, color: TEXT, mt: 1.5 }}>Svādhyāya</Typography>
          <Typography variant="caption" sx={{ fontSize: 11, fontFamily: '"Noto Sans Devanagari","Mangal",sans-serif', color: primaryColor, fontWeight: 600 }}>स्वाध्याय</Typography>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Typography variant="h5" sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 400, color: TEXT, mb: 0.5 }}>Welcome back</Typography>
          <Typography variant="body2" sx={{ color: SUBTEXT, mb: 3 }}>Sign in to continue your practice</Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth name="email" label="Email address" type="email"
              value={form.email} onChange={handleChange} sx={{ mb: 2 }}
              autoComplete="email" autoFocus
              inputProps={{ 'aria-label': 'Email address' }}
            />
            <TextField
              fullWidth name="password" label="Password"
              type={showPass ? 'text' : 'password'}
              value={form.password} onChange={handleChange} sx={{ mb: 1 }}
              autoComplete="current-password"
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPass(p => !p)} edge="end" size="small">
                    {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              )}}
            />
            <Box sx={{ textAlign: 'right', mb: 2.5 }}>
              <Link component={RouterLink} to="/auth/forgot-password" variant="caption" sx={{ color: primaryColor }}>
                Forgot password?
              </Link>
            </Box>
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ py: 1.4, fontSize: 14, background: primaryColor, '&:hover': { background: primaryColor, opacity: 0.88 }, borderRadius: 2, textTransform: 'none', boxShadow: '0 2px 10px rgba(30,58,138,0.18)' }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
            </Button>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: BORDER }} />

          <Typography variant="body2" sx={{ color: SUBTEXT, textAlign: 'center' }}>
            New to Svaadhyaya?{' '}
            <Link component={RouterLink} to="/auth/signup" sx={{ color: primaryColor, fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Create account
            </Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
