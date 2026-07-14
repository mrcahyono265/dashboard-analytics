import { useState, useMemo } from 'react'
import { useAchievementData } from '@/hooks/use-achievement-data'
import { AchievementCard } from '@/components/achievement/achievement-card'
import { PeriodFilter } from '@/components/achievement/period-filter'
import { BarChart } from '@/components/charts/bar-chart'
import { PieChart } from '@/components/charts/pie-chart'
import { EmptyState } from '@/components/dashboard/empty-state'
import { computeAchievementCharts } from '@/lib/achievement-computer'
import { getThisMonthKey } from '@/lib/date-parser'
import { Users, Wifi } from 'lucide-react'

const CARD_ICONS: Record<string, React.ReactNode> = {
  Prioritas: <Users className="h-5 w-5 text-primary" />,
  'XL Satu': <Wifi className="h-5 w-5 text-secondary" />,
}

export function AchievementWOPage() {
  const [period, setPeriod] = useState(getThisMonthKey)
  const { wo, availablePeriods } = useAchievementData(period)

  const charts = useMemo(() => computeAchievementCharts(wo), [wo])
  const hasData = wo.some(c => c.leaves.length > 0)

  if (!hasData) {
    return (
      <div className="space-y-6">
        <PeriodFilter period={period} onChange={setPeriod} availablePeriods={availablePeriods} />
        <EmptyState message="Belum ada data achievement WO. Upload file data dari Excel." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-headline-md font-headline font-bold text-on-surface">Achievement WO Agent</h2>
          <p className="text-body-sm text-on-surface-variant mt-1">Rekap Bulanan — Prioritas & XL Satu (via WO)</p>
        </div>
        <PeriodFilter period={period} onChange={setPeriod} availablePeriods={availablePeriods} />
      </div>

      <div className="space-y-6">
        <h3 className="text-title-sm font-headline font-semibold text-on-surface">Ringkasan Metrik</h3>
        {charts.crrChart.length > 0 && (
          <BarChart
            title="Pencapaian per CRR"
            data={charts.crrChart}
            categories={['achievement', 'target']}
            index="name"
            layout="horizontal"
            height={charts.crrChart.length * 36 + 40}
            colors={['emerald', 'amber']}
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {charts.storeChart.length > 0 && (
            <BarChart
              title="Pencapaian per Store"
              data={charts.storeChart}
              categories={['achievement', 'target']}
              index="name"
              layout="horizontal"
              height={Math.min(charts.storeChart.length * 36 + 40, 300)}
              colors={['emerald', 'amber']}
            />
          )}
          {charts.distributionDonut.length > 0 && (
            <PieChart
              title="Distribusi per Produk"
              data={charts.distributionDonut}
              donut
              height={260}
            />
          )}
        </div>
      </div>

      {wo.map((card, i) => (
        <div key={i} className="relative">
          <div className="flex items-center gap-2 mb-3">
            {CARD_ICONS[card.title]}
            <h3 className="text-title-sm font-headline font-semibold text-on-surface">{card.title}</h3>
          </div>
          <AchievementCard card={card} />
        </div>
      ))}
    </div>
  )
}
