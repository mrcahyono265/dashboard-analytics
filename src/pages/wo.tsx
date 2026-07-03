import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { WO } from '@/lib/data'
import { formatNumber } from '@/lib/utils'
import { UserRound, MapPin, Users, DollarSign } from 'lucide-react'

export function WOPage() {
  const { data } = useStore()
  const tableRef = useRef<HTMLDivElement>(null)
  const woData = data?.wo ?? []

  const totalRevenue = woData.reduce((s, d) => s + d.PricePlan, 0)

  const chartByAgent = useMemo(() => {
    const map = woData.reduce<Record<string, number>>((acc, d) => {
      acc[d.AgentWO || 'Unknown'] = (acc[d.AgentWO || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [woData])

  const chartByXLC = useMemo(() => {
    const map = woData.reduce<Record<string, number>>((acc, d) => {
      acc[d.XLCName || 'Unknown'] = (acc[d.XLCName || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [woData])

  const columns: ColumnDef<WO>[] = [
    { header: 'MSISDN', accessorKey: 'MSISDN', enableSorting: true },
    { header: 'Package', accessorKey: 'PackagePlan', enableSorting: true },
    { header: 'Price', accessorKey: 'PricePlan', enableSorting: true, cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}` },
    { header: 'XLC', accessorKey: 'XLCName', enableSorting: true },
    { header: 'Agent WO', accessorKey: 'AgentWO', enableSorting: true },
    { header: 'RSM', accessorKey: 'RSM', enableSorting: true },
    { header: 'Leader', accessorKey: 'Leader', enableSorting: true },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">WO Agent Activations</h2>
        <ExportButtons data={woData} filename="WO_Agent" tableRef={tableRef} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard title="Total" value={formatNumber(woData.length)} icon={<UserRound className="h-5 w-5" />} />
        <KPICard title="Agents" value={formatNumber(new Set(woData.map((d) => d.AgentWO)).size)} variant="success" icon={<Users className="h-5 w-5" />} />
        <KPICard title="XLC Locations" value={formatNumber(new Set(woData.map((d) => d.XLCName)).size)} variant="warning" icon={<MapPin className="h-5 w-5" />} />
        <KPICard title="Revenue" value={`Rp ${formatNumber(totalRevenue)}`} variant="default" icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="By Agent WO" data={chartByAgent} index="name" categories={['Activations']} colors={['red']} />
        <BarChart title="By XLC Location" data={chartByXLC} index="name" categories={['Activations']} colors={['orange']} />
      </div>
      <div ref={tableRef}>
        <DataTable columns={columns} data={woData} searchPlaceholder="Search WO data..." compact />
      </div>
    </div>
  )
}
