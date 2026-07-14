import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-on-surface-variant" />
          </div>
        </div>
        <div>
          <h1 className="text-5xl font-headline font-bold text-on-surface">404</h1>
          <p className="text-xl text-on-surface mt-2 font-headline">Page not found</p>
          <p className="text-sm text-on-surface-variant mt-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <Button onClick={() => navigate('/')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
