import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Target } from 'lucide-react'
import { getTargetStatusLabel } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TargetItem {
  channel: string
  pct: number
  status: 'on-track' | 'need-improvement' | 'below-target'
}

const STATUS_BAR = {
  'on-track': 'bg-secondary',
  'need-improvement': 'bg-tertiary',
  'below-target': 'bg-error',
} as const

const STATUS_BADGE = {
  'on-track': 'bg-secondary/10 text-secondary',
  'need-improvement': 'bg-tertiary/10 text-tertiary',
  'below-target': 'bg-error/10 text-error',
} as const

export function TargetProgress({ data }: { data: TargetItem[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Target Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((t) => (
            <div key={t.channel} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface">{t.channel}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-data-mono text-on-surface-variant">{t.pct}%</span>
                  <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full', STATUS_BADGE[t.status])}>
                    {getTargetStatusLabel(t.status)}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', STATUS_BAR[t.status])}
                  style={{ width: `${Math.min(t.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
