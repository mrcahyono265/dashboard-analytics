import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/lib/chart-config'

interface PieChartProps {
  title: string
  data: { name: string; value: number }[]
  height?: number
  valueFormatter?: (value: number) => string
  donut?: boolean
}

const defaultFormatter = (v: number) => formatCompact(v)

export function PieChart({ title, data, height = 300, valueFormatter = defaultFormatter, donut = true }: PieChartProps) {
  if (!data.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={donut ? 60 : 0}
              outerRadius={90}
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
