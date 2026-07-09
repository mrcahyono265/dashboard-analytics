import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
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
import { Target } from 'lucide-react'

interface TargetRow {
  channel: string
  target: number
  actual: number
  gap: number
  percentage: number
  status: ReturnType<typeof getTargetStatus>
}

export function TargetPage() {
  const { data } = useStore()
  const pageRef = useRef<HTMLDivElement>(null)

  const filteredXlc = useFilteredData(data?.xlc, 'XLC')
  const filteredGsf = useFilteredData(data?.gsf, 'GSF')
  const filteredMerchant = useFilteredData(data?.merchant, 'Merchant')
  const filteredWo = useFilteredData(data?.wo, 'WO')
  const filteredExpo = useFilteredData(data?.expo, 'EXPO')
  const filteredXlsatu = useFilteredData(data?.xlsatu, 'XL Satu')

  const targetRows = useMemo((): TargetRow[] => {
    const actuals: Record<string, number> = {
      XLC: filteredXlc.length,
      GSF: filteredGsf.reduce((s, d) => s + d.Amount, 0),
      Merchant: filteredMerchant.length,
      WO: filteredWo.length,
      EXPO: filteredExpo.length,
      'XL Satu': filteredXlsatu.length,
    }

    return Object.entries(CHANNEL_TARGETS).map(([channel, target]) => {
      const actual = actuals[channel] ?? 0
      const percentage = computeTargetPercentage(actual, target)
      const status = getTargetStatus(percentage)
      return { channel, target, actual, gap: target - actual, percentage, status }
    })
  }, [filteredXlc, filteredGsf, filteredMerchant, filteredWo, filteredExpo, filteredXlsatu])

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

  if (!data) return null

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
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
      </div>
    </div>
  )
}
