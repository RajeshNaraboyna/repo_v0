import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService from '../services/authService'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  loginAsGuest: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session on mount
    const initializeAuth = () => {
      const token = authService.getToken()
      if (token) {
        const savedUser = authService.getUser()
        const guestFlag = authService.isGuestSession()
        
        if (savedUser) {
          setUser(savedUser)
        }
        setIsGuest(guestFlag)
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password)
    authService.saveToken(response.access_token)
    
    if (response.user) {
      authService.saveUser(response.user)
      setUser(response.user)
    }
    
    authService.setGuestFlag(false)
    setIsGuest(false)
  }

  const loginAsGuest = async () => {
    const response = await authService.guestLogin()
    authService.saveToken(response.access_token)
    authService.setGuestFlag(true)
    
    const guestUser: User = {
      id: 'guest',
      email: 'guest@school.local',
      name: 'Guest User',
      role: 'guest',
    }
    
    authService.saveUser(guestUser)
    setUser(guestUser)
    setIsGuest(true)
  }

  const logout = () => {
    authService.clearToken()
    setUser(null)
    setIsGuest(false)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !isGuest,
    isGuest,
    isLoading,
    login,
    loginAsGuest,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
