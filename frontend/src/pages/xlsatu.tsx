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
import type { XLSatu } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { getTimeLabel } from '@/lib/constants'
import { Wifi, Store, Users, Globe, Calendar } from 'lucide-react'

export function XLSatuPage() {
  const data = useStore(s => s.data)
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)
  const xlsatuData = useRoleScopedData(data?.xlsatu, 'XL Satu')

  const periodComparison = usePeriodComparison(xlsatuData, (d) => d.Tanggal || d.Bulan)
  const timeSeries = useTimeSeries(xlsatuData, (d) => d.Tanggal || d.Bulan)
  const chartByStore = useGroupedByCategory(xlsatuData, (d) => d.StoreName, () => 1)
  const chartByCRR = useGroupedByCategory(xlsatuData, (d) => d.NamaCRR, () => 1)

  const columns: ColumnDef<XLSatu>[] = [
    { header: 'No. SO', accessorKey: 'NoSO' },
    { header: 'Package', accessorKey: 'PackagePlan' },
    { header: 'Price', accessorKey: 'PricePlan', cell: ({ row }) => row.original.PricePlan ? `Rp ${formatNumber(row.original.PricePlan)}` : '-' },
    { header: 'Store', accessorKey: 'StoreName' },
    { header: 'CRR', accessorKey: 'NamaCRR' },
    { header: 'RSM', accessorKey: 'RSM' },
    { header: 'SM', accessorKey: 'SM' },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
          <ExportButtons data={xlsatuData} filename="XL_Satu" pageRef={pageRef} columns={columns} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Total XL Satu" value={formatNumber(xlsatuData.length)} icon={<Wifi className="h-5 w-5" />} trend={periodComparison.growth} />
          <KPICard title="Active Stores" value={formatNumber(new Set(xlsatuData.map((d) => d.StoreName)).size)} variant="success" icon={<Store className="h-5 w-5" />} />
          <KPICard title="CRRs" value={formatNumber(new Set(xlsatuData.map((d) => d.NamaCRR)).size)} variant="warning" icon={<Users className="h-5 w-5" />} />
        </div>

        {timeSeries.length > 1 && (
          <AreaChart title="Activation Trend" data={timeSeries.map((p) => ({ label: p.label, Activations: p.count }))} index="label" categories={['Activations']} colors={['#22d3ee']} height={300} />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="By Store" data={chartByStore} index="name" categories={['value']} colors={['#22d3ee']} />
          <BarChart title="By CRR" data={chartByCRR} index="name" categories={['value']} colors={['#b4c5ff']} />
        </div>

        <DataTable columns={columns} data={xlsatuData} searchPlaceholder="Search XL Satu..." compact />
      </div>
    </div>
  )
}
