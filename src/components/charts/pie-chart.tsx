import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'
import { CHART_COLORS } from '@/lib/chart-config'
import { useMediaQuery } from '@/hooks/use-media-query'

interface PieChartProps {
  title: string
  data: { name: string; value: number }[]
  height?: number
  valueFormatter?: (value: number) => string
  donut?: boolean
  layout?: 'vertical' | 'horizontal'
}

const defaultFormatter = (v: number) => formatCompact(v)

export function PieChart({
  title, data, height = 300, valueFormatter = defaultFormatter, donut = true, layout = 'vertical',
}: PieChartProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const computedHeight = isMobile ? Math.min(height, 220) : height
  const innerR = isMobile ? 40 : 60
  const outerR = isMobile ? 60 : 90

  if (!data.length) return null

  const total = data.reduce((s, d) => s + d.value, 0)

  const chart = (
    <ResponsiveContainer width="100%" height={computedHeight}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={donut ? innerR : 0}
          outerRadius={outerR}
          paddingAngle={3}
          dataKey="value"
          nameKey="name"
          strokeWidth={0}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => [valueFormatter(Number(value) || 0)]}
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid var(--color-outline-variant)',
            background: 'var(--color-surface)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  )

  const legendItems = data.map((d, i) => ({
    name: d.name,
    value: d.value,
    color: CHART_COLORS[i % CHART_COLORS.length],
    pct: total > 0 ? Math.round((d.value / total) * 100) : 0,
  }))

  const legend = (
    <div className="flex flex-col justify-center gap-2.5">
      {legendItems.map((item) => (
        <div key={item.name} className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
          <span className="text-xs text-on-surface font-medium min-w-0 truncate">{item.name}</span>
          <span className="text-xs text-on-surface-variant ml-auto font-data-mono">{item.pct}%</span>
        </div>
      ))}
      {donut && (
        <div className="mt-2 pt-2 border-t border-outline-variant">
          <span className="text-lg font-data-mono text-on-surface font-medium">{valueFormatter(total)}</span>
          <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest ml-2">Total</span>
        </div>
      )}
    </div>
  )

  if (layout === 'horizontal') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-1/2 min-w-0">{chart}</div>
            <div className="w-1/2 min-w-0">{legend}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {chart}
        {donut && (
          <div className="mt-4 flex flex-col items-center">
            <span className="text-2xl font-data-mono text-on-surface font-medium">
              {valueFormatter(total)}
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Total</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
