import { Upload, Link, Filter, Download, Sun, Moon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useStore } from '@/lib/store'
import { useTheme } from '@/providers/theme-provider'
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onUploadExcel(file)
    e.target.value = ''
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        {dataSource === 'google' && (
          <Badge variant="info" dot>Live</Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">Excel</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onGoogleSheetConnect}>
          <Link className="h-4 w-4" />
          <span className="hidden sm:inline">Sheets</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onOpenFilter}>
          <Filter className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
        </Button>
        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        )}
        <div className="ml-2 pl-2 border-l border-border">
          <Button variant="ghost" size="icon-sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </header>
  )
}
