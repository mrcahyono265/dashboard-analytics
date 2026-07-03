import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { EXPO } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { Megaphone, Users, Building2, Package } from 'lucide-react'

export function EXPOPage() {
  const { data } = useStore()
  const pageRef = useRef<HTMLDivElement>(null)
  const expoData = useFilteredData(data?.expo, 'EXPO')

  const chartByPromotor = useMemo(() => {
    const map = expoData.reduce<Record<string, number>>((acc, d) => {
      acc[d.NamaPromotor || 'Unknown'] = (acc[d.NamaPromotor || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [expoData])

  const chartByPackage = useMemo(() => {
    const map = expoData.reduce<Record<string, number>>((acc, d) => {
      acc[d.PackagePlan || 'Unknown'] = (acc[d.PackagePlan || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [expoData])

  const columns: ColumnDef<EXPO>[] = [
    { header: 'MSISDN', accessorKey: 'MSISDN', enableSorting: true },
    { header: 'Package', accessorKey: 'PackagePlan', enableSorting: true },
    { header: 'Price', accessorKey: 'PricePlan', enableSorting: true, cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'Expo', accessorKey: 'ExpoName', enableSorting: true },
    { header: 'Promotor', accessorKey: 'NamaPromotor', enableSorting: true },
    { header: 'RSM', accessorKey: 'RSM', enableSorting: true },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">EXPO Activations</h2>
          <ExportButtons data={expoData} filename="EXPO" pageRef={pageRef} columns={columns} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total" value={formatNumber(expoData.length)} icon={<Megaphone className="h-5 w-5" />} />
          <KPICard title="Promotors" value={formatNumber(new Set(expoData.map((d) => d.NamaPromotor)).size)} variant="success" icon={<Users className="h-5 w-5" />} />
          <KPICard title="Locations" value={formatNumber(new Set(expoData.map((d) => d.ExpoName)).size)} variant="warning" icon={<Building2 className="h-5 w-5" />} />
          <KPICard title="Packages" value={formatNumber(new Set(expoData.map((d) => d.PackagePlan)).size)} variant="default" icon={<Package className="h-5 w-5" />} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="By Promotor" data={chartByPromotor} index="name" categories={['Activations']} colors={['violet']} />
          <BarChart title="By Expo Location" data={Object.entries(expoData.reduce<Record<string, number>>((acc, d) => { acc[d.ExpoName || 'Unknown'] = (acc[d.ExpoName || 'Unknown'] || 0) + 1; return acc }, {})).map(([n, v]) => ({ name: n, Activations: v })).sort((a, b) => b.Activations - a.Activations)} index="name" categories={['Activations']} colors={['cyan']} />
        </div>
        <PieChart title="Package Distribution" data={chartByPackage} />
        <DataTable columns={columns} data={expoData} searchPlaceholder="Search EXPO..." compact />
      </div>
    </div>
  )
}
