import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { Merchant } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { Store, Users, Package, Building2 } from 'lucide-react'

export function MerchantPage() {
  const { data } = useStore()
  const pageRef = useRef<HTMLDivElement>(null)
  const merchantData = useFilteredData(data?.merchant, 'Merchant')

  const storeCount = new Set(merchantData.map((d) => d.StoreName)).size
  const totalRevenue = merchantData.reduce((s, d) => s + d.PricePlan, 0)

  const chartByStore = useMemo(() => {
    const map = merchantData.reduce<Record<string, number>>((acc, d) => {
      acc[d.StoreName || 'Unknown'] = (acc[d.StoreName || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [merchantData])

  const chartByCRR = useMemo(() => {
    const map = merchantData.reduce<Record<string, number>>((acc, d) => {
      acc[d.NamaCRR || 'Unknown'] = (acc[d.NamaCRR || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [merchantData])

  const columns: ColumnDef<Merchant>[] = [
    { header: 'MSISDN', accessorKey: 'MSISDN', enableSorting: true },
    { header: 'Package', accessorKey: 'PackagePlan', enableSorting: true },
    { header: 'Price', accessorKey: 'PricePlan', enableSorting: true, cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'Store', accessorKey: 'StoreName', enableSorting: true },
    { header: 'CRR', accessorKey: 'NamaCRR', enableSorting: true },
    { header: 'RSM', accessorKey: 'RSM', enableSorting: true },
    { header: 'SM', accessorKey: 'SM', enableSorting: true },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">Merchant Activations</h2>
          <ExportButtons data={merchantData} filename="Merchant" pageRef={pageRef} columns={columns} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total" value={formatNumber(merchantData.length)} icon={<Store className="h-5 w-5" />} />
          <KPICard title="Stores" value={formatNumber(storeCount)} variant="success" icon={<Building2 className="h-5 w-5" />} />
          <KPICard title="Revenue" value={`Rp ${formatNumber(totalRevenue)}`} variant="warning" icon={<Package className="h-5 w-5" />} />
          <KPICard title="CRRs" value={formatNumber(new Set(merchantData.map((d) => d.NamaCRR)).size)} variant="default" icon={<Users className="h-5 w-5" />} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="By Store" data={chartByStore} index="name" categories={['Activations']} colors={['amber']} />
          <BarChart title="By CRR" data={chartByCRR} index="name" categories={['Activations']} colors={['emerald']} />
        </div>
        <DataTable columns={columns} data={merchantData} searchPlaceholder="Search merchant..." compact />
      </div>
    </div>
  )
}
