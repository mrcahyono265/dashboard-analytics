import { useStore } from '@/lib/store'
import { Calendar, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimeMode } from '@/lib/date-parser'

const timeOptions: { value: TimeMode; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function TimeFilter() {
  const timeMode = useStore((s) => s.timeMode)
  const customDateRange = useStore((s) => s.customDateRange)
  const setTimeMode = useStore((s) => s.setTimeMode)
  const setCustomDateRange = useStore((s) => s.setCustomDateRange)

  const isCustom = customDateRange !== null

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <div className="flex items-center bg-surface-container border border-outline-variant rounded-2xl p-1 shrink-0">
        {timeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setTimeMode(opt.value); setCustomDateRange(null) }}
            className={cn(
              'px-3 sm:px-4 py-1.5 text-xs font-label rounded-xl transition-all font-bold',
              timeMode === opt.value && !isCustom
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-container border border-outline-variant rounded-2xl">
          <Calendar className="text-[18px] text-on-surface-variant hidden sm:block" />
          <input
            type="date"
            value={customDateRange?.from ?? ''}
            onChange={(e) => {
              const from = e.target.value
              const to = customDateRange?.to ?? from
              if (from) setCustomDateRange({ from, to })
            }}
            className="text-sm text-on-surface bg-transparent border-none outline-none w-[90px] md:w-[110px] [color-scheme:dark]"
            placeholder="From"
          />
          <span className="text-on-surface-variant text-sm">—</span>
          <input
            type="date"
            value={customDateRange?.to ?? ''}
            onChange={(e) => {
              const to = e.target.value
              const from = customDateRange?.from ?? to
              if (to) setCustomDateRange({ from, to })
            }}
            className="text-sm text-on-surface bg-transparent border-none outline-none w-[90px] md:w-[110px] [color-scheme:dark]"
            placeholder="To"
          />
        </div>

        {isCustom && (
          <button
            onClick={() => setCustomDateRange(null)}
            className="p-1.5 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-error-container/20"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
