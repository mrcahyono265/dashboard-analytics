import { Search, Filter, Sun, Moon, Bell, Upload, Link, Loader2 } from 'lucide-react'
import { useStore } from '@/lib/store'
import { useTheme } from '@/providers/theme-provider'
import { useAuth } from '@/hooks/use-auth'
import { useRef } from 'react'

interface HeaderProps {
  title: string
  loading: boolean
  onOpenFilter: () => void
  onUploadExcel: (file: File) => void
  onGoogleSheetConnect: () => void
  onExport?: () => void
}

export function Header({
  title, loading, onOpenFilter, onUploadExcel, onGoogleSheetConnect, onExport,
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { dataSource } = useStore()
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUploadExcel(file)
    e.target.value = ''
  }

  return (
    <header className="fixed top-0 right-0 h-header-height z-30 flex items-center justify-between px-container-padding ml-sidebar-width w-[calc(100%-theme(spacing.sidebar-width))] bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant shadow-sm">
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            className="w-full bg-surface-container-low border-none rounded-2xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary text-on-surface placeholder:text-on-surface-variant/50 transition-all"
            placeholder="Search analytics..."
            type="text"
          />
        </div>
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenFilter}
            className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-all">
            <Filter className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Filter</span>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 text-on-surface-variant hover:text-primary transition-all">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button className="p-2 text-on-surface-variant hover:text-primary transition-all relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
          </button>
        </div>

        <div className="flex items-center gap-3 pl-6 border-l border-outline-variant">
          {user && (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-on-surface">{user.displayName}</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-medium">Channel Manager</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 border-2 border-primary-container flex items-center justify-center text-primary font-bold text-sm shadow-lg">
                {user.displayName?.charAt(0) || 'A'}
              </div>
            </>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </header>
  )
}
