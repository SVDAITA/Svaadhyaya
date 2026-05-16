import { Box, Typography, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, textAlign: 'center' }}>
      <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 300, fontSize: 80, opacity: 0.1, lineHeight: 1 }}>404</Typography>
      <Typography variant="h5" sx={{ fontFamily: '"Fraunces", serif', fontWeight: 300, mt: 2, mb: 1 }}>Page not found</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>This path does not exist.</Typography>
      <Button variant="contained" onClick={() => navigate('/svadhyaya')}>Go to Today</Button>
    </Box>
  )
}
