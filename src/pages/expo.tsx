import { useRef } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { useTimeSeries, useGroupedByCategory, usePeriodComparison } from '@/hooks/use-time-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { EXPO } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { getTimeLabel } from '@/lib/constants'
import { Megaphone, Users, Building2, Package, Calendar } from 'lucide-react'

export function EXPOPage() {
  const { data } = useStore()
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)
  const expoData = useFilteredData(data?.expo, 'EXPO')

  const periodComparison = usePeriodComparison(expoData, (d) => d.Tanggal || d.Bulan)
  const timeSeries = useTimeSeries(expoData, (d) => d.Tanggal || d.Bulan)
  const chartByPromotor = useGroupedByCategory(expoData, (d) => d.NamaPromotor, () => 1)
  const chartByPackage = useGroupedByCategory(expoData, (d) => d.PackagePlan, () => 1)
  const chartByLocation = useGroupedByCategory(expoData, (d) => d.ExpoName, () => 1)

  const columns: ColumnDef<EXPO>[] = [
    { header: 'MSISDN', accessorKey: 'MSISDN' },
    { header: 'Package', accessorKey: 'PackagePlan' },
    { header: 'Price', accessorKey: 'PricePlan', cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'Expo', accessorKey: 'ExpoName' },
    { header: 'Promotor', accessorKey: 'NamaPromotor' },
    { header: 'RSM', accessorKey: 'RSM' },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
          <ExportButtons data={expoData} filename="EXPO" pageRef={pageRef} columns={columns} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Total EXPO" value={formatNumber(expoData.length)} icon={<Megaphone className="h-5 w-5" />} trend={periodComparison.growth} />
          <KPICard title="Promotors" value={formatNumber(new Set(expoData.map((d) => d.NamaPromotor)).size)} variant="success" icon={<Users className="h-5 w-5" />} />
          <KPICard title="Locations" value={formatNumber(new Set(expoData.map((d) => d.ExpoName)).size)} variant="warning" icon={<Building2 className="h-5 w-5" />} />
        </div>

        {timeSeries.length > 1 && (
          <AreaChart title="Activation Trend" data={timeSeries.map((p) => ({ label: p.label, Activations: p.count }))} index="label" categories={['Activations']} colors={['#c0c1ff']} height={300} />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="By Promotor" data={chartByPromotor} index="name" categories={['value']} colors={['#c0c1ff']} />
          <BarChart title="By Expo Location" data={chartByLocation} index="name" categories={['value']} colors={['#89ceff']} />
        </div>

        <DataTable columns={columns} data={expoData} searchPlaceholder="Search EXPO..." compact />
      </div>
    </div>
  )
}
