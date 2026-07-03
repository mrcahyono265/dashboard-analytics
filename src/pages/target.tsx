import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatNumber, formatCompact } from '@/lib/utils'

const TARGETS: Record<string, number> = {
  XLC: 500,
  GSF: 300_000_000,
  Merchant: 50,
  WO: 100,
  EXPO: 200,
  XLSatu: 20,
}

export function TargetPage() {
  const { data } = useStore()

  const actuals = {
    XLC: data?.xlc?.length ?? 0,
    GSF: data?.gsf?.reduce((s, d) => s + d.Amount, 0) ?? 0,
    Merchant: data?.merchant?.length ?? 0,
    WO: data?.wo?.length ?? 0,
    EXPO: data?.expo?.length ?? 0,
    XLSatu: data?.xlsatu?.length ?? 0,
  }

  const chartData = useMemo(() => {
    if (!data) return []
    return Object.keys(TARGETS).map((key) => ({
      name: key,
      Target: key === 'GSF' ? Math.round(TARGETS[key] / 1_000_000) : TARGETS[key],
      Realisasi: key === 'GSF' ? Math.round(actuals.GSF / 1_000_000) : actuals[key as keyof typeof actuals],
    }))
  }, [data, actuals])

  const overallAchievement = useMemo(() => {
    if (!data) return 0
    const totalTarget = Object.values(TARGETS).reduce((s, v) => s + v, 0)
    const totalActualScaled = Object.keys(TARGETS).reduce((s, key) => {
      const actual = actuals[key as keyof typeof actuals]
      return s + (key === 'GSF' ? Math.round(actual / 1_000_000) : actual)
    }, 0)
    return Math.round((totalActualScaled / totalTarget) * 100)
  }, [data, actuals])

  const getAchievement = (key: string) => {
    const target = TARGETS[key]
    const actual = actuals[key as keyof typeof actuals]
    return Math.round((actual / target) * 100)
  }

  const getStatus = (pct: number) => {
    if (pct >= 100) return { label: 'On Target', variant: 'success' as const }
    if (pct >= 75) return { label: 'Need Improvement', variant: 'warning' as const }
    return { label: 'Below Target', variant: 'danger' as const }
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-text">Target vs Realisasi</h2>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-sm text-text-secondary">Overall Achievement</p>
            <p className={`text-5xl font-bold mt-1 ${overallAchievement >= 100 ? 'text-success' : overallAchievement >= 75 ? 'text-warning' : 'text-danger'}`}>
              {overallAchievement}%
            </p>
            <div className="mt-4 h-3 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  overallAchievement >= 100 ? 'bg-success' : overallAchievement >= 75 ? 'bg-warning' : 'bg-danger'
                }`}
                style={{ width: `${Math.min(overallAchievement, 100)}%` }}
              />
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.keys(TARGETS).map((key) => {
                const pct = getAchievement(key)
                const status = getStatus(pct)
                return (
                  <div key={key} className="text-center">
                    <p className="text-xs text-text-tertiary uppercase">{key}</p>
                    <p className="text-lg font-bold mt-0.5">{pct}%</p>
                    <Badge variant={status.variant} className="mt-1">{status.label}</Badge>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Object.keys(TARGETS).map((key) => {
          const target = TARGETS[key]
          const actual = key === 'GSF' ? actuals.GSF : actuals[key as keyof typeof actuals]
          const formattedTarget = key === 'GSF' ? `Rp ${formatCompact(target)}` : formatNumber(target)
          const formattedActual = key === 'GSF' ? `Rp ${formatCompact(actual)}` : formatNumber(actual)
          const pct = getAchievement(key)
          return (
            <KPICard
              key={key}
              title={key}
              value={formattedActual}
              subtitle={`Target: ${formattedTarget}`}
              trend={pct}
              variant={pct >= 100 ? 'success' : pct >= 75 ? 'warning' : 'danger'}
            />
          )
        })}
      </div>

      <BarChart title="Target vs Realisasi" data={chartData} index="name" categories={['Target', 'Realisasi']} colors={['gray', 'blue']} />

      <Card>
        <CardHeader>
          <CardTitle>Detail Achievement</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase">Channel</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-tertiary uppercase">Target</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-tertiary uppercase">Realisasi</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-tertiary uppercase">Gap</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-tertiary uppercase">%</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-text-tertiary uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(TARGETS).map((key) => {
                  const target = TARGETS[key]
                  const actual = key === 'GSF' ? actuals.GSF : actuals[key as keyof typeof actuals]
                  const gap = target - (key === 'GSF' ? actual / 1_000_000 : actual)
                  const pct = getAchievement(key)
                  const status = getStatus(pct)
                  return (
                    <tr key={key} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-text">{key}</td>
                      <td className="px-4 py-3 text-sm text-right text-text-secondary">{key === 'GSF' ? formatCompact(target) : formatNumber(target)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-text">{key === 'GSF' ? formatCompact(actual) : formatNumber(actual)}</td>
                      <td className={`px-4 py-3 text-sm text-right font-medium ${gap > 0 ? 'text-danger' : 'text-success'}`}>
                        {gap > 0 ? `(${key === 'GSF' ? formatCompact(gap * 1_000_000) : formatNumber(gap)})` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-bold text-text">{pct}%</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={status.variant} dot>{status.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
