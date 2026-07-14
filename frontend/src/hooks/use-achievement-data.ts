import { useState, useEffect, useMemo, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { parseDate, getThisMonthKey } from '@/lib/date-parser'
import { computeXLCGSFReport, computeWOReport, computeEXPOReport } from '@/lib/achievement-computer'
import type { CardData } from '@/lib/achievement-computer'

function bulanToPeriod(bulan: any): string | null {
  if (!bulan) return null
  let d: Date | null = null
  if (bulan instanceof Date && !isNaN(bulan.getTime())) {
    d = bulan
  } else if (typeof bulan === 'number') {
    d = new Date((bulan - 25569) * 86400000)
  } else if (typeof bulan === 'string') {
    d = parseDate(bulan)
  }
  if (!d || isNaN(d.getTime())) return null
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export interface AchievementResult {
  xlcgsf: CardData[]
  wo: CardData[]
  expo: CardData[]
  targets: any[]
  targetsLoading: boolean
  period: string
  periodLabel: string
  availablePeriods: string[]
  hasAnyData: boolean
  refetchTargets: () => void
}

export function useAchievementData(period?: string): AchievementResult {
  const data = useStore((s) => s.data)

  const availablePeriods = useMemo(() => {
    const months = new Set<string>()
    if (!data) return []
    for (const rec of (data.xlc || []) as any[]) {
      const p = bulanToPeriod(rec.Bulan)
      if (p) months.add(p)
    }
    for (const rec of (data.gsf || []) as any[]) {
      const p = bulanToPeriod(rec.Bulan)
      if (p) months.add(p)
    }
    for (const rec of (data.wo || []) as any[]) {
      const p = bulanToPeriod(rec.Bulan)
      if (p) months.add(p)
    }
    for (const rec of (data.expo || []) as any[]) {
      const p = bulanToPeriod(rec.Bulan)
      if (p) months.add(p)
    }
    for (const rec of (data.xlsatu || []) as any[]) {
      const p = bulanToPeriod(rec.Bulan)
      if (p) months.add(p)
    }
    return Array.from(months).sort()
  }, [data])

  const effectivePeriod = period || availablePeriods[availablePeriods.length - 1] || getThisMonthKey()
  const [targets, setTargets] = useState<any[]>([])
  const [targetsLoading, setTargetsLoading] = useState(false)

  const fetchTargets = useCallback(() => {
    if (!api.getToken()) return
    setTargetsLoading(true)
    api.getTargets(effectivePeriod)
      .then(r => setTargets(r.targets || []))
      .catch(() => {})
      .finally(() => setTargetsLoading(false))
  }, [effectivePeriod])

  const [smMap, setSmMap] = useState<Map<string, string>>(new Map())

  const fetchSmMap = useCallback(() => {
    if (!api.getToken()) return
    api.getUserAssignments({ roleType: 'SM' })
      .then(r => {
        const map = new Map<string, string>()
        for (const a of (r.assignments || [])) {
          map.set(`${a.channel}|${a.storeName}`, a.user?.displayName || '')
        }
        setSmMap(map)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchTargets()
    fetchSmMap()
    window.addEventListener('data-synced', fetchTargets)
    return () => window.removeEventListener('data-synced', fetchTargets)
  }, [fetchTargets, fetchSmMap])

  const hasAnyData = useMemo(() => {
    if (!data) return false
    return !!((data.xlc?.length) || (data.gsf?.length) || (data.wo?.length) || (data.expo?.length))
  }, [data])

  const filtered = useMemo(() => {
    if (!data) return { xlc: [] as any[], gsf: [] as any[], wo: [] as any[], expo: [] as any[], xlsatu: [] as any[] }
    const filter = <T extends { Bulan: any }>(recs: T[]): T[] => {
      if (!effectivePeriod) return recs
      const matched = recs.filter(r => {
        const p = bulanToPeriod(r.Bulan)
        return p === effectivePeriod
      })
      return matched.length > 0 ? matched : recs
    }
    return {
      xlc: filter(data.xlc || []),
      gsf: filter(data.gsf || []),
      wo: filter(data.wo || []),
      expo: filter(data.expo || []),
      xlsatu: filter(data.xlsatu || []),
    }
  }, [data, effectivePeriod])

  const xlcgsf = useMemo(() => computeXLCGSFReport(filtered.xlc as any[], filtered.gsf as any[], filtered.xlsatu as any[], targets, smMap), [filtered, targets, smMap])
  const wo = useMemo(() => computeWOReport(filtered.wo as any[], filtered.xlsatu as any[], targets, smMap), [filtered, targets, smMap])
  const expo = useMemo(() => computeEXPOReport(filtered.expo as any[], targets, smMap), [filtered, targets, smMap])

  const periodLabel = useMemo(() => {
    if (!effectivePeriod) return ''
    const [y, m] = effectivePeriod.split('-')
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
    return `${months[parseInt(m) - 1] || ''} ${y}`
  }, [effectivePeriod])

  return {
    xlcgsf, wo, expo,
    targets,
    targetsLoading,
    period: effectivePeriod,
    periodLabel,
    availablePeriods,
    hasAnyData,
    refetchTargets: fetchTargets,
  }
}
