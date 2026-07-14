import { useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { useStore } from '@/lib/store'
import { getRoleScope, filterByRoleScope, filterByDrillDown, canDrillDown } from '@/lib/rbac'

export function useRoleScopedData<T extends Record<string, any>>(
  data: T[] | undefined,
  channel?: string,
): T[] {
  const { user } = useAuth()
  const scope = getRoleScope(user)
  const drillDown = useStore((s) => s.drillDown)
  const canDrill = canDrillDown(user)

  const roleFiltered = useMemo(
    () => (data && channel ? filterByRoleScope(data, channel, scope) : (data ?? [])),
    [data, channel, scope.level, scope.value],
  )

  const drillFiltered = useMemo(
    () => (canDrill && channel ? filterByDrillDown(roleFiltered, channel, drillDown) : roleFiltered),
    [roleFiltered, channel, canDrill, drillDown.center, drillDown.crr],
  )

  return useFilteredData(drillFiltered, channel)
}
