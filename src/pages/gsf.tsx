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
import type { GSF } from '@/lib/data'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { getTimeLabel } from '@/lib/constants'
import { DollarSign, CreditCard, Building2, Receipt, Calendar } from 'lucide-react'

export function GSFPage() {
  const { data } = useStore()
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)
  const gsfData = useFilteredData(data?.gsf, 'GSF')

  const totalAmount = gsfData.reduce((sum, d) => sum + d.Amount, 0)
  const totalTransactions = gsfData.length
  const officeCount = new Set(gsfData.map((d) => d.Office)).size
  const avgTransaction = totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0

  const periodComparison = usePeriodComparison(gsfData, (d) => d.Tanggal || d.Bulan)
  const timeSeries = useTimeSeries(gsfData, (d) => d.Tanggal || d.Bulan, (d) => d.Amount)
  const chartByOffice = useGroupedByCategory(gsfData, (d) => d.Office, () => 1, 10)
  const chartByEvent = useGroupedByCategory(gsfData, (d) => d.EventName, () => 1, 8)
  const chartByOperator = useGroupedByCategory(gsfData, (d) => d.Operator, () => 1, 10)

  const chartRevenueByOffice = (() => {
    const map = new Map<string, number>()
    for (const d of gsfData) {
      const office = d.Office || 'Unknown'
      map.set(office, (map.get(office) ?? 0) + d.Amount)
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value: Math.round(value / 1_000_000) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  })()

  const columns: ColumnDef<GSF>[] = [
    { header: 'Office', accessorKey: 'Office' },
    { header: 'Operator', accessorKey: 'Operator' },
    { header: 'Event', accessorKey: 'EventName' },
    { header: 'Amount', accessorKey: 'Amount', cell: ({ row }) => formatCurrency(row.original.Amount) },
    { header: 'Payment', accessorKey: 'PaymentMethod' },
    { header: 'Date', accessorKey: 'OperationTime' },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-8">
        {/* Page Header with Export */}
        <div className="flex items-center justify-end">
          <ExportButtons data={gsfData} filename="GSF_Transactions" pageRef={pageRef} columns={columns} />
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Total Revenue" value={formatCurrency(totalAmount)} icon={<DollarSign className="h-5 w-5" />} trend={periodComparison.growth} />
          <KPICard title="Transactions" value={formatNumber(totalTransactions)} variant="success" icon={<CreditCard className="h-5 w-5" />} />
          <KPICard title="Avg/Transaction" value={formatCurrency(avgTransaction)} variant="warning" icon={<Receipt className="h-5 w-5" />} />
        </div>

        {/* Trend Chart */}
        {timeSeries.length > 1 && (
          <AreaChart
            title="Revenue Trend"
            data={timeSeries.map((p) => ({ label: p.label, Revenue: Math.round(p.value / 1_000_000) }))}
            index="label"
            categories={['Revenue']}
            colors={['#89ceff']}
            height={300}
            valueFormatter={(v) => `${v}M`}
          />
        )}

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="Transactions by Office" data={chartByOffice} index="name" categories={['value']} colors={['#89ceff']} />
          <BarChart title="Revenue by Office (in Millions)" data={chartRevenueByOffice} index="name" categories={['value']} colors={['#b4c5ff']} />
        </div>

        {/* Data Table */}
        <DataTable columns={columns} data={gsfData} searchPlaceholder="Search GSF..." compact />
      </div>
    </div>
  )
}
