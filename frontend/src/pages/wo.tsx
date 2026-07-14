import { useRef } from 'react'
import { useStore } from '@/lib/store'
import { useRoleScopedData } from '@/hooks/use-role-scoped-data'
import { useTimeSeries, useGroupedByCategory, usePeriodComparison } from '@/hooks/use-time-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { WO } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { getTimeLabel } from '@/lib/constants'
import { UserRound, MapPin, Users, DollarSign, Calendar } from 'lucide-react'

export function WOPage() {
  const data = useStore(s => s.data)
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)
  const woData = useRoleScopedData(data?.wo, 'WO')

  const totalRevenue = woData.reduce((s, d) => s + d.PricePlan, 0)
  const periodComparison = usePeriodComparison(woData, (d) => d.Tanggal || d.Bulan)
  const timeSeries = useTimeSeries(woData, (d) => d.Tanggal || d.Bulan)
  const chartByAgent = useGroupedByCategory(woData, (d) => d.AgentWO, () => 1)
  const chartByXLC = useGroupedByCategory(woData, (d) => d.XLCName, () => 1)

  const columns: ColumnDef<WO>[] = [
    { header: 'MSISDN', accessorKey: 'MSISDN' },
    { header: 'Package', accessorKey: 'PackagePlan' },
    { header: 'Price', accessorKey: 'PricePlan', cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'XLC', accessorKey: 'XLCName' },
    { header: 'Agent WO', accessorKey: 'AgentWO' },
    { header: 'RSM', accessorKey: 'RSM' },
    { header: 'Leader', accessorKey: 'Leader' },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
          <ExportButtons data={woData} filename="WO_Agent" pageRef={pageRef} columns={columns} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Total WO Agent" value={formatNumber(woData.length)} icon={<UserRound className="h-5 w-5" />} trend={periodComparison.growth} />
          <KPICard title="Agents" value={formatNumber(new Set(woData.map((d) => d.AgentWO)).size)} variant="success" icon={<Users className="h-5 w-5" />} />
          <KPICard title="Revenue" value={`Rp ${formatNumber(totalRevenue)}`} variant="warning" icon={<DollarSign className="h-5 w-5" />} />
        </div>

        {timeSeries.length > 1 && (
          <AreaChart title="Activation Trend" data={timeSeries.map((p) => ({ label: p.label, Activations: p.count }))} index="label" categories={['Activations']} colors={['#f87171']} height={300} />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="By Agent WO" data={chartByAgent} index="name" categories={['value']} colors={['#f87171']} />
          <BarChart title="By XLC Location" data={chartByXLC} index="name" categories={['value']} colors={['#c0c1ff']} />
        </div>

        <DataTable columns={columns} data={woData} searchPlaceholder="Search WO data..." compact />
      </div>
    </div>
  )
}
