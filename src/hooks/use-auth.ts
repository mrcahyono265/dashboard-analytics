import { useState, useCallback, useEffect } from 'react'
import { login as authLogin, logout as authLogout, getCurrentUser, initDefaultUser, type User } from '@/lib/auth'
import { logger } from '@/lib/logger'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initDefaultUser()
    const currentUser = getCurrentUser()
    setUser(currentUser)
    if (currentUser) {
      logger.info('auth', 'Session restored', { user: currentUser.username, role: currentUser.role })
    }
    setLoading(false)
  }, [])

  const login = useCallback((username: string, password: string): boolean => {
    const start = performance.now()
    const result = authLogin(username, password)
    const duration = Math.round(performance.now() - start)

    if (result) {
      setUser(result)
      logger.info('auth', 'Login successful', { user: username, role: result.role, duration })
      return true
    }

    logger.warn('auth', 'Login failed', { user: username, duration })
    return false
  }, [])

  const logout = useCallback(() => {
    const username = user?.username
    authLogout()
    setUser(null)
    logger.info('auth', 'Logged out', { user: username })
  }, [user])

  return { user, login, logout, loading, isAuthenticated: user !== null }
}
