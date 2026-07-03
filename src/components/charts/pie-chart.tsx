import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'

const COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)', 'var(--color-chart-6)', 'var(--color-chart-1)', 'var(--color-chart-2)']

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
        <CardTitle className="text-text">{title}</CardTitle>
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
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any) => [valueFormatter(Number(value) || 0)]}
              contentStyle={{
                borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            />
            <Legend
              formatter={(value: string) => <span className="text-xs text-text-secondary">{value}</span>}
              iconType="circle"
              iconSize={8}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
        {donut && (
          <p className="mt-2 text-center text-sm text-text-tertiary">
            Total: {valueFormatter(data.reduce((s, d) => s + d.value, 0))}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
