import { jsPDF } from 'jspdf'
import type { ExportSettings } from '@/lib/export-settings'

type PDFPageSize = [number, number] // width, height in mm

const PAGE_SIZES: Record<string, PDFPageSize> = {
  A4: [210, 297],
  F4: [215, 330],
  Legal: [216, 356],
  Letter: [216, 279],
}

interface RenderOptions {
  kopDataUrl?: string | null
  logoDataUrl?: string | null
}

export async function renderExportPreview(settings: ExportSettings, opts?: RenderOptions): Promise<string> {
  const [pw, ph] = PAGE_SIZES[settings.paperSize] || PAGE_SIZES.A4
  const pdf = new jsPDF({ orientation: pw > ph ? 'l' : 'p', unit: 'mm', format: [pw, ph] })
  const { marginTop, marginBottom, marginLeft, marginRight } = settings
  const pageW = pw - marginLeft - marginRight
  const contentY = marginTop

  // KOP full background
  const kopSrc = settings.mode === 'kop' ? (opts?.kopDataUrl || settings.kopDataUrl) : null
  if (kopSrc) {
    try {
      const imgProps = await loadImageProps(kopSrc)
      const imgW = pw
      const imgH = (imgProps.height / imgProps.width) * imgW
      pdf.addImage(kopSrc, 'JPEG', 0, 0, imgW, imgH)
    } catch { /* skip */ }
  }

  // ── Header (manual mode) ──
  if (settings.mode === 'manual') {
    let headerY = contentY + 4

    // Logo
    const logo = settings.showLogo ? (opts?.logoDataUrl || settings.logoDataUrl) : null
    if (logo) {
      try {
        const imgProps = await loadImageProps(logo)
        const logoH = 12
        const logoW = (imgProps.width / imgProps.height) * logoH
        pdf.addImage(logo, 'JPEG', marginLeft + pageW / 2 - logoW / 2, headerY, logoW, logoH)
        headerY += logoH + 2
      } catch { /* skip */ }
    }

    // Company name
    if (settings.showStoreName && settings.companyName) {
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(14)
      const textW = pdf.getTextWidth(settings.companyName)
      pdf.text(settings.companyName, marginLeft + pageW / 2 - textW / 2, headerY)
      headerY += 5
    }

    // Address
    if (settings.showAddress && settings.address) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      const lines = pdf.splitTextToSize(settings.address, pageW)
      lines.forEach((line: string) => {
        const tw = pdf.getTextWidth(line)
        pdf.text(line, marginLeft + pageW / 2 - tw / 2, headerY)
        headerY += 3.5
      })
    }

    // Phone + Email + Website
    if (settings.showPhone) {
      const parts = [settings.phone, settings.email, settings.website].filter(Boolean)
      if (parts.length > 0) {
        pdf.setFontSize(8)
        pdf.setTextColor(100)
        const line = parts.join('  |  ')
        const tw = pdf.getTextWidth(line)
        pdf.text(line, marginLeft + pageW / 2 - tw / 2, headerY)
        headerY += 4
        pdf.setTextColor(0)
      }
    }

    // Header text
    if (settings.headerText) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(80)
      const tw = pdf.getTextWidth(settings.headerText)
      pdf.text(settings.headerText, marginLeft + pageW / 2 - tw / 2, headerY)
      headerY += 4
      pdf.setTextColor(0)
    }

    // Divider line
    headerY += 2
    pdf.setDrawColor(180)
    pdf.setLineWidth(0.3)
    pdf.line(marginLeft, headerY, marginLeft + pageW, headerY)
  }

  // ── Dummy content (chart placeholders) ──
  const chartStart = settings.mode === 'manual' ? contentY + 38 : contentY + 10
  let cy = chartStart

  // KPI boxes
  const kpiCount = 3
  const kpiW = (pageW - (kpiCount - 1) * 4) / kpiCount
  for (let i = 0; i < kpiCount; i++) {
    const x = marginLeft + i * (kpiW + 4)
    pdf.setFillColor(240, 242, 247)
    pdf.roundedRect(x, cy, kpiW, 18, 2, 2, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(10)
    pdf.setTextColor(180)
    const label = ['Total Sales', 'Revenue', 'Target'][i]
    const tw = pdf.getTextWidth(label)
    pdf.text(label, x + kpiW / 2 - tw / 2, cy + 7)
    pdf.setFontSize(14)
    pdf.setTextColor(200)
    const val = ['Rp 2.5M', '85%', '12.4K'][i]
    const vw = pdf.getTextWidth(val)
    pdf.text(val, x + kpiW / 2 - vw / 2, cy + 15)
  }
  cy += 22

  // Bar chart placeholder
  pdf.setFillColor(240, 242, 247)
  pdf.roundedRect(marginLeft, cy, pageW, 28, 2, 2, 'F')
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(9)
  pdf.setTextColor(180)
  pdf.text('Chart — Sales by Channel', marginLeft + 4, cy + 6)
  const barW = 12
  const barGap = 6
  const barColors = [59, 16, 139, 245, 16]
  for (let i = 0; i < 5; i++) {
    const bx = marginLeft + 12 + i * (barW + barGap)
    const bh = 4 + Math.random() * 10
    pdf.setFillColor(59 + i * 10, 130 + i * 5, 245 - i * 20)
    pdf.rect(bx, cy + 20 - bh, barW, bh, 'F')
  }
  cy += 32

  // Pie chart placeholder
  pdf.setFillColor(240, 242, 247)
  pdf.roundedRect(marginLeft, cy, pageW, 24, 2, 2, 'F')
  pdf.setFontSize(9)
  pdf.setTextColor(180)
  pdf.text('Chart — Distribution by Category', marginLeft + 4, cy + 6)
  const cx = marginLeft + pageW / 2
  const cy2 = cy + 16
  const r = 6
  const slices = [0.35, 0.25, 0.2, 0.12, 0.08]
  const colors = [[59, 130, 246], [16, 185, 129], [139, 92, 246], [245, 158, 11], [239, 68, 68]]
  let angle = 0
  for (let i = 0; i < slices.length; i++) {
    const end = angle + slices[i] * Math.PI * 2
    pdf.setFillColor(colors[i][0], colors[i][1], colors[i][2])
      pdf.path([
      ['M', cx, cy2],
      ['L', cx + r * Math.cos(angle), cy2 + r * Math.sin(angle)],
      ['A', r, r, 0, slices[i] > 0.5 ? 1 : 0, 1, cx + r * Math.cos(end), cy2 + r * Math.sin(end)],
      ['Z'],
    ], 'F')
    angle = end
  }
  cy += 28

  // Table placeholder
  pdf.setFillColor(240, 242, 247)
  pdf.roundedRect(marginLeft, cy, pageW, 20, 2, 2, 'F')
  pdf.setFontSize(9)
  pdf.setTextColor(180)
  pdf.text('Table — Monthly Performance', marginLeft + 4, cy + 6)
  const colW = pageW / 4
  for (let i = 0; i < 4; i++) {
    pdf.setDrawColor(210)
    pdf.setLineWidth(0.2)
    pdf.line(marginLeft + i * colW, cy + 9, marginLeft + (i + 1) * colW, cy + 9)
    pdf.line(marginLeft + i * colW, cy + 14, marginLeft + (i + 1) * colW, cy + 14)
  }

  // ── Footer ──
  if (settings.showFooter) {
    const footerY = ph - marginBottom - 4
    pdf.setDrawColor(180)
    pdf.setLineWidth(0.3)
    pdf.line(marginLeft, footerY, marginLeft + pageW, footerY)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(7)
    pdf.setTextColor(130)

    let leftParts: string[] = []
    if (settings.showTimestamp) leftParts.push(new Date().toLocaleDateString('id-ID'))
    if (settings.npwp && settings.showNpwp) leftParts.push(`NPWP: ${settings.npwp}`)
    const leftText = leftParts.join('  |  ')
    if (leftText) pdf.text(leftText, marginLeft, footerY + 3.5)

    if (settings.footerText) {
      const fw = pdf.getTextWidth(settings.footerText)
      pdf.text(settings.footerText, marginLeft + pageW / 2 - fw / 2, footerY + 3.5)
    }

    pdf.text('1 / 1', marginLeft + pageW - pdf.getTextWidth('1 / 1'), footerY + 3.5)
  }

  return pdf.output('bloburl') as unknown as string
}

function loadImageProps(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = src
  })
}
