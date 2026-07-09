import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { CHART_TOOLTIP_STYLE } from '@/lib/chart-config'

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  trend?: number
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  sparklineData?: { value: number }[]
  className?: string
}

export function KPICard({ title, value, subtitle, trend, icon, variant = 'default', sparklineData, className }: KPICardProps) {
  const variantStyles = {
    default: {
      border: 'border-l-primary',
      iconBg: 'bg-primary-container/10',
      iconColor: 'text-primary',
      trendColor: trend && trend > 0 ? 'text-secondary' : trend && trend < 0 ? 'text-error' : 'text-on-surface-variant',
    },
    success: {
      border: 'border-l-secondary',
      iconBg: 'bg-secondary-container/10',
      iconColor: 'text-secondary',
      trendColor: 'text-secondary',
    },
    warning: {
      border: 'border-l-tertiary',
      iconBg: 'bg-tertiary-container/10',
      iconColor: 'text-tertiary',
      trendColor: trend && trend > 0 ? 'text-secondary' : 'text-error',
    },
    danger: {
      border: 'border-l-error',
      iconBg: 'bg-error-container/10',
      iconColor: 'text-error',
      trendColor: 'text-error',
    },
  }

  const s = variantStyles[variant]
  const chartColor = variant === 'default' ? 'var(--color-primary)' : variant === 'success' ? 'var(--color-secondary)' : variant === 'warning' ? 'var(--color-tertiary)' : 'var(--color-error)'

  return (
    <Card className={cn('min-h-[140px] flex flex-col justify-between border-l-4', s.border, className)}>
      <CardContent className="p-4 md:p-5 flex-1 flex flex-col justify-between">
        {/* Top: Label + Icon */}
        <div className="flex justify-between items-start">
          <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-widest font-bold">{title}</p>
          {icon && (
            <div className={cn('p-3 rounded-2xl group-hover:scale-110 transition-transform', s.iconBg)}>
              <span className={cn('h-5 w-5 block', s.iconColor)}>{icon}</span>
            </div>
          )}
        </div>

        {/* Middle: Value */}
        <h3 className="text-2xl md:text-3xl font-data-mono text-on-surface font-medium truncate">{value}</h3>

        {/* Bottom: Trend */}
        <div className="flex items-center gap-1">
          {trend !== undefined && (
            <>
              {trend > 0 ? <TrendingUp className={cn('h-4 w-4', s.trendColor)} /> :
               trend < 0 ? <TrendingDown className={cn('h-4 w-4', s.trendColor)} /> :
               <Minus className={cn('h-4 w-4', s.trendColor)} />}
              <span className={cn('text-sm font-bold', s.trendColor)}>
                {trend > 0 ? '+' : ''}{Math.abs(trend)}%
              </span>
            </>
          )}
          {subtitle && <span className="text-[10px] text-on-surface-variant ml-1">{subtitle}</span>}
        </div>
      </CardContent>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 1 && (
        <div className="h-10 px-5 pb-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={`sparkline-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                strokeWidth={1.5}
                fill={`url(#sparkline-${title})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
