import api from './api'
import type { AuthToken, GuestToken, User } from '../types'

export const authService = {
  async login(username: string, password: string): Promise<AuthToken> {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await api.post<AuthToken>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    
    return response.data
  },

  async guestLogin(): Promise<GuestToken> {
    const response = await api.post<GuestToken>('/auth/guest')
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  // Store token in localStorage
  saveToken(token: string): void {
    localStorage.setItem('access_token', token)
  },

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('access_token')
  },

  // Remove token from localStorage
  clearToken(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    localStorage.removeItem('is_guest')
  },

  // Save user data
  saveUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user))
  },

  // Get user data
  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  },

  // Set guest flag
  setGuestFlag(isGuest: boolean): void {
    localStorage.setItem('is_guest', String(isGuest))
  },

  // Check if current session is guest
  isGuestSession(): boolean {
    return localStorage.getItem('is_guest') === 'true'
  },
}

export default authService
