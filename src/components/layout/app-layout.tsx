import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { FilterBar, type FilterOption } from '@/components/filters/filter-bar'
import { TimeFilter } from '@/components/filters/time-filter'
import { LogViewer } from '@/components/dev/log-viewer'
import { LoadingOverlay } from '@/components/ui/loading-overlay'
import { useDataLoader } from '@/hooks/use-data'
import { useStore } from '@/lib/store'
import { useMediaQuery } from '@/hooks/use-media-query'
import { Toaster } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'
import { getTimeLabel } from '@/lib/constants'

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
  '/target': 'Target vs Realisasi',
  '/reporting': 'Reporting',
  '/monitoring': 'Monitoring',
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
  '/target': 'Target achievement vs realisasi.',
  '/reporting': 'Comprehensive reporting dashboard.',
  '/monitoring': 'Live monitoring with progress indicators.',
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { loading, loadFromExcel, loadFromGoogleSheets } = useDataLoader()
  const { data } = useStore()
  const location = useLocation()
  const timeMode = useStore((s) => s.timeMode)
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1024px)')

  // Auto-collapse sidebar on tablet
  useEffect(() => {
    if (isTablet) setSidebarCollapsed(true)
  }, [isTablet])

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

  const filterOptions: FilterOption[] = [
    {
      key: 'bulan',
      label: 'Bulan',
      options: data ? [...new Set(data.xlc.map((d) => d.Bulan).filter(Boolean))] : [],
    },
    {
      key: 'rsm',
      label: 'RSM',
      options: data ? [...new Set([...data.xlc, ...data.merchant, ...data.wo, ...data.expo].map((d: any) => d.RSM).filter(Boolean))] : [],
    },
    {
      key: 'sm',
      label: 'SM / Leader',
      options: data ? [...new Set([...data.xlc, ...data.merchant].map((d: any) => d.SM).filter(Boolean))] : [],
    },
    {
      key: 'store',
      label: 'Store / Galeri',
      options: data ? [...new Set([...data.xlc, ...data.merchant, ...data.wo, ...data.expo].map((d: any) => d.StoreName || d.XLCName || d.ExpoName || d.Office).filter(Boolean))] : [],
    },
    {
      key: 'channel',
      label: 'Channel',
      options: ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XL Satu'],
    },
  ]

  const currentTitle = pageTitles[location.pathname] || 'Dashboard'
  const currentSubtitle = pageSubtitles[location.pathname] || ''

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onUploadClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.xlsx,.xls'
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) loadFromExcel(file)
          }
          input.click()
        }}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Wrapper */}
      <div className="ml-sidebar-width flex flex-col flex-1 min-h-screen">
        {/* Header */}
        <Header
          title={currentTitle}
          loading={loading}
          onOpenFilter={() => setFilterOpen(!filterOpen)}
          onUploadExcel={loadFromExcel}
          onGoogleSheetConnect={() => {
            const url = prompt('Enter Google Sheet ID or URL:')
            if (url) loadFromGoogleSheets(url)
          }}
          onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content */}
        <main className="mt-header-height flex-1 bg-background">
          <div className="p-container-padding">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-headline font-bold text-on-surface">{currentTitle}</h2>
                  {currentSubtitle && (
                    <p className="text-on-surface-variant text-sm mt-0.5">{currentSubtitle}</p>
                  )}
                </div>
                <TimeFilter />
              </div>
            </div>

            {/* Filter Bar */}
            <FilterBar
              open={filterOpen}
              options={filterOptions}
              onClose={() => setFilterOpen(false)}
            />

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

            {/* Footer */}
            <footer className="flex items-center justify-between py-8 mt-8 border-t border-outline-variant">
              <p className="text-xs text-on-surface-variant">Data last updated: Today at 08:45 AM (GMT+7)</p>
              <p className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-widest">
                Prio Dashboard v1.0
              </p>
            </footer>
          </div>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
      <LoadingOverlay />
      <LogViewer />
    </div>
  )
}
