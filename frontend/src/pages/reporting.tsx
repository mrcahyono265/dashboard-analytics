import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useAllChannelData } from '@/hooks/use-channel-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ColumnDef } from '@tanstack/react-table'
import { formatNumber, formatCurrency, formatCompact } from '@/lib/utils'
import {
  FileText, Smartphone, CreditCard, Store, UserRound, Megaphone, Wifi,
  TrendingUp, BarChart3
} from 'lucide-react'
import { EmptyState } from '@/components/dashboard/empty-state'

interface ChannelSummary {
  channel: string
  total: number
  percentage: number
  icon: React.ReactNode
  color: string
}

interface MonthlyRecap {
  month: string
  xlc: number
  gsf: number
  merchant: number
  wo: number
  expo: number
  xlsatu: number
  total: number
}

export function ReportingPage() {
  const pageRef = useRef<HTMLDivElement>(null)
  const data = useStore(s => s.data)
  const { xlc, gsf, merchant, wo, expo, xlsatu } = useAllChannelData()

  if (!data) return <EmptyState />

  const xlcTotal = xlc.length
  const gsfTotal = gsf.reduce((s, d) => s + d.Amount, 0)
  const gsfCount = gsf.length
  const merchantTotal = merchant.length
  const woTotal = wo.length
  const expoTotal = expo.length
  const xlsatuTotal = xlsatu.length
  const grandActivation = xlcTotal + merchantTotal + woTotal + expoTotal + xlsatuTotal

  const channelSummary: ChannelSummary[] = [
    { channel: 'XLC', total: xlcTotal, percentage: grandActivation > 0 ? Math.round((xlcTotal / grandActivation) * 100) : 0, icon: <Smartphone className="h-4 w-4" />, color: 'text-primary' },
    { channel: 'Merchant', total: merchantTotal, percentage: grandActivation > 0 ? Math.round((merchantTotal / grandActivation) * 100) : 0, icon: <Store className="h-4 w-4" />, color: 'text-tertiary' },
    { channel: 'WO Agent', total: woTotal, percentage: grandActivation > 0 ? Math.round((woTotal / grandActivation) * 100) : 0, icon: <UserRound className="h-4 w-4" />, color: 'text-error' },
    { channel: 'EXPO', total: expoTotal, percentage: grandActivation > 0 ? Math.round((expoTotal / grandActivation) * 100) : 0, icon: <Megaphone className="h-4 w-4" />, color: 'text-tertiary' },
    { channel: 'XL Satu', total: xlsatuTotal, percentage: grandActivation > 0 ? Math.round((xlsatuTotal / grandActivation) * 100) : 0, icon: <Wifi className="h-4 w-4" />, color: 'text-secondary' },
  ]

  const monthlyRecap = useMemo((): MonthlyRecap[] => {
    const monthMap = new Map<string, MonthlyRecap>()
    const channels = [
      { data: xlc, key: 'xlc' as const },
      { data: merchant, key: 'merchant' as const },
      { data: wo, key: 'wo' as const },
      { data: expo, key: 'expo' as const },
      { data: xlsatu, key: 'xlsatu' as const },
    ]

    for (const { data: items, key } of channels) {
      for (const item of items) {
        const m = item.Bulan || 'Unknown'
        if (!monthMap.has(m)) monthMap.set(m, { month: m, xlc: 0, gsf: 0, merchant: 0, wo: 0, expo: 0, xlsatu: 0, total: 0 })
        const entry = monthMap.get(m)!
        entry[key]++
        entry.total++
      }
    }

    return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month))
  }, [xlc, merchant, wo, expo, xlsatu])

  const topStores = useMemo(() => {
    const all = [...xlc, ...merchant]
    const map = new Map<string, number>()
    for (const item of all) {
      const store = item.StoreName || 'Unknown'
      map.set(store, (map.get(store) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [xlc, merchant])

  const topRSM = useMemo(() => {
    const all = [...xlc, ...merchant, ...wo, ...expo]
    const map = new Map<string, number>()
    for (const item of all) {
      const rsm = (item as any).RSM || 'Unknown'
      map.set(rsm, (map.get(rsm) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [xlc, merchant, wo, expo])

  const monthlyTrend = useMemo(() => {
    return monthlyRecap.map((m) => ({
      label: m.month,
      XLC: m.xlc,
      Merchant: m.merchant,
      WO: m.wo,
      EXPO: m.expo,
      'XL Satu': m.xlsatu,
    }))
  }, [monthlyRecap])

  const gsfAvg = gsfCount > 0 ? Math.round(gsfTotal / gsfCount) : 0

  const recapColumns: ColumnDef<MonthlyRecap>[] = [
    { header: 'Month', accessorKey: 'month' },
    { header: 'XLC', accessorKey: 'xlc' },
    { header: 'GSF', accessorKey: 'gsf' },
    { header: 'Merchant', accessorKey: 'merchant' },
    { header: 'WO', accessorKey: 'wo' },
    { header: 'EXPO', accessorKey: 'expo' },
    { header: 'XL Satu', accessorKey: 'xlsatu' },
    { header: 'Total', accessorKey: 'total', cell: ({ row }) => (
      <span className="font-bold">{formatNumber(row.original.total)}</span>
    )},
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
          <ExportButtons data={monthlyRecap} filename="Full_Report" pageRef={pageRef} columns={recapColumns} variant="dropdown" />
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Grand Total Activations" value={formatCompact(grandActivation)} subtitle="All channels" variant="success" icon={<BarChart3 className="h-5 w-5" />} />
          <KPICard title="Total GSF Revenue" value={formatCurrency(gsfTotal)} subtitle={`${formatNumber(gsfCount)} transactions`} variant="default" icon={<CreditCard className="h-5 w-5" />} />
          <KPICard title="Avg GSF Transaction" value={formatCurrency(gsfAvg)} subtitle="Per transaction" variant="warning" icon={<TrendingUp className="h-5 w-5" />} />
          <KPICard title="Active Months" value={formatNumber(monthlyRecap.length)} subtitle="Data coverage" variant="default" icon={<FileText className="h-5 w-5" />} />
        </div>

        {/* Channel Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelSummary.map((ch) => (
                <div key={ch.channel} className="flex items-center gap-2 sm:gap-3">
                  <span className={ch.color}>{ch.icon}</span>
                  <span className="text-sm font-bold text-on-surface min-w-[72px] md:min-w-[96px]">{ch.channel}</span>
                  <div className="flex-1 h-2.5 bg-surface-container-high rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${ch.percentage}%` }} />
                  </div>
                  <span className="text-sm text-on-surface-variant min-w-[64px] md:min-w-[80px] text-right font-data-mono">{formatNumber(ch.total)}</span>
                  <span className="text-xs text-on-surface-variant min-w-[40px] md:min-w-[48px] text-right font-bold">{ch.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        {monthlyTrend.length > 1 && (
          <AreaChart title="Monthly Activation Trend" data={monthlyTrend} index="label" categories={['XLC', 'Merchant', 'WO', 'EXPO', 'XL Satu']} colors={['#b4c5ff', '#c0c1ff', '#f87171', '#fbbf24', '#22d3ee']} height={350} />
        )}

        {/* Top Stores + RSM */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="Top 10 Stores" data={topStores} index="name" categories={['value']} colors={['#b4c5ff']} />
          <BarChart title="Top 10 RSM" data={topRSM} index="name" categories={['value']} colors={['#89ceff']} />
        </div>

        {/* Monthly Recap Table */}
        <DataTable columns={recapColumns} data={monthlyRecap} searchPlaceholder="Search month..." compact />
      </div>
    </div>
  )
}
