import { useStore } from '@/lib/store'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Smartphone, CreditCard, Store, UserRound, TrendingUp, BarChart3, Target } from 'lucide-react'
import { formatCompact, formatCurrency } from '@/lib/utils'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { useTimeSeries, useGroupedByCategory, usePeriodComparison } from '@/hooks/use-time-data'
import { computeMonthlySparkline } from '@/lib/sparkline'
import {
  CHANNEL_TARGETS, computeTargetPercentage, getTargetStatus, getTargetStatusLabel, getTimeLabel,
} from '@/lib/constants'
import { cn } from '@/lib/utils'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

const STATUS_COLORS = {
  'on-track': 'bg-secondary',
  'need-improvement': 'bg-tertiary',
  'below-target': 'bg-error',
} as const

const STATUS_TEXT = {
  'on-track': 'text-secondary',
  'need-improvement': 'text-tertiary',
  'below-target': 'text-error',
} as const

export function OverviewPage() {
  const { data } = useStore()
  const timeMode = useStore((s) => s.timeMode)

  const filteredXlc = useFilteredData(data?.xlc, 'XLC')
  const filteredGsf = useFilteredData(data?.gsf, 'GSF')
  const filteredMerchant = useFilteredData(data?.merchant, 'Merchant')
  const filteredWo = useFilteredData(data?.wo, 'WO')
  const filteredExpo = useFilteredData(data?.expo, 'EXPO')

  const xlcTotal = filteredXlc.length
  const xlcNew = filteredXlc.filter((d) => d.NewMigrate === 'New').length
  const xlcMigrate = filteredXlc.filter((d) => d.NewMigrate === 'Migrate').length
  const gsfTotal = filteredGsf.reduce((sum, d) => sum + d.Amount, 0)
  const gsfCount = filteredGsf.length
  const merchantTotal = filteredMerchant.length
  const woTotal = filteredWo.length
  const expoTotal = filteredExpo.length
  const grandTotal = xlcTotal + merchantTotal + woTotal + expoTotal

  // Period comparison
  const xlcPeriod = usePeriodComparison(filteredXlc, (d) => d.Tanggal || d.Bulan)
  const gsfPeriod = usePeriodComparison(filteredGsf, (d) => d.Tanggal || d.Bulan)
  const merchantPeriod = usePeriodComparison(filteredMerchant, (d) => d.Tanggal || d.Bulan)
  const allActivationPeriod = usePeriodComparison(
    [...filteredXlc, ...filteredMerchant, ...filteredWo, ...filteredExpo],
    (d: any) => d.Tanggal || d.Bulan
  )

  // Time series for trend chart
  const xlcTimeSeries = useTimeSeries(filteredXlc, (d) => d.Tanggal || d.Bulan)
  const merchantTimeSeries = useTimeSeries(filteredMerchant, (d) => d.Tanggal || d.Bulan)
  const woTimeSeries = useTimeSeries(filteredWo, (d) => d.Tanggal || d.Bulan)
  const expoTimeSeries = useTimeSeries(filteredExpo, (d) => d.Tanggal || d.Bulan)

  const trendData = useMemo(() => {
    const allLabels = new Set<string>()
    xlcTimeSeries.forEach((p) => allLabels.add(p.label))
    merchantTimeSeries.forEach((p) => allLabels.add(p.label))
    woTimeSeries.forEach((p) => allLabels.add(p.label))
    expoTimeSeries.forEach((p) => allLabels.add(p.label))

    const xlcMap = new Map(xlcTimeSeries.map((p) => [p.label, p.count]))
    const merchMap = new Map(merchantTimeSeries.map((p) => [p.label, p.count]))
    const woMap = new Map(woTimeSeries.map((p) => [p.label, p.count]))
    const expoMap = new Map(expoTimeSeries.map((p) => [p.label, p.count]))

    return Array.from(allLabels).sort().map((label) => ({
      label,
      XLC: xlcMap.get(label) ?? 0,
      Merchant: merchMap.get(label) ?? 0,
      WO: woMap.get(label) ?? 0,
      EXPO: expoMap.get(label) ?? 0,
    }))
  }, [xlcTimeSeries, merchantTimeSeries, woTimeSeries, expoTimeSeries])

  // Sparklines
  const xlcSparkline = useMemo(() => computeMonthlySparkline(filteredXlc, () => 1), [filteredXlc])
  const gsfSparkline = useMemo(() => computeMonthlySparkline(filteredGsf, (d) => d.Amount), [filteredGsf])
  const merchantSparkline = useMemo(() => computeMonthlySparkline(filteredMerchant, () => 1), [filteredMerchant])
  const totalSparkline = useMemo(() => {
    const all = [
      ...filteredXlc.map((d) => ({ Bulan: d.Bulan })),
      ...filteredMerchant.map((d) => ({ Bulan: d.Bulan })),
      ...filteredWo.map((d) => ({ Bulan: d.Bulan })),
      ...filteredExpo.map((d) => ({ Bulan: d.Bulan })),
    ]
    return computeMonthlySparkline(all, () => 1)
  }, [filteredXlc, filteredMerchant, filteredWo, filteredExpo])

  // Category charts
  const chartByStore = useGroupedByCategory(filteredXlc, (d) => d.StoreName, () => 1, 10)
  const chartByPackage = useGroupedByCategory(filteredXlc, (d) => d.PackagePlan, () => 1, 8)

  const chartByRSM = useMemo(() => {
    const all = [...filteredXlc, ...filteredMerchant, ...filteredWo, ...filteredExpo]
    const map = all.reduce<Record<string, number>>((acc, d: any) => {
      if (d.RSM) acc[d.RSM] = (acc[d.RSM] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [filteredXlc, filteredMerchant, filteredWo, filteredExpo])

  const gsfChart = useGroupedByCategory(filteredGsf, (d) => d.EventName, () => 1, 8)

  const channelMix = [
    { name: 'XLC', value: xlcTotal },
    { name: 'Merchant', value: merchantTotal },
    { name: 'WO', value: woTotal },
    { name: 'EXPO', value: expoTotal },
  ]

  // Target progress data
  const targetData = useMemo(() => {
    const actuals: Record<string, number> = {
      XLC: xlcTotal,
      GSF: gsfTotal,
      Merchant: merchantTotal,
      WO: woTotal,
      EXPO: expoTotal,
    }
    return Object.entries(CHANNEL_TARGETS)
      .filter(([ch]) => ch !== 'XL Satu')
      .map(([channel, target]) => {
        const actual = actuals[channel] ?? 0
        const pct = computeTargetPercentage(actual, target)
        const status = getTargetStatus(pct)
        return { channel, target, actual, pct, status }
      })
  }, [xlcTotal, gsfTotal, merchantTotal, woTotal, expoTotal])

  const timeLabel = getTimeLabel(timeMode)

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center mb-6">
        <BarChart3 className="h-10 w-10 text-on-surface-variant" />
      </div>
      <h2 className="text-xl font-headline font-bold text-on-surface mb-2">No Data Available</h2>
      <p className="text-on-surface-variant text-sm max-w-md mb-6">
        Upload an Excel file or connect to Google Sheets to start viewing your dashboard analytics.
      </p>
      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
        <span className="px-3 py-1.5 bg-primary-container/20 text-primary rounded-xl font-bold border border-primary/30">Excel</span>
        <span>or</span>
        <span className="px-3 py-1.5 bg-secondary-container/20 text-secondary rounded-xl font-bold border border-secondary/30">Google Sheets</span>
      </div>
    </div>
  )

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ── Row 1: KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <KPICard
            title="Total Activation"
            value={formatCompact(grandTotal)}
            subtitle="All channels"
            trend={allActivationPeriod.growth}
            variant="success"
            icon={<BarChart3 className="h-5 w-5" />}
            sparklineData={totalSparkline}
          />
        </motion.div>
        <motion.div variants={item}>
          <KPICard
            title="XLC Activations"
            value={formatCompact(xlcTotal)}
            subtitle={`${xlcNew} New · ${xlcMigrate} Migrate`}
            trend={xlcPeriod.growth}
            variant="default"
            icon={<Smartphone className="h-5 w-5" />}
            sparklineData={xlcSparkline}
          />
        </motion.div>
        <motion.div variants={item}>
          <KPICard
            title="GSF Revenue"
            value={formatCurrency(gsfTotal)}
            subtitle={`${formatCompact(gsfCount)} transactions`}
            trend={gsfPeriod.growth}
            variant="success"
            icon={<CreditCard className="h-5 w-5" />}
            sparklineData={gsfSparkline}
          />
        </motion.div>
        <motion.div variants={item}>
          <KPICard
            title="Merchant Act"
            value={formatCompact(merchantTotal)}
            subtitle="Total activations"
            trend={merchantPeriod.growth}
            variant="warning"
            icon={<Store className="h-5 w-5" />}
            sparklineData={merchantSparkline}
          />
        </motion.div>
      </div>

      {/* ── Row 2: Trend (8) + Target Progress (4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {trendData.length > 1 && (
          <motion.div variants={item} className="lg:col-span-8">
            <AreaChart
              title="Activation Trend"
              data={trendData}
              index="label"
              categories={['XLC', 'Merchant', 'WO', 'EXPO']}
              colors={['#b4c5ff', '#fbbf24', '#f87171', '#c0c1ff']}
              height={340}
            />
          </motion.div>
        )}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Target Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {targetData.map((t) => (
                  <div key={t.channel} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-on-surface">{t.channel}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-data-mono text-on-surface-variant">{t.pct}%</span>
                        <span className={cn(
                          'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full',
                          t.status === 'on-track' && 'bg-secondary/10 text-secondary',
                          t.status === 'need-improvement' && 'bg-tertiary/10 text-tertiary',
                          t.status === 'below-target' && 'bg-error/10 text-error',
                        )}>
                          {getTargetStatusLabel(t.status)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', STATUS_COLORS[t.status])}
                        style={{ width: `${Math.min(t.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Row 3: Channel Donut (4) + Top Stores (4) + Top Packages (4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div variants={item} className="lg:col-span-4">
          <PieChart title="Channel Distribution" data={channelMix} height={260} />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-4">
          <BarChart title="Top 10 Stores" data={chartByStore} index="name" categories={['value']} colors={['#b4c5ff']} height={280} />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-4">
          <PieChart title="Package Distribution" data={chartByPackage.map((d) => ({ name: d.name, value: d.value }))} height={260} />
        </motion.div>
      </div>

      {/* ── Row 4: GSF Revenue (6) + RSM Performance (6) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div variants={item} className="lg:col-span-6">
          <BarChart title="GSF Transaction by Event" data={gsfChart} index="name" categories={['value']} colors={['#89ceff']} />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-6">
          {chartByRSM.length > 1 ? (
            <BarChart title="Performance by RSM" data={chartByRSM} index="name" categories={['Activations']} colors={['#c0c1ff']} />
          ) : (
            <PieChart title="New vs Migrate" data={[{ name: 'New', value: xlcNew }, { name: 'Migrate', value: xlcMigrate }]} />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
