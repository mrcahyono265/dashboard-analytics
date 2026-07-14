import { useStore } from '@/lib/store'
import { X, RotateCcw, ChevronDown } from 'lucide-react'
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
  const filters = useStore(s => s.filters)
  const setFilter = useStore(s => s.setFilter)
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
          'flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-medium transition-all',
          selected.length > 0
            ? 'bg-primary-container/20 border-primary/30 text-primary'
            : 'bg-surface-container border-outline-variant text-on-surface-variant hover:border-outline'
        )}
      >
        {option.label}
        {selected.length > 0 && (
          <span className="bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">{selected.length}</span>
        )}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-outline-variant bg-surface shadow-xl z-50 max-h-60 overflow-y-auto">
          <div className="p-2">
            {option.options.map((val) => (
              <label
                key={val}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all',
                  selected.includes(val)
                    ? 'bg-primary-container/20 text-primary font-medium'
                    : 'text-on-surface hover:bg-surface-container-high'
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(val)}
                  onChange={() => toggleValue(val)}
                  className="h-3.5 w-3.5 rounded border-outline-variant text-primary"
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
  const filters = useStore(s => s.filters)
  const resetFilters = useStore(s => s.resetFilters)

  const activeCount = Object.values(filters).reduce((s, v) => s + v.length, 0)

  return (
    <div className={cn(
      'border-b border-outline-variant bg-surface-container-low transition-all duration-200 overflow-hidden mb-6',
      open ? 'max-h-48 py-3' : 'max-h-0 py-0'
    )}>
      <div className="flex items-center gap-2 px-4 md:px-6 flex-wrap">
        {options.map((opt) => (
          <FilterDropdown key={opt.key} option={opt} />
        ))}
        {activeCount > 0 && (
          <>
            <span className="text-xs font-bold text-on-surface-variant">
              {activeCount} active
            </span>
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-primary transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </button>
          </>
        )}
        <div className="ml-auto">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-medium text-on-surface-variant hover:text-error transition-colors"
          >
            <X className="h-3 w-3" />
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
