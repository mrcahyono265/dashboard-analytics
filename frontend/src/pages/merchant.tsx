import { useRef } from 'react'
import { useStore } from '@/lib/store'
import { useRoleScopedData } from '@/hooks/use-role-scoped-data'
import { useTimeSeries, useGroupedByCategory, usePeriodComparison } from '@/hooks/use-time-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { Merchant } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { getTimeLabel } from '@/lib/constants'
import { Store, Users, Package, Building2, Calendar } from 'lucide-react'

export function MerchantPage() {
  const data = useStore(s => s.data)
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)
  const merchantData = useRoleScopedData(data?.merchant, 'Merchant')

  const storeCount = new Set(merchantData.map((d) => d.StoreName)).size
  const totalRevenue = merchantData.reduce((s, d) => s + d.PricePlan, 0)

  const periodComparison = usePeriodComparison(merchantData, (d) => d.Tanggal || d.Bulan)
  const timeSeries = useTimeSeries(merchantData, (d) => d.Tanggal || d.Bulan)
  const chartByStore = useGroupedByCategory(merchantData, (d) => d.StoreName, () => 1)
  const chartByCRR = useGroupedByCategory(merchantData, (d) => d.NamaCRR, () => 1)

  const columns: ColumnDef<Merchant>[] = [
    { header: 'MSISDN', accessorKey: 'MSISDN' },
    { header: 'Package', accessorKey: 'PackagePlan' },
    { header: 'Price', accessorKey: 'PricePlan', cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'Store', accessorKey: 'StoreName' },
    { header: 'CRR', accessorKey: 'NamaCRR' },
    { header: 'RSM', accessorKey: 'RSM' },
    { header: 'SM', accessorKey: 'SM' },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
          <ExportButtons data={merchantData} filename="Merchant" pageRef={pageRef} columns={columns} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Total Merchant" value={formatNumber(merchantData.length)} icon={<Store className="h-5 w-5" />} trend={periodComparison.growth} />
          <KPICard title="Stores" value={formatNumber(storeCount)} variant="success" icon={<Building2 className="h-5 w-5" />} />
          <KPICard title="Revenue" value={`Rp ${formatNumber(totalRevenue)}`} variant="warning" icon={<Package className="h-5 w-5" />} />
        </div>

        {timeSeries.length > 1 && (
          <AreaChart title="Activation Trend" data={timeSeries.map((p) => ({ label: p.label, Activations: p.count }))} index="label" categories={['Activations']} colors={['#c0c1ff']} height={300} />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="By Store" data={chartByStore} index="name" categories={['value']} colors={['#c0c1ff']} />
          <BarChart title="By CRR" data={chartByCRR} index="name" categories={['value']} colors={['#89ceff']} />
        </div>

        <DataTable columns={columns} data={merchantData} searchPlaceholder="Search merchant..." compact />
      </div>
    </div>
  )
}
