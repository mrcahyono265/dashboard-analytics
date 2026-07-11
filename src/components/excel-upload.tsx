import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface UploadResult {
  success: boolean
  message: string
  sheets?: { sheetType: string; recordsCount: number }[]
}

export function ExcelUpload() {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      toast.error('Invalid file type. Please upload Excel (.xlsx, .xls) or CSV files.')
      return
    }

    setIsUploading(true)
    setResult(null)

    try {
      const response = await api.uploadExcel(file, period)
      setResult({
        success: true,
        message: response.message,
        sheets: response.sheets,
      })
      toast.success(`File uploaded! ${response.sheets.length} sheet(s) processed.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed'
      setResult({
        success: false,
        message,
      })
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Excel Data
        </CardTitle>
        <CardDescription>
          Upload your Achievement Excel file to update dashboard data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="text-sm font-medium">Period:</label>
          <input
            id="period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 border rounded-md bg-background text-foreground"
          />
        </div>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
            }
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleInputChange}
            className="hidden"
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Uploading and processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                Drop Excel file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports .xlsx, .xls, and .csv files
              </p>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className={`flex items-start gap-2 p-3 rounded-md ${
            result.success ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
          }`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium">{result.message}</p>
              {result.sheets && result.sheets.length > 0 && (
                <ul className="mt-1 text-xs list-disc list-inside">
                  {result.sheets.map((sheet) => (
                    <li key={sheet.sheetType}>
                      {sheet.sheetType}: {sheet.recordsCount} records
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
