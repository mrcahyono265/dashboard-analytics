import type { User } from '@/lib/auth'

export interface ChannelHierarchy {
  rse: string
  manager: string
  staff: string
}

export const CHANNEL_HIERARCHY: Record<string, ChannelHierarchy | null> = {
  xlc:      { rse: 'RSM', manager: 'StoreName', staff: 'NamaCRR' },
  merchant: { rse: 'RSM', manager: 'StoreName', staff: 'NamaCRR' },
  xlsatu:   { rse: 'RSM', manager: 'StoreName', staff: 'NamaCRR' },
  wo:       { rse: 'RSM', manager: 'XLCName',   staff: 'AgentWO' },
  expo:     { rse: 'RSM', manager: 'ExpoName',  staff: 'NamaPromotor' },
  gsf:      null,
  elite:    null,
  promotor: null,
}

export type RoleLevel = 'all' | 'manager' | 'staff'

export interface RoleScope {
  level: RoleLevel
  value: string | null
}

export function getRoleScope(user: User | null): RoleScope {
  if (!user) return { level: 'all', value: null }
  if (user.role === 'RSE') return { level: 'all', value: null }
  if (user.role === 'STORE_MANAGER') return { level: 'manager', value: user.center ?? null }
  return { level: 'staff', value: user.crrName ?? null }
}

export function filterByRoleScope<T extends Record<string, any>>(
  data: T[],
  channel: string,
  scope: RoleScope,
): T[] {
  if (scope.level === 'all' || !scope.value) return data

  const key = channel.toLowerCase().replace(/\s/g, '')
  const hierarchy = CHANNEL_HIERARCHY[key]
  if (!hierarchy) return data

  const field = scope.level === 'manager' ? hierarchy.manager : hierarchy.staff
  return data.filter((item) => item[field] === scope.value)
}

export function canDrillDown(user: User | null): boolean {
  return user?.role === 'RSE' || user?.role === 'STORE_MANAGER'
}

export function filterByDrillDown<T extends Record<string, any>>(
  data: T[],
  channel: string,
  drillDown: { center: string | null; crr: string | null },
): T[] {
  const key = channel.toLowerCase().replace(/\s/g, '')
  const hierarchy = CHANNEL_HIERARCHY[key]
  if (!hierarchy) return data

  let result = data
  if (drillDown.center) {
    result = result.filter((item) => item[hierarchy.manager] === drillDown.center)
  }
  if (drillDown.crr) {
    result = result.filter((item) => item[hierarchy.staff] === drillDown.crr)
  }
  return result
}

export function getDrillDownOptions(
  data: Record<string, any>[],
  channel: string,
): { centers: string[]; crrs: string[] } {
  const key = channel.toLowerCase().replace(/\s/g, '')
  const hierarchy = CHANNEL_HIERARCHY[key]
  if (!hierarchy) return { centers: [], crrs: [] }

  const centers = [...new Set(data.map((d) => d[hierarchy.manager]).filter(Boolean))].sort()
  const crrs = [...new Set(data.map((d) => d[hierarchy.staff]).filter(Boolean))].sort()
  return { centers, crrs }
}
