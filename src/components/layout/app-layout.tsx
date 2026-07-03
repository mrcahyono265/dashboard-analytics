import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { FilterBar, type FilterOption } from '@/components/filters/filter-bar'
import { useDataLoader } from '@/hooks/use-data'
import { useStore } from '@/lib/store'
import { Toaster } from 'sonner'
import { AnimatePresence, motion } from 'framer-motion'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/xlc': 'XLC Activation',
  '/gsf': 'GSF Transactions',
  '/merchant': 'Merchant Activations',
  '/wo': 'WO Agent Activations',
  '/expo': 'EXPO Activations',
  '/xlsatu': 'XL Satu Home Broadband',
  '/elite': 'ELITE Performance',
  '/promotor': 'Promotor Performance',
  '/target': 'Target vs Realisasi',
}

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const { loading, loadFromExcel, loadFromGoogleSheets } = useDataLoader()
  const { data } = useStore()
  const location = useLocation()

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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={currentTitle}
          loading={loading}
          onOpenFilter={() => setFilterOpen(!filterOpen)}
          onUploadExcel={loadFromExcel}
          onGoogleSheetConnect={() => {
            const url = prompt('Enter Google Sheet ID or URL:')
            if (url) loadFromGoogleSheets(url)
          }}
        />
        <FilterBar
          open={filterOpen}
          options={filterOptions}
          onClose={() => setFilterOpen(false)}
        />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="p-6"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  )
}
