import api from './api'

export interface User {
  id?: string
  username: string
  displayName: string
  role: 'admin' | 'viewer' | 'ADMIN' | 'MANAGER' | 'SALES'
  rsm?: string | null
  sm?: string | null
  storeName?: string | null
}

const SESSION_KEY = 'prio_dashboard_session'
const USERS_KEY = 'prio_dashboard_users'
const AUTH_MODE_KEY = 'prio_dashboard_auth_mode'

// Simple hash function (for local fallback)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(36)
}

// Check if backend is available
async function isBackendAvailable(): Promise<boolean> {
  try {
    await fetch('http://localhost:3001/api/health', { method: 'GET' })
    return true
  } catch {
    return false
  }
}

// Initialize default user for local mode
function initDefaultUser(): void {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    if (users.length === 0) {
      users.push({
        username: 'admin',
        passwordHash: simpleHash('admin123'),
        displayName: 'Administrator',
        role: 'admin',
      })
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }
  } catch {}
}

export async function login(username: string, password: string): Promise<User | null> {
  // Try API login first
  const backendAvailable = await isBackendAvailable()

  if (backendAvailable) {
    try {
      const result = await api.login(username, password)
      const user: User = {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        role: result.user.role,
        rsm: result.user.rsm,
        sm: result.user.sm,
        storeName: result.user.storeName,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      localStorage.setItem(AUTH_MODE_KEY, 'api')
      return user
    } catch (error) {
      console.warn('API login failed, trying local auth:', error)
    }
  }

  // Fallback to local auth
  initDefaultUser()
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    const found = users.find(
      (u: any) => u.username === username && u.passwordHash === simpleHash(password)
    )
    if (!found) return null

    const user: User = {
      username: found.username,
      displayName: found.displayName,
      role: found.role,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    localStorage.setItem(AUTH_MODE_KEY, 'local')
    return user
  } catch {
    return null
  }
}

export function logout(): void {
  api.logout()
  localStorage.removeItem(SESSION_KEY)
  localStorage.removeItem(AUTH_MODE_KEY)
}

export async function getCurrentUser(): Promise<User | null> {
  // Check if we have a session
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null

  const authMode = localStorage.getItem(AUTH_MODE_KEY)

  // If using API mode, validate token with backend
  if (authMode === 'api' && api.getToken()) {
    try {
      const result = await api.getMe()
      const user: User = {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        role: result.user.role,
        rsm: result.user.rsm,
        sm: result.user.sm,
        storeName: result.user.storeName,
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      return user
    } catch {
      // Token invalid, clear session
      logout()
      return null
    }
  }

  // Local mode - just return stored user
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(SESSION_KEY) !== null
}

// Helper to normalize role to lowercase
export function getNormalizedRole(user: User | null): string {
  if (!user) return 'viewer'
  const role = user.role.toLowerCase()
  if (role === 'admin') return 'admin'
  if (role === 'manager') return 'manager'
  if (role === 'sales') return 'sales'
  return 'viewer'
}

// Check if user has access
export function hasAccess(user: User | null, requiredRole: 'admin' | 'manager' | 'sales'): boolean {
  if (!user) return false
  const role = getNormalizedRole(user)
  if (role === 'admin') return true
  if (role === 'manager' && (requiredRole === 'manager' || requiredRole === 'sales')) return true
  if (role === 'sales' && requiredRole === 'sales') return true
  return false
}
