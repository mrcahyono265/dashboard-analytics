import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Sun, Moon, Menu } from 'lucide-react'
import { useTheme } from '@/providers/theme-provider'

interface HeaderProps {
  sidebarOffset: number
  onMobileMenuToggle?: () => void
}

const PAGE_INDEX = [
  { label: 'Overview', path: '/' },
  { label: 'Monitoring', path: '/monitoring' },
  { label: 'Data Source', path: '/data-source' },
  { label: 'Data Entry', path: '/data-entry' },
  { label: 'Settings', path: '/settings' },
  { label: 'XLC Channel', path: '/xlc' },
  { label: 'GSF Revenue', path: '/gsf' },
  { label: 'Merchant', path: '/merchant' },
  { label: 'WO Agent', path: '/wo' },
  { label: 'EXPO', path: '/expo' },
  { label: 'XL Satu', path: '/xlsatu' },
  { label: 'ELITE', path: '/elite' },
  { label: 'Promotor', path: '/promotor' },
  { label: 'Target vs Realisasi', path: '/target' },
  { label: 'Reporting', path: '/reporting' },
]

export function Header({ sidebarOffset, onMobileMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const results = query
    ? PAGE_INDEX.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : []

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (path: string) => {
    navigate(path)
    setQuery('')
    setShowResults(false)
  }

  return (
    <header className="fixed top-0 right-0 h-header-height z-30 flex items-center justify-between px-container-padding bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant shadow-sm transition-[margin-left,width] duration-300 ease-out" style={{ marginLeft: sidebarOffset, width: `calc(100% - ${sidebarOffset}px)` }}>
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMobileMenuToggle} className="md:hidden p-2 text-on-surface-variant hover:text-on-surface transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <div ref={searchRef} className="relative w-full max-w-sm hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none z-10" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowResults(true) }}
            onFocus={() => setShowResults(true)}
            className="w-full bg-surface-container-low border-none rounded-2xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/50 transition-all"
            placeholder="Cari halaman..."
            type="text"
          />
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden z-50">
              {results.map((r) => (
                <button key={r.path} onClick={() => handleSelect(r.path)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-container-high transition-colors border-b border-outline-variant last:border-0">
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button onClick={toggleTheme} className="p-2 text-on-surface-variant hover:text-primary transition-all rounded-xl">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </div>
    </header>
  )
}
