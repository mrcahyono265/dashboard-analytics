import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import type { FilterState } from '@/lib/store'

export function applyFilters<T extends Record<string, any>>(
  data: T[],
  filters: FilterState
): T[] {
  if (!data.length) return data
  const { bulan, rsm, sm, store, channel } = filters
  const hasBulan = bulan.length > 0
  const hasRsm = rsm.length > 0
  const hasSm = sm.length > 0
  const hasStore = store.length > 0
  const hasChannel = channel.length > 0

  if (!hasBulan && !hasRsm && !hasSm && !hasStore && !hasChannel) return data

  return data.filter((item) => {
    if (hasBulan && !bulan.includes(item.Bulan ?? '')) return false
    if (hasRsm && !rsm.includes(item.RSM ?? item.Rsm ?? '')) return false
    if (hasSm && !sm.includes(item.SM ?? item.Sm ?? '')) return false
    if (hasStore) {
      const v = item.StoreName ?? item.Store ?? item.XLCName ?? item.ExpoName ?? item.Galeri ?? item.Office ?? ''
      if (!store.includes(v)) return false
    }
    return true
  })
}

export function useFilteredData<T extends Record<string, any>>(
  data: T[] | undefined,
  channel?: string
): T[] {
  const filters = useStore((s) => s.filters)
  return useMemo(() => {
    if (channel && filters.channel.length > 0) {
      if (!filters.channel.includes(channel)) return []
    }
    return applyFilters(data ?? [], filters)
  }, [data, filters, channel])
}
