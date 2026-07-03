import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'

interface BarChartProps {
  title: string
  data: any[]
  categories: string[]
  index: string
  colors?: string[]
  height?: number
  layout?: 'vertical' | 'horizontal'
  valueFormatter?: (value: number) => string
}

const defaultFormatter = (v: number) => formatCompact(v)
const CHART_COLORS = ['var(--color-chart-1)', 'var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)', 'var(--color-chart-5)', 'var(--color-chart-6)']

export function BarChart({
  title, data, categories, index,
  colors = CHART_COLORS,
  height = 300,
  layout = 'vertical',
  valueFormatter = defaultFormatter,
}: BarChartProps) {
  if (!data.length) return null
  const isHorizontal = layout === 'horizontal'

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-text">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={data} layout={isHorizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={!isHorizontal} horizontal={isHorizontal} />
            {isHorizontal ? (
              <>
                <XAxis type="number" tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => valueFormatter(v)} />
                <YAxis type="category" dataKey={index} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} width={120} />
              </>
            ) : (
              <>
                <XAxis dataKey={index} tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
                <YAxis tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v: number) => valueFormatter(v)} width={50} />
              </>
            )}
            <Tooltip
              contentStyle={{
                borderRadius: '8px', border: '1px solid var(--color-border)',
                background: 'var(--color-surface)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
              formatter={(value: any) => [valueFormatter(Number(value) || 0)]}
            />
            {categories.length > 1 && <Legend />}
            {categories.map((cat, i) => (
              <Bar key={cat} dataKey={cat} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} maxBarSize={40} />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
