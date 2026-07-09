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
import type { XLC } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { getTimeLabel } from '@/lib/constants'
import { Smartphone, Users, Store, ArrowRightLeft, DollarSign, Calendar } from 'lucide-react'

export function XLCPage() {
  const { data } = useStore()
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)
  const xlcData = useFilteredData(data?.xlc, 'XLC')

  const totalNew = xlcData.filter((d) => d.NewMigrate === 'New').length
  const totalMigrate = xlcData.filter((d) => d.NewMigrate === 'Migrate').length
  const storeCount = new Set(xlcData.map((d) => d.StoreName)).size
  const totalRevenue = xlcData.reduce((sum, d) => sum + d.PricePlan, 0)

  const periodComparison = usePeriodComparison(xlcData, (d) => d.Tanggal || d.Bulan)
  const timeSeries = useTimeSeries(xlcData, (d) => d.Tanggal || d.Bulan)
  const chartByStore = useGroupedByCategory(xlcData, (d) => d.StoreName, () => 1, 10)
  const chartByCRR = useGroupedByCategory(xlcData, (d) => d.NamaCRR, () => 1, 10)
  const chartByPackage = useGroupedByCategory(xlcData, (d) => d.PackagePlan, () => 1, 8)

  const columns: ColumnDef<XLC>[] = [
    {
      header: 'MSISDN',
      accessorKey: 'MSISDN',
      cell: ({ row }) => <span className="font-data-mono text-primary font-bold">{row.original.MSISDN}</span>,
    },
    {
      header: 'Tanggal',
      accessorKey: 'Tanggal',
      cell: ({ row }) => <span className="text-on-surface-variant text-sm">{row.original.Tanggal || row.original.Bulan}</span>,
    },
    {
      header: 'Package',
      accessorKey: 'PackagePlan',
      cell: ({ row }) => (
        <span className="bg-secondary-container/20 text-secondary px-3 py-1 rounded-xl text-[10px] font-bold border border-secondary/30 uppercase tracking-tighter">
          {row.original.PackagePlan}
        </span>
      ),
    },
    { header: 'Price', accessorKey: 'PricePlan', cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'Store', accessorKey: 'StoreName', cell: ({ row }) => <span className="font-bold text-on-surface">{row.original.StoreName}</span> },
    { header: 'Agent', accessorKey: 'UsernameAgent' },
    { header: 'CRR', accessorKey: 'NamaCRR' },
    { header: 'RSM', accessorKey: 'RSM' },
    {
      header: 'Status',
      accessorKey: 'NewMigrate',
      cell: ({ row }) => (
        <span className={row.original.NewMigrate === 'New' ? 'text-secondary bg-secondary-container/10 px-4 py-1.5 rounded-full text-xs font-bold border border-secondary/20' : 'text-tertiary bg-tertiary-container/10 px-4 py-1.5 rounded-full text-xs font-bold border border-tertiary/20'}>
          {row.original.NewMigrate}
        </span>
      ),
    },
  ]

  const timeLabel = getTimeLabel(timeMode)

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        {/* Page Header with Export */}
        <div className="flex items-center justify-end">
          <ExportButtons data={xlcData} filename="XLC_Activation" pageRef={pageRef} columns={columns} />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPICard title="Total XLC Active" value={formatNumber(xlcData.length)} icon={<Smartphone className="h-5 w-5" />} trend={periodComparison.growth} />
          <KPICard title="New Migrations" value={formatNumber(totalNew)} subtitle="vs Migrate" trend={periodComparison.growth} variant="success" icon={<Users className="h-5 w-5" />} />
          <KPICard title="Revenue" value={`Rp ${formatNumber(totalRevenue)}`} subtitle={`Across ${storeCount} stores`} variant="default" icon={<DollarSign className="h-5 w-5" />} />
        </div>

        {/* Trend Chart */}
        {timeSeries.length > 1 && (
          <AreaChart
            title="XLC Monthly Performance"
            data={timeSeries.map((p) => ({ label: p.label, Activations: p.count }))}
            index="label"
            categories={['Activations']}
            colors={['#b4c5ff']}
            height={300}
          />
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="Activations by Store" data={chartByStore} index="name" categories={['value']} colors={['#b4c5ff']} />
          <BarChart title="Top CRR Performers" data={chartByCRR} index="name" categories={['value']} colors={['#89ceff']} />
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={xlcData} searchPlaceholder="Filter by MSISDN or Store..." compact />
      </div>
    </div>
  )
}
