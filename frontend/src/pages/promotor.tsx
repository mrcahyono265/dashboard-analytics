import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useRoleScopedData } from '@/hooks/use-role-scoped-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { Promotor } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { Users, Package, TrendingUp, Award } from 'lucide-react'

export function PromotorPage() {
  const data = useStore(s => s.data)
  const pageRef = useRef<HTMLDivElement>(null)
  const promotorData = useRoleScopedData(data?.promotor)

  const packageKeys = useMemo(() => {
    if (!promotorData.length) return []
    return Object.keys(promotorData[0]).filter((k) => k !== 'NamaPromotor' && k !== 'Grand Total')
  }, [promotorData])

  const totalAll = useMemo(() => {
    return promotorData.reduce((sum, d) => {
      return sum + packageKeys.reduce((s, k) => s + (Number(d[k]) || 0), 0)
    }, 0)
  }, [promotorData, packageKeys])

  const chartByPromotor = useMemo(() => {
    return promotorData.map((d) => ({
      name: d.NamaPromotor,
      Total: packageKeys.reduce((s, k) => s + (Number(d[k]) || 0), 0),
    })).sort((a, b) => b.Total - a.Total)
  }, [promotorData, packageKeys])

  const columns: ColumnDef<Promotor>[] = [
    { header: 'Promotor', accessorKey: 'NamaPromotor' },
    ...packageKeys.map((key) => ({
      header: key,
      accessorKey: key,
      cell: ({ row }: any) => formatNumber(Number(row.original[key]) || 0),
    })),
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        <div className="flex items-center justify-end">
          <ExportButtons data={promotorData} filename="Promotor" pageRef={pageRef} columns={columns} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Grand Total" value={formatNumber(totalAll)} icon={<Award className="h-5 w-5" />} />
          <KPICard title="Promotors" value={formatNumber(promotorData.length)} variant="success" icon={<Users className="h-5 w-5" />} />
          <KPICard title="Package Types" value={formatNumber(packageKeys.length)} variant="warning" icon={<Package className="h-5 w-5" />} />
          <KPICard title="Avg/Promotor" value={formatNumber(Math.round(totalAll / (promotorData.length || 1)))} variant="default" icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        <BarChart title="Total Activations by Promotor" data={chartByPromotor} index="name" categories={['Total']} colors={['#c0c1ff']} />

        <DataTable columns={columns} data={promotorData} searchPlaceholder="Search promotor..." pageSize={10} compact />
      </div>
    </div>
  )
}
