import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText, FileDown, Printer } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ExportButtonsProps {
  data: Record<string, any>[]
  filename?: string
  tableRef?: React.RefObject<HTMLDivElement | null>
  variant?: 'dropdown' | 'row'
}

export function ExportButtons({ data, filename = 'export', tableRef, variant = 'row' }: ExportButtonsProps) {
  const [open, setOpen] = useState(false)

  const exportToExcel = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${filename}.xlsx`)
    toast.success(`Exported ${data.length} rows to Excel`)
  }

  const exportToCSV = () => {
    if (!data.length) { toast.error('No data to export'); return }
    const ws = XLSX.utils.json_to_sheet(data)
    const csv = XLSX.utils.sheet_to_csv(ws)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${filename}.csv`
    a.click(); URL.revokeObjectURL(url)
    toast.success(`Exported ${data.length} rows to CSV`)
  }

  const exportToPDF = async () => {
    if (!tableRef?.current) { toast.error('Table reference not available'); return }
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const canvas = await html2canvas(tableRef.current, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save(`${filename}.pdf`)
      toast.success('PDF exported')
    } catch {
      toast.error('Failed to generate PDF')
    }
  }

  if (variant === 'row') {
    return (
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="xs" onClick={exportToExcel}>
          <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
        </Button>
        <Button variant="outline" size="xs" onClick={exportToCSV}>
          <FileDown className="h-3.5 w-3.5" /> CSV
        </Button>
        <Button variant="outline" size="xs" onClick={exportToPDF}>
          <FileText className="h-3.5 w-3.5" /> PDF
        </Button>
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
          <div className="absolute right-0 top-full mt-1 z-50 w-40 rounded-lg border border-border bg-surface shadow-lg overflow-hidden">
            <button onClick={() => { exportToExcel(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-text hover:bg-muted transition-colors">
              <FileSpreadsheet className="h-4 w-4 text-success" /> Excel
            </button>
            <button onClick={() => { exportToCSV(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-text hover:bg-muted transition-colors">
              <FileDown className="h-4 w-4 text-primary" /> CSV
            </button>
            <button onClick={() => { exportToPDF(); setOpen(false) }} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-text hover:bg-muted transition-colors">
              <FileText className="h-4 w-4 text-danger" /> PDF
            </button>
          </div>
        </>
      )}
    </div>
  )
}
