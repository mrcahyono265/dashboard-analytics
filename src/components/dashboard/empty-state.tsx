import { BarChart3 } from 'lucide-react'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl bg-surface-container-high flex items-center justify-center mb-6">
        <BarChart3 className="h-10 w-10 text-on-surface-variant" />
      </div>
      <h2 className="text-xl font-headline font-bold text-on-surface mb-2">No Data Available</h2>
      <p className="text-on-surface-variant text-sm max-w-md mb-6">
        Upload an Excel file or connect to Google Sheets to start viewing your dashboard analytics.
      </p>
      <div className="flex items-center gap-3 text-xs text-on-surface-variant">
        <span className="px-3 py-1.5 bg-primary-container/20 text-primary rounded-xl font-bold border border-primary/30">Excel</span>
        <span>or</span>
        <span className="px-3 py-1.5 bg-secondary-container/20 text-secondary rounded-xl font-bold border border-secondary/30">Google Sheets</span>
      </div>
    </div>
  )
}
