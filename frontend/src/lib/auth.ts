import api from './api'

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

export async function login(username: string, password: string): Promise<User> {
  try {
    const result = await api.login(username, password)
    return result.user
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Tidak dapat terhubung ke backend. Pastikan backend aktif dan VITE_API_URL benar.')
    }
    if (error instanceof Error && error.message === 'Invalid credentials') {
      throw new Error('Username atau password salah.')
    }
    if (error instanceof Error && error.message.startsWith('Too many login attempts')) {
      throw new Error('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.')
    }
    throw error
  }
}

export async function logout(): Promise<void> {
  await api.logout()
}

export function clearLegacyAuthStorage(): void {
  try {
    localStorage.removeItem('analitics_token')
    localStorage.removeItem('prio_dashboard_auth_mode')
    localStorage.removeItem('prio_dashboard_session')
  } catch {
    // Authentication uses the HttpOnly cookie, not localStorage.
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const result = await api.getMe()
    return result.user
  } catch {
    return null
  }
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
