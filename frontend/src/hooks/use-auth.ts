import { useState, useCallback, useEffect } from 'react'
import { login as authLogin, logout as authLogout, getCurrentUser, type User } from '@/lib/auth'
import { logger } from '@/lib/logger'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          logger.info('auth', 'Session restored', { user: currentUser.username, role: currentUser.role })
        }
      } catch (error) {
        logger.warn('auth', 'Failed to restore session')
      } finally {
        setLoading(false)
      }
    }
    restoreSession()

    const onUserUpdated = () => {
      const stored = localStorage.getItem('prio_dashboard_session')
      if (stored) {
        try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
      }
    }
    window.addEventListener('user-updated', onUserUpdated)
    return () => window.removeEventListener('user-updated', onUserUpdated)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const start = performance.now()
    try {
      const result = await authLogin(username, password)
      const duration = Math.round(performance.now() - start)

      if (result) {
        setUser(result)
        logger.info('auth', 'Login successful', { user: username, role: result.role, duration })
        return true
      }

      logger.warn('auth', 'Login failed', { user: username, duration })
      return false
    } catch (error) {
      logger.warn('auth', 'Login error', { user: username, error: String(error) })
      return false
    }
  }, [])

  const logout = useCallback(() => {
    const username = user?.username
    authLogout()
    setUser(null)
    logger.info('auth', 'Logged out', { user: username })
  }, [user])

  return { user, login, logout, loading, isAuthenticated: user !== null }
}
