import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { api } from '@/lib/api'
import { isRSE, User } from '@/lib/auth'
import { toast } from 'sonner'
import { Loader2, Plus, Pencil, Trash2, UserCog, X, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react'

interface Props {
  currentUser: User | null
}

const CHANNELS = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XL Satu'] as const
const ROLE_BY_CHANNEL: Record<string, string[]> = {
  XLC: ['CRR', 'RSM', 'SM'],
  GSF: ['OPERATOR', 'RSM', 'SM'],
  Merchant: ['CRR', 'RSM', 'SM'],
  WO: ['AGENT_WO', 'LEADER', 'RSM'],
  EXPO: ['PROMOTOR', 'LEADER', 'RSM'],
  'XL Satu': ['CRR', 'RSM', 'SM'],
}
const USERNAME_AGENT_ROLES = ['CRR', 'AGENT_WO', 'PROMOTOR']
const ROLE_LABELS: Record<string, string> = {
  CRR: 'CRR', RSM: 'RSM', SM: 'SM',
  OPERATOR: 'Operator', AGENT_WO: 'Agent WO',
  PROMOTOR: 'Promotor', LEADER: 'Leader',
}

const SUB_TABS = [
  { id: 'accounts', label: 'Akun' },
  { id: 'assignments', label: 'Penugasan' },
] as const
type SubTab = (typeof SUB_TABS)[number]['id']

export function UsersSection({ currentUser }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('accounts')

  if (!isRSE(currentUser)) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-on-surface-variant text-sm">
          Hanya RSE yang dapat mengelola user.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-outline-variant pb-1 overflow-x-auto">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              subTab === t.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      {subTab === 'accounts' && <AccountsTab currentUser={currentUser} />}
      {subTab === 'assignments' && <AssignmentsTab />}
    </div>
  )
}

// ─── ACCOUNTS TAB ────────────────────────────────────────

function AccountsTab({ currentUser }: { currentUser: User | null }) {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [syncing, setSyncing] = useState(false)

  // set password dialog
  const [passwordDialog, setPasswordDialog] = useState<{ id: string; name: string } | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newConfirmPassword, setNewConfirmPassword] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)

  const load = useCallback(async () => {
    try { const r = await api.getUsers(); setUsers(r.users || []) }
    catch { toast.error('Gagal memuat user') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditingId(null); setUsername(''); setDisplayName(''); setPassword(''); setConfirmPassword(''); setIsAdmin(false)
    setDialogOpen(true)
  }

  const openEdit = (u: any) => {
    setEditingId(u.id); setUsername(u.username); setDisplayName(u.displayName || ''); setPassword(''); setConfirmPassword(''); setIsAdmin(u.role === 'RSE')
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!username || username.length < 3) { toast.error('Username minimal 3 karakter'); return }
    if (!displayName) { toast.error('Nama tampilan harus diisi'); return }
    if (!editingId && (!password || password.length < 6)) { toast.error('Password minimal 6 karakter'); return }
    if (password && password.length < 6) { toast.error('Password minimal 6 karakter'); return }
    if (password && password !== confirmPassword) { toast.error('Password dan konfirmasi tidak cocok'); return }

    setSaving(true)
    try {
      if (editingId) {
        const payload: any = { displayName, isAdmin }
        if (password) { payload.password = password; payload.confirmPassword = confirmPassword }
        await api.updateUser(editingId, payload)
        toast.success('User diupdate')
      } else {
        await api.createUser({ username, password, confirmPassword, displayName, isAdmin })
        toast.success('User dibuat')
      }
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await api.deleteUser(deleteTarget.id); toast.success('User dihapus'); setDeleteTarget(null); await load() }
    catch (e: any) { toast.error(e.message) }
  }

  const handleSetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return }
    if (newPassword !== newConfirmPassword) { toast.error('Password dan konfirmasi tidak cocok'); return }
    setSettingPassword(true)
    try {
      await api.setUserPassword(passwordDialog!.id, newPassword, newConfirmPassword)
      toast.success('Password berhasil diatur'); setPasswordDialog(null); setNewPassword(''); setNewConfirmPassword(''); await load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSettingPassword(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-on-surface-variant">{users.length} user</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={async () => { setSyncing(true); try { const r = await api.syncMaster(); toast.success(`Sync: ${r.created.assignments} penugasan, ${r.created.stores} store, ${r.created.packages} paket, ${r.created.events} event`); await load() } catch { toast.error('Gagal sync') } finally { setSyncing(false) } }} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}Sync Excel
          </Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Tambah User</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat...</div>
          ) : users.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Belum ada user.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase">Username</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Nama</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Role</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase">Penugasan</th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase w-36">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-medium">{u.username}</td>
                    <td className="py-3 px-3 text-on-surface-variant">{u.displayName}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${u.role === 'RSE' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant'}`}>{u.role}</span>
                    </td>
                    <td className="py-3 px-3">
                      {u.hasPassword ? (
                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-medium">Aktif</span>
                      ) : (
                        <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-medium">Belum password</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {(u.assignments?.length || 0) > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.assignments.map((a: any, i: number) => (
                            <span key={i} className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full font-medium">
                              {a.storeName} · {ROLE_LABELS[a.roleType] || a.roleType}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-xs text-on-surface-variant">—</span>}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {!u.hasPassword && (
                          <button onClick={() => { setPasswordDialog({ id: u.id, name: u.displayName }); setNewPassword(''); setNewConfirmPassword('') }} className="p-1.5 text-on-surface-variant hover:text-emerald-400 rounded-lg transition-colors" title="Atur password">
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button onClick={() => openEdit(u)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget(u)} disabled={u.id === currentUser?.id}
                          className={`p-1.5 text-on-surface-variant rounded-lg transition-colors ${u.id === currentUser?.id ? 'opacity-30 cursor-not-allowed' : 'hover:text-error'}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit User' : 'Tambah User'}</DialogTitle>
            <DialogDescription>{editingId ? 'Ubah data user.' : 'Buat user baru.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Username" value={username} onChange={setUsername} disabled={!!editingId} placeholder="min 3 karakter" />
            <Field label="Nama Tampilan" value={displayName} onChange={setDisplayName} placeholder="Nama lengkap" />
            <Field label={editingId ? 'Password baru (opsional)' : 'Password'} value={password} onChange={setPassword} type="password" placeholder={editingId ? 'Kosongkan jika tidak diubah' : 'min 6 karakter'} />
            <Field label="Konfirmasi Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Ulangi password" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isAdmin} onChange={e => setIsAdmin(e.target.checked)} className="rounded border-outline-variant" />
              Akun Administrator (RSE)
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? 'Simpan' : 'Buat'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={() => setPasswordDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Atur Password</DialogTitle>
            <DialogDescription>Set password untuk <strong>{passwordDialog?.name}</strong>.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Field label="Password Baru" value={newPassword} onChange={setNewPassword} type="password" placeholder="min 6 karakter" />
            <Field label="Konfirmasi Password" value={newConfirmPassword} onChange={setNewConfirmPassword} type="password" placeholder="Ulangi password" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPasswordDialog(null)}>Batal</Button>
            <Button onClick={handleSetPassword} disabled={settingPassword}>
              {settingPassword && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>Yakin ingin menghapus <strong>{deleteTarget?.displayName || deleteTarget?.username}</strong>? Semua data akan dihapus.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button className="bg-error hover:bg-error/90" onClick={handleDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── ASSIGNMENTS TAB ──────────────────────────────────────

function AssignmentsTab() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [userId, setUserId] = useState('')
  const [channel, setChannel] = useState('XLC')
  const [storeName, setStoreName] = useState('')
  const [roleType, setRoleType] = useState('CRR')
  const [usernameAgent, setUsernameAgent] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [filterUser, setFilterUser] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [sortKey, setSortKey] = useState('user.displayName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, u, s] = await Promise.all([
        api.getUserAssignments(),
        api.getUsers(),
        api.getStores(),
      ])
      setAssignments(a.assignments || [])
      setUsers(u.users || [])
      setStores(s.stores || [])
    } catch { toast.error('Gagal memuat data') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditingId(null); setUserId(''); setChannel('XLC'); setStoreName(''); setRoleType('CRR'); setUsernameAgent('')
    setDialogOpen(true)
  }

  const openEdit = (a: any) => {
    setEditingId(a.id); setUserId(a.userId); setChannel(a.channel); setStoreName(a.storeName); setRoleType(a.roleType); setUsernameAgent(a.usernameAgent || '')
    setDialogOpen(true)
  }

  const filteredStores = stores.filter(s => s.channel === channel)
  const storeOptions = useMemo(() => {
    const names = new Set(filteredStores.map(s => s.name))
    if (editingId && storeName) names.add(storeName)
    return Array.from(names).map(n => ({ value: n, label: n }))
  }, [filteredStores, editingId, storeName])
  const rolesForChannel = ROLE_BY_CHANNEL[channel] || []
  const showUsernameAgent = USERNAME_AGENT_ROLES.includes(roleType)

  const handleSave = async () => {
    if (!userId) { toast.error('Pilih user'); return }
    if (!storeName) { toast.error('Pilih store'); return }
    setSaving(true)
    try {
      if (editingId) {
        await api.updateUserAssignment(editingId, { channel, storeName, roleType, usernameAgent: showUsernameAgent ? usernameAgent || null : null })
        toast.success('Penugasan diupdate')
      } else {
        await api.createUserAssignment({ userId, channel, storeName, roleType, usernameAgent: showUsernameAgent ? usernameAgent || null : null })
        toast.success('Penugasan ditambahkan')
      }
      setDialogOpen(false); await load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try { await api.deleteUserAssignment(deleteTarget.id); toast.success('Penugasan dihapus'); setDeleteTarget(null); await load() }
    catch (e: any) { toast.error(e.message) }
  }

  const filtered = useMemo(() => {
    let items = [...assignments]
    if (filterUser) items = items.filter(a => a.userId === filterUser)
    if (filterChannel) items = items.filter(a => a.channel === filterChannel)
    items.sort((a, b) => {
      const getVal = (item: any, key: string) => {
        if (key === 'user.displayName') return item.user?.displayName || ''
        return String(item[key] || '')
      }
      const va = getVal(a, sortKey), vb = getVal(b, sortKey)
      return sortDir === 'asc' ? va.localeCompare(vb, 'id') : vb.localeCompare(va, 'id')
    })
    return items
  }, [assignments, filterUser, filterChannel, sortKey, sortDir])

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: string }) => {
    if (sortKey !== k) return <span className="text-on-surface-variant/40 ml-1">↕</span>
    return <span className="text-primary ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="bg-surface-container-high rounded-lg px-3 py-1.5 text-xs outline-none ring-1 ring-outline-variant">
            <option value="">Semua User</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
          </select>
          <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)} className="bg-surface-container-high rounded-lg px-3 py-1.5 text-xs outline-none ring-1 ring-outline-variant">
            <option value="">Semua Channel</option>
            {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Tambah Penugasan</Button>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat...</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-on-surface-variant text-center py-8">Belum ada penugasan.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase cursor-pointer select-none" onClick={() => toggleSort('user.displayName')}>
                    User <SortIcon k="user.displayName" />
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase cursor-pointer select-none" onClick={() => toggleSort('channel')}>
                    Channel <SortIcon k="channel" />
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase cursor-pointer select-none" onClick={() => toggleSort('storeName')}>
                    Store <SortIcon k="storeName" />
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase cursor-pointer select-none" onClick={() => toggleSort('roleType')}>
                    Role <SortIcon k="roleType" />
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase cursor-pointer select-none" onClick={() => toggleSort('usernameAgent')}>
                    Username Agent <SortIcon k="usernameAgent" />
                  </th>
                  <th className="text-left py-3 px-3 text-xs font-bold text-on-surface-variant uppercase w-20">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a: any) => (
                  <tr key={a.id} className="border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4 font-medium">{a.user?.displayName || '—'}</td>
                    <td className="py-3 px-3"><span className="text-xs bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded-full font-medium">{a.channel}</span></td>
                    <td className="py-3 px-3 text-on-surface-variant">{a.storeName}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        a.roleType === 'RSM' ? 'bg-violet-500/10 text-violet-400' :
                        a.roleType === 'SM' ? 'bg-emerald-500/10 text-emerald-400' :
                        a.roleType === 'LEADER' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>{ROLE_LABELS[a.roleType] || a.roleType}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-on-surface-variant">{a.usernameAgent || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(a)} className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget(a)} className="p-1.5 text-on-surface-variant hover:text-error rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Penugasan' : 'Tambah Penugasan'}</DialogTitle>
            <DialogDescription>{editingId ? 'Ubah penugasan user.' : 'Tambahkan penugasan baru.'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <SelectField label="User" value={userId} onChange={v => setUserId(v)} options={users.map(u => ({ value: u.id, label: `${u.displayName} (${u.username})` }))} placeholder="Pilih user" />
            <SelectField label="Channel" value={channel} onChange={v => { setChannel(v); setStoreName(''); setRoleType(ROLE_BY_CHANNEL[v]?.[0] || 'CRR'); setUsernameAgent('') }} options={CHANNELS.map(c => ({ value: c, label: c }))} />
            <SelectField label="Store" value={storeName} onChange={setStoreName} options={storeOptions} placeholder="Pilih store" />
            <SelectField label="Role" value={roleType} onChange={v => { setRoleType(v); setUsernameAgent('') }} options={rolesForChannel.map(r => ({ value: r, label: ROLE_LABELS[r] || r }))} />
            {showUsernameAgent && (
              <Field label="Username Agent" value={usernameAgent} onChange={setUsernameAgent} placeholder="cth: adam.tlogomas" />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editingId ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Penugasan</DialogTitle>
            <DialogDescription>Yakin ingin menghapus penugasan ini?</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button className="bg-error hover:bg-error/90" onClick={handleDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── UI ─────────────────────────────────────────────────────

function Field({ label, value, onChange, type, placeholder, disabled }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{label}</label>
      <input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled}
        className="mt-1 w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none ring-1 ring-outline-variant focus:ring-primary disabled:opacity-50" />
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-on-surface-variant uppercase tracking-wider font-medium">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full bg-surface-container-high rounded-lg px-3 py-2 text-sm outline-none ring-1 ring-outline-variant focus:ring-primary">
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
