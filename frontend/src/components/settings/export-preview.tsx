import { useState, useEffect, useRef } from 'react'
import type { ExportSettings } from '@/lib/export-settings'
import { renderExportPreview } from '@/utils/export-pdf'
import { Loader2 } from 'lucide-react'

interface Props {
  settings: ExportSettings
}

const PAPER_ASPECT: Record<string, number> = {
  A4: 297 / 210,
  F4: 330 / 215,
  Legal: 356 / 216,
  Letter: 279 / 216,
}

const PAPER_WIDTH: Record<string, number> = {
  A4: 340,
  F4: 340,
  Legal: 340,
  Letter: 340,
}

export function ExportPreview({ settings }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const paperPxW = PAPER_WIDTH[settings.paperSize] || 340
  const paperPxH = Math.round(paperPxW * (PAPER_ASPECT[settings.paperSize] || 1.414))

  useEffect(() => {
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const url = await renderExportPreview(settings)
        setPdfUrl(url)
      } catch {
        setPdfUrl(null)
      }
      setLoading(false)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [settings])

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden bg-surface">
      <div className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-high px-4 py-1.5 border-b border-outline-variant">
        Preview ({settings.paperSize})
      </div>
      <div className="p-4 bg-surface-container" style={{ aspectRatio: `${paperPxW}/${paperPxH}` }}>
        {loading && (
          <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant w-full h-full">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat preview...
          </div>
        )}
        {!loading && pdfUrl && (
          <embed
            src={pdfUrl}
            type="application/pdf"
            className="w-full h-full shadow-md border border-outline-variant rounded-sm bg-white"
          />
        )}
        {!loading && !pdfUrl && (
          <div className="flex items-center justify-center text-xs text-on-surface-variant w-full h-full">
            Preview tidak tersedia
          </div>
        )}
      </div>
    </div>
  )
}
