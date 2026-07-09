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

function buildTableHtml(columns: any[], data: Record<string, any>[]): string {
  const headers = columns.map((col) => {
    const h = typeof col.header === 'string' ? col.header : (col.accessorKey || '')
    return `<th style="padding:8px 12px;text-align:left;font-size:11px;font-weight:600;text-transform:uppercase;border-bottom:1px solid #434655;background:#171f33;color:#c3c6d7">${h}</th>`
  }).join('')
  const rows = data.map((item) => {
    const cells = columns.map((col) => {
      const v = formatCellValue(col, item)
      return `<td style="padding:6px 12px;font-size:12px;border-bottom:1px solid #222a3d;color:#dae2fd;font-family:'JetBrains Mono',monospace">${v}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('')
  return `<table style="width:100%;border-collapse:collapse">${headers ? `<thead><tr>${headers}</tr></thead>` : ''}<tbody>${rows}</tbody></table>`
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

  const captureSection = async (html2canvas: any, el: HTMLElement): Promise<string> => {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:1200px;background:#0b1326;padding:24px'
    wrapper.appendChild(el)
    document.body.appendChild(wrapper)
    const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, logging: false, backgroundColor: '#0b1326' })
    document.body.removeChild(wrapper)
    return canvas.toDataURL('image/png')
  }

  const addImageToPdf = (pdf: any, imgData: string, imgWidth: number, maxPageHeight: number) => {
    const img = new Image()
    img.src = imgData
    const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth
    if (imgHeight <= maxPageHeight) {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    } else {
      let remaining = imgHeight
      let offset = 0
      while (remaining > 0) {
        if (offset > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 10, 10 - offset, imgWidth, imgHeight)
        offset += maxPageHeight
        remaining -= maxPageHeight
      }
    }
  }

  const exportToPDF = async () => {
    const sourceEl = pageRef?.current || tableRef?.current
    if (!sourceEl) { toast.error('Page reference not available'); return }
    if (!data.length) { toast.error('No data to export'); return }
    toast.loading('Generating PDF...')
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      const pdf = new jsPDF('l', 'mm', 'a4')
      const pageWidth = 280
      const maxPageHeight = 190

      const clone = sourceEl.cloneNode(true) as HTMLElement
      clone.style.width = '1200px'

      const searchBar = clone.querySelector('.relative.max-w-xs')
      const pagination = clone.querySelector('.flex.items-center.justify-between')
      searchBar?.remove()
      pagination?.remove()

      const tableContainer = clone.querySelector('.overflow-auto.rounded-2xl')
      if (tableContainer && columns && data.length > 0) {
        tableContainer.innerHTML = buildTableHtml(columns, data)
      }

      if (!pageRef?.current || !columns) {
        const imgData = await captureSection(html2canvas, clone)
        addImageToPdf(pdf, imgData, pageWidth, maxPageHeight)
      } else {
        const contentArea = clone.querySelector('.space-y-6') || clone
        const children = Array.from(contentArea.children) as HTMLElement[]

        const groups: HTMLElement[][] = []
        let cur: HTMLElement[] = []

        for (const child of children) {
          const isGrid = child.classList.contains('grid')
          const isTable = child.classList.contains('overflow-auto')
          const isFlexTitle = child.classList.contains('flex') && child.classList.contains('items-center') && child.classList.contains('justify-between')

          if (isTable) {
            if (cur.length > 0) { groups.push(cur); cur = [] }
            groups.push([child])
          } else if (cur.length === 0 || (isFlexTitle && cur.length === 0) || (isGrid && cur.length === 0)) {
            cur.push(child)
          } else if (isGrid && cur.length === 1 && cur[0].classList.contains('grid')) {
            groups.push(cur); cur = [child]
          } else if (cur.length > 0) {
            cur.push(child)
          }
        }
        if (cur.length > 0) groups.push(cur)

        for (let i = 0; i < groups.length; i++) {
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'width:1200px;'
          groups[i].forEach((c) => wrapper.appendChild(c))
          const imgData = await captureSection(html2canvas, wrapper)
          if (i > 0) pdf.addPage()
          addImageToPdf(pdf, imgData, pageWidth, maxPageHeight)
        }
      }

      pdf.save(`${filename}.pdf`)
      toast.dismiss()
      toast.success(`PDF exported with ${data.length} rows`)
    } catch {
      toast.dismiss()
      toast.error('Failed to generate PDF')
    }
  }

  if (variant === 'row') {
    return (
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="text-[10px] font-label text-on-surface-variant uppercase font-bold tracking-widest mr-2 hidden sm:inline">Export Report</span>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-bold text-on-surface"
        >
          <FileSpreadsheet className="h-[18px] w-[18px]" />
          Excel
        </button>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-bold text-on-surface"
        >
          <FileDown className="h-[18px] w-[18px]" />
          CSV
        </button>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-2xl bg-surface-container hover:bg-surface-container-high transition-colors text-xs font-bold text-on-surface"
        >
          <FileText className="h-[18px] w-[18px]" />
          PDF
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
