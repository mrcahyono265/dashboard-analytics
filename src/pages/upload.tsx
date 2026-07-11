import { ExcelUpload } from '@/components/excel-upload'
import { useAuth } from '@/hooks/use-auth'
import { Navigate } from 'react-router-dom'

export function UploadPage() {
  const { user } = useAuth()

  // Only managers and admins can upload
  if (user && user.role.toLowerCase() === 'sales') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Data</h1>
        <p className="text-muted-foreground">
          Upload Excel files to update dashboard data
        </p>
      </div>

      <div className="max-w-2xl">
        <ExcelUpload />
      </div>
    </div>
  )
}
