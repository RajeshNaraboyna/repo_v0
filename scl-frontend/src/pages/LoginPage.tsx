import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, Divider, Avatar, Paper,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'

export default function LoginPage() {
  const { login, loginAsGuest, isAuthenticated, isGuest } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (isAuthenticated || isGuest) {
    navigate('/admission')
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setError('')
    setIsLoading(true)

    try {
      await loginAsGuest()
      navigate('/admission')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Guest login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }} className="fade-in">
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 64,
              height: 64,
              mx: 'auto',
              mb: 2,
              fontSize: '1.75rem',
              fontWeight: 700,
              boxShadow: '0 8px 24px rgb(37 99 235 / 0.3)',
            }}
          >
            S
          </Avatar>
          <Typography variant="h2" gutterBottom>
            School Management System
          </Typography>
          <Typography color="text.secondary">
            Sign in to your account or continue as guest
          </Typography>
        </Box>

        <Card sx={{ borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@school.local"
                  required
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  fullWidth
                />
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                  startIcon={<LockOutlinedIcon />}
                  sx={{ py: 1.5 }}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Box>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">or</Typography>
            </Divider>

            <Button
              variant="outlined"
              size="large"
              fullWidth
              onClick={handleGuestLogin}
              disabled={isLoading}
              startIcon={<PersonOutlinedIcon />}
              sx={{ py: 1.5 }}
            >
              Continue as Guest
            </Button>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Guest users can submit admission requests without creating an account
            </Typography>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Paper
          variant="outlined"
          sx={{ mt: 3, p: 2.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 3 }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
            Demo Credentials
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Admin: admin@school.local / admin123
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Staff: staff@school.local / staff123
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}
