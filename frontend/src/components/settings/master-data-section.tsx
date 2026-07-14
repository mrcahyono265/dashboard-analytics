import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, Store, Package, List, RefreshCw } from 'lucide-react'

const SUB_TABS = [
  { id: 'stores', label: 'Stores', icon: Store },
  { id: 'packages', label: 'Packages', icon: Package },
  { id: 'events', label: 'Events', icon: List },
] as const

type SubTab = (typeof SUB_TABS)[number]['id']
const CHANNELS = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XL Satu'] as const

export function MasterDataSection() {
  const [subTab, setSubTab] = useState<SubTab>('stores')
  const [syncing, setSyncing] = useState(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-1 border-b border-outline-variant pb-1 overflow-x-auto">
          {SUB_TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                  subTab === t.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}>
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>
        <Button size="sm" variant="outline" onClick={async () => { setSyncing(true); try { const r = await api.syncMaster(); toast.success(`Sync: ${r.created.assignments} penugasan, ${r.created.stores} store, ${r.created.packages} paket, ${r.created.events} event`); } catch { toast.error('Gagal sync') } finally { setSyncing(false) } }} disabled={syncing}>
          {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}Sync Excel
        </Button>
      </div>
      {subTab === 'stores' && <StoresSection />}
      {subTab === 'packages' && <PackagesSection />}
      {subTab === 'events' && <EventsSection />}
    </div>
  )
}

function TableLoading() {
  return <div className="flex items-center justify-center py-12 text-on-surface-variant"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat...</div>
}

function EmptyState() {
  return <p className="text-sm text-on-surface-variant text-center py-8">Belum ada data.</p>
}

function CrudDialogs({ dialogOpen, setDialogOpen, editingId, children, onSave, saving, onClose }: {
  dialogOpen: boolean; setDialogOpen: (v: boolean) => void; editingId: string | null
  children: React.ReactNode; onSave: () => void; saving: boolean; onClose?: () => void
}) {
  const handleClose = () => { setDialogOpen(false); onClose?.() }
  return (
    <Dialog open={dialogOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit' : 'Tambah'}</DialogTitle>
          <DialogDescription>Isi data dengan benar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">{children}</div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>Batal</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {editingId ? 'Simpan' : 'Buat'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DeleteConfirm({ target, onConfirm, onCancel }: {
  target: any; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <Dialog open={!!target} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Data</DialogTitle>
          <DialogDescription>Yakin ingin menghapus <strong>{target?.name || target?.nama}</strong>?</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>Batal</Button>
          <Button className="bg-error hover:bg-error/90" onClick={onConfirm}>Hapus</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-1 block">{label}</label>
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none ring-1 ring-outline-variant focus:ring-primary" />
    </div>
  )
}

function Select({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-on-surface-variant uppercase tracking-wider font-medium mb-1 block">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none ring-1 ring-outline-variant focus:ring-primary">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ─── STORES ─────────────────────────────────────────────

function StoresSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('XLC')
  const [region, setRegion] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const load = async () => {
    try { const res = await api.getStores(); setItems(res.stores || []) }
    catch { toast.error('Gagal memuat stores') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditingId(null); setName(''); setChannel('XLC'); setRegion(''); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditingId(item.id); setName(item.name); setChannel(item.channel); setRegion(item.region || ''); setDialogOpen(true) }

  const handleSave = async () => {
    if (!name) { toast.error('Nama store harus diisi'); return }
    setSaving(true)
    try {
      if (editingId) { await api.updateStore(editingId, { name, channel, region: region || null }); toast.success('Store diupdate') }
      else { await api.createStore({ name, channel, region: region || undefined }); toast.success('Store dibuat') }
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await api.deleteStore(deleteTarget.id); toast.success('Store dihapus'); setDeleteTarget(null); await load() }
    catch (e: any) { toast.error(e.message) }
  }

  const actionCol = 'w-20'
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{items.length} store</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Tambah Store</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {loading ? <TableLoading /> : items.length === 0 ? <EmptyState /> : (
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Nama</th>
              <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Channel</th>
              <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Region</th>
              <th className={`text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase ${actionCol}`}>Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-3"><ChannelBadge channel={item.channel} /></td>
                  <td className="py-3 px-3 text-on-surface-variant">{item.region || '—'}</td>
                  <td className="py-3 px-3"><Actions onEdit={() => openEdit(item)} onDelete={() => setDeleteTarget(item)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>

      <CrudDialogs dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} editingId={editingId} onSave={handleSave} saving={saving}>
        <Field label="Nama Store" value={name} onChange={setName} />
        <Select label="Channel" value={channel} onChange={setChannel} options={CHANNELS} />
        <Field label="Region" value={region} onChange={setRegion} placeholder="East / West (opsional)" />
      </CrudDialogs>
      <DeleteConfirm target={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  )
}

// ─── PACKAGES ──────────────────────────────────────────

function PackagesSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('XLC')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const CATEGORIES = ['PRIO XLC', 'XL Satu', 'ELITE', 'Merchant', 'WO', 'EXPO', 'GSF Event']

  const load = async () => {
    try { const res = await api.getPackages(); setItems(res.packages || []) }
    catch { toast.error('Gagal memuat packages') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditingId(null); setName(''); setChannel('XLC'); setCategory(''); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditingId(item.id); setName(item.name); setChannel(item.channel); setCategory(item.category || ''); setDialogOpen(true) }

  const handleSave = async () => {
    if (!name) { toast.error('Nama paket harus diisi'); return }
    setSaving(true)
    try {
      if (editingId) { await api.updatePackage(editingId, { name, channel, category: category || null }); toast.success('Package diupdate') }
      else { await api.createPackage({ name, channel, category: category || undefined }); toast.success('Package dibuat') }
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await api.deletePackage(deleteTarget.id); toast.success('Package dihapus'); setDeleteTarget(null); await load() }
    catch (e: any) { toast.error(e.message) }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{items.length} paket</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Tambah Package</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {loading ? <TableLoading /> : items.length === 0 ? <EmptyState /> : (
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Nama Paket</th>
              <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Channel</th>
              <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Kategori</th>
              <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase w-20">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-3"><ChannelBadge channel={item.channel} /></td>
                  <td className="py-3 px-3 text-on-surface-variant">{item.category || '—'}</td>
                  <td className="py-3 px-3"><Actions onEdit={() => openEdit(item)} onDelete={() => setDeleteTarget(item)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>

      <CrudDialogs dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} editingId={editingId} onSave={handleSave} saving={saving}>
        <Field label="Nama Paket" value={name} onChange={setName} placeholder="cth: 80K, XL Satu SPARK 250 Mbps" />
        <Select label="Channel" value={channel} onChange={setChannel} options={CHANNELS} />
        <Select label="Kategori" value={category} onChange={setCategory} options={CATEGORIES as readonly string[]} placeholder="Pilih kategori (opsional)" />
      </CrudDialogs>
      <DeleteConfirm target={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  )
}

// ─── EVENTS ────────────────────────────────────────────

function EventsSection() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const load = async () => {
    try { const res = await api.getEventTypes(); setItems(res.events || []) }
    catch { toast.error('Gagal memuat event types') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditingId(null); setName(''); setDialogOpen(true) }
  const openEdit = (item: any) => { setEditingId(item.id); setName(item.name); setDialogOpen(true) }

  const handleSave = async () => {
    if (!name) { toast.error('Nama event harus diisi'); return }
    setSaving(true)
    try {
      if (editingId) { await api.updateEventType(editingId, { name }); toast.success('Event diupdate') }
      else { await api.createEventType({ name }); toast.success('Event dibuat') }
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await api.deleteEventType(deleteTarget.id); toast.success('Event dihapus'); setDeleteTarget(null); await load() }
    catch (e: any) { toast.error(e.message) }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{items.length} event type</p>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Tambah Event</Button>
      </div>
      <Card><CardContent className="p-0 overflow-x-auto">
        {loading ? <TableLoading /> : items.length === 0 ? <EmptyState /> : (
          <table className="w-full text-sm border-collapse">
            <thead><tr className="border-b border-outline-variant bg-surface-container-low">
              <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Nama Event</th>
              <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase w-20">Aksi</th>
            </tr></thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                  <td className="py-3 px-4 font-medium">{item.name}</td>
                  <td className="py-3 px-3"><Actions onEdit={() => openEdit(item)} onDelete={() => setDeleteTarget(item)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent></Card>

      <CrudDialogs dialogOpen={dialogOpen} setDialogOpen={setDialogOpen} editingId={editingId} onSave={handleSave} saving={saving}>
        <Field label="Nama Event" value={name} onChange={setName} placeholder="cth: New Connection, Prepaid Recharge" />
      </CrudDialogs>
      <DeleteConfirm target={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  )
}

// ─── SHARED UI ─────────────────────────────────────────

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onEdit} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
      <button onClick={onDelete} className="p-1.5 text-on-surface-variant hover:text-error rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
    </div>
  )
}

function ChannelBadge({ channel }: { channel: string }) {
  return <span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full font-medium">{channel}</span>
}


