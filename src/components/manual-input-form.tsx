import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2, Save, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface ManualInputFormProps {
  sheetType: string
  period: string
  onSuccess?: () => void
  onCancel?: () => void
}

// Field definitions per sheet type
const SHEET_FIELDS: Record<string, { key: string; label: string; type: string; required: boolean; options?: string[] }[]> = {
  XLC: [
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'PackagePlan', label: 'Package Plan', type: 'text', required: true },
    { key: 'PricePlan', label: 'Price Plan', type: 'text', required: false },
    { key: 'StoreName', label: 'Store Name', type: 'text', required: true },
    { key: 'RSM', label: 'RSM', type: 'text', required: true },
    { key: 'SM', label: 'SM', type: 'text', required: true },
    { key: 'NewMigrate', label: 'New/Migrate', type: 'select', options: ['New', 'Migrate'], required: true }
  ],
  GSF: [
    { key: 'Amount', label: 'Amount', type: 'number', required: true },
    { key: 'Office', label: 'Office', type: 'text', required: true },
    { key: 'Operator', label: 'Operator', type: 'text', required: true },
    { key: 'EventName', label: 'Event Name', type: 'text', required: true },
    { key: 'TransactionNumber', label: 'Transaction Number', type: 'text', required: false }
  ],
  Merchant: [
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'StoreName', label: 'Store Name', type: 'text', required: true },
    { key: 'RSM', label: 'RSM', type: 'text', required: true },
    { key: 'SM', label: 'SM', type: 'text', required: true }
  ],
  WO: [
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'XLCName', label: 'XLC Name', type: 'text', required: true },
    { key: 'AgentWO', label: 'Agent WO', type: 'text', required: true },
    { key: 'RSM', label: 'RSM', type: 'text', required: true },
    { key: 'Leader', label: 'Leader', type: 'text', required: false }
  ],
  EXPO: [
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'ExpoName', label: 'Expo Name', type: 'text', required: true },
    { key: 'NamaPromotor', label: 'Nama Promotor', type: 'text', required: true },
    { key: 'RSM', label: 'RSM', type: 'text', required: true }
  ],
  XLSatu: [
    { key: 'NoSO', label: 'No SO', type: 'text', required: true },
    { key: 'StoreName', label: 'Store Name', type: 'text', required: true },
    { key: 'NamaCRR', label: 'Nama CRR', type: 'text', required: true }
  ]
}

export function ManualInputForm({ sheetType, period, onSuccess, onCancel }: ManualInputFormProps) {
  const [rows, setRows] = useState<Record<string, any>[]>([{}])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fields = SHEET_FIELDS[sheetType] || []

  const addRow = () => {
    setRows([...rows, {}])
  }

  const removeRow = (index: number) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index))
    }
  }

  const updateRow = (index: number, key: string, value: any) => {
    const newRows = [...rows]
    newRows[index] = { ...newRows[index], [key]: value }
    setRows(newRows)
  }

  const handleSubmit = async () => {
    // Validate required fields
    for (let i = 0; i < rows.length; i++) {
      for (const field of fields) {
        if (field.required && !rows[i][field.key]) {
          toast.error(`Row ${i + 1}: ${field.label} is required`)
          return
        }
      }
    }

    setIsSubmitting(true)
    try {
      await api.request('/data/manual', {
        method: 'POST',
        body: {
          sheetType,
          period,
          data: rows
        }
      })
      toast.success(`${rows.length} row(s) saved successfully`)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Input {sheetType} Data</span>
          <span className="text-sm font-normal text-muted-foreground">Period: {period}</span>
        </CardTitle>
        <CardDescription>
          Fill in the form below. Add multiple rows if needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rows */}
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Row {rowIndex + 1}</span>
              {rows.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRow(rowIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  {field.type === 'select' ? (
                    <select
                      value={row[field.key] || ''}
                      onChange={(e) => updateRow(rowIndex, field.key, e.target.value)}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="">Select...</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={row[field.key] || ''}
                      onChange={(e) => updateRow(rowIndex, field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                      placeholder={field.label}
                      className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="outline" onClick={addRow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Row
          </Button>
          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
