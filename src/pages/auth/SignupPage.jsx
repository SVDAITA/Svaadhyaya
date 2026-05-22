import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, TextField, Button, Typography, InputAdornment, IconButton, Alert, CircularProgress, Link, Divider } from '@mui/material'
import { Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useThemeMode } from '../../hooks/useTheme'
import { QUOTES as BUILTIN_QUOTES, getAllQuotesAsync } from '../../lib/quotes'
import { supabase } from '../../lib/supabase'
import MandalaSVG from '../../components/shared/MandalaSVG'

const BG = '#F8FAFC'
const PANEL_BG = 'linear-gradient(160deg, #EEF2FF 0%, #F0F9FF 100%)'
const BORDER = '#E2E8F0'
const TEXT = '#0f172a'
const SUBTEXT = '#475569'


function QuotePanel({ primaryColor }) {
  const [quotes, setQuotes] = useState(BUILTIN_QUOTES)
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * BUILTIN_QUOTES.length))
  const [visible, setVisible] = useState(true)
  const q = quotes[idx]
  useEffect(() => {
    getAllQuotesAsync(supabase).then((all) => { setQuotes(all); setIdx(Math.floor(Math.random() * all.length)) })
  }, [])
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % quotes.length); setVisible(true) }, 500)
    }, 7000)
    return () => clearInterval(t)
  }, [quotes.length])

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', background: PANEL_BG, p: { md: 6, lg: 8 }, borderRight: `1px solid ${BORDER}`, position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', right: -40, bottom: -40, opacity: 0.06 }}>
        <MandalaSVG size={320} color={primaryColor} />
      </Box>
      <MandalaSVG size={48} color={primaryColor} />
      <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, fontSize: 26, color: TEXT, mt: 3, mb: 1 }}>Begin here.</Typography>
      <Typography variant="caption" sx={{ color: primaryColor, letterSpacing: 3, textTransform: 'uppercase', fontSize: 10, display: 'block', mb: 5, fontWeight: 600 }}>Your practice awaits</Typography>
      <Box sx={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 0.5s ease, transform 0.5s ease', mt: 'auto' }}>
        <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontStyle: 'italic', fontSize: 17, color: TEXT, lineHeight: 1.75, mb: 1 }}>"{q.text}"</Typography>
        {q.translation && <Typography sx={{ fontSize: 13, color: primaryColor, mb: 0.75, fontStyle: 'italic' }}>{q.translation}</Typography>}
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

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { primaryColor } = useThemeMode()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const validate = () => {
    if (!form.fullName.trim()) return 'Please enter your name.'
    if (!form.email) return 'Please enter your email.'
    if (form.password.length < 8) return 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) return 'Passwords do not match.'
    return null
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(''); setLoading(true)
    try { await signUp(form.email, form.password, form.fullName); setSuccess(true) }
    catch (err) { setError(err.message || 'Signup failed. Please try again.') }
    finally { setLoading(false) }
  }

  if (success) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG, p: 2 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
        <CheckCircle sx={{ fontSize: 52, color: '#2D7A4F', mb: 2 }} />
        <Typography variant="h5" sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, color: TEXT, mb: 1 }}>Check your email</Typography>
        <Typography sx={{ color: SUBTEXT, mb: 3, fontSize: 14, lineHeight: 1.75 }}>
          We sent a confirmation link to <strong style={{ color: TEXT }}>{form.email}</strong>.<br />Click it to activate your account, then sign in.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/auth/login')} fullWidth
          sx={{ background: primaryColor, '&:hover': { background: primaryColor, opacity: 0.88 }, py: 1.3, borderRadius: 2, textTransform: 'none', boxShadow: 'none' }}>
          Go to sign in
        </Button>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', background: BG }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, width: '50%', maxWidth: 520 }}>
        <QuotePanel primaryColor={primaryColor} />
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 }, background: '#fff' }}>
        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <MandalaSVG size={44} color={primaryColor} />
          <Typography sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 300, fontSize: 20, lineHeight: 1.1, color: TEXT, mt: 1.5 }}>Svādhyāya</Typography>
          <Typography variant="caption" sx={{ fontSize: 11, fontFamily: '"Noto Sans Devanagari","Mangal",sans-serif', color: primaryColor, fontWeight: 600 }}>स्वाध्याय</Typography>
        </Box>
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Typography variant="h5" sx={{ fontFamily: '"Fraunces","Lora",serif', fontWeight: 400, color: TEXT, mb: 0.5 }}>Create account</Typography>
          <Typography variant="body2" sx={{ color: SUBTEXT, mb: 3 }}>Begin your practice today</Typography>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: 13 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField fullWidth name="fullName" label="Your name" value={form.fullName} onChange={handleChange} sx={{ mb: 2 }} autoFocus />
            <TextField fullWidth name="email" label="Email address" type="email" value={form.email} onChange={handleChange} sx={{ mb: 2 }} />
            <TextField fullWidth name="password" label="Password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handleChange} sx={{ mb: 2 }} helperText="Minimum 8 characters"
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPass(p => !p)} edge="end" size="small">{showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
            <TextField fullWidth name="confirm" label="Confirm password" type={showPass ? 'text' : 'password'} value={form.confirm} onChange={handleChange} sx={{ mb: 2.5 }} />
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ py: 1.4, fontSize: 14, background: primaryColor, '&:hover': { background: primaryColor, opacity: 0.88 }, borderRadius: 2, textTransform: 'none', boxShadow: '0 2px 10px rgba(30,58,138,0.18)' }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Create account'}
            </Button>
          </Box>
          <Divider sx={{ my: 2.5, borderColor: BORDER }} />
          <Typography variant="body2" sx={{ color: SUBTEXT, textAlign: 'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/auth/login" sx={{ color: primaryColor, fontWeight: 500, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Sign in</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
