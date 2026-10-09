import { createContext, useState, useCallback, useEffect, useContext, type ReactElement, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { login as authLogin, logout as authLogout, getCurrentUser, clearLegacyAuthStorage, type User } from '@/lib/auth'
import { logger } from '@/lib/logger'

interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  loading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): ReactElement {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const refreshUser = useCallback(async () => {
    setUser(await getCurrentUser())
  }, [])

  useEffect(() => {
    let active = true
    clearLegacyAuthStorage()
    const restoreSession = async () => {
      if (location.pathname === '/login') {
        setLoading(false)
        return
      }
      await refreshUser()
      if (active) setLoading(false)
    }
    restoreSession()

    const onUnauthorized = () => {
      setUser(null)
      setLoading(false)
      navigate('/login', { replace: true })
    }
    window.addEventListener('auth:unauthorized', onUnauthorized)
    return () => {
      active = false
      window.removeEventListener('auth:unauthorized', onUnauthorized)
    }
  }, [location.pathname, navigate, refreshUser])

  const login = useCallback(async (username: string, password: string): Promise<void> => {
    const start = performance.now()
    try {
      const result = await authLogin(username, password)
      const duration = Math.round(performance.now() - start)
      setUser(result)
      logger.info('auth', 'Login successful', { user: username, role: result.role, duration })
    } catch (error) {
      logger.warn('auth', 'Login error', { user: username, error: String(error) })
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    const username = user?.username
    try {
      await authLogout()
      logger.info('auth', 'Logged out', { user: username })
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate, user])

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser, loading, isAuthenticated: user !== null }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
