import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { XLSatu } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { Wifi, Store, Users, Globe } from 'lucide-react'

export function XLSatuPage() {
  const { data } = useStore()
  const tableRef = useRef<HTMLDivElement>(null)
  const xlsatuData = data?.xlsatu ?? []

  const chartByStore = useMemo(() => {
    const map = xlsatuData.reduce<Record<string, number>>((acc, d) => {
      acc[d.StoreName || 'Unknown'] = (acc[d.StoreName || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [xlsatuData])

  const chartByCRR = useMemo(() => {
    const map = xlsatuData.reduce<Record<string, number>>((acc, d) => {
      acc[d.NamaCRR || 'Unknown'] = (acc[d.NamaCRR || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [xlsatuData])

  const columns: ColumnDef<XLSatu>[] = [
    { header: 'No. SO', accessorKey: 'NoSO', enableSorting: true },
    { header: 'Package', accessorKey: 'PackagePlan', enableSorting: true },
    { header: 'Price', accessorKey: 'PricePlan', enableSorting: true, cell: ({ row }) => row.original.PricePlan ? `Rp ${formatNumber(row.original.PricePlan)}` : '-' },
    { header: 'Store', accessorKey: 'StoreName', enableSorting: true },
    { header: 'CRR', accessorKey: 'NamaCRR', enableSorting: true },
    { header: 'RSM', accessorKey: 'RSM', enableSorting: true },
    { header: 'SM', accessorKey: 'SM', enableSorting: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">XL Satu Home Broadband</h2>
        <ExportButtons data={xlsatuData} filename="XL_Satu" tableRef={tableRef} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard title="Total Activations" value={formatNumber(xlsatuData.length)} icon={<Wifi className="h-5 w-5" />} />
        <KPICard title="Active Stores" value={formatNumber(new Set(xlsatuData.map((d) => d.StoreName)).size)} variant="success" icon={<Store className="h-5 w-5" />} />
        <KPICard title="CRRs" value={formatNumber(new Set(xlsatuData.map((d) => d.NamaCRR)).size)} variant="warning" icon={<Users className="h-5 w-5" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="By Store" data={chartByStore} index="name" categories={['Activations']} colors={['cyan']} />
        <BarChart title="By CRR" data={chartByCRR} index="name" categories={['Activations']} colors={['teal']} />
      </div>
      <div ref={tableRef}>
        <DataTable columns={columns} data={xlsatuData} searchPlaceholder="Search XL Satu..." compact />
      </div>
    </div>
  )
}
