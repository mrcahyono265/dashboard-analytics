import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { formatNumber, formatCompact } from '@/lib/utils'
import { CHANNEL_TARGETS, getTargetStatus } from '@/lib/constants'
import { BarChart } from '@/components/charts/bar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Trophy, Users, Calendar, Target, TrendingUp, Activity
} from 'lucide-react'
import { EmptyState } from '@/components/dashboard/empty-state'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export function MonitoringPage() {
  const reportData = useStore(s => s.reportData)
  const r = reportData ?? { xlcReport: [], gsfReport: [], woReport: [], expoReport: [], storeMaster: [], ranking: [] }

  const crrRanking = useMemo(() => {
    if (!r.xlcReport.length) return []
    return [...r.xlcReport]
      .sort((a, b) => (b.achievement / (b.target || 1)) - (a.achievement / (a.target || 1)))
      .slice(0, 10)
  }, [r.xlcReport])

  const woRanking = useMemo(() => {
    if (!r.woReport.length) return []
    return [...r.woReport]
      .sort((a, b) => b.achievement - a.achievement)
      .slice(0, 10)
  }, [r.woReport])

  const totalAchievement = useMemo(() =>
    r.xlcReport.reduce((s, d) => s + d.achievement, 0), [r.xlcReport])
  const totalTarget = useMemo(() =>
    r.xlcReport.reduce((s, d) => s + d.target, 0), [r.xlcReport])
  const avgPctMda = useMemo(() => {
    const valid = r.xlcReport.filter(d => d.target > 0)
    return valid.length > 0
      ? valid.reduce((s, d) => s + d.achievement / d.target, 0) / valid.length * 100
      : 0
  }, [r.xlcReport])

  const storeSummary = useMemo(() => {
    const map = new Map<string, { achievement: number; target: number; count: number }>()
    for (const d of r.xlcReport) {
      const s = map.get(d.storeName) || { achievement: 0, target: 0, count: 0 }
      s.achievement += d.achievement
      s.target += d.target
      s.count++
      map.set(d.storeName, s)
    }
    return Array.from(map.entries())
      .map(([storeName, v]) => ({ storeName, ...v, pct: v.target > 0 ? v.achievement / v.target * 100 : 0 }))
      .sort((a, b) => b.achievement - a.achievement)
  }, [r.xlcReport])

  if (!r.xlcReport.length && !r.woReport.length && !r.expoReport.length) {
    return <EmptyState message="No monitoring data. Upload a report file or sync from Excel 365." />
  }

  return (
    <div className="space-y-8">
      {/* KPI Row */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-container/10 rounded-2xl">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatCompact(totalAchievement)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total Achievement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-container/10 rounded-2xl">
                <Target className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatCompact(totalTarget)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total Target</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-tertiary-container/10 rounded-2xl">
                <TrendingUp className="h-8 w-8 text-tertiary" />
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{avgPctMda.toFixed(1)}%</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Avg Achievement %</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <Users className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{formatCompact(r.xlcReport.length + r.woReport.length + r.expoReport.length)}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Total Personnel</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRR Ranking */}
      {crrRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Top 10 CRR — Achievement %
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {crrRanking.map((d, i) => {
                const pct = d.target > 0 ? (d.achievement / d.target * 100) : 0
                const status = getTargetStatus(pct)
                return (
                  <div key={d.crrName || i} className="flex items-center gap-4">
                    <span className="w-6 text-center text-sm font-bold text-on-surface-variant">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-on-surface truncate">{d.crrName}</span>
                        <span className="text-xs font-data-mono text-on-surface-variant ml-2">
                          {formatNumber(d.achievement)} / {formatNumber(d.target)}
                        </span>
                      </div>
                      <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status === 'on-track' ? 'bg-secondary' :
                            status === 'need-improvement' ? 'bg-tertiary' : 'bg-error'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-xs font-bold shrink-0 ${
                      status === 'on-track' ? 'text-secondary' :
                      status === 'need-improvement' ? 'text-tertiary' : 'text-error'
                    }`}>{pct.toFixed(1)}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Store Summary */}
      {storeSummary.length > 0 && (
        <BarChart
          title="Store Achievement vs Target"
          data={storeSummary.map(s => ({ name: s.storeName, Achievement: s.achievement, Target: s.target }))}
          index="name"
          categories={['Achievement', 'Target']}
          colors={['#b4c5ff', '#8d90a0']}
          height={300}
        />
      )}

      {/* WO Ranking */}
      {woRanking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              WO Agent Top Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rank</th>
                    <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Agent</th>
                    <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Store</th>
                    <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Achievement</th>
                    <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Target</th>
                    <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody>
                  {woRanking.slice(0, 20).map((d, i) => {
                    const pct = d.target > 0 ? (d.achievement / d.target * 100) : 0
                    return (
                      <tr key={d.agentName || i} className="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                        <td className="py-2 px-2 font-bold text-on-surface-variant">{i + 1}</td>
                        <td className="py-2 px-2 font-medium text-on-surface">{d.agentName}</td>
                        <td className="py-2 px-2 text-on-surface-variant">{d.storeName}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{formatNumber(d.achievement)}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{formatNumber(d.target)}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* EXPO Section */}
      {r.expoReport.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-tertiary" />
              EXPO Promotors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Promotor</th>
                    <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Store</th>
                    <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Achievement</th>
                    <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Target</th>
                    <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider">%</th>
                  </tr>
                </thead>
                <tbody>
                  {r.expoReport.map((d, i) => {
                    const pct = d.target > 0 ? (d.achievement / d.target * 100) : 0
                    return (
                      <tr key={d.promotorName || i} className="border-b border-outline-variant/50 hover:bg-surface-container-high transition-colors">
                        <td className="py-2 px-2 font-medium text-on-surface">{d.promotorName}</td>
                        <td className="py-2 px-2 text-on-surface-variant">{d.storeName}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{formatNumber(d.achievement)}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{formatNumber(d.target)}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{pct.toFixed(1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
