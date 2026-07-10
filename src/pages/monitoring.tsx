import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { usePeriodComparison } from '@/hooks/use-time-data'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, formatCurrency, formatCompact } from '@/lib/utils'
import { parseDate } from '@/lib/date-parser'
import { getTimeLabel, CHANNEL_TARGETS, getTargetStatus, getTargetStatusLabel, computeTargetPercentage } from '@/lib/constants'
import {
  Activity, Clock, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Target, Zap
} from 'lucide-react'
import { EmptyState } from '@/components/dashboard/empty-state'

export function MonitoringPage() {
  const { data, timeMode } = useStore()

  const filteredXlc = useFilteredData(data?.xlc, 'XLC')
  const filteredGsf = useFilteredData(data?.gsf, 'GSF')
  const filteredMerchant = useFilteredData(data?.merchant, 'Merchant')
  const filteredWo = useFilteredData(data?.wo, 'WO')
  const filteredExpo = useFilteredData(data?.expo, 'EXPO')
  const filteredXlsatu = useFilteredData(data?.xlsatu, 'XL Satu')

  const xlcPeriod = usePeriodComparison(filteredXlc, (d) => d.Tanggal || d.Bulan)
  const gsfPeriod = usePeriodComparison(filteredGsf, (d) => d.Tanggal || d.Bulan)
  const merchantPeriod = usePeriodComparison(filteredMerchant, (d) => d.Tanggal || d.Bulan)
  const woPeriod = usePeriodComparison(filteredWo, (d) => d.Tanggal || d.Bulan)
  const expoPeriod = usePeriodComparison(filteredExpo, (d) => d.Tanggal || d.Bulan)

  const targetData = useMemo(() => {
    const items = [
      { channel: 'XLC', target: CHANNEL_TARGETS['XLC'], actual: filteredXlc.length },
      { channel: 'GSF', target: CHANNEL_TARGETS['GSF'], actual: filteredGsf.reduce((s, d) => s + d.Amount, 0) },
      { channel: 'Merchant', target: CHANNEL_TARGETS['Merchant'], actual: filteredMerchant.length },
      { channel: 'WO', target: CHANNEL_TARGETS['WO'], actual: filteredWo.length },
      { channel: 'EXPO', target: CHANNEL_TARGETS['EXPO'], actual: filteredExpo.length },
      { channel: 'XL Satu', target: CHANNEL_TARGETS['XL Satu'], actual: filteredXlsatu.length },
    ]

    return items.map((item) => {
      const pct = computeTargetPercentage(item.actual, item.target)
      const status = getTargetStatus(pct)
      return { ...item, percentage: pct, status }
    })
  }, [filteredXlc, filteredGsf, filteredMerchant, filteredWo, filteredExpo, filteredXlsatu])

  const recentActivity = useMemo(() => {
    const all = [
      ...filteredXlc.map((d) => ({ date: d.Tanggal, detail: `XLC activation: ${d.MSISDN}`, store: d.StoreName, type: 'activation' })),
      ...filteredGsf.slice(0, 50).map((d) => ({ date: d.Tanggal, detail: `GSF: ${d.EventName} - ${formatCurrency(d.Amount)}`, store: d.Office, type: 'transaction' })),
    ]

    return all
      .filter((a) => a.date)
      .sort((a, b) => {
        const da = parseDate(a.date)
        const db = parseDate(b.date)
        if (da && db) return db.getTime() - da.getTime()
        return 0
      })
      .slice(0, 10)
  }, [filteredXlc, filteredGsf])

  const onTrack = targetData.filter((t) => t.status === 'on-track').length
  const needImprovement = targetData.filter((t) => t.status === 'need-improvement').length
  const belowTarget = targetData.filter((t) => t.status === 'below-target').length

  const targetChartData = targetData.map((t) => ({
    name: t.channel,
    Target: t.target > 1_000_000 ? Math.round(t.target / 1_000_000) : t.target,
    Actual: t.target > 1_000_000 ? Math.round(t.actual / 1_000_000) : t.actual,
  }))

  if (!data) return <EmptyState />

  return (
    <div className="space-y-8">
      {/* Status Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-container/10 rounded-2xl">
                <CheckCircle2 className="h-8 w-8 text-secondary" />
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{onTrack}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">On Track</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-tertiary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-tertiary-container/10 rounded-2xl">
                <AlertTriangle className="h-8 w-8 text-tertiary" />
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{needImprovement}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Need Improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-error">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-error-container/10 rounded-2xl">
                <XCircle className="h-8 w-8 text-error" />
              </div>
              <div>
                <p className="text-3xl font-headline font-bold text-on-surface">{belowTarget}</p>
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-widest">Below Target</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <KPICard title={`XLC ${getTimeLabel(timeMode)}`} value={formatNumber(xlcPeriod.current)} trend={xlcPeriod.growth} subtitle={`Target: ${CHANNEL_TARGETS['XLC']}`} icon={<Target className="h-5 w-5" />} />
        <KPICard title={`GSF ${getTimeLabel(timeMode)}`} value={formatCurrency(gsfPeriod.current)} trend={gsfPeriod.growth} subtitle={`Target: ${formatCurrency(CHANNEL_TARGETS['GSF'])}`} variant="success" icon={<Zap className="h-5 w-5" />} />
        <KPICard title={`Merchant ${getTimeLabel(timeMode)}`} value={formatNumber(merchantPeriod.current)} trend={merchantPeriod.growth} subtitle={`Target: ${CHANNEL_TARGETS['Merchant']}`} variant="warning" icon={<Target className="h-5 w-5" />} />
      </div>

      {/* Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Target vs Actual — Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {targetData.map((item) => (
              <div key={item.channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface">{item.channel}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant font-data-mono">
                      {item.channel === 'GSF' ? formatCurrency(item.actual) : formatNumber(item.actual)}
                      {' / '}
                      {item.channel === 'GSF' ? formatCurrency(item.target) : formatNumber(item.target)}
                    </span>
                    <span className={
                      item.status === 'on-track' ? 'text-secondary bg-secondary-container/10 px-3 py-1 rounded-full text-xs font-bold border border-secondary/20' :
                      item.status === 'need-improvement' ? 'text-tertiary bg-tertiary-container/10 px-3 py-1 rounded-full text-xs font-bold border border-tertiary/20' :
                      'text-error bg-error-container/10 px-3 py-1 rounded-full text-xs font-bold border border-error/20'
                    }>
                      {item.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.status === 'on-track' ? 'bg-secondary' : item.status === 'need-improvement' ? 'bg-tertiary' : 'bg-error'
                    }`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Chart + Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BarChart title="Target vs Actual (Normalized)" data={targetChartData} index="name" categories={['Target', 'Actual']} colors={['#8d90a0', '#b4c5ff']} height={350} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-on-surface-variant text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container-high transition-all cursor-pointer">
                    <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${act.type === 'activation' ? 'bg-primary' : 'bg-secondary'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-on-surface truncate font-medium">{act.detail}</p>
                      <p className="text-xs text-on-surface-variant">{act.store}</p>
                    </div>
                    <span className="text-xs text-on-surface-variant shrink-0 font-data-mono">{act.date}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Channel Distribution + Growth */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PieChart title="Channel Distribution" data={[
          { name: 'XLC', value: filteredXlc.length },
          { name: 'Merchant', value: filteredMerchant.length },
          { name: 'WO', value: filteredWo.length },
          { name: 'EXPO', value: filteredExpo.length },
          { name: 'XL Satu', value: filteredXlsatu.length },
        ]} />
        <BarChart title="Period Growth Comparison" data={[
          { name: 'XLC', Growth: xlcPeriod.growth },
          { name: 'GSF', Growth: gsfPeriod.growth },
          { name: 'Merchant', Growth: merchantPeriod.growth },
          { name: 'WO', Growth: woPeriod.growth },
          { name: 'EXPO', Growth: expoPeriod.growth },
        ]} index="name" categories={['Growth']} colors={['#b4c5ff']} />
      </div>
    </div>
  )
}
