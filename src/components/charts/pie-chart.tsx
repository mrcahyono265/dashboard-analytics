import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/lib/chart-config'
import { useMediaQuery } from '@/hooks/use-media-query'

interface PieChartProps {
  title: string
  data: { name: string; value: number }[]
  height?: number
  valueFormatter?: (value: number) => string
  donut?: boolean
}

const defaultFormatter = (v: number) => formatCompact(v)

export function PieChart({ title, data, height = 300, valueFormatter = defaultFormatter, donut = true }: PieChartProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const computedHeight = isMobile ? Math.min(height, 220) : height
  const innerR = isMobile ? 40 : 60
  const outerR = isMobile ? 60 : 90

  if (!data.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
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
            <Legend
              formatter={(value: string) => <span className="text-xs text-on-surface-variant">{value}</span>}
              iconType="circle"
              iconSize={8}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        {donut && (
          <div className="mt-4 flex flex-col items-center">
            <span className="text-2xl font-data-mono text-on-surface font-medium">
              {valueFormatter(data.reduce((s, d) => s + d.value, 0))}
            </span>
            <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">Total</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
