import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileSpreadsheet, FileText, FileDown } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { formatNumber, formatCurrency } from '@/lib/utils'

interface ExportButtonsProps {
  data: Record<string, any>[]
  filename?: string
  columns?: any[]
  pageRef?: React.RefObject<HTMLDivElement | null>
  tableRef?: React.RefObject<HTMLDivElement | null>
  variant?: 'dropdown' | 'row'
}

function formatCellValue(col: any, item: Record<string, any>): string {
  const key = col.accessorKey
  if (!key) return ''
  const val = item[key]
  if (val == null) return ''
  if (typeof val === 'number') {
    if (key === 'PricePlan' || key === 'Amount' || key === 'PreBalance' || key === 'NextBalance') {
      return formatCurrency(val)
    }
    return formatNumber(val)
  }
  return String(val)
}

export function ExportButtons({ data, filename = 'export', columns, pageRef, tableRef, variant = 'row' }: ExportButtonsProps) {
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
    const sourceEl = pageRef?.current || tableRef?.current
    if (!sourceEl) { toast.error('Page reference not available'); return }
    if (!data.length) { toast.error('No data to export'); return }
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const clone = sourceEl.cloneNode(true) as HTMLElement
      clone.style.width = '1200px'
      clone.style.padding = '24px'

      if (columns && data.length > 0) {
        const searchBar = clone.querySelector('.relative.max-w-xs')
        const pagination = clone.querySelector('.flex.items-center.justify-between')
        searchBar?.remove()
        pagination?.remove()

        const tableContainer = clone.querySelector('.overflow-auto.rounded-lg')
        if (tableContainer) {
          const headers = columns.map((col) => {
            const h = typeof col.header === 'string' ? col.header : (col.accessorKey || '')
            return `<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #e2e8f0;background:#f1f5f9">${h}</th>`
          }).join('')

          const rows = data.map((item) => {
            const cells = columns.map((col) => {
              const v = formatCellValue(col, item)
              return `<td style="padding:6px 12px;font-size:12px;border-bottom:1px solid #f1f5f9">${v}</td>`
            }).join('')
            return `<tr>${cells}</tr>`
          }).join('')

          tableContainer.innerHTML = `<table style="width:100%;border-collapse:collapse">${headers ? `<thead><tr>${headers}</tr></thead>` : ''}<tbody>${rows}</tbody></table>`
        }
      }

      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;'
      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      const canvas = await html2canvas(wrapper, {
        scale: 2, useCORS: true, logging: false,
        backgroundColor: '#f8fafc',
      })
      document.body.removeChild(wrapper)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pageWidth = 280
      const pageHeight = 190
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      } else {
        let remaining = imgHeight
        let offset = 0
        while (remaining > 0) {
          if (offset > 0) pdf.addPage()
          pdf.addImage(imgData, 'PNG', 10, 10 - offset, imgWidth, imgHeight)
          offset += pageHeight
          remaining -= pageHeight
        }
      }

      pdf.save(`${filename}.pdf`)
      toast.success(`PDF exported with ${data.length} rows`)
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
