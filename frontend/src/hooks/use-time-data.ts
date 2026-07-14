import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { parseDate, getTimeKey, formatTimeLabel, isDateInRange, getPreviousPeriodKey } from '@/lib/date-parser'
import type { TimeMode } from '@/lib/date-parser'

// ─── Shared: Apply custom date range filter ──────────────────
function applyDateRange<T>(
  data: T[],
  extractDate: (item: T) => string,
  customDateRange: { from: string; to: string } | null
): T[] {
  if (!customDateRange) return data
  return data.filter((item) => isDateInRange(extractDate(item), customDateRange.from, customDateRange.to))
}

// ─── Shared: Group data by time key ──────────────────────────
function groupByTimeKey<T>(
  data: T[],
  extractDate: (item: T) => string,
  timeMode: TimeMode
): Map<string, T[]> {
  const buckets = new Map<string, T[]>()
  for (const item of data) {
    const date = parseDate(extractDate(item))
    if (!date) continue
    const key = getTimeKey(date, timeMode)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(item)
  }
  return buckets
}

// ─── useTimeData: Returns grouped items ──────────────────────
export interface TimeBucket<T> {
  key: string
  label: string
  items: T[]
  count: number
}

export function useTimeData<T extends Record<string, any>>(
  data: T[] | undefined,
  extractDate: (item: T) => string,
): TimeBucket<T>[] {
  const timeMode = useStore((s) => s.timeMode)
  const customDateRange = useStore((s) => s.customDateRange)

  return useMemo(() => {
    if (!data?.length) return []
    const filtered = applyDateRange(data, extractDate, customDateRange)
    const buckets = groupByTimeKey(filtered, extractDate, timeMode)

    return Array.from(buckets.entries())
      .map(([key, items]) => ({ key, label: formatTimeLabel(key, timeMode), items, count: items.length }))
      .sort((a, b) => a.key.localeCompare(b.key))
  }, [data, timeMode, customDateRange, extractDate])
}

// ─── useTimeSeries: Returns count + value aggregates ─────────
export interface TimeSeriesPoint {
  period: string
  label: string
  count: number
  value: number
}

export function useTimeSeries<T extends Record<string, any>>(
  data: T[] | undefined,
  extractDate: (item: T) => string,
  extractValue: (item: T) => number = () => 1,
): TimeSeriesPoint[] {
  const timeMode = useStore((s) => s.timeMode)
  const customDateRange = useStore((s) => s.customDateRange)

  return useMemo(() => {
    if (!data?.length) return []
    const filtered = applyDateRange(data, extractDate, customDateRange)
    const buckets = groupByTimeKey(filtered, extractDate, timeMode)

    return Array.from(buckets.entries())
      .map(([key, items]) => ({
        period: key,
        label: formatTimeLabel(key, timeMode),
        count: items.length,
        value: items.reduce((sum, item) => sum + extractValue(item), 0),
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
  }, [data, timeMode, customDateRange, extractDate, extractValue])
}

// ─── useGroupedByCategory: Group by arbitrary category ───────
export function useGroupedByCategory<T extends Record<string, any>>(
  data: T[] | undefined,
  extractCategory: (item: T) => string,
  extractValue: (item: T) => number = () => 1,
  limit?: number,
): { name: string; value: number }[] {
  const customDateRange = useStore((s) => s.customDateRange)

  return useMemo(() => {
    if (!data?.length) return []
    const filtered = applyDateRange(data, (item) => item.Tanggal ?? item.Bulan ?? '', customDateRange)

    const map = new Map<string, number>()
    for (const item of filtered) {
      const cat = extractCategory(item) || 'Unknown'
      map.set(cat, (map.get(cat) ?? 0) + extractValue(item))
    }

    const result = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    return limit ? result.slice(0, limit) : result
  }, [data, customDateRange, extractCategory, extractValue, limit])
}

// ─── usePeriodComparison: Current vs previous period ─────────
export function usePeriodComparison<T extends Record<string, any>>(
  data: T[] | undefined,
  extractDate: (item: T) => string,
): { current: number; previous: number; growth: number } {
  const timeMode = useStore((s) => s.timeMode)

  return useMemo(() => {
    if (!data?.length) return { current: 0, previous: 0, growth: 0 }

    const now = new Date()
    const currentKey = getTimeKey(now, timeMode)
    const prevKey = getPreviousPeriodKey(currentKey, timeMode)

    let currentCount = 0
    let previousCount = 0

    for (const item of data) {
      const date = parseDate(extractDate(item))
      if (!date) continue
      const key = getTimeKey(date, timeMode)
      if (key === currentKey) currentCount++
      else if (prevKey && key === prevKey) previousCount++
    }

    const growth = previousCount > 0
      ? Math.round(((currentCount - previousCount) / previousCount) * 100)
      : currentCount > 0 ? 100 : 0

    return { current: currentCount, previous: previousCount, growth }
  }, [data, timeMode, extractDate])
}
