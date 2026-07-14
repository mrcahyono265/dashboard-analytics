import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCompact } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/use-media-query'

interface LineChartProps {
  title: string
  data: any[]
  xKey: string
  lines: { key: string; color: string; name: string }[]
  height?: number
}

export function LineChart({ title, data, xKey, lines, height = 350 }: LineChartProps) {
  const isMobile = useMediaQuery('(max-width: 767px)')
  const computedHeight = isMobile ? Math.min(height, 220) : height

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={computedHeight}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" />
            <XAxis dataKey={xKey} tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'var(--color-outline-variant)' }} />
            <YAxis tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 12, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid var(--color-outline-variant)',
                background: 'var(--color-surface)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
              formatter={(value: any) => [formatCompact(Number(value) || 0)]}
            />
            <Legend />
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                strokeWidth={2}
                dot={{ r: 3, fill: l.color, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-surface)' }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
