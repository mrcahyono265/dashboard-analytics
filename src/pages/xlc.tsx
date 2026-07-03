import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { XLC } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { Smartphone, Users, Store, ArrowRightLeft, DollarSign } from 'lucide-react'

export function XLCPage() {
  const { data } = useStore()
  const tableRef = useRef<HTMLDivElement>(null)
  const xlcData = data?.xlc ?? []

  const totalNew = xlcData.filter((d) => d.NewMigrate === 'New').length
  const totalMigrate = xlcData.filter((d) => d.NewMigrate === 'Migrate').length
  const storeCount = new Set(xlcData.map((d) => d.StoreName)).size
  const totalRevenue = xlcData.reduce((sum, d) => sum + d.PricePlan, 0)

  const chartByStore = useMemo(() => {
    const map = xlcData.reduce<Record<string, number>>((acc, d) => {
      acc[d.StoreName || 'Unknown'] = (acc[d.StoreName || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations).slice(0, 10)
  }, [xlcData])

  const chartByCRR = useMemo(() => {
    const map = xlcData.reduce<Record<string, number>>((acc, d) => {
      acc[d.NamaCRR || 'Unknown'] = (acc[d.NamaCRR || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations).slice(0, 10)
  }, [xlcData])

  const chartByPackage = useMemo(() => {
    const map = xlcData.reduce<Record<string, number>>((acc, d) => {
      acc[d.PackagePlan || 'Unknown'] = (acc[d.PackagePlan || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [xlcData])

  const columns: ColumnDef<XLC>[] = [
    { header: 'MSISDN', accessorKey: 'MSISDN', enableSorting: true },
    { header: 'Package', accessorKey: 'PackagePlan', enableSorting: true },
    { header: 'Price', accessorKey: 'PricePlan', enableSorting: true, cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'Store', accessorKey: 'StoreName', enableSorting: true },
    { header: 'Agent', accessorKey: 'UsernameAgent', enableSorting: true },
    { header: 'CRR', accessorKey: 'NamaCRR', enableSorting: true },
    { header: 'RSM', accessorKey: 'RSM', enableSorting: true },
    { header: 'Type', accessorKey: 'NewMigrate', enableSorting: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">XLC Activation</h2>
        <ExportButtons data={xlcData} filename="XLC_Activation" tableRef={tableRef} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total Activations" value={formatNumber(xlcData.length)} icon={<Smartphone className="h-5 w-5" />} />
        <KPICard title="New" value={formatNumber(totalNew)} subtitle="New activations" variant="success" icon={<Users className="h-5 w-5" />} />
        <KPICard title="Migrate" value={formatNumber(totalMigrate)} subtitle="Migration" variant="warning" icon={<ArrowRightLeft className="h-5 w-5" />} />
        <KPICard title="Revenue" value={`Rp ${formatNumber(totalRevenue)}`} subtitle={`Across ${storeCount} stores`} variant="default" icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Activations by Store" data={chartByStore} index="name" categories={['Activations']} colors={['blue']} />
        <BarChart title="Top CRR Performers" data={chartByCRR} index="name" categories={['Activations']} colors={['emerald']} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <PieChart title="Package Distribution" data={chartByPackage} />
        <PieChart title="New vs Migrate" data={[{ name: 'New', value: totalNew }, { name: 'Migrate', value: totalMigrate }]} />
      </div>
      <div ref={tableRef}>
        <DataTable columns={columns} data={xlcData} searchPlaceholder="Search XLC..." compact />
      </div>
    </div>
  )
}
