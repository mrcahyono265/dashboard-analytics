import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { ELITE } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { Trophy, Users, Repeat, Activity } from 'lucide-react'

export function ELITEPage() {
  const { data } = useStore()
  const pageRef = useRef<HTMLDivElement>(null)
  const eliteData = useFilteredData(data?.elite)

  const totalNew = eliteData.reduce((s, d) => s + d.NewConnection, 0)
  const totalPrepaid = eliteData.reduce((s, d) => s + d.PrepaidToPostpaid, 0)
  const total = eliteData.reduce((s, d) => s + d.GrandTotal, 0)

  const chartData = useMemo(() => {
    return eliteData.map((d) => ({
      name: d.Operator,
      'New Connection': d.NewConnection,
      'Prepaid to Postpaid': d.PrepaidToPostpaid,
    }))
  }, [eliteData])

  const columns: ColumnDef<ELITE>[] = [
    { header: 'Operator', accessorKey: 'Operator', enableSorting: true },
    { header: 'New Connection', accessorKey: 'NewConnection', enableSorting: true, cell: ({ row }) => formatNumber(row.original.NewConnection) },
    { header: 'Prepaid→Postpaid', accessorKey: 'PrepaidToPostpaid', enableSorting: true, cell: ({ row }) => formatNumber(row.original.PrepaidToPostpaid) },
    { header: 'Grand Total', accessorKey: 'GrandTotal', enableSorting: true, cell: ({ row }) => formatNumber(row.original.GrandTotal) },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">ELITE Performance</h2>
          <ExportButtons data={eliteData} filename="ELITE" pageRef={pageRef} columns={columns} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Grand Total" value={formatNumber(total)} icon={<Trophy className="h-5 w-5" />} />
          <KPICard title="New Connection" value={formatNumber(totalNew)} variant="success" icon={<Users className="h-5 w-5" />} />
          <KPICard title="Prepaid→Postpaid" value={formatNumber(totalPrepaid)} variant="warning" icon={<Repeat className="h-5 w-5" />} />
          <KPICard title="Operators" value={formatNumber(eliteData.length)} variant="default" icon={<Activity className="h-5 w-5" />} />
        </div>
        <BarChart title="Operator Comparison" data={chartData} index="name" categories={['New Connection', 'Prepaid to Postpaid']} colors={['emerald', 'amber']} />
        <DataTable columns={columns} data={eliteData} searchPlaceholder="Search ELITE..." compact />
      </div>
    </div>
  )
}
