import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'
import { CHART_COLORS, COLOR_ALIAS, CHART_TOOLTIP_STYLE, AXIS_TICK_STYLE, AXIS_LINE_STYLE } from '@/lib/chart-config'

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

export function BarChart({
  title, data, categories, index,
  colors = CHART_COLORS,
  height = 300,
  layout = 'vertical',
  valueFormatter = defaultFormatter,
}: BarChartProps) {
  if (!data.length) return null
  const isHorizontal = layout === 'horizontal'
  const resolvedColors = colors.map((c) => COLOR_ALIAS[c] || c)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart data={data} layout={isHorizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={!isHorizontal} horizontal={isHorizontal} />
            {isHorizontal ? (
              <>
                <XAxis type="number" tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => valueFormatter(v)} />
                <YAxis type="category" dataKey={index} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--color-outline-variant)' }} width={120} />
              </>
            ) : (
              <>
                <XAxis dataKey={index} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--color-outline-variant)' }} />
                <YAxis tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => valueFormatter(v)} width={50} />
              </>
            )}
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value: any) => [valueFormatter(Number(value) || 0)]}
            />
            {categories.length > 1 && <Legend />}
            {categories.map((cat, i) => (
              <Bar key={cat} dataKey={cat} fill={resolvedColors[i % resolvedColors.length]} radius={[6, 6, 0, 0]} maxBarSize={40} />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
