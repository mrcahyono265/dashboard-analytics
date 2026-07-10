import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import { useExportActions } from '@/hooks/use-export-actions'

interface ExportButtonsProps {
  data: Record<string, any>[]
  filename?: string
  columns?: any[]
  pageRef?: React.RefObject<HTMLDivElement | null>
  tableRef?: React.RefObject<HTMLDivElement | null>
  variant?: 'dropdown' | 'row'
}

export function ExportButtons({ data, filename = 'export', columns, pageRef, variant = 'row' }: ExportButtonsProps) {
  const [open, setOpen] = useState(false)
  const { exportToExcel, exportToCSV, exportToPDF } = useExportActions(data, filename, columns, pageRef)

  if (variant === 'row') {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-widest mr-2 hidden sm:inline">Export Report</span>
        <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-bold text-on-surface">
          <FileSpreadsheet className="h-[18px] w-[18px]" /> Excel
        </button>
        <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-bold text-on-surface">
          <FileDown className="h-[18px] w-[18px]" /> CSV
        </button>
        <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-bold text-on-surface">
          <FileText className="h-[18px] w-[18px]" /> PDF
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
        <Download className="h-4 w-4" /> Export
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-2xl border border-outline-variant bg-surface shadow-xl overflow-hidden">
            <button onClick={() => { exportToExcel(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors">
              <FileSpreadsheet className="h-4 w-4 text-secondary" /> Excel
            </button>
            <button onClick={() => { exportToCSV(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors">
              <FileDown className="h-4 w-4 text-primary" /> CSV
            </button>
            <button onClick={() => { exportToPDF(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-on-surface hover:bg-surface-container-high transition-colors">
              <FileText className="h-4 w-4 text-error" /> PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
