import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { formatNumber } from '@/lib/utils'
import { BarChart } from '@/components/charts/bar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Users, Activity, UserRound } from 'lucide-react'

export function WOAgentPage() {
  const data = useStore(s => s.data)
  const woAgent = data?.woAgent ?? []

  const totalCount = useMemo(() => woAgent.reduce((s, d) => s + d.count, 0), [woAgent])
  const sorted = useMemo(() => [...woAgent].sort((a, b) => b.count - a.count), [woAgent])

  if (!woAgent.length) {
    return <EmptyState message="Tidak ada data WO Agent. Upload file Achievment Prio atau sync dari Excel 365." />
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-headline-md font-headline font-bold text-on-surface">WO Agent</h2>
        <p className="text-body-sm text-on-surface-variant mt-1">Data Pivot — Performa per Agent WO</p>
      </div>

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-container/10 rounded-2xl"><Activity className="h-8 w-8 text-primary" /></div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatNumber(totalCount)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total Aktivasi</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-container/10 rounded-2xl"><Users className="h-8 w-8 text-secondary" /></div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatNumber(woAgent.length)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total Agent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {sorted.length > 0 && (
        <BarChart title="Aktivasi by Agent" data={sorted.map(s => ({ name: s.agentName, value: s.count }))} index="name" categories={['value']} colors={['#89ceff']} height={350} />
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5 text-secondary" />Detail per Agent WO</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">#</th>
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Agent</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Aktivasi</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, i) => (
                  <tr key={d.agentName} className="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                    <td className="py-2 px-2 font-bold text-on-surface-variant">{i + 1}</td>
                    <td className="py-2 px-2 font-medium text-on-surface">{d.agentName}</td>
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
