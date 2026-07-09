import { useStore } from '@/lib/store'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { Smartphone, CreditCard, Store, UserRound, TrendingUp, BarChart3, Calendar } from 'lucide-react'
import { formatCompact, formatCurrency } from '@/lib/utils'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { useTimeSeries, useGroupedByCategory, usePeriodComparison } from '@/hooks/use-time-data'
import { computeMonthlySparkline } from '@/lib/sparkline'
import { getTimeLabel } from '@/lib/constants'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

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

  // Period comparison for today/this week KPIs
  const xlcPeriod = usePeriodComparison(filteredXlc, (d) => d.Tanggal || d.Bulan)
  const gsfPeriod = usePeriodComparison(filteredGsf, (d) => d.Tanggal || d.Bulan)
  const merchantPeriod = usePeriodComparison(filteredMerchant, (d) => d.Tanggal || d.Bulan)
  const woPeriod = usePeriodComparison(filteredWo, (d) => d.Tanggal || d.Bulan)
  const expoPeriod = usePeriodComparison(filteredExpo, (d) => d.Tanggal || d.Bulan)

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
  const woSparkline = useMemo(() => computeMonthlySparkline(filteredWo, () => 1), [filteredWo])
  const expoSparkline = useMemo(() => computeMonthlySparkline(filteredExpo, () => 1), [filteredExpo])
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

  const hasMultipleRSM = chartByRSM.length > 1

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
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Charts Row 1: Trend + Channel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {trendData.length > 1 && (
          <motion.div variants={item} className="lg:col-span-2">
            <AreaChart
              title="Activation Trend"
              data={trendData}
              index="label"
              categories={['XLC', 'Merchant', 'WO', 'EXPO']}
              colors={['#b4c5ff', '#fbbf24', '#f87171', '#c0c1ff']}
              height={350}
            />
          </motion.div>
        )}
        <motion.div variants={item}>
          <PieChart title="Channel Distribution" data={channelMix} />
        </motion.div>
      </div>

      {/* Charts Row 2: Top Stores + RSM Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <BarChart title="Top 10 Stores by XLC Activation" data={chartByStore} index="name" categories={['value']} colors={['#b4c5ff']} />
        </motion.div>
        <motion.div variants={item}>
          <BarChart title="GSF Transaction by Event" data={gsfChart} index="name" categories={['value']} colors={['#89ceff']} />
        </motion.div>
      </div>

      {/* Charts Row 3: Package + New/Migrate + RSM */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item}>
          <PieChart title="Package Distribution" data={chartByPackage.map((d) => ({ name: d.name, value: d.value }))} />
        </motion.div>
        <motion.div variants={item}>
          <PieChart title="New vs Migrate" data={[{ name: 'New', value: xlcNew }, { name: 'Migrate', value: xlcMigrate }]} />
        </motion.div>
        {hasMultipleRSM && (
          <motion.div variants={item}>
            <BarChart title="Performance by RSM" data={chartByRSM} index="name" categories={['Activations']} colors={['#c0c1ff']} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
