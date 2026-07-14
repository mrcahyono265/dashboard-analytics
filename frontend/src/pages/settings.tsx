import { useState, useEffect, useCallback, useRef } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { api, API_ORIGIN } from '@/lib/api'
import { toast } from 'sonner'
import {
  User, Link, Shield, Download, Cloud,
  LinkIcon, Unlink, CheckCircle, XCircle, Loader2,
  Pencil, Check, X, Camera,
  Upload, FileSpreadsheet, ExternalLink,
  Save, ImageIcon, Trash2, SlidersHorizontal
} from 'lucide-react'
import type { ExportSettings } from '@/lib/export-settings'
import { DEFAULT_EXPORT_SETTINGS, getExportSettings, saveExportSettings } from '@/lib/export-settings'
import { ExportPreview } from '@/components/settings/export-preview'
import { UsersSection } from '@/components/settings/users-section'
import { MasterDataSection } from '@/components/settings/master-data-section'
import { compressImage } from '@/utils/compress-image'

const tabs = [
  { id: 'information', label: 'Information', icon: User },
  { id: 'connections', label: 'Connections', icon: Link },
  { id: 'users', label: 'Users', icon: Shield },
  { id: 'master', label: 'Master Data', icon: SlidersHorizontal },
  { id: 'export', label: 'Export', icon: Download },
] as const

type TabId = (typeof tabs)[number]['id']

interface SyncStatus {
  connected: boolean
  account: { displayName: string; email: string } | null
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const MAX = 512
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const { width: cw, height: ch } = pixelCrop
      const scale = Math.min(MAX / cw, MAX / ch, 1)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(cw * scale)
      canvas.height = Math.round(ch * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No canvas context')); return }
      ctx.drawImage(img, pixelCrop.x, pixelCrop.y, cw, ch, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => {
        if (!blob) { reject(new Error('Canvas to blob failed')); return }
        resolve(blob)
      }, 'image/jpeg', 0.85)
    }
    img.onerror = reject
    img.src = imageSrc
  })
}

function AvatarCropDialog({ open, onOpenChange, imageSrc, onSave }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  imageSrc: string
  onSave: (blob: Blob) => Promise<void>
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!croppedAreaPixels) return
    setSaving(true)
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels)
      await onSave(blob)
      onOpenChange(false)
    } catch {
      toast.error('Failed to crop image')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Avatar</DialogTitle>
          <DialogDescription>Adjust the crop area and zoom level.</DialogDescription>
        </DialogHeader>
        <div className="relative w-full h-72 bg-black/40 rounded-xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs text-on-surface-variant w-6 text-right">{zoom.toFixed(1)}x</span>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InputField({ label, value, onChange, multiline }: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-on-surface-variant mb-1">{label}</p>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2}
          className="w-full bg-surface-container-high rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-outline-variant focus:ring-primary resize-none" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full bg-surface-container-high rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-outline-variant focus:ring-primary" />
      )}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={cn('w-10 h-5.5 rounded-full transition-all shrink-0', checked ? 'bg-primary' : 'bg-surface-container-highest')}>
      <div className={cn('w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-all', checked ? 'translate-x-[20px]' : 'translate-x-0.5')} />
    </button>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg border border-outline-variant">
      <p className="text-sm font-medium text-on-surface">{label}</p>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  )
}

function FieldRow({ label, value, onEdit, disabled }: {
  label: string
  value: string
  onEdit: () => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant/50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-medium mt-0.5 truncate">{value}</p>
      </div>
      <button onClick={onEdit} className={cn('p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors shrink-0 ml-3', disabled && 'opacity-30 cursor-not-allowed')} disabled={disabled}>
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}

function EditableField({ label, value, field, onSave, disabled }: {
  label: string
  value: string
  field: string
  onSave: (field: string, value: string) => Promise<void>
  disabled?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(field, draft); setEditing(false); toast.success(`${label} updated`) }
    catch { setDraft(value) }
    finally { setSaving(false) }
  }

  const handleCancel = () => { setDraft(value); setEditing(false) }

  return (
    <div className="flex items-center justify-between py-3 border-b border-outline-variant/50 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{label}</p>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1 w-full bg-surface-container-high rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-outline-variant focus:ring-primary"
            disabled={saving}
          />
        ) : (
          <p className="text-sm font-medium mt-0.5 truncate">{value || '—'}</p>
        )}
      </div>
      <div className="flex items-center gap-1 ml-3 shrink-0">
        {editing ? (
          <>
            <button onClick={handleCancel} className="p-1.5 text-on-surface-variant hover:text-error rounded-lg transition-colors" disabled={saving}>
              <X className="h-4 w-4" />
            </button>
            <button onClick={handleSave} className="p-1.5 text-on-surface-variant hover:text-emerald-400 rounded-lg transition-colors" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className={cn('p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors', disabled && 'opacity-30 cursor-not-allowed')} disabled={disabled}>
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('information')
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [activeInfo, setActiveInfo] = useState<{ activeSource: string; sourceFileName: string | null } | null>(null)
  const [exportSettings, setExportSettings] = useState<ExportSettings>(DEFAULT_EXPORT_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Avatar state
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isApiMode = !!api.getToken()

  const loadSyncStatus = useCallback(async () => {
    try { setSyncStatus(await api.getSyncStatus()) } catch {}
  }, [])

  useEffect(() => { loadSyncStatus() }, [loadSyncStatus])

  useEffect(() => {
    api.getActiveSource().then(setActiveInfo).catch(() => {})
  }, [])

  useEffect(() => {
    getExportSettings()
      .then(setExportSettings)
      .catch(() => {})
      .finally(() => setSettingsLoaded(true))
  }, [])

  const updateExportField = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setExportSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const { authUrl } = await api.syncConnect()
      window.location.href = authUrl
    } catch {
      toast.error('Failed to connect to Microsoft 365')
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      await api.syncDisconnect()
      await loadSyncStatus()
      toast.success('Disconnected')
    } catch { toast.error('Failed to disconnect') }
  }

  const handleSaveExport = async () => {
    setSaving(true)
    try {
      const saved = await saveExportSettings(exportSettings)
      setExportSettings(saved)
      toast.success('Export settings saved')
    } catch { toast.error('Failed to save export settings') }
    finally { setSaving(false) }
  }

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoDataUrl' | 'kopDataUrl') => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImage(file, 800, 0.7)
      updateExportField(field, dataUrl)
      toast.success(field === 'logoDataUrl' ? 'Logo uploaded' : 'KOP uploaded')
    } catch { toast.error('Failed to upload image') }
    if (e.target) e.target.value = ''
  }

  const handleChangeAccount = async () => {
    try {
      await api.syncDisconnect()
      const { authUrl } = await api.syncConnect()
      window.location.href = authUrl
    } catch {
      toast.error('Failed to change account')
    }
  }

  const connected = syncStatus?.connected ?? false

  // ─── Avatar handlers ───────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setAvatarDialogOpen(false); setAvatarSrc(reader.result as string); setCropDialogOpen(true) }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleAvatarSave = async (blob: Blob) => {
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    const { avatarUrl } = await api.uploadAvatar(file)
    const stored = localStorage.getItem('prio_dashboard_session')
    if (stored) {
      const u = JSON.parse(stored)
      u.avatarUrl = avatarUrl
      localStorage.setItem('prio_dashboard_session', JSON.stringify(u))
    }
    window.dispatchEvent(new Event('user-updated'))
    setAvatarSrc(null)
    toast.success('Avatar updated')
  }

  const handleAvatarDelete = async () => {
    try {
      await api.deleteAvatar()
      const stored = localStorage.getItem('prio_dashboard_session')
      if (stored) {
        const u = JSON.parse(stored)
        u.avatarUrl = null
        localStorage.setItem('prio_dashboard_session', JSON.stringify(u))
      }
      window.dispatchEvent(new Event('user-updated'))
      setAvatarDialogOpen(false)
      toast.success('Avatar removed')
    } catch (e: any) { toast.error(e.message) }
  }

  // ─── Profile field handler ────────────────────────────────
  const handleFieldSave = async (field: string, value: string) => {
    const data: any = {}
    data[field] = value || null
    const res = await api.updateProfile(data)
    const stored = localStorage.getItem('prio_dashboard_session')
    if (stored) {
      const u = JSON.parse(stored)
      u[field] = res.user[field]
      localStorage.setItem('prio_dashboard_session', JSON.stringify(u))
    }
    if (res.token) api.setToken(res.token)
  }



  const avatarUrl = user?.avatarUrl
    ? `${API_ORIGIN}${user.avatarUrl}`
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-on-surface-variant text-sm">Manage your account, connections, and preferences.</p>
      </div>

      <div className="flex gap-1 border-b border-outline-variant pb-1 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="space-y-6">
        {/* ─── INFORMATION TAB ──────────────────────────────── */}
        {activeTab === 'information' && (
          <>
            {!isApiMode && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-600">
                You are using local mode. Connect to the backend to edit your profile.
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

            {/* Avatar Options Dialog */}
            <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Profile Picture</DialogTitle>
                  <DialogDescription>View, upload, or remove your profile photo.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-5 py-2">
                  <div className="size-32 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-outline-variant">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-on-surface-variant">
                        {(user?.displayName || '?')[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <Button onClick={() => fileInputRef.current?.click()} disabled={!isApiMode}>
                      <Camera className="h-4 w-4 mr-2" />Upload Photo
                    </Button>
                    {avatarUrl && (
                      <Button variant="outline" className="text-error hover:bg-error-container/20" onClick={handleAvatarDelete} disabled={!isApiMode}>
                        Delete Photo
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>



            {/* Main card */}
            <Card>
              {/* Avatar + identity row */}
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <button onClick={() => setAvatarDialogOpen(true)} className="relative group shrink-0">
                    <div className="size-20 sm:size-24 rounded-full overflow-hidden bg-surface-container-high ring-2 ring-outline-variant">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-on-surface-variant">
                          {(user?.displayName || '?')[0]}
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                  </button>
                  <div className="text-center sm:text-left min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold truncate">{user?.displayName}</h2>
                    <p className="text-sm text-on-surface-variant">@{user?.username}</p>
                    <span className="mt-1.5 inline-block text-xs bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full font-medium uppercase tracking-wider">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </CardContent>

              <div className="mx-6 border-t border-outline-variant/50" />

              {/* Profile fields */}
              <CardContent className="pt-4 pb-2">
                <EditableField label="Email" value={user?.email || ''} field="email" onSave={handleFieldSave} disabled={!isApiMode} />
                <EditableField label="Phone" value={user?.phone || ''} field="phone" onSave={handleFieldSave} disabled={!isApiMode} />
              </CardContent>
            </Card>

            <AvatarCropDialog
              open={cropDialogOpen}
              onOpenChange={setCropDialogOpen}
              imageSrc={avatarSrc || ''}
              onSave={handleAvatarSave}
            />
          </>
        )}

        {/* ─── CONNECTIONS TAB ─────────────────────────────── */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            {/* Data Connection — active source + file name */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5" />Data Connection</CardTitle>
                <CardDescription>Current active data source used to power dashboards.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-surface-container rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {activeInfo?.activeSource === 'upload' ? (
                        <Upload className="h-5 w-5 text-primary" />
                      ) : activeInfo?.activeSource === 'url' ? (
                        <Link className="h-5 w-5 text-primary" />
                      ) : (
                        <Cloud className="h-5 w-5 text-primary" />
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {activeInfo?.activeSource === 'upload'
                            ? 'Upload'
                            : activeInfo?.activeSource === 'url'
                              ? 'URL Sync'
                              : 'Microsoft 365'}
                        </p>
                        {activeInfo?.sourceFileName && (
                          <p className="text-xs text-on-surface-variant mt-0.5 truncate max-w-64" title={activeInfo.sourceFileName}>
                            {activeInfo.sourceFileName}
                          </p>
                        )}
                      </div>
                    </div>
                    <a href="/data-source" className="text-xs text-primary hover:underline shrink-0">Change</a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Microsoft 365 account management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Cloud className="h-5 w-5" />Microsoft 365 (OneDrive)</CardTitle>
                <CardDescription>Connect your OneDrive for Business account to sync Excel files.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connected ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>Connected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleChangeAccount}><ExternalLink className="h-4 w-4 mr-2" />Change Account</Button>
                        <Button variant="outline" onClick={handleDisconnect}><Unlink className="h-4 w-4 mr-2" />Disconnect</Button>
                      </div>
                    </div>
                    {syncStatus?.account && (
                      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
                          {(syncStatus.account.displayName || '?')[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{syncStatus.account.displayName}</p>
                          <p className="text-xs text-on-surface-variant truncate">{syncStatus.account.email}</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                      <XCircle className="h-5 w-5" />
                      <span>Not connected</span>
                    </div>
                    <Button onClick={handleConnect} disabled={isConnecting}>
                      <LinkIcon className="h-4 w-4 mr-2" />
                      {isConnecting ? 'Connecting...' : 'Connect Microsoft 365'}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-on-surface-variant">
                  Note: OneDrive integration requires a SharePoint Online (SPO) license. Personal OneDrive accounts are not supported.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── USERS TAB ───────────────────────────────────── */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />User Management</CardTitle>
              <CardDescription>Kelola user, role, dan akses.</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersSection currentUser={user} />
            </CardContent>
          </Card>
        )}

        {/* ─── MASTER DATA TAB ──────────────────────────────── */}
        {activeTab === 'master' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5" />Master Data</CardTitle>
              <CardDescription>Kelola store, paket, dan referensi lainnya.</CardDescription>
            </CardHeader>
            <CardContent>
              <MasterDataSection />
            </CardContent>
          </Card>
        )}

        {/* ─── EXPORT TAB ──────────────────────────────────── */}
        {activeTab === 'export' && settingsLoaded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ── LEFT: Settings ── */}
            <div className="space-y-5">
              {/* Header: title + save */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-on-surface">Pengaturan Laporan</h2>
                <Button size="sm" onClick={handleSaveExport} disabled={saving}>
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>

              {/* Paper size */}
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Ukuran Kertas</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(['A4', 'F4', 'Legal', 'Letter'] as const).map((size) => (
                    <button key={size} onClick={() => updateExportField('paperSize', size)}
                      className={cn('px-3 h-9 rounded-xl text-sm font-medium transition-all', exportSettings.paperSize === size ? 'bg-primary-container text-on-primary-container shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest')}
                    >{size}</button>
                  ))}
                </div>
              </div>

              {/* Mode KOP */}
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Mode Kop</label>
                <div className="flex gap-2">
                  {([{ value: 'manual', label: 'Isi Sendiri' }, { value: 'kop', label: 'Upload KOP' }] as const).map((mode) => (
                    <button key={mode.value} onClick={() => updateExportField('mode', mode.value)}
                      className={cn('flex-1 h-10 rounded-xl text-sm font-medium transition-all', exportSettings.mode === mode.value ? 'bg-primary-container text-on-primary-container shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest')}
                    >{mode.label}</button>
                  ))}
                </div>
              </div>

              {/* Manual mode */}
              {exportSettings.mode === 'manual' && (
                <>
                  {/* Logo toggle — from upload */}
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-outline-variant">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-surface-container-high flex items-center justify-center overflow-hidden shrink-0">
                        {exportSettings.logoDataUrl ? (
                          <img src={exportSettings.logoDataUrl} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon className="h-3.5 w-3.5 text-on-surface-variant/50" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-on-surface">Pakai Logo</p>
                        <p className="text-[10px] text-on-surface-variant">Upload logo perusahaan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {exportSettings.logoDataUrl ? (
                        <button onClick={() => updateExportField('logoDataUrl', null)} className="p-1 text-error hover:bg-error-container/20 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                      ) : (
                        <label className="text-xs text-primary hover:underline cursor-pointer">
                          <Upload className="h-3.5 w-3.5 inline mr-0.5" />Upload
                          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleImageFile(e, 'logoDataUrl')} />
                        </label>
                      )}
                      <ToggleSwitch checked={exportSettings.showLogo} onChange={(v) => updateExportField('showLogo', v)} />
                    </div>
                  </div>

                  <ToggleRow label="Tampilkan Nama Toko" checked={exportSettings.showStoreName} onChange={(v) => updateExportField('showStoreName', v)} />
                  <ToggleRow label="Tampilkan Alamat" checked={exportSettings.showAddress} onChange={(v) => updateExportField('showAddress', v)} />
                  <ToggleRow label="Tampilkan Telepon" checked={exportSettings.showPhone} onChange={(v) => updateExportField('showPhone', v)} />

                  <InputField label="Company Name" value={exportSettings.companyName} onChange={(v) => updateExportField('companyName', v)} />
                  <InputField label="Address" value={exportSettings.address} onChange={(v) => updateExportField('address', v)} multiline />
                  <InputField label="Phone" value={exportSettings.phone} onChange={(v) => updateExportField('phone', v)} />
                  <InputField label="Email" value={exportSettings.email} onChange={(v) => updateExportField('email', v)} />
                  <InputField label="Website" value={exportSettings.website} onChange={(v) => updateExportField('website', v)} />
                  <InputField label="NPWP" value={exportSettings.npwp} onChange={(v) => updateExportField('npwp', v)} />
                  <InputField label="Teks Header" value={exportSettings.headerText} onChange={(v) => updateExportField('headerText', v)} />
                </>
              )}

              {/* Upload KOP mode */}
              {exportSettings.mode === 'kop' && (
                <div>
                  <label className="text-xs font-medium text-on-surface-variant mb-1 block">Upload Gambar KOP</label>
                  <div className="flex items-center gap-3">
                    {exportSettings.kopDataUrl ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-outline-variant">
                        <img src={exportSettings.kopDataUrl} alt="KOP" className="w-full h-full object-contain" />
                        <button onClick={() => updateExportField('kopDataUrl', null)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-error text-white flex items-center justify-center">
                          <Trash2 className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl bg-surface-container-high flex items-center justify-center border border-outline-variant">
                        <ImageIcon className="h-8 w-8 text-on-surface-variant/50" />
                      </div>
                    )}
                    <label className="inline-flex items-center justify-center h-9 px-3 text-xs font-medium rounded-xl border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-high transition-all cursor-pointer">
                      <Upload className="h-3.5 w-3.5 mr-1" /> Upload
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleImageFile(e, 'kopDataUrl')} />
                    </label>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-1">Upload gambar KOP yang sudah jadi</p>
                </div>
              )}

              {/* Margins */}
              <div>
                <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">Margin (mm)</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['marginTop', 'marginBottom', 'marginLeft', 'marginRight'] as const).map((key) => (
                    <div key={key}>
                      <label className="text-[10px] text-on-surface-variant">{key.replace('margin', '')}</label>
                      <input type="number" min={0} max={100}
                        value={exportSettings[key]}
                        onChange={(e) => updateExportField(key, Number(e.target.value))}
                        className="w-full h-8 px-2 text-sm rounded-lg bg-surface-container-high outline-none ring-1 ring-outline-variant focus:ring-primary" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-on-surface">Footer</p>
                  <ToggleSwitch checked={exportSettings.showFooter} onChange={(v) => updateExportField('showFooter', v)} />
                </div>
                {exportSettings.showFooter && (
                  <div className="space-y-2 pl-2 border-l-2 border-outline-variant">
                    <InputField label="Teks Footer" value={exportSettings.footerText} onChange={(v) => updateExportField('footerText', v)} />
                    <ToggleRow label="Tampilkan Timestamp Cetak" checked={exportSettings.showTimestamp} onChange={(v) => updateExportField('showTimestamp', v)} />
                    <ToggleRow label="Tampilkan NPWP" checked={exportSettings.showNpwp} onChange={(v) => updateExportField('showNpwp', v)} />
                  </div>
                )}
              </div>
            </div>

            {/* ── RIGHT: Preview ── */}
            <div>
              <ExportPreview settings={exportSettings} />
            </div>
          </div>
        )}

        {/* ─── LOADING STATE ────────────────────────────────── */}
        {activeTab === 'export' && !settingsLoaded && (
          <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading settings...
          </div>
        )}
      </div>
    </div>
  )
}
