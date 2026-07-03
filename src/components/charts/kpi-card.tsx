import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'

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
    default: { border: 'border-l-primary', bg: 'bg-primary/5', iconBg: 'bg-primary/10', iconColor: 'text-primary' },
    success: { border: 'border-l-success', bg: 'bg-success/5', iconBg: 'bg-success/10', iconColor: 'text-success' },
    warning: { border: 'border-l-warning', bg: 'bg-warning/5', iconBg: 'bg-warning/10', iconColor: 'text-warning' },
    danger: { border: 'border-l-danger', bg: 'bg-danger/5', iconBg: 'bg-danger/10', iconColor: 'text-danger' },
  }

  const s = variantStyles[variant]
  const chartColor = variant === 'default' ? 'var(--color-primary)' : variant === 'success' ? 'var(--color-success)' : variant === 'warning' ? 'var(--color-warning)' : 'var(--color-danger)'

  return (
    <Card className={cn('h-full flex flex-col relative overflow-hidden border-l-4', s.border, className)}>
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between shrink-0">
          <div className="space-y-1.5 min-w-0 flex-1">
            <p className="text-sm font-medium text-text-secondary truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight text-text truncate">{value}</p>
            <div className="flex items-center gap-2 flex-wrap">
              {trend !== undefined && (
                <span className={cn(
                  'inline-flex items-center gap-0.5 text-xs font-semibold rounded-full px-1.5 py-0.5',
                  trend > 0 ? 'text-success bg-success/10' :
                  trend < 0 ? 'text-danger bg-danger/10' :
                  'text-text-secondary bg-muted'
                )}>
                  {trend > 0 ? <TrendingUp className="h-3 w-3" /> :
                   trend < 0 ? <TrendingDown className="h-3 w-3" /> :
                   <Minus className="h-3 w-3" />}
                  {Math.abs(trend)}%
                </span>
              )}
              {subtitle && <span className="text-xs text-text-tertiary truncate">{subtitle}</span>}
            </div>
          </div>
          {icon && (
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', s.iconBg)}>
              <span className={cn('h-5 w-5', s.iconColor)}>{icon}</span>
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="mt-auto pt-3 h-10">
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
      </CardContent>
    </Card>
  )
}
