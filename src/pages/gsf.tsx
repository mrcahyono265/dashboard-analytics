import { useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { DataTable } from '@/components/tables/data-table'
import { ExportButtons } from '@/components/export/export-buttons'
import type { ColumnDef } from '@tanstack/react-table'
import type { GSF } from '@/lib/data'
import { formatNumber, formatCurrency } from '@/lib/utils'
import { DollarSign, CreditCard, Building2, Receipt, TrendingUp } from 'lucide-react'

export function GSFPage() {
  const { data } = useStore()
  const pageRef = useRef<HTMLDivElement>(null)
  const gsfData = useFilteredData(data?.gsf, 'GSF')

  const totalAmount = gsfData.reduce((sum, d) => sum + d.Amount, 0)
  const totalTransactions = gsfData.length
  const officeCount = new Set(gsfData.map((d) => d.Office)).size
  const avgTransaction = totalTransactions > 0 ? Math.round(totalAmount / totalTransactions) : 0

  const chartByOffice = useMemo(() => {
    const map = gsfData.reduce<Record<string, number>>((acc, d) => {
      acc[d.Office || 'Unknown'] = (acc[d.Office || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Transactions]) => ({ name, Transactions })).sort((a, b) => b.Transactions - a.Transactions).slice(0, 10)
  }, [gsfData])

  const chartByEvent = useMemo(() => {
    const map = gsfData.reduce<Record<string, number>>((acc, d) => {
      acc[d.EventName || 'Unknown'] = (acc[d.EventName || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [gsfData])

  const chartRevenueByOffice = useMemo(() => {
    const map = gsfData.reduce<Record<string, number>>((acc, d) => {
      acc[d.Office || 'Unknown'] = (acc[d.Office || 'Unknown'] || 0) + d.Amount
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value: Math.round(value / 1_000_000) })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [gsfData])

  const chartByOperator = useMemo(() => {
    const map = gsfData.reduce<Record<string, number>>((acc, d) => {
      acc[d.Operator || 'Unknown'] = (acc[d.Operator || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Transactions]) => ({ name, Transactions })).sort((a, b) => b.Transactions - a.Transactions).slice(0, 10)
  }, [gsfData])

  const columns: ColumnDef<GSF>[] = [
    { header: 'Office', accessorKey: 'Office', enableSorting: true },
    { header: 'Operator', accessorKey: 'Operator', enableSorting: true },
    { header: 'Event', accessorKey: 'EventName', enableSorting: true },
    { header: 'Amount', accessorKey: 'Amount', enableSorting: true, cell: ({ row }) => formatCurrency(row.original.Amount) },
    { header: 'Payment', accessorKey: 'PaymentMethod', enableSorting: true },
    { header: 'Date', accessorKey: 'OperationTime', enableSorting: true },
  ]

  return (
    <div ref={pageRef}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">GSF Transactions</h2>
          <ExportButtons data={gsfData} filename="GSF_Transactions" pageRef={pageRef} columns={columns} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard title="Total Revenue" value={formatCurrency(totalAmount)} icon={<DollarSign className="h-5 w-5" />} />
          <KPICard title="Transactions" value={formatNumber(totalTransactions)} variant="success" icon={<CreditCard className="h-5 w-5" />} />
          <KPICard title="Avg/Transaction" value={formatCurrency(avgTransaction)} variant="warning" icon={<Receipt className="h-5 w-5" />} />
          <KPICard title="Active Offices" value={formatNumber(officeCount)} variant="default" icon={<Building2 className="h-5 w-5" />} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <BarChart title="Transactions by Office" data={chartByOffice} index="name" categories={['Transactions']} colors={['cyan']} />
          <BarChart title="Revenue by Office (in Millions)" data={chartRevenueByOffice} index="name" categories={['value']} colors={['emerald']} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <PieChart title="Event Distribution" data={chartByEvent} />
          <BarChart title="Top Operators" data={chartByOperator} index="name" categories={['Transactions']} colors={['violet']} />
        </div>
        <DataTable columns={columns} data={gsfData} searchPlaceholder="Search GSF..." compact />
      </div>
    </div>
  )
}
