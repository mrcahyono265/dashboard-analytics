import { useStore } from '@/lib/store'
import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { Smartphone, CreditCard, Store, UserRound, TrendingUp, BarChart3 } from 'lucide-react'
import { formatCompact, formatCurrency } from '@/lib/utils'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { computeMonthlySparkline } from '@/lib/sparkline'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function OverviewPage() {
  const { data } = useStore()

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

  const chartByStore = useMemo(() => {
    if (!filteredXlc.length) return []
    const map = filteredXlc.reduce<Record<string, number>>((acc, d) => {
      acc[d.StoreName || 'Unknown'] = (acc[d.StoreName || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, Activations: value })).sort((a, b) => b.Activations - a.Activations).slice(0, 10)
  }, [filteredXlc])

  const chartByPackage = useMemo(() => {
    if (!filteredXlc.length) return []
    const map = filteredXlc.reduce<Record<string, number>>((acc, d) => {
      acc[d.PackagePlan || 'Unknown'] = (acc[d.PackagePlan || 'Unknown'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [filteredXlc])

  const chartByRSM = useMemo(() => {
    const all = [...filteredXlc, ...filteredMerchant, ...filteredWo, ...filteredExpo]
    const map = all.reduce<Record<string, number>>((acc, d: any) => {
      if (d.RSM) acc[d.RSM] = (acc[d.RSM] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, Activations]) => ({ name, Activations })).sort((a, b) => b.Activations - a.Activations)
  }, [filteredXlc, filteredMerchant, filteredWo, filteredExpo])

  const gsfChart = useMemo(() => {
    if (!filteredGsf.length) return []
    const map = filteredGsf.reduce<Record<string, number>>((acc, d) => {
      acc[d.EventName || 'Other'] = (acc[d.EventName || 'Other'] || 0) + 1
      return acc
    }, {})
    return Object.entries(map).map(([name, value]) => ({ name, Transactions: value })).sort((a, b) => b.Transactions - a.Transactions).slice(0, 8)
  }, [filteredGsf])

  const channelMix = [
    { name: 'XLC', value: xlcTotal },
    { name: 'Merchant', value: merchantTotal },
    { name: 'WO', value: woTotal },
    { name: 'EXPO', value: expoTotal },
  ]

  const hasMultipleRSM = chartByRSM.length > 1

  if (!data) return null

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <motion.div variants={item}><KPICard title="XLC Activations" value={formatCompact(xlcTotal)} subtitle={`${xlcNew} New · ${xlcMigrate} Migrate`} variant="default" icon={<Smartphone className="h-5 w-5" />} sparklineData={xlcSparkline} /></motion.div>
        <motion.div variants={item}><KPICard title="GSF Revenue" value={formatCurrency(gsfTotal)} subtitle={`${formatCompact(gsfCount)} transactions`} variant="success" icon={<CreditCard className="h-5 w-5" />} sparklineData={gsfSparkline} /></motion.div>
        <motion.div variants={item}><KPICard title="Merchant" value={formatCompact(merchantTotal)} subtitle="Total activations" variant="warning" icon={<Store className="h-5 w-5" />} sparklineData={merchantSparkline} /></motion.div>
        <motion.div variants={item}><KPICard title="WO Agent" value={formatCompact(woTotal)} subtitle="Total activations" variant="danger" icon={<UserRound className="h-5 w-5" />} sparklineData={woSparkline} /></motion.div>
        <motion.div variants={item}><KPICard title="EXPO" value={formatCompact(expoTotal)} subtitle="Total activations" variant="default" icon={<TrendingUp className="h-5 w-5" />} sparklineData={expoSparkline} /></motion.div>
        <motion.div variants={item}><KPICard title="Grand Total" value={formatCompact(grandTotal)} subtitle="All channels" variant="success" icon={<BarChart3 className="h-5 w-5" />} sparklineData={totalSparkline} /></motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={item}><BarChart title="Top 10 Stores by XLC Activation" data={chartByStore} index="name" categories={['Activations']} colors={['blue']} /></motion.div>
        <motion.div variants={item}><BarChart title="GSF Transaction by Event" data={gsfChart} index="name" categories={['Transactions']} colors={['emerald']} /></motion.div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div variants={item}><PieChart title="Channel Mix" data={channelMix} /></motion.div>
        <motion.div variants={item}><PieChart title="Package Distribution" data={chartByPackage} /></motion.div>
        <motion.div variants={item}><PieChart title="New vs Migrate" data={[{ name: 'New', value: xlcNew }, { name: 'Migrate', value: xlcMigrate }]} /></motion.div>
      </div>

      {hasMultipleRSM && (
        <motion.div variants={item}>
          <BarChart title="Performance by RSM" data={chartByRSM} index="name" categories={['Activations']} colors={['violet']} />
        </motion.div>
      )}
    </motion.div>
  )
}
