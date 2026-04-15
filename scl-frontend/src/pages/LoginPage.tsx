import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

export default function LoginPage() {
  const { login, loginAsGuest, isAuthenticated, isGuest } = useAuth()
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already logged in
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">School Management System</h1>
          <p className="text-gray-600 mt-2">Sign in to your account or continue as guest</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@school.local"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary py-3 font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Guest Login */}
          <button
            onClick={handleGuestLogin}
            className="w-full btn-outline py-3 font-medium"
            disabled={isLoading}
          >
            Continue as Guest
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Guest users can submit admission requests without creating an account
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-white/50 rounded-lg text-center">
          <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials</p>
          <p className="text-xs text-gray-500">Admin: admin@school.local / admin123</p>
          <p className="text-xs text-gray-500">Staff: staff@school.local / staff123</p>
        </div>
      </div>
    </div>
  )
}
