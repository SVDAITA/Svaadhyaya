import { useState, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, TextField, Button, Typography, Alert, CircularProgress, Link, IconButton } from '@mui/material'
import { ArrowBack, DarkMode, LightMode, CheckCircle } from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useThemeMode } from '../../hooks/useTheme'
import { QUOTES as BUILTIN_QUOTES, getAllQuotesAsync } from '../../lib/quotes'
import { supabase } from '../../lib/supabase'
import MandalaSVG from '../../components/shared/MandalaSVG'


function QuotePanel({ isDark, primaryColor }) {
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
  const bg = isDark ? 'linear-gradient(160deg,#1A1916 0%,#110F0C 100%)' : 'linear-gradient(160deg,#FAF9F6 0%,#F2EEE6 100%)'
  const tc = isDark ? '#F0EDE8' : '#2C2C2C'
  const sc = isDark ? '#9C9A94' : '#5F5F5F'
  return (
    <Box sx={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', background:bg, p:{md:6,lg:8}, borderRight:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#D1D0CF'}`, position:'relative', overflow:'hidden' }}>
      <Box sx={{ position:'absolute', right:-40, bottom:-40, opacity:0.04 }}><MandalaSVG size={320} color={primaryColor}/></Box>
      <MandalaSVG size={52} color={primaryColor}/>
      <Typography sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:300, fontSize:28, lineHeight:1.1, color:tc, mt:3, mb:0.5 }}>Svādhyāya</Typography>
      <Typography variant="caption" sx={{ fontSize:12, fontFamily:'"Noto Sans Devanagari","Mangal",sans-serif', color:primaryColor, fontWeight:600, display:'block', mb:1 }}>स्वाध्याय</Typography>
      <Typography variant="caption" sx={{ color:primaryColor, letterSpacing:3, textTransform:'uppercase', fontSize:10, display:'block', mb:5 }}>The path continues</Typography>
      <Box sx={{ opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(8px)', transition:'opacity 0.5s ease,transform 0.5s ease', mt:'auto' }}>
        <Typography sx={{ fontFamily:'"Fraunces","Lora",serif', fontStyle:'italic', fontSize:18, color:tc, lineHeight:1.7, mb:1 }}>"{q.text}"</Typography>
        {q.translation && <Typography sx={{ fontSize:13, color:primaryColor, mb:0.75, fontStyle:'italic' }}>{q.translation}</Typography>}
        <Typography variant="caption" sx={{ color:sc, letterSpacing:1, fontSize:11 }}>— {q.source}</Typography>
      </Box>
    </Box>
  )
}

function UnifiedAuthShell({ children }) {
  const { mode, toggleTheme, primaryColor } = useThemeMode()
  const isDark = mode === 'dark'
  const bg = isDark ? '#0F0E0C' : '#FAF9F6'
  const textSecondary = isDark ? '#9C9A94' : '#5F5F5F'

  return (
    <Box sx={{ minHeight:'100vh', display:'flex', background:bg }}>
      <Box sx={{ display:{xs:'none',md:'flex'}, width:'50%', maxWidth:520 }}>
        <QuotePanel isDark={isDark} primaryColor={primaryColor}/>
      </Box>
      <Box sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', p:{xs:2,md:4}, position:'relative' }}>
        <Box sx={{ position:'absolute', top:20, right:20 }}>
          <IconButton size="small" onClick={toggleTheme} sx={{ color:textSecondary }}>
            {isDark ? <LightMode sx={{fontSize:18}}/> : <DarkMode sx={{fontSize:18}}/>}
          </IconButton>
        </Box>
        {children}
      </Box>
    </Box>
  )
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const { mode, primaryColor } = useThemeMode()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  
  const isDark = mode === 'dark'
  const textPrimary = isDark ? '#F0EDE8' : '#2C2C2C'
  const textSecondary = isDark ? '#9C9A94' : '#5F5F5F'

  const handleSubmit = async e => {
    e.preventDefault()
    if (!email) { setError('Please enter your email address.'); return }
    setError(''); setLoading(true)
    try { await resetPassword(email); setSent(true) }
    catch (err) { setError(err.message || 'Failed to send reset email.') }
    finally { setLoading(false) }
  }

  return (
    <UnifiedAuthShell>
      <Box sx={{ width:'100%', maxWidth:380 }}>
        <Box sx={{ display:{xs:'flex',md:'none'}, flexDirection:'column', alignItems:'center', mb:4 }}>
          <MandalaSVG size={48} color={primaryColor}/>
          <Typography sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:300, fontSize:20, lineHeight:1.1, color:textPrimary, mt:1.5 }}>Svādhyāya</Typography>
          <Typography variant="caption" sx={{ fontSize:11, fontFamily:'"Noto Sans Devanagari","Mangal",sans-serif', color:primaryColor, fontWeight:600 }}>स्वाध्याय</Typography>
        </Box>
        {sent ? (
          <Box sx={{ textAlign:'center' }}>
            <CheckCircle sx={{ fontSize:48, color:'#2D7A4F', mb:2 }}/>
            <Typography variant="h6" sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:400, color:textPrimary, mb:1 }}>Check your email</Typography>
            <Typography sx={{ color:textSecondary, fontSize:13, mb:3, lineHeight:1.7 }}>
              We sent a reset link to <strong style={{color:textPrimary}}>{email}</strong>. It expires in 1 hour.
            </Typography>
            <Button component={RouterLink} to="/auth/login" variant="contained" fullWidth
              sx={{ background:primaryColor,'&:hover':{background:primaryColor, opacity:0.88}, py:1.3, borderRadius:2, textTransform: 'none', fontSize: 15 }}>
              Back to sign in
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h5" sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:400, color:textPrimary, mb:0.5 }}>Reset password</Typography>
            <Typography variant="body2" sx={{ color:textSecondary, mb:3 }}>Enter your email and we'll send a reset link</Typography>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField fullWidth label="Email address" type="email" value={email} onChange={e=>setEmail(e.target.value)} sx={{ mb:2.5 }} autoFocus/>
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                sx={{ py:1.4, background:primaryColor,'&:hover':{background:primaryColor, opacity:0.88}, borderRadius:2, textTransform: 'none', fontSize: 15 }}>
                {loading ? <CircularProgress size={22} color="inherit"/> : 'Send reset link'}
              </Button>
            </Box>
            <Box sx={{ textAlign:'center', mt:3 }}>
              <Link component={RouterLink} to="/auth/login" sx={{ color:textSecondary, fontSize:13, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:0.5, '&:hover':{color:primaryColor} }}>
                <ArrowBack sx={{fontSize:16}}/> Back to sign in
              </Link>
            </Box>
          </>
        )}
      </Box>
    </UnifiedAuthShell>
  )
}

export function ResetPasswordPage() {
  const { updatePassword } = useAuth()
  const { mode, primaryColor } = useThemeMode()
  const [form, setForm] = useState({ password:'', confirm:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  
  const isDark = mode === 'dark'
  const textPrimary = isDark ? '#F0EDE8' : '#2C2C2C'
  const textSecondary = isDark ? '#9C9A94' : '#5F5F5F'

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    setError(''); setLoading(true)
    try { await updatePassword(form.password); setDone(true) }
    catch (err) { setError(err.message || 'Failed to update password.') }
    finally { setLoading(false) }
  }

  return (
    <UnifiedAuthShell>
      <Box sx={{ width:'100%', maxWidth:380 }}>
        <Box sx={{ display:{xs:'flex',md:'none'}, flexDirection:'column', alignItems:'center', mb:4 }}>
          <MandalaSVG size={48} color={primaryColor}/>
        </Box>
        {done ? (
          <Box sx={{ textAlign:'center' }}>
            <CheckCircle sx={{ fontSize:48, color:'#2D7A4F', mb:2 }}/>
            <Typography variant="h6" sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:400, color:textPrimary, mb:1 }}>Password updated</Typography>
            <Button component={RouterLink} to="/auth/login" variant="contained" fullWidth
              sx={{ background:primaryColor,'&:hover':{background:primaryColor, opacity:0.88}, py:1.3, borderRadius:2, mt:2, textTransform:'none', fontSize:15 }}>
              Sign in
            </Button>
          </Box>
        ) : (
          <>
            <Typography variant="h5" sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:400, color:textPrimary, mb:0.5 }}>Set new password</Typography>
            <Typography variant="body2" sx={{ color:textSecondary, mb:3 }}>Choose a strong new password</Typography>
            {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField fullWidth label="New password" type="password" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))} sx={{ mb:2 }} helperText="Minimum 8 characters"/>
              <TextField fullWidth label="Confirm password" type="password" value={form.confirm} onChange={e=>setForm(p=>({...p,confirm:e.target.value}))} sx={{ mb:2.5 }}/>
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                sx={{ py:1.4, background:primaryColor,'&:hover':{background:primaryColor, opacity:0.88}, borderRadius:2, textTransform:'none', fontSize:15 }}>
                {loading ? <CircularProgress size={22} color="inherit"/> : 'Update password'}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </UnifiedAuthShell>
  )
}