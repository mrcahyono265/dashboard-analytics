import { KPICard } from '@/components/charts/kpi-card'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { AreaChart } from '@/components/charts/area-chart'
import { Smartphone, CreditCard, Store, BarChart3 } from 'lucide-react'
import { formatCompact, formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { useOverviewData } from '@/hooks/use-overview-data'
import { TargetProgress } from '@/components/dashboard/target-progress'
import { EmptyState } from '@/components/dashboard/empty-state'

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } }
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }

export function OverviewPage() {
  const d = useOverviewData()

  if (!d.data) return <EmptyState />

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={item}>
          <KPICard title="Total Activation" value={formatCompact(d.grandTotal)} subtitle="All channels" trend={d.allActivationPeriod.growth} variant="success" icon={<BarChart3 className="h-5 w-5" />} sparklineData={d.totalSparkline} />
        </motion.div>
        <motion.div variants={item}>
          <KPICard title="XLC Activations" value={formatCompact(d.xlcTotal)} subtitle={`${d.xlcNew} New · ${d.xlcMigrate} Migrate`} trend={d.xlcPeriod.growth} variant="default" icon={<Smartphone className="h-5 w-5" />} sparklineData={d.xlcSparkline} />
        </motion.div>
        <motion.div variants={item}>
          <KPICard title="GSF Revenue" value={formatCurrency(d.gsfTotal)} subtitle={`${formatCompact(d.gsfCount)} transactions`} trend={d.gsfPeriod.growth} variant="success" icon={<CreditCard className="h-5 w-5" />} sparklineData={d.gsfSparkline} />
        </motion.div>
        <motion.div variants={item}>
          <KPICard title="Merchant Act" value={formatCompact(d.merchantTotal)} subtitle="Total activations" trend={d.merchantPeriod.growth} variant="warning" icon={<Store className="h-5 w-5" />} sparklineData={d.merchantSparkline} />
        </motion.div>
      </div>

      {/* ── Trend (8) + Target Progress (4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {d.trendData.length > 1 && (
          <motion.div variants={item} className="lg:col-span-8">
            <AreaChart title="Activation Trend" data={d.trendData} index="label" categories={['XLC', 'Merchant', 'WO', 'EXPO']} colors={['#b4c5ff', '#fbbf24', '#f87171', '#c0c1ff']} height={340} />
          </motion.div>
        )}
        <motion.div variants={item} className="lg:col-span-4">
          <TargetProgress data={d.targetData} />
        </motion.div>
      </div>

      {/* ── Channel Donut (4) + Top Stores (4) + Top Packages (4) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div variants={item} className="lg:col-span-4">
          <PieChart title="Channel Distribution" data={d.channelMix} height={260} />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-4">
          <BarChart title="Top 10 Stores" data={d.chartByStore} index="name" categories={['value']} colors={['#b4c5ff']} height={280} />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-4">
          <PieChart title="Package Distribution" data={d.chartByPackage.map((p) => ({ name: p.name, value: p.value }))} height={260} />
        </motion.div>
      </div>

      {/* ── GSF Revenue (6) + RSM Performance (6) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <motion.div variants={item} className="lg:col-span-6">
          <BarChart title="GSF Transaction by Event" data={d.gsfChart} index="name" categories={['value']} colors={['#89ceff']} />
        </motion.div>
        <motion.div variants={item} className="lg:col-span-6">
          {d.chartByRSM.length > 1 ? (
            <BarChart title="Performance by RSM" data={d.chartByRSM} index="name" categories={['Activations']} colors={['#c0c1ff']} />
          ) : (
            <PieChart title="New vs Migrate" data={[{ name: 'New', value: d.xlcNew }, { name: 'Migrate', value: d.xlcMigrate }]} />
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
