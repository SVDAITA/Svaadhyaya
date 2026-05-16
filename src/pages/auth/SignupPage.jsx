import { useState, useEffect } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { Box, TextField, Button, Typography, InputAdornment, IconButton, Alert, CircularProgress, Link, Divider } from '@mui/material'
import { Visibility, VisibilityOff, DarkMode, LightMode, CheckCircle } from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'
import { useThemeMode } from '../../hooks/useTheme'
import { QUOTES } from '../../lib/quotes'

function MandalaSVG({ size=48, color='#C07830' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M32 4 L60 32 L32 60 L4 32 Z" stroke={color} strokeWidth="1" fill="none" opacity="0.5"/>
      <circle cx="32" cy="32" r="16" stroke={color} strokeWidth="1.2" fill="none" opacity="0.7"/>
      <path d="M20 32 Q32 20 44 32 Q32 44 20 32" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
      <path d="M32 20 Q44 32 32 44 Q20 32 32 20" stroke={color} strokeWidth="1" fill="none" opacity="0.6"/>
      <circle cx="32" cy="32" r="3" fill={color}/>
      <circle cx="32" cy="4" r="1.5" fill={color} opacity="0.4"/>
      <circle cx="60" cy="32" r="1.5" fill={color} opacity="0.4"/>
      <circle cx="32" cy="60" r="1.5" fill={color} opacity="0.4"/>
      <circle cx="4" cy="32" r="1.5" fill={color} opacity="0.4"/>
    </svg>
  )
}

function QuotePanel({ isDark, primaryColor }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [visible, setVisible] = useState(true)
  const q = QUOTES[idx]
  useEffect(() => {
    const t = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setIdx(i => (i + 1) % QUOTES.length); setVisible(true) }, 500)
    }, 7000)
    return () => clearInterval(t)
  }, [])
  const bg = isDark ? 'linear-gradient(160deg,#1A1916 0%,#110F0C 100%)' : 'linear-gradient(160deg,#FAF9F6 0%,#F2EEE6 100%)'
  const tc = isDark ? '#F0EDE8' : '#2C2C2C'
  const sc = isDark ? '#9C9A94' : '#5F5F5F'
  return (
    <Box sx={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', background:bg, p:{md:6,lg:8}, borderRight:`1px solid ${isDark?'rgba(255,255,255,0.06)':'#D1D0CF'}`, position:'relative', overflow:'hidden' }}>
      <Box sx={{ position:'absolute', right:-40, bottom:-40, opacity:0.04 }}><MandalaSVG size={320} color={primaryColor}/></Box>
      <MandalaSVG size={52} color={primaryColor}/>
      <Typography sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:300, fontSize:28, color:tc, mt:3, mb:1 }}>Begin here.</Typography>
      <Typography variant="caption" sx={{ color:primaryColor, letterSpacing:3, textTransform:'uppercase', fontSize:10, display:'block', mb:5 }}>Your practice awaits</Typography>
      <Box sx={{ opacity:visible?1:0, transform:visible?'translateY(0)':'translateY(8px)', transition:'opacity 0.5s ease,transform 0.5s ease', mt:'auto' }}>
        <Typography sx={{ fontFamily:'"Fraunces","Lora",serif', fontStyle:'italic', fontSize:18, color:tc, lineHeight:1.7, mb:1 }}>"{q.text}"</Typography>
        {q.translation && <Typography sx={{ fontSize:13, color:primaryColor, mb:0.75, fontStyle:'italic' }}>{q.translation}</Typography>}
        <Typography variant="caption" sx={{ color:sc, letterSpacing:1, fontSize:11 }}>— {q.source}</Typography>
      </Box>
      <Box sx={{ display:'flex', gap:0.5, mt:3 }}>
        {[...Array(5)].map((_,i) => <Box key={i} sx={{ width:i===idx%5?16:5, height:5, borderRadius:3, background:i===idx%5?primaryColor:isDark?'rgba(255,255,255,0.15)':'#D1D0CF', transition:'width 0.3s ease' }}/>)}
      </Box>
    </Box>
  )
}

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const { mode, toggleTheme, primaryColor } = useThemeMode()
  const isDark = mode === 'dark'
  const [form, setForm] = useState({ fullName:'', email:'', password:'', confirm:'' })
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
  const bg = isDark ? '#0F0E0C' : '#FAF9F6'
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : '#D1D0CF'
  const textPrimary = isDark ? '#F0EDE8' : '#2C2C2C'
  const textSecondary = isDark ? '#9C9A94' : '#5F5F5F'

  if (success) return (
    <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:bg, p:2 }}>
      <Box sx={{ textAlign:'center', maxWidth:400 }}>
        <CheckCircle sx={{ fontSize:56, color:'#2D7A4F', mb:2 }}/>
        <Typography variant="h5" sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:300, color:textPrimary, mb:1 }}>Check your email</Typography>
        <Typography sx={{ color:textSecondary, mb:3, fontSize:14, lineHeight:1.7 }}>
          We sent a confirmation link to <strong style={{color:textPrimary}}>{form.email}</strong>.<br/>Click it to activate your account, then sign in.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/auth/login')} fullWidth
          sx={{ background:primaryColor, '&:hover':{background:primaryColor, opacity:0.88}, py:1.3, borderRadius:2 }}>
          Go to sign in
        </Button>
      </Box>
    </Box>
  )

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
        <Box sx={{ display:{xs:'flex',md:'none'}, flexDirection:'column', alignItems:'center', mb:4 }}>
          <MandalaSVG size={48} color={primaryColor}/>
          <Typography sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:300, fontSize:22, color:textPrimary, mt:1.5 }}>Svaadhyaya</Typography>
        </Box>
        <Box sx={{ width:'100%', maxWidth:380 }}>
          <Typography variant="h5" sx={{ fontFamily:'"Fraunces","Lora",serif', fontWeight:400, color:textPrimary, mb:0.5 }}>Create account</Typography>
          <Typography variant="body2" sx={{ color:textSecondary, mb:3 }}>Begin your practice today</Typography>
          {error && <Alert severity="error" sx={{ mb:2, borderRadius:2, fontSize:13 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField fullWidth name="fullName" label="Your name" value={form.fullName} onChange={handleChange} sx={{ mb:2 }} autoFocus/>
            <TextField fullWidth name="email" label="Email address" type="email" value={form.email} onChange={handleChange} sx={{ mb:2 }}/>
            <TextField fullWidth name="password" label="Password" type={showPass?'text':'password'} value={form.password} onChange={handleChange} sx={{ mb:2 }} helperText="Minimum 8 characters"
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={()=>setShowPass(p=>!p)} edge="end" size="small">{showPass?<VisibilityOff fontSize="small"/>:<Visibility fontSize="small"/>}</IconButton></InputAdornment> }}/>
            <TextField fullWidth name="confirm" label="Confirm password" type={showPass?'text':'password'} value={form.confirm} onChange={handleChange} sx={{ mb:2.5 }}/>
            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ py:1.4, fontSize:14, background:primaryColor, '&:hover':{background:primaryColor, opacity:0.88}, borderRadius:2 }}>
              {loading ? <CircularProgress size={22} color="inherit"/> : 'Create account'}
            </Button>
          </Box>
          <Divider sx={{ my:2.5, borderColor }}/>
          <Typography variant="body2" sx={{ color:textSecondary, textAlign:'center' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/auth/login" sx={{ color:primaryColor, fontWeight:500, textDecoration:'none', '&:hover':{textDecoration:'underline'} }}>Sign in</Link>
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
