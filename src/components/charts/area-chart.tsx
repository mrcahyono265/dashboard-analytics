import {
  AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'

interface AreaChartProps {
  title: string
  data: any[]
  categories: string[]
  index: string
  colors?: string[]
  height?: number
  valueFormatter?: (value: number) => string
}

const defaultFormatter = (v: number) => formatCompact(v)
const CHART_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)', 'var(--color-chart-6)']

export function AreaChart({
  title, data, categories, index,
  colors = CHART_COLORS,
  height = 300,
  valueFormatter = defaultFormatter,
}: AreaChartProps) {
  if (!data.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-text">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsAreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              {categories.map((cat, i) => (
                <linearGradient key={cat} id={`area-${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors[i % colors.length]} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors[i % colors.length]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey={index} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
            <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => valueFormatter(v)} width={50} />
            <Tooltip
              contentStyle={{
                borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'var(--color-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: any) => [valueFormatter(Number(value) || 0)]}
            />
            {categories.length > 1 && <Legend />}
            {categories.map((cat, i) => (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={colors[i % colors.length]}
                fill={`url(#area-${cat})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
