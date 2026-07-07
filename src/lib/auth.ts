export interface User {
  username: string
  displayName: string
  role: 'admin' | 'viewer'
}

interface StoredUser {
  username: string
  passwordHash: string
  displayName: string
  role: 'admin' | 'viewer'
}

const USERS_KEY = 'prio_dashboard_users'
const SESSION_KEY = 'prio_dashboard_session'

// Simple hash function (not cryptographically secure, but fine for client-side MVP)
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return 'h_' + Math.abs(hash).toString(36)
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveStoredUsers(users: StoredUser[]): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function initDefaultUser(): void {
  const users = getStoredUsers()
  if (users.length === 0) {
    users.push({
      username: 'admin',
      passwordHash: simpleHash('admin123'),
      displayName: 'Administrator',
      role: 'admin',
    })
    saveStoredUsers(users)
  }
}

export function login(username: string, password: string): User | null {
  const users = getStoredUsers()
  const found = users.find(
    (u) => u.username === username && u.passwordHash === simpleHash(password)
  )
  if (!found) return null

  const user: User = {
    username: found.username,
    displayName: found.displayName,
    role: found.role,
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null
}
