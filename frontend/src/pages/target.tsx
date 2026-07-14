import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useRoleScopedData } from '@/hooks/use-role-scoped-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import { formatNumber, formatCompact } from '@/lib/utils'
import {
  CHANNEL_TARGETS, getTargetStatus, getTargetStatusLabel,
  getTargetStatusVariant, computeTargetPercentage,
} from '@/lib/constants'
import type { ColumnDef } from '@tanstack/react-table'
import { Target, Calendar } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/empty-state'
import { api } from '@/lib/api'

interface TargetRow {
  channel: string
  target: number
  actual: number
  gap: number
  percentage: number
  status: ReturnType<typeof getTargetStatus>
}

export function TargetPage() {
  const data = useStore(s => s.data)
  const pageRef = useRef<HTMLDivElement>(null)
  const [apiTargets, setApiTargets] = useState<any[]>([])
  const [targetPeriod, setTargetPeriod] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    const fetchTargets = () => {
      api.getTargets(targetPeriod).then(r => setApiTargets(r.targets || [])).catch(() => {})
    }
    fetchTargets()
    window.addEventListener('data-synced', fetchTargets)
    return () => window.removeEventListener('data-synced', fetchTargets)
  }, [targetPeriod])

  const filteredXlc = useRoleScopedData(data?.xlc, 'XLC')
  const filteredGsf = useRoleScopedData(data?.gsf, 'GSF')
  const filteredMerchant = useRoleScopedData(data?.merchant, 'Merchant')
  const filteredWo = useRoleScopedData(data?.wo, 'WO')
  const filteredExpo = useRoleScopedData(data?.expo, 'EXPO')
  const filteredXlsatu = useRoleScopedData(data?.xlsatu, 'XL Satu')

  const targetRows = useMemo((): TargetRow[] => {
    const actuals: Record<string, number> = {
      XLC: filteredXlc.length,
      GSF: filteredGsf.reduce((s, d) => s + d.Amount, 0),
      Merchant: filteredMerchant.length,
      WO: filteredWo.length,
      EXPO: filteredExpo.length,
      'XL Satu': filteredXlsatu.length,
    }

    const channelTargetMap: Record<string, number> = {}
    const globalChannels = new Set<string>()
    for (const t of apiTargets) {
      if (!t.center && !t.staffName) {
        channelTargetMap[t.channel] = t.targetValue
        globalChannels.add(t.channel)
      }
    }
    for (const t of apiTargets) {
      if (!globalChannels.has(t.channel)) {
        channelTargetMap[t.channel] = (channelTargetMap[t.channel] ?? 0) + t.targetValue
      }
    }

    return (Object.entries(CHANNEL_TARGETS) as [string, number][]).map(([channel, defaultTarget]) => {
      const target = channelTargetMap[channel] ?? defaultTarget
      const actual = actuals[channel] ?? 0
      const percentage = computeTargetPercentage(actual, target)
      const status = getTargetStatus(percentage)
      return { channel, target, actual, gap: target - actual, percentage, status }
    })
  }, [filteredXlc, filteredGsf, filteredMerchant, filteredWo, filteredExpo, filteredXlsatu, apiTargets])

  const overallAchievement = useMemo(() => {
    if (targetRows.length === 0) return 0
    const sum = targetRows.reduce((s, r) => s + r.percentage, 0)
    return Math.round(sum / targetRows.length)
  }, [targetRows])

  const chartData = useMemo(() => {
    return targetRows.map((r) => ({
      name: r.channel,
      Target: r.target > 1_000_000 ? Math.round(r.target / 1_000_000) : r.target,
      Realisasi: r.target > 1_000_000 ? Math.round(r.actual / 1_000_000) : r.actual,
    }))
  }, [targetRows])

  const detailColumns: ColumnDef<TargetRow>[] = [
    { header: 'Channel', accessorKey: 'channel' },
    { header: 'Target', accessorKey: 'target', cell: ({ row }) => row.original.target > 1_000_000 ? formatCompact(row.original.target) : formatNumber(row.original.target) },
    { header: 'Realisasi', accessorKey: 'actual', cell: ({ row }) => row.original.target > 1_000_000 ? formatCompact(row.original.actual) : formatNumber(row.original.actual) },
    { header: 'Gap', accessorKey: 'gap', cell: ({ row }) => {
      const g = row.original.gap
      return g > 0 ? <span className="text-error">({row.original.target > 1_000_000 ? formatCompact(g) : formatNumber(g)})</span> : '-'
    }},
    { header: '%', accessorKey: 'percentage', cell: ({ row }) => <span className="font-bold">{row.original.percentage}%</span> },
    { header: 'Status', accessorKey: 'status', cell: ({ row }) => (
      <span className={
        row.original.status === 'on-track' ? 'text-secondary bg-secondary-container/10 px-4 py-1.5 rounded-full text-xs font-bold border border-secondary/20' :
        row.original.status === 'need-improvement' ? 'text-tertiary bg-tertiary-container/10 px-4 py-1.5 rounded-full text-xs font-bold border border-tertiary/20' :
        'text-error bg-error-container/10 px-4 py-1.5 rounded-full text-xs font-bold border border-error/20'
      }>
        {getTargetStatusLabel(row.original.status)}
      </span>
    )},
  ]

  if (!data) return <EmptyState />

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 border border-outline-variant">
            <Calendar className="h-4 w-4 ml-2 text-on-surface-variant" />
            <input type="month" value={targetPeriod}
              onChange={e => setTargetPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs bg-transparent border-none focus:outline-none cursor-pointer" />
          </div>
          <ExportButtons data={targetRows} filename="Target_vs_Realisasi" pageRef={pageRef} columns={detailColumns} />
        </div>

        {/* Overall Achievement */}
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-sm text-on-surface-variant uppercase font-bold tracking-widest">Overall Achievement</p>
              <p className={`text-5xl font-headline font-bold mt-2 ${overallAchievement >= 100 ? 'text-secondary' : overallAchievement >= 75 ? 'text-tertiary' : 'text-error'}`}>
                {overallAchievement}%
              </p>
              <div className="mt-6 h-4 w-full rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    overallAchievement >= 100 ? 'bg-secondary' : overallAchievement >= 75 ? 'bg-tertiary' : 'bg-error'
                  }`}
                  style={{ width: `${Math.min(overallAchievement, 100)}%` }}
                />
              </div>
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {targetRows.map((r) => (
                  <div key={r.channel} className="text-center">
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">{r.channel}</p>
                    <p className="text-xl font-headline font-bold mt-1">{r.percentage}%</p>
                    <span className={
                      r.status === 'on-track' ? 'text-secondary bg-secondary-container/10 px-3 py-1 rounded-full text-[10px] font-bold border border-secondary/20 mt-1 inline-block' :
                      r.status === 'need-improvement' ? 'text-tertiary bg-tertiary-container/10 px-3 py-1 rounded-full text-[10px] font-bold border border-tertiary/20 mt-1 inline-block' :
                      'text-error bg-error-container/10 px-3 py-1 rounded-full text-[10px] font-bold border border-error/20 mt-1 inline-block'
                    }>
                      {getTargetStatusLabel(r.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <BarChart title="Target vs Realisasi" data={chartData} index="name" categories={['Target', 'Realisasi']} colors={['#8d90a0', '#b4c5ff']} />

        {/* Detail Table */}
        <DataTable columns={detailColumns} data={targetRows} searchable={false} compact />

        {/* Breakdown Table */}
        {apiTargets.filter(t => t.center || t.staffName).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-title-sm">Detail Target — {targetPeriod}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low">
                    <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Channel</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Center</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Staff</th>
                    <th className="text-right py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {apiTargets
                    .filter(t => t.center || t.staffName)
                    .sort((a, b) => a.channel.localeCompare(b.channel, 'id') || a.center?.localeCompare(b.center, 'id') || a.staffName?.localeCompare(b.staffName, 'id'))
                    .map((t, i) => (
                      <tr key={i} className="border-b border-outline-variant/30 hover:bg-surface-container-high transition-colors">
                        <td className="py-3 px-4 font-medium text-on-surface">{t.channel}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{t.center || '—'}</td>
                        <td className="py-3 px-4 text-on-surface-variant">{t.staffName || '—'}</td>
                        <td className="py-3 px-4 text-right font-data-mono text-on-surface">{formatNumber(t.targetValue)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
