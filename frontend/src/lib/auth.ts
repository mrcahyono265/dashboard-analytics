import api, { API_ORIGIN } from './api'

export interface User {
  id?: string
  username: string
  displayName: string
  role: 'RSE' | 'STORE_MANAGER' | 'CRR'
  region?: string | null
  center?: string | null
  crrName?: string | null
  channel?: 'XLC' | 'GSF' | null
  email?: string | null
  phone?: string | null
  avatarUrl?: string | null
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

// Check if backend is available — uses API_ORIGIN from api.ts, not hardcoded localhost
async function isBackendAvailable(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), 3000)
    await fetch(`${API_ORIGIN}/api/health`, {
      method: 'GET',
      signal: ctrl.signal,
    })
    clearTimeout(timeout)
    return true
  } catch {
    return false
  }
}

// Initialize default user for local mode — DEV ONLY, never in production
function initDefaultUser(): void {
  if (!import.meta.env.DEV) return
  try {
    const raw = localStorage.getItem(USERS_KEY)
    const users = raw ? JSON.parse(raw) : []
    if (users.length === 0) {
      users.push({
        username: 'zahra',
        passwordHash: simpleHash('admin123'),
        displayName: 'Mbak Zahra (RSE)',
        role: 'RSE',
        region: 'East'
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
        region: result.user.region,
        center: result.user.center,
        crrName: result.user.crrName,
        channel: result.user.channel,
        email: result.user.email,
        phone: result.user.phone,
        avatarUrl: result.user.avatarUrl
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
      region: found.region,
      center: found.center,
      crrName: found.crrName
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
        region: result.user.region,
        center: result.user.center,
        crrName: result.user.crrName,
        channel: result.user.channel,
        email: result.user.email,
        phone: result.user.phone,
        avatarUrl: result.user.avatarUrl
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

// Helper to check role
export function isRSE(user: User | null): boolean {
  return user?.role === 'RSE'
}

export function isStoreManager(user: User | null): boolean {
  return user?.role === 'STORE_MANAGER'
}

export function isCRR(user: User | null): boolean {
  return user?.role === 'CRR'
}

// Check if user has access (hierarchy)
export function hasAccess(user: User | null, requiredRole: 'RSE' | 'STORE_MANAGER' | 'CRR'): boolean {
  if (!user) return false
  if (user.role === 'RSE') return true
  if (user.role === 'STORE_MANAGER' && (requiredRole === 'STORE_MANAGER' || requiredRole === 'CRR')) return true
  if (user.role === 'CRR' && requiredRole === 'CRR') return true
  return false
}
