import { formatNumber, formatCurrency } from '@/lib/utils'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

export function useExportActions(data: Record<string, any>[], filename: string, columns?: any[], pageRef?: React.RefObject<HTMLDivElement | null>) {
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
    const sourceEl = pageRef?.current
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

      clone.querySelector('.relative.max-w-xs')?.remove()
      clone.querySelector('.flex.items-center.justify-between')?.remove()

      const tableContainer = clone.querySelector('.overflow-auto.rounded-2xl')
      if (tableContainer && columns && data.length > 0) {
        tableContainer.innerHTML = buildTableHtml(columns, data)
      }

      const capture = async (el: HTMLElement): Promise<string> => {
        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:1200px;background:#0b1326;padding:24px'
        wrapper.appendChild(el)
        document.body.appendChild(wrapper)
        const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, logging: false, backgroundColor: '#0b1326' })
        document.body.removeChild(wrapper)
        return canvas.toDataURL('image/png')
      }

      const addPage = (imgData: string) => {
        const img = new Image()
        img.src = imgData
        const imgHeight = (img.naturalHeight * pageWidth) / img.naturalWidth
        if (imgHeight <= maxPageHeight) {
          pdf.addImage(imgData, 'PNG', 10, 10, pageWidth, imgHeight)
        } else {
          let remaining = imgHeight, offset = 0
          while (remaining > 0) {
            if (offset > 0) pdf.addPage()
            pdf.addImage(imgData, 'PNG', 10, 10 - offset, pageWidth, imgHeight)
            offset += maxPageHeight; remaining -= maxPageHeight
          }
        }
      }

      const contentArea = clone.querySelector('.space-y-6') || clone
      const children = Array.from(contentArea.children) as HTMLElement[]
      const groups: HTMLElement[][] = []
      let cur: HTMLElement[] = []

      for (const child of children) {
        const isTable = child.classList.contains('overflow-auto')
        const isGrid = child.classList.contains('grid')
        if (isTable) { if (cur.length > 0) { groups.push(cur); cur = [] }; groups.push([child]) }
        else if (cur.length === 0 || (isGrid && cur.length === 1 && cur[0].classList.contains('grid'))) { if (cur.length > 0) groups.push(cur); cur = [child] }
        else cur.push(child)
      }
      if (cur.length > 0) groups.push(cur)

      for (let i = 0; i < groups.length; i++) {
        const wrapper = document.createElement('div')
        wrapper.style.cssText = 'width:1200px;'
        groups[i].forEach((c) => wrapper.appendChild(c))
        const imgData = await capture(wrapper)
        if (i > 0) pdf.addPage()
        addPage(imgData)
      }

      pdf.save(`${filename}.pdf`)
      toast.dismiss()
      toast.success(`PDF exported with ${data.length} rows`)
    } catch {
      toast.dismiss()
      toast.error('Failed to generate PDF')
    }
  }

  return { exportToExcel, exportToCSV, exportToPDF }
}

function formatCellValue(col: any, item: Record<string, any>): string {
  const key = col.accessorKey
  if (!key) return ''
  const val = item[key]
  if (val == null) return ''
  if (typeof val === 'number') {
    if (['PricePlan', 'Amount', 'PreBalance', 'NextBalance'].includes(key)) return formatCurrency(val)
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
    const cells = columns.map((col) => `<td style="padding:6px 12px;font-size:12px;border-bottom:1px solid #222a3d;color:#dae2fd;font-family:'JetBrains Mono',monospace">${formatCellValue(col, item)}</td>`).join('')
    return `<tr>${cells}</tr>`
  }).join('')
  return `<table style="width:100%;border-collapse:collapse">${headers ? `<thead><tr>${headers}</tr></thead>` : ''}<tbody>${rows}</tbody></table>`
}
