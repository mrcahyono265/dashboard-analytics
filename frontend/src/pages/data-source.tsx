import { useState, useEffect, useCallback, useRef, type DragEvent } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Cloud, RefreshCw, FileSpreadsheet, CheckCircle, XCircle,
  Loader2, Download, AlertTriangle, Globe, FileUp, Upload,
} from 'lucide-react'
import { api, API_ORIGIN } from '@/lib/api'
import { useStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type SourceType = 'upload' | 'url' | 'excel365' | 'none'

interface SyncStatus {
  connected: boolean
  active: boolean
  fileId: string | null
  urlActive: boolean
  url: string | null
  account: { displayName: string; email: string } | null
  recentSyncs: { id: string; status: string; recordsCount?: number; error?: string; createdAt: string }[]
}

interface ExcelFile {
  id: string
  name: string
  webUrl: string
  lastModifiedDateTime: string
}

interface PreviewResult {
  totalRecords: number
  sheets: { sheetName: string; recordsCount: number }[]
}

interface UploadPreview {
  sheets: { sheetType: string; recordsCount: number }[]
}

const TABS: { id: SourceType; label: string; icon: typeof FileUp }[] = [
  { id: 'upload', label: 'Upload File', icon: FileUp },
  { id: 'url', label: 'URL', icon: Globe },
  { id: 'excel365', label: 'OneDrive', icon: Cloud },
]

const SOURCE_LABELS: Record<SourceType, string> = {
  upload: 'File Upload',
  url: 'URL Sync',
  excel365: 'OneDrive',
  none: 'None',
}

function SourceSwitchDialog({
  open, onClose, onConfirm, currentSource, newSource,
}: {
  open: boolean
  onClose: () => void
  onConfirm: (exportFirst: boolean) => Promise<void>
  currentSource: string
  newSource: string
}) {
  const [busy, setBusy] = useState(false)

  const handleAction = async (exportFirst: boolean) => {
    setBusy(true)
    try {
      if (exportFirst) {
        const blob = await api.downloadSyncExcel()
        const url = URL.createObjectURL(blob)
        const a = window.document.createElement('a')
        a.href = url
        a.download = 'dashboard-data-backup.xlsx'
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Data exported')
      }
      await onConfirm(false)
    } catch {
      toast.error('Export failed, switching anyway')
      await onConfirm(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Switch Data Source
          </DialogTitle>
          <DialogDescription>
            Active source: <strong>{SOURCE_LABELS[currentSource as SourceType] || currentSource}</strong> &rarr; switching to{' '}
            <strong>{SOURCE_LABELS[newSource as SourceType] || newSource}</strong>. All existing data including users, stores, packages, and targets will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="outline" onClick={() => handleAction(false)} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : 'Switch (No Export)'}
          </Button>
          <Button onClick={() => handleAction(true)} disabled={busy}>
            <Download className="h-4 w-4 mr-1" />
            Export & Switch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function DataSourcePage() {
  const [activeSource, setActiveSource] = useState<SourceType>('none')
  const [activeTab, setActiveTab] = useState<SourceType>('upload')
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [files, setFiles] = useState<ExcelFile[]>([])
  const [urlInput, setUrlInput] = useState('')
  const [selectedOneDriveFile, setSelectedOneDriveFile] = useState<string | null>(null)
  const [selectedOneDriveFileName, setSelectedOneDriveFileName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [switchDialog, setSwitchDialog] = useState<{ newSource: SourceType; action: () => Promise<void> } | null>(null)
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [urlPreview, setUrlPreview] = useState<PreviewResult | null>(null)
  const [urlPreviewError, setUrlPreviewError] = useState<string | null>(null)
  const [uploadPreview, setUploadPreview] = useState<UploadPreview | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storeSetActiveSource = useStore((s) => s.setActiveSource)

  const loadStatus = useCallback(async () => {
    try {
      const [src, status] = await Promise.all([api.getActiveSource(), api.getSyncStatus()])
      setActiveSource((src.activeSource as SourceType) || 'none')
      setSyncStatus(status)
      if (status?.url) setUrlInput(status.url)
    } catch {}
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  const confirmSwitch = async (_exportFirst: boolean) => {
    if (!switchDialog) return
    await switchDialog.action()
    setSwitchDialog(null)
  }

  const showSwitchDialog = (newSource: SourceType, action: () => Promise<void>) => {
    setSwitchDialog({ newSource, action })
  }

  // ── Upload ──
  const handleFile = async (file: File) => {
    setBusy('upload')
    setUploadPreview(null)
    try {
      const result = await api.uploadExcel(file)
      setUploadPreview({ sheets: result.sheets })
      toast.success(`Staged: ${result.sheets.reduce((s: number, sh: any) => s + sh.recordsCount, 0)} records`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally { setBusy(null) }
  }

  const handleUploadClick = () => fileInputRef.current?.click()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  const handleUploadSaveSwitch = async () => {
    setBusy('upload-activate')
    try {
      const result = await api.switchSource('upload')
      toast.success(`${result.sheets.reduce((s, sh) => s + sh.recordsCount, 0)} records activated`)
      storeSetActiveSource('upload')
      setActiveSource('upload')
      setUploadPreview(null)
      window.dispatchEvent(new Event('data-synced'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Activation failed')
    } finally { setBusy(null) }
  }

  // ── URL ──
  const handleUrlPreview = async () => {
    if (!urlInput.trim()) { toast.error('Enter a URL'); return }
    setBusy('url-preview')
    setUrlPreview(null)
    setUrlPreviewError(null)
    try {
      const result = await api.syncFromUrlPreview(urlInput.trim())
      setUrlPreview(result)
      toast.success(`Preview: ${result.totalRecords} records found`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Preview failed'
      setUrlPreviewError(msg)
      toast.error(msg)
    } finally { setBusy(null) }
  }

  const handleUrlSaveSwitch = async () => {
    if (!urlInput.trim()) { toast.error('Enter a URL'); return }
    setBusy('url-activate')
    try {
      const result = await api.switchSource('url', { url: urlInput.trim(), sourceFileName: urlInput.trim() })
      toast.success(`${result.sheets.reduce((s, sh) => s + sh.recordsCount, 0)} records activated`)
      storeSetActiveSource('url')
      setActiveSource('url')
      await loadStatus()
      window.dispatchEvent(new Event('data-synced'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Activation failed')
    } finally { setBusy(null) }
  }

  const handleAutoSyncToggle = async () => {
    if (syncStatus?.urlActive) {
      try { await api.stopUrlAutoSync(); toast.success('Auto-sync stopped') }
      catch { toast.error('Failed to stop') }
      await loadStatus()
    } else {
      const url = syncStatus?.url || urlInput.trim()
      if (!url) { toast.error('No URL configured'); return }
      try { await api.startUrlAutoSync(url); toast.success('Auto-sync started (every 60s)') }
      catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to start') }
      await loadStatus()
    }
  }

  // ── OneDrive ──
  const loadFiles = async () => {
    setIsLoadingFiles(true)
    try { const r = await api.getSyncFiles(); setFiles(r.files) }
    catch { toast.error('Failed to load files') }
    finally { setIsLoadingFiles(false) }
  }

  const handleOneDriveSaveSwitch = async () => {
    if (!selectedOneDriveFile) { toast.error('Select a file first'); return }
    setBusy('onedrive-activate')
    try {
      const result = await api.switchSource('excel365', {
        fileId: selectedOneDriveFile,
        sourceFileName: selectedOneDriveFileName,
      })
      toast.success(`${result.sheets.reduce((s, sh) => s + sh.recordsCount, 0)} records activated`)
      storeSetActiveSource('excel365')
      setActiveSource('excel365')
      await loadStatus()
      window.dispatchEvent(new Event('data-synced'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Activation failed')
    } finally { setBusy(null) }
  }

  // ── Save & Switch logic ──
  const handleSaveSwitch = () => {
    if (activeTab === 'upload') {
      if (activeSource === 'upload') {
        toast.info('File Upload is already the active source')
        return
      }
      if (!uploadPreview) { toast.error('Upload a file first'); return }
      showSwitchDialog('upload', handleUploadSaveSwitch)
    } else if (activeTab === 'url') {
      if (!urlInput.trim()) { toast.error('Enter a URL first'); return }
      if (!urlPreview && !urlPreviewError) {
        toast.error('Test the URL first with the Test URL button')
        return
      }
      if (activeSource === 'url') {
        toast.info('URL Sync is already active')
        return
      }
      showSwitchDialog('url', handleUrlSaveSwitch)
    } else if (activeTab === 'excel365') {
      if (!selectedOneDriveFile) { toast.error('Select a file from OneDrive first'); return }
      if (activeSource === 'excel365') {
        toast.info('OneDrive is already the active source')
        return
      }
      showSwitchDialog('excel365', handleOneDriveSaveSwitch)
    }
  }

  const connected = syncStatus?.connected ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Data Source</h1>
          <p className="text-on-surface-variant text-sm">Upload, sync, or connect your data source.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl">
          <span className={cn(
            'h-2 w-2 rounded-full',
            activeSource === 'upload' && 'bg-blue-400',
            activeSource === 'url' && 'bg-emerald-400',
            activeSource === 'excel365' && 'bg-violet-400',
            activeSource === 'none' && 'bg-on-surface-variant/40',
          )} />
          <span className="text-sm font-bold">
            {activeSource === 'none' ? 'None' : SOURCE_LABELS[activeSource]}
          </span>
        </div>
      </div>

      {/* Tabs with active indicators */}
      <div className="flex gap-1 border-b border-outline-variant pb-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeSource === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setUrlPreview(null); setUrlPreviewError(null) }}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-emerald-400' : 'text-on-surface-variant/50')} />
              <span>{tab.label}</span>
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider ml-1',
                isActive ? 'text-emerald-400' : 'text-on-surface-variant/40',
              )}>
                {isActive ? 'Active' : 'Not Active'}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="space-y-4">
        {/* ── Upload ── */}
        {activeTab === 'upload' && (
          <div>
            <div
              onDrop={handleDrop}
              onDragOver={(e: DragEvent) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onClick={handleUploadClick}
              className={cn(
                'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all',
                dragging
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container',
              )}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} className="hidden" />
              <Upload className="h-10 w-10 mx-auto mb-4 text-on-surface-variant" />
              <p className="font-bold text-lg mb-1">
                {dragging ? 'Drop file here' : 'Drag & drop or click to upload'}
              </p>
              <p className="text-sm text-on-surface-variant">.xlsx, .xls, or .csv files</p>
            </div>
            {busy === 'upload' && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-surface-container rounded-xl text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Uploading & parsing...
              </div>
            )}
            {uploadPreview && (
              <div className="mt-4 p-4 bg-surface-container border border-outline-variant rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3">
                  <CheckCircle className="h-5 w-5" />
                  File staged — review then click "Save & Switch" below
                </div>
                <div className="text-sm text-on-surface-variant space-y-1">
                  {uploadPreview.sheets.map((s) => (
                    <div key={s.sheetType} className="flex justify-between">
                      <span>{s.sheetType}</span>
                      <span className="font-medium">{s.recordsCount.toLocaleString()} rows</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── URL ── */}
        {activeTab === 'url' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Sync from URL</CardTitle>
              <CardDescription>Paste a direct download link (Google Drive, company server).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://drive.google.com/..." disabled={busy === 'url-preview' || busy === 'url-activate'}
                  className="flex-1 px-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button onClick={handleUrlPreview} disabled={busy === 'url-preview' || busy === 'url-activate'}>
                  {busy === 'url-preview' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                  Test URL
                </Button>
              </div>

              {/* Preview result */}
              {urlPreview && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                    <CheckCircle className="h-5 w-5" />
                    URL Valid: {urlPreview.totalRecords} records found
                  </div>
                  <div className="text-sm text-on-surface-variant space-y-1">
                    {urlPreview.sheets.map((s) => (
                      <div key={s.sheetName} className="flex justify-between">
                        <span>{s.sheetName}</span>
                        <span className="font-medium">{s.recordsCount.toLocaleString()} rows</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {urlPreviewError && (
                <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                  <XCircle className="h-5 w-5 shrink-0" />
                  {urlPreviewError}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setUrlInput(`${API_ORIGIN}/api/files/Achievement%20Prio%20(1).xlsx`)}>
                  <FileSpreadsheet className="h-3 w-3 mr-1" />Use Test File
                </Button>
              </div>

              {/* Auto-sync status */}
              {activeSource === 'url' && (
                <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={cn('h-2 w-2 rounded-full', syncStatus?.urlActive ? 'bg-emerald-400' : 'bg-on-surface-variant/40')} />
                    <span className="font-medium">Auto-sync:</span>
                    <span>{syncStatus?.urlActive ? 'Active (every 60s)' : 'Stopped'}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAutoSyncToggle} disabled={busy === 'url-activate'}>
                    {syncStatus?.urlActive ? 'Stop' : 'Start'}
                  </Button>
                </div>
              )}

              <details className="text-xs text-on-surface-variant border border-outline-variant rounded-lg overflow-hidden">
                <summary className="px-4 py-2 cursor-pointer hover:bg-surface-container font-medium">How to get a direct link?</summary>
                <div className="px-4 py-3 space-y-3 border-t border-outline-variant">
                  <p><strong>Google Drive:</strong> Share &rarr; "Anyone with link" &rarr; paste URL above (auto-converts).</p>
                  <p><strong>Direct URL:</strong> Any URL returning .xlsx directly (company server, Dropbox).</p>
                  <p><strong>OneDrive Personal:</strong> 1drv.ms links need browser auth &mdash; use Upload instead.</p>
                </div>
              </details>
            </CardContent>
          </Card>
        )}

        {/* ── OneDrive ── */}
        {activeTab === 'excel365' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5" />Microsoft 365 (OneDrive)</CardTitle>
              <CardDescription>Sync Excel files from your OneDrive for Business.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {connected ? (
                <>
                  {syncStatus?.account && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm">
                        {(syncStatus.account.displayName || '?')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{syncStatus.account.displayName}</p>
                        <p className="text-xs text-on-surface-variant truncate">{syncStatus.account.email}</p>
                      </div>
                    </div>
                  )}
                  <Button onClick={loadFiles} disabled={isLoadingFiles}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFiles ? 'animate-spin' : ''}`} />Load Files
                  </Button>
                  {files.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => { setSelectedOneDriveFile(file.id); setSelectedOneDriveFileName(file.name) }}
                          className={cn(
                            'flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all',
                            selectedOneDriveFile === file.id
                              ? 'border-primary bg-primary/5'
                              : 'border-outline-variant hover:bg-surface-container',
                          )}
                        >
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-on-surface-variant">Modified: {new Date(file.lastModifiedDateTime).toLocaleDateString()}</p>
                          </div>
                          {selectedOneDriveFile === file.id && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Auto-sync status for OneDrive */}
                  {activeSource === 'excel365' && (
                    <div className="flex items-center justify-between p-3 bg-surface-container rounded-xl">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={cn('h-2 w-2 rounded-full', syncStatus?.active ? 'bg-emerald-400' : 'bg-on-surface-variant/40')} />
                        <span className="font-medium">Auto-sync:</span>
                        <span>{syncStatus?.active ? 'Active (every 60s)' : 'Stopped'}</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={async () => {
                        if (syncStatus?.active) {
                          try { await api.stopUrlAutoSync(); toast.success('Auto-sync stopped') }
                          catch { toast.error('Failed to stop') }
                        } else {
                          try { await api.startUrlAutoSync(syncStatus?.fileId || selectedOneDriveFile!); toast.success('Auto-sync started') }
                          catch (err) { toast.error(err instanceof Error ? err.message : 'Failed to start') }
                        }
                        await loadStatus()
                      }}>
                        {syncStatus?.active ? 'Stop' : 'Start'}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <Cloud className="h-12 w-12 text-on-surface-variant/40" />
                  <div>
                    <p className="font-bold">Not connected to Microsoft 365</p>
                    <p className="text-sm text-on-surface-variant mt-1">Connect your account in Settings to sync OneDrive files.</p>
                  </div>
                  <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                    Go to Settings
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Save & Switch */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-on-surface-variant space-y-1">
              <p>
                {activeTab === 'upload' && (activeSource === 'upload' ? 'File Upload is the active source.' : !uploadPreview ? 'Upload a file above, then save to switch.' : 'File staged. Click Save & Switch to activate.')}
                {activeTab === 'url' && (activeSource === 'url' ? 'URL Sync is the active source.' : !urlPreview ? 'Test a URL first, then save to switch.' : `Save ${urlInput.slice(0, 40)}... as the active source.`)}
                {activeTab === 'excel365' && (activeSource === 'excel365' ? 'OneDrive is the active source.' : !selectedOneDriveFile ? 'Select a file above, then save to switch.' : 'Save selected file as the active source.')}
              </p>
            </div>
            <Button
              onClick={handleSaveSwitch}
              disabled={!!busy}
              className={cn(
                activeSource === activeTab && 'opacity-50 cursor-not-allowed',
              )}
            >
              {busy === 'upload-activate' || busy === 'url-activate' || busy === 'onedrive-activate' ? (
                <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Activating...</>
              ) : (
                <><Upload className="h-4 w-4 mr-1" />Save & Switch</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Source switch confirmation */}
      <SourceSwitchDialog
        open={!!switchDialog}
        onClose={() => setSwitchDialog(null)}
        onConfirm={confirmSwitch}
        currentSource={activeSource}
        newSource={switchDialog?.newSource || 'upload'}
      />
    </div>
  )
}
