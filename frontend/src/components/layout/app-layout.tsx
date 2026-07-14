import { useState, useEffect, useMemo } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { TimeFilter } from '@/components/filters/time-filter'
import { LogViewer } from '@/components/dev/log-viewer'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { useDataLoader } from '@/hooks/use-data'
import { useMediaQuery } from '@/hooks/use-media-query'
import { api } from '@/lib/api'
import { FilterBar, type FilterOption } from '@/components/filters/filter-bar'
import { DrillDownBar } from '@/components/filters/drill-down-bar'
import { useStore } from '@/lib/store'
import { useAuth } from '@/hooks/use-auth'
import { getRoleScope, filterByRoleScope } from '@/lib/rbac'
import { Toaster } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

const DASHBOARD_PATHS = new Set([
  '/', '/xlc', '/gsf', '/merchant', '/wo', '/expo',
  '/xlsatu', '/elite', '/promotor', '/target', '/reporting', '/monitoring',
  '/prio-xlc', '/wo-agent',
])

const pageTitles: Record<string, string> = {
  '/': 'Overview Analytics',
  '/xlc': 'XLC Channel Analytics',
  '/gsf': 'GSF Revenue',
  '/merchant': 'Merchant Activations',
  '/wo': 'WO Agent Activations',
  '/expo': 'EXPO Activations',
  '/xlsatu': 'XL Satu Home Broadband',
  '/elite': 'ELITE Performance',
  '/promotor': 'Promotor Performance',
  '/target': 'Target',
  '/reporting': 'Reporting',
  '/monitoring': 'Monitoring',
  '/achievement/xlc-gsf': 'Achievement XLC & GSF',
  '/achievement/wo': 'Achievement WO Agent',
  '/achievement/expo': 'Achievement EXPO',
  '/prio-xlc': 'PrioXLC',
  '/wo-agent': 'WO Agent',
  '/data-entry': 'Data Entry',
  '/data-source': 'Data Source',
  '/settings': 'Settings',
}

const pageSubtitles: Record<string, string> = {
  '/': 'Real-time performance tracking for all channels.',
  '/xlc': 'Real-time performance tracking for XLC distribution channels.',
  '/gsf': 'Transaction and revenue tracking for GSF.',
  '/merchant': 'Merchant activation tracking.',
  '/wo': 'WO Agent activation tracking.',
  '/expo': 'EXPO activation tracking.',
  '/xlsatu': 'XL Satu Home Broadband tracking.',
  '/elite': 'Operator comparison performance.',
  '/promotor': 'Promotor performance tracking.',
  '/target': 'Target achievement vs realisasi per channel.',
  '/reporting': 'Comprehensive reporting dashboard.',
  '/monitoring': 'Kinerja per orang — ranking CRR, WO Agent, dan EXPO Promotor.',
  '/achievement/xlc-gsf': 'CRR performance — daily activity, target, proyeksi, dan product mix.',
  '/achievement/wo': 'WO Agent performance — rekap bulanan per agent.',
  '/achievement/expo': 'EXPO Promotor performance — rekap bulanan per promotor.',
  '/prio-xlc': 'Aktivasi produk prioritas — breakdown per store dan CRR.',
  '/wo-agent': 'Data WO Agent — perbandingan aktivasi per agent.',
  '/data-source': 'Upload, sync, or connect your data source.',
  '/settings': 'Manage your account, connections, and preferences.',
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { loading, fetchFromApi } = useDataLoader()
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const storeData = useStore((s) => s.data)

  // Layout offset: sidebar takes space on desktop/tablet, overlays on mobile
  const sidebarOffset = isMobile ? 0 : (sidebarCollapsed ? 64 : 220)

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false)
  const { user } = useAuth()
  const filterOptions: FilterOption[] = useMemo(() => {
    if (!storeData) return []
    const scope = getRoleScope(user)
    const channelKeys = ['xlc', 'gsf', 'merchant', 'wo', 'expo'] as const
    const semua: string[] = []
    const storeNames: string[] = []
    for (const key of channelKeys) {
      const arr = storeData[key]
      if (!arr) continue
      const scoped = filterByRoleScope(arr as Record<string, any>[], key, scope)
      scoped.forEach((d: any) => {
        if (d.Bulan) semua.push(d.Bulan)
        if (d.StoreName) storeNames.push(d.StoreName)
      })
    }
    return [
      { key: 'bulan', label: 'Bulan', options: [...new Set(semua)].sort() },
      { key: 'store', label: 'Store', options: [...new Set(storeNames)].sort() },
    ]
  }, [storeData, user])

  // Reload from API when data is synced (URL/upload/OneDrive)
  useEffect(() => {
    const handler = () => fetchFromApi()
    window.addEventListener('data-synced', handler)
    return () => window.removeEventListener('data-synced', handler)
  }, [fetchFromApi])

  // SSE: real-time updates from server-side auto-sync
  useEffect(() => {
    const token = api.getToken()
    if (!token) return
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const es = new EventSource(`${API_BASE}/sync/events?token=${token}`)
    es.addEventListener('data-updated', () => fetchFromApi())
    return () => es.close()
  }, [fetchFromApi])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const currentTitle = pageTitles[location.pathname] || 'Dashboard'
  const currentSubtitle = pageSubtitles[location.pathname] || ''

  return (
    <Tooltip.Provider>
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        isMobile={isMobile}
      />

      {/* Main Wrapper */}
      <div
        className="flex flex-col flex-1 min-h-screen transition-[margin-left] duration-300 ease-out"
        style={{ marginLeft: sidebarOffset }}
      >
        {/* Header */}
        <Header
          sidebarOffset={sidebarOffset}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content */}
        <main className="mt-header-height flex-1 bg-background">
          <div className="p-container-padding">
            {/* Page Header (dashboard pages only) */}
            {DASHBOARD_PATHS.has(location.pathname) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-headline font-bold text-on-surface">{currentTitle}</h2>
                    {currentSubtitle && (
                      <p className="text-on-surface-variant text-sm mt-0.5">{currentSubtitle}</p>
                    )}
                  </div>
                  <TimeFilter />
                </div>
                <button onClick={() => setFilterOpen(!filterOpen)} className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors">
                  {filterOpen ? 'Hide Filters' : 'Filters'}
                </button>
              </div>
            )}
            <FilterBar open={filterOpen} options={filterOptions} onClose={() => setFilterOpen(false)} />
            {DASHBOARD_PATHS.has(location.pathname) && <DrillDownBar />}

            {/* Page Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
      <LoadingOverlay />
      <LogViewer />
    </div>
    </Tooltip.Provider>
  )
}
