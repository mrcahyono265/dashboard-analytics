import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { formatNumber } from '@/lib/utils'
import { BarChart } from '@/components/charts/bar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Smartphone, Store, Users } from 'lucide-react'

export function PrioXLCPage() {
  const data = useStore(s => s.data)
  const prioData = data?.prioXLC ?? []

  const byStore = useMemo(() => prioData.filter(d => d.label && !d.label.includes(' ') && d.count > 0), [prioData])
  const byCRR = useMemo(() => prioData.filter(d => d.label && d.label.includes(' ') && d.count > 0), [prioData])

  const totalCount = useMemo(() => prioData.reduce((s, d) => s + (d.count ?? 0), 0), [prioData])

  if (!prioData.length) {
    return <EmptyState message="Tidak ada data PrioXLC. Upload file Achievment Prio atau sync dari Excel 365." />
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-headline-md font-headline font-bold text-on-surface">PrioXLC</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">Produk Prioritas — Aktivasi per Store & CRR</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-container/10 rounded-2xl"><Smartphone className="h-8 w-8 text-primary" /></div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatNumber(totalCount)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total PrioXLC</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-container/10 rounded-2xl"><Store className="h-8 w-8 text-secondary" /></div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatNumber(byStore.length)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total Store</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-tertiary-container/10 rounded-2xl"><Users className="h-8 w-8 text-tertiary" /></div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatNumber(byCRR.length)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total CRR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarChart title="Aktivasi by Store" data={byStore.map(s => ({ name: s.label, value: s.count }))} index="name" categories={['value']} colors={['#3b82f6']} height={300} />
        <BarChart title="Aktivasi by CRR" data={byCRR.map(s => ({ name: s.label, value: s.count }))} index="name" categories={['value']} colors={['#10b981']} height={300} />
      </div>

      <Card>
        <CardHeader><CardTitle>Detail per CRR</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">CRR</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Aktivasi</th>
                </tr>
              </thead>
              <tbody>
                {byCRR.sort((a, b) => b.count - a.count).map((d, i) => (
                  <tr key={d.label} className="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                    <td className="py-2 px-2 font-medium text-on-surface">{d.label}</td>
                    <td className="py-2 px-2 text-right font-data-mono">{formatNumber(d.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
