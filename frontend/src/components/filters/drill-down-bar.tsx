import { useMemo, useState, useRef, useEffect } from 'react'
import { ChevronDown, MapPin, X } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { canDrillDown, getRoleScope, filterByRoleScope, CHANNEL_HIERARCHY } from '@/lib/rbac'
import { cn } from '@/lib/utils'

const CHANNEL_KEYS = ['xlc', 'merchant', 'xlsatu', 'wo', 'expo'] as const

export function DrillDownBar() {
  const { user } = useAuth()
  const storeData = useStore((s) => s.data)
  const drillDown = useStore((s) => s.drillDown)
  const setDrillDown = useStore((s) => s.setDrillDown)
  const resetDrillDown = useStore((s) => s.resetDrillDown)

  const scope = getRoleScope(user)

  const { centers, crrs } = useMemo(() => {
    if (!storeData) return { centers: [], crrs: [] }
    const centerSet = new Set<string>()
    const crrSet = new Set<string>()
    for (const key of CHANNEL_KEYS) {
      const arr = storeData[key]
      if (!arr) continue
      const scoped = filterByRoleScope(arr as Record<string, any>[], key, scope)
      const h = CHANNEL_HIERARCHY[key]
      if (!h) continue
      scoped.forEach((d) => {
        if (drillDown.center && d[h.manager] !== drillDown.center) return
        if (d[h.manager]) centerSet.add(d[h.manager])
        if (d[h.staff]) crrSet.add(d[h.staff])
      })
    }
    return { centers: [...centerSet].sort(), crrs: [...crrSet].sort() }
  }, [storeData, scope.level, scope.value, drillDown.center])

  if (!canDrillDown(user) || !storeData) return null

  const isRSE = user?.role === 'RSE'
  const hasSelection = drillDown.center || drillDown.crr

  return (
    <div className="flex items-center gap-2 flex-wrap mb-2">
      <div className="flex items-center gap-1.5 text-on-surface-variant">
        <MapPin className="h-4 w-4" />
      </div>

      {isRSE ? (
        <DropdownSelect
          label="All Centers"
          value={drillDown.center}
          options={centers}
          onChange={(v) => setDrillDown({ center: v, crr: null })}
        />
      ) : (
        <span className="text-sm font-medium text-on-surface px-3 py-1.5">
          {user?.center ?? 'Unknown Center'}
        </span>
      )}

      <ChevronDown className="h-3 w-3 text-on-surface-variant -rotate-90" />

      <DropdownSelect
        label="All CRRs"
        value={drillDown.crr}
        options={crrs}
        onChange={(v) => setDrillDown({ crr: v })}
      />

      {hasSelection && (
        <button
          onClick={resetDrillDown}
          className="flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-error transition-colors ml-1"
        >
          <X className="h-3 w-3" />
          Reset
        </button>
      )}
    </div>
  )
}

function DropdownSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: string[]
  onChange: (value: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-sm font-medium transition-all',
          value
            ? 'bg-primary-container/20 border-primary/30 text-primary'
            : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline',
        )}
      >
        {value ?? label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 max-w-[calc(100vw-2rem)] rounded-2xl border border-outline-variant bg-surface shadow-xl z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className={cn(
                'w-full text-left rounded-xl px-3 py-2 text-sm transition-all',
                !value
                  ? 'bg-primary-container/20 text-primary font-medium'
                  : 'text-on-surface hover:bg-surface-container-high',
              )}
            >
              {label}
            </button>
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false) }}
                className={cn(
                  'w-full text-left rounded-xl px-3 py-2 text-sm transition-all',
                  value === opt
                    ? 'bg-primary-container/20 text-primary font-medium'
                    : 'text-on-surface hover:bg-surface-container-high',
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
