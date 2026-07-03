import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, RotateCcw, ChevronDown, Search } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface FilterOption {
  key: 'bulan' | 'rsm' | 'sm' | 'store' | 'channel'
  label: string
  options: string[]
}

interface FilterBarProps {
  open: boolean
  options: FilterOption[]
  onClose: () => void
}

function FilterDropdown({ option }: { option: FilterOption }) {
  const { filters, setFilter } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selected = filters[option.key]
  const toggleValue = (value: string) => {
    const updated = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    setFilter(option.key, updated)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors',
          selected.length > 0
            ? 'bg-primary/10 border-primary/30 text-primary'
            : 'bg-surface text-text-secondary hover:border-text-tertiary'
        )}
      >
        {option.label}
        {selected.length > 0 && (
          <Badge variant="default" className="px-1 py-0 text-[10px]">{selected.length}</Badge>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 rounded-lg border border-border bg-surface shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-1">
            {option.options.map((val) => (
              <label
                key={val}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors',
                  selected.includes(val)
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-text hover:bg-muted'
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(val)}
                  onChange={() => toggleValue(val)}
                  className="h-3.5 w-3.5 rounded border-border text-primary"
                />
                {val}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function FilterBar({ open, options, onClose }: FilterBarProps) {
  const { filters, resetFilters } = useStore()

  const activeCount = Object.values(filters).reduce((s, v) => s + v.length, 0)

  return (
    <div className={cn(
      'border-b border-border bg-surface transition-all duration-200 overflow-hidden',
      open ? 'max-h-32 py-3' : 'max-h-0 py-0'
    )}>
      <div className="flex items-center gap-2 px-6 flex-wrap">
        {options.map((opt) => (
          <FilterDropdown key={opt.key} option={opt} />
        ))}
        {activeCount > 0 && (
          <>
            <Badge variant="neutral" className="text-xs">
              {activeCount} active
            </Badge>
            <Button variant="ghost" size="xs" onClick={resetFilters}>
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
          </>
        )}
        <div className="ml-auto">
          <Button variant="ghost" size="xs" onClick={onClose}>
            <X className="h-3 w-3" />
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
