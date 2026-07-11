import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Cloud, Link, Unlink, RefreshCw, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface SyncStatus {
  active: boolean
  fileId?: string
  recentSyncs: {
    id: string
    status: string
    recordsCount?: number
    error?: string
    createdAt: string
  }[]
}

interface ExcelFile {
  id: string
  name: string
  webUrl: string
  lastModifiedDateTime: string
}

export function Excel365Settings() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [files, setFiles] = useState<ExcelFile[]>([])
  const [isConnecting, setIsConnecting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    loadSyncStatus()
  }, [])

  const loadSyncStatus = async () => {
    try {
      const result = await api.request<{ active: boolean; fileId?: string; recentSyncs: any[] }>('/sync/status')
      setSyncStatus(result)
    } catch (error) {
      console.error('Failed to load sync status:', error)
    }
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const result = await api.request<{ authUrl: string }>('/sync/connect', {
        method: 'POST',
      })
      // Redirect to Microsoft auth
      window.location.href = result.authUrl
    } catch (error) {
      toast.error('Failed to connect to Microsoft 365')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.request('/sync/stop', { method: 'POST' })
      setAccessToken(null)
      setFiles([])
      await loadSyncStatus()
      toast.success('Disconnected from Microsoft 365')
    } catch (error) {
      toast.error('Failed to disconnect')
    }
  }

  const loadFiles = async () => {
    if (!accessToken) {
      toast.error('Please connect to Microsoft 365 first')
      return
    }

    setIsLoading(true)
    try {
      const result = await api.request<{ files: ExcelFile[] }>(`/sync/files?accessToken=${accessToken}`)
      setFiles(result.files)
    } catch (error) {
      toast.error('Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartSync = async (fileId: string) => {
    if (!accessToken) return

    try {
      await api.request('/sync/start', {
        method: 'POST',
        body: { fileId, accessToken },
      })
      await loadSyncStatus()
      toast.success('Sync started!')
    } catch (error) {
      toast.error('Failed to start sync')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Excel 365 Integration</h1>
        <p className="text-muted-foreground">
          Connect your Microsoft 365 account to auto-sync Excel files
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Microsoft 365 Connection
          </CardTitle>
          <CardDescription>
            Connect your account to access Excel files from OneDrive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus?.active ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Connected and syncing</span>
              </div>
              <Button variant="outline" onClick={handleDisconnect}>
                <Unlink className="h-4 w-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-5 w-5" />
                <span>Not connected</span>
              </div>
              <Button onClick={handleConnect} disabled={isConnecting}>
                <Link className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Microsoft 365'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Selection */}
      {syncStatus?.active && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Select Excel File
            </CardTitle>
            <CardDescription>
              Choose which Excel file to sync with the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={loadFiles} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Load Files
            </Button>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Modified: {new Date(file.lastModifiedDateTime).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartSync(file.id)}
                      disabled={syncStatus.active && syncStatus.fileId === file.id}
                    >
                      {syncStatus.active && syncStatus.fileId === file.id ? 'Syncing' : 'Sync'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync History */}
      {syncStatus?.recentSyncs && syncStatus.recentSyncs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Syncs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncStatus.recentSyncs.map((sync) => (
                <div
                  key={sync.id}
                  className="flex items-center justify-between p-2 border rounded"
                >
                  <div className="flex items-center gap-2">
                    {sync.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm">
                      {sync.status === 'success'
                        ? `${sync.recordsCount} records synced`
                        : sync.error || 'Sync failed'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(sync.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
