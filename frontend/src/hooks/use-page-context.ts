import { useRef } from 'react'
import { useStore } from '@/lib/store'
import { useRoleScopedData } from '@/hooks/use-role-scoped-data'
import { usePeriodComparison, useTimeSeries } from '@/hooks/use-time-data'
import type { TimeMode } from '@/lib/date-parser'
import type { DashboardData } from '@/lib/data'

export interface PageContext<T extends Record<string, any>> {
  data: T[]
  timeMode: TimeMode
  pageRef: React.RefObject<HTMLDivElement | null>
  periodComparison: { current: number; previous: number; growth: number }
  timeSeries: { period: string; label: string; count: number; value: number }[]
}

export function usePageContext<K extends keyof DashboardData>(
  channelKey: K,
  filterChannel?: string
): PageContext<any> {
  const storeData = useStore((s) => s.data)
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)

  const rawData = storeData?.[channelKey]
  const data = useRoleScopedData(
    rawData as Record<string, any>[] | undefined,
    filterChannel
  )

  const extractDate = (item: Record<string, any>) =>
    (item as any).Tanggal || (item as any).Bulan || ''

  const periodComparison = usePeriodComparison(data, extractDate)
  const timeSeries = useTimeSeries(data, extractDate)

  return { data, timeMode, pageRef, periodComparison, timeSeries }
}
