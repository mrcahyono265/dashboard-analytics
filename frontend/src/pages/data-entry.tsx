import { useState, useEffect, useCallback, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { getCurrentUser, type User } from '@/lib/auth'
import type { DashboardData } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, Loader2, Trash2, Save, Pencil, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface FieldDef {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'month'
  options?: string[]
  required?: boolean
  dynamic?: true
  dependsOn?: string
  auto?: boolean
  placeholder?: string
}

const FIELD_DEFS: Record<string, FieldDef[]> = {
  XLC: [
    { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
    { key: 'StoreName', label: 'Store', type: 'select', dynamic: true, required: true },
    { key: 'NamaCRR', label: 'CRR', type: 'select', dynamic: true, dependsOn: 'StoreName', required: true },
    { key: 'UsernameAgent', label: 'Username Agent', type: 'text', auto: true },
    { key: 'RSM', label: 'RSM', type: 'text', auto: true },
    { key: 'SM', label: 'SM', type: 'text', auto: true },
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'PackagePlan', label: 'Paket', type: 'select', dynamic: true, required: true },
    { key: 'NewMigrate', label: 'Tipe', type: 'select', options: ['New', 'Migrate'], required: true },
    { key: 'PricePlan', label: 'Harga (Rp)', type: 'number' },
  ],
  'XL Satu': [
    { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
    { key: 'StoreName', label: 'Store', type: 'select', dynamic: true, required: true },
    { key: 'NamaCRR', label: 'CRR', type: 'select', dynamic: true, dependsOn: 'StoreName', required: true },
    { key: 'UsernameAgent', label: 'Username Agent', type: 'text', auto: true },
    { key: 'RSM', label: 'RSM', type: 'text', auto: true },
    { key: 'SM', label: 'SM', type: 'text', auto: true },
    { key: 'NoSO', label: 'No. SO', type: 'text', required: true },
    { key: 'PackagePlan', label: 'Paket', type: 'select', dynamic: true, required: true },
    { key: 'PricePlan', label: 'Harga (Rp)', type: 'number' },
  ],
  WO: [
    { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
    { key: 'XLCName', label: 'Store', type: 'select', dynamic: true, required: true },
    { key: 'AgentWO', label: 'Agent WO', type: 'select', dynamic: true, dependsOn: 'XLCName', required: true },
    { key: 'UsernameAgent', label: 'Username Agent', type: 'text', auto: true },
    { key: 'RSM', label: 'RSM', type: 'text', auto: true },
    { key: 'Leader', label: 'Leader', type: 'text', auto: true },
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'PackagePlan', label: 'Paket', type: 'select', dynamic: true, required: true },
    { key: 'NewMigrate', label: 'Tipe', type: 'select', options: ['New', 'Migrate'] },
    { key: 'PricePlan', label: 'Harga (Rp)', type: 'number' },
  ],
  EXPO: [
    { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
    { key: 'ExpoName', label: 'Nama Expo', type: 'select', dynamic: true, required: true },
    { key: 'NamaPromotor', label: 'Promotor', type: 'select', dynamic: true, dependsOn: 'ExpoName', required: true },
    { key: 'UsernameAgent', label: 'Username Agent', type: 'text', auto: true },
    { key: 'RSM', label: 'RSM', type: 'text', auto: true },
    { key: 'Leader', label: 'Leader', type: 'text', auto: true },
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'PackagePlan', label: 'Paket', type: 'select', dynamic: true, required: true },
    { key: 'NewMigrate', label: 'Tipe', type: 'select', options: ['New', 'Migrate'] },
    { key: 'PricePlan', label: 'Harga (Rp)', type: 'number' },
  ],
  Merchant: [
    { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
    { key: 'StoreName', label: 'Store', type: 'select', dynamic: true, required: true },
    { key: 'NamaCRR', label: 'CRR', type: 'select', dynamic: true, dependsOn: 'StoreName' },
    { key: 'UsernameAgent', label: 'Username Agent', type: 'text', auto: true },
    { key: 'RSM', label: 'RSM', type: 'text', auto: true },
    { key: 'SM', label: 'SM', type: 'text', auto: true },
    { key: 'MSISDN', label: 'MSISDN', type: 'text', required: true },
    { key: 'PackagePlan', label: 'Paket', type: 'select', dynamic: true, required: true },
    { key: 'NewMigrate', label: 'Tipe', type: 'select', options: ['New', 'Migrate'] },
    { key: 'PricePlan', label: 'Harga (Rp)', type: 'number' },
  ],
  GSF: [
    { key: 'Tanggal', label: 'Tanggal', type: 'date', required: true },
    { key: 'Office', label: 'Galeri', type: 'select', dynamic: true, required: true },
    { key: 'Operator', label: 'Operator', type: 'select', dynamic: true, dependsOn: 'Office' },
    { key: 'Amount', label: 'Amount (Rp)', type: 'number', required: true, placeholder: 'cth: 300000000' },
    { key: 'EventName', label: 'Event', type: 'select', dynamic: true, required: true },
    { key: 'PaymentMethod', label: 'Method', type: 'text' },
    { key: 'PaymentCategory', label: 'Kategori', type: 'text' },
  ],
  ELITE: [
    { key: 'Operator', label: 'Operator', type: 'text', required: true },
    { key: 'NewConnection', label: 'New Connection', type: 'number', required: true },
    { key: 'PrepaidToPostpaid', label: 'Prepaid to Postpaid', type: 'number', required: true },
    { key: 'GrandTotal', label: 'Grand Total', type: 'number', auto: true },
  ],
  Promotor: [
    { key: 'NamaPromotor', label: 'Nama Promotor', type: 'text', required: true },
  ],
  Target: [
    { key: 'channel', label: 'Channel', type: 'select', options: ['XLC', 'WO', 'EXPO', 'Merchant', 'XL Satu'], required: true },
    { key: 'staffName', label: 'Nama Staff', type: 'select', dynamic: true },
    { key: 'targetValue', label: 'Target', type: 'number', required: true },
    { key: 'period', label: 'Periode', type: 'month' },
  ],
}

const TABS = [
  { id: 'XLC', label: 'XLC Activation' },
  { id: 'XL Satu', label: 'XL Satu' },
  { id: 'WO', label: 'WO Agent' },
  { id: 'EXPO', label: 'EXPO' },
  { id: 'Merchant', label: 'Merchant' },
  { id: 'GSF', label: 'GSF Revenue' },
  { id: 'ELITE', label: 'ELITE' },
  { id: 'Promotor', label: 'Promotor' },
  { id: 'Target', label: 'Target' },
]

const DEFAULT_PERIOD = new Date().toISOString().slice(0, 7)
const TODAY = new Date().toISOString().slice(0, 10)

function getRoleTabs(user: User | null): string[] {
  if (!user) return []
  if (user.role === 'RSE') return TABS.map(t => t.id)
  if (user.role === 'STORE_MANAGER') return ['Merchant', 'GSF']
  if (user.role === 'CRR') {
    if (user.channel === 'GSF') return ['GSF']
    return ['XLC', 'XL Satu']
  }
  return []
}

const ROLE_BY_CHANNEL: Record<string, string> = {
  XLC: 'CRR', 'XL Satu': 'CRR', Merchant: 'CRR',
  WO: 'AGENT_WO', EXPO: 'PROMOTOR', GSF: 'OPERATOR',
}

const AUTO_ROLES: Record<string, string[]> = {
  XLC: ['RSM', 'SM', 'CRR'],
  Merchant: ['RSM', 'SM', 'CRR'],
  'XL Satu': ['RSM', 'SM', 'CRR'],
  WO: ['RSM', 'LEADER', 'AGENT_WO'],
  EXPO: ['RSM', 'LEADER', 'PROMOTOR'],
  GSF: ['RSM', 'OPERATOR'],
}



export function DataEntryPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tab, setTab] = useState<string>('XLC')
  const [form, setForm] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [entries, setEntries] = useState<any[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [monthFilter, setMonthFilter] = useState(DEFAULT_PERIOD)
  const [targets, setTargets] = useState<any[]>([])
  const [sortKey, setSortKey] = useState<string>('')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const data = useStore(s => s.data)
  const reportData = useStore(s => s.reportData)
  const tabs = getRoleTabs(user)
  const fields = FIELD_DEFS[tab] ?? []
  const isTargetTab = tab === 'Target'
  const [masterStores, setMasterStores] = useState<any[]>([])
  const [masterPackages, setMasterPackages] = useState<any[]>([])
  const [masterAssignments, setMasterAssignments] = useState<any[]>([])
  const [masterEvents, setMasterEvents] = useState<any[]>([])

  useEffect(() => {
    const fetchMaster = () => {
      api.getStores().then(r => setMasterStores(r.stores || [])).catch(() => {})
      api.getPackages().then(r => setMasterPackages(r.packages || [])).catch(() => {})
      api.getUserAssignments().then(r => setMasterAssignments(r.assignments || [])).catch(() => {})
      api.getEventTypes().then(r => setMasterEvents(r.events || [])).catch(() => {})
    }
    fetchMaster()
    window.addEventListener('data-synced', fetchMaster)
    return () => window.removeEventListener('data-synced', fetchMaster)
  }, [])

  const pkgOptions = useMemo(() => {
    return masterPackages.filter(p => p.channel === tab).map(p => p.name)
  }, [masterPackages, tab])

  const storeOptions = useMemo(() => {
    const channelKey = tab === 'WO' ? 'WO' : tab === 'EXPO' ? 'EXPO' : tab === 'GSF' ? 'GSF' : tab === 'XL Satu' ? 'XL Satu' : tab
    return masterStores.filter(s => s.channel === tab).map(s => s.name)
  }, [masterStores, tab])

  const lookups = useMemo(() => {
    const usernameAgentByName = new Map<string, string>()
    const rsmByStore = new Map<string, string>()
    const smByStore = new Map<string, string>()
    const leaderByStore = new Map<string, string>()

    for (const a of masterAssignments) {
      if (a.roleType === 'CRR' || a.roleType === 'AGENT_WO' || a.roleType === 'PROMOTOR') {
        if (a.usernameAgent) usernameAgentByName.set(a.user?.displayName || '', a.usernameAgent)
      }
      if (a.roleType === 'RSM') rsmByStore.set(a.storeName, a.user?.displayName || '')
      if (a.roleType === 'SM') smByStore.set(a.storeName, a.user?.displayName || '')
      if (a.roleType === 'LEADER') leaderByStore.set(a.storeName, a.user?.displayName || '')
    }

    for (const d of data?.xlc ?? []) {
      if (d.NamaCRR && d.UsernameAgent && !usernameAgentByName.has(d.NamaCRR)) usernameAgentByName.set(d.NamaCRR, d.UsernameAgent)
      if (d.StoreName && d.SM && !smByStore.has(d.StoreName)) smByStore.set(d.StoreName, d.SM)
      if (d.StoreName && d.RSM && !rsmByStore.has(d.StoreName)) rsmByStore.set(d.StoreName, d.RSM)
    }
    for (const d of data?.merchant ?? []) {
      if (d.NamaCRR && d.UsernameAgent && !usernameAgentByName.has(d.NamaCRR)) usernameAgentByName.set(d.NamaCRR, d.UsernameAgent)
      if (d.StoreName && d.SM && !smByStore.has(d.StoreName)) smByStore.set(d.StoreName, d.SM)
    }
    for (const d of data?.wo ?? []) {
      if (d.AgentWO && d.UsernameAgent && !usernameAgentByName.has(d.AgentWO)) usernameAgentByName.set(d.AgentWO, d.UsernameAgent)
      if (d.XLCName && d.Leader && !leaderByStore.has(d.XLCName)) leaderByStore.set(d.XLCName, d.Leader)
      if (d.XLCName && d.RSM && !rsmByStore.has(d.XLCName)) rsmByStore.set(d.XLCName, d.RSM)
    }
    for (const d of data?.expo ?? []) {
      if (d.NamaPromotor && d.UsernameAgent && !usernameAgentByName.has(d.NamaPromotor)) usernameAgentByName.set(d.NamaPromotor, d.UsernameAgent)
      if (d.ExpoName && d.Leader && !leaderByStore.has(d.ExpoName)) leaderByStore.set(d.ExpoName, d.Leader)
      if (d.ExpoName && d.RSM && !rsmByStore.has(d.ExpoName)) rsmByStore.set(d.ExpoName, d.RSM)
    }
    for (const d of reportData?.storeMaster ?? []) {
      if (d.storeName && d.rse && !rsmByStore.has(d.storeName)) rsmByStore.set(d.storeName, d.rse)
    }
    return { usernameAgentByName, smByStore, rsmByStore, leaderByStore }
  }, [data, reportData, masterAssignments])

  function getFilteredPeople(storeVal: string): string[] {
    const channelKey = tab === 'XL Satu' ? 'XL Satu' : tab
    const roleType = ROLE_BY_CHANNEL[channelKey]
    return masterAssignments
      .filter(a => a.storeName === storeVal && a.channel === channelKey && a.roleType === roleType)
      .map(a => a.user?.displayName || '')
      .sort((a, b) => a.localeCompare(b, 'id'))
  }

  function extractBaseOptions(): Record<string, string[]> {
    const personFallback = new Set<string>()
    for (const d of data?.xlc ?? []) { if (d.NamaCRR) personFallback.add(d.NamaCRR) }
    for (const d of data?.merchant ?? []) { if (d.NamaCRR) personFallback.add(d.NamaCRR) }
    for (const d of data?.gsf ?? []) { if (d.Operator) personFallback.add(d.Operator) }
    for (const d of data?.wo ?? []) { if (d.AgentWO) personFallback.add(d.AgentWO) }
    for (const d of data?.expo ?? []) { if (d.NamaPromotor) personFallback.add(d.NamaPromotor) }
    const sort = (arr: string[]) => [...arr].sort((a, b) => a.localeCompare(b, 'id'))
    return {
      StoreName: sort(storeOptions),
      XLCName: sort(masterStores.filter(s => s.channel === 'WO').map(s => s.name)),
      ExpoName: sort(masterStores.filter(s => s.channel === 'EXPO').map(s => s.name)),
      Office: sort(masterStores.filter(s => s.channel === 'GSF').map(s => s.name)),
      staffName: sort([...personFallback, ...masterAssignments.map(a => a.user?.displayName || '').filter(Boolean)]),
    }
  }

  const baseOptions = useMemo(() => extractBaseOptions(), [storeOptions, masterStores, data, masterAssignments])

  useEffect(() => { getCurrentUser().then(u => setUser(u)) }, [])

  useEffect(() => {
    if (tabs.length > 0 && !tabs.includes(tab)) setTab(tabs[0])
    setSortKey('')
    setSortDir('asc')
  }, [tab])

  const resetForm = useCallback(() => {
    const defaults: Record<string, string> = {
      Tanggal: TODAY,
      period: monthFilter,
    }
    if (isTargetTab) {
      setForm(defaults)
      return
    }
    if (user?.role !== 'RSE') {
      if (user?.center) defaults.StoreName = user.center
      if (user?.crrName) {
        if (tab === 'WO') defaults.AgentWO = user.crrName
        else if (tab === 'EXPO') defaults.NamaPromotor = user.crrName
        else if (tab === 'GSF') defaults.Operator = user.crrName
        else defaults.NamaCRR = user.crrName
      }
    }
    setForm(defaults)
  }, [user, tab, monthFilter, isTargetTab])

  const loadEntries = useCallback(async () => {
    if (isTargetTab) {
      try {
        const result = await api.getTargets(monthFilter)
        if (result && Array.isArray(result.targets)) setTargets(result.targets)
        else setTargets([])
      } catch {
        setTargets([])
      }
      return
    }
    try {
      const key = tab === 'XL Satu' ? 'XLSatu' : tab
      const result = await api.getDataWithCategory(key, 'entry', monthFilter)
      if (result && Array.isArray(result.data)) setEntries(result.data)
      else setEntries([])
    } catch {
      setEntries([])
    }
  }, [tab, monthFilter, isTargetTab])

  useEffect(() => { loadEntries() }, [loadEntries])

  const displayEntries = useMemo(() => {
    const raw = isTargetTab ? targets : entries
    if (!sortKey || !raw) return raw
    return [...raw].sort((a: any, b: any) => {
      const va = a[sortKey], vb = b[sortKey]
      const numA = Number(va), numB = Number(vb)
      const cmp = !isNaN(numA) && !isNaN(numB) ? numA - numB : String(va ?? '').localeCompare(String(vb ?? ''), 'id')
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [entries, targets, isTargetTab, sortKey, sortDir])

  function getFieldOptions(field: FieldDef): string[] {
    if (field.key === 'PackagePlan') return pkgOptions
    if (field.key === 'EventName') {
      const names = masterEvents.map(e => e.name).filter(Boolean)
      return names.length > 0 ? names : ['New Connection', 'Prepaid Recharge', 'Postpaid Payment', 'SIM Replacement', 'Reverse Payment']
    }
    if (!field.dynamic) return field.options ?? []
    if (field.dependsOn) {
      const parentKey = form[field.dependsOn]
      if (!parentKey) return []
      if (['NamaCRR', 'AgentWO', 'NamaPromotor', 'Operator'].includes(field.key)) {
        return getFilteredPeople(parentKey)
      }
    }
    return baseOptions[field.key] ?? []
  }

  function isDisabled(field: FieldDef): boolean {
    if (!field.dynamic || !field.dependsOn) return false
    return !form[field.dependsOn]
  }

  function getAutoValue(field: FieldDef): string {
    switch (field.key) {
      case 'UsernameAgent': {
        const key = form.NamaCRR || form.AgentWO || form.NamaPromotor || ''
        return lookups.usernameAgentByName.get(key) || ''
      }
      case 'RSM': {
        const storeKey = form.StoreName || form.XLCName || form.ExpoName || form.Office || user?.center || ''
        return lookups.rsmByStore.get(storeKey) || user?.displayName || user?.username || ''
      }
      case 'SM': {
        const storeKey = form.StoreName || user?.center || ''
        return lookups.smByStore.get(storeKey) || ''
      }
      case 'Leader': {
        const storeKey = form.XLCName || form.ExpoName || ''
        return lookups.leaderByStore.get(storeKey) || ''
      }
      case 'GrandTotal': {
        const nc = Number(form.NewConnection || 0)
        const pp = Number(form.PrepaidToPostpaid || 0)
        return String(nc + pp)
      }
      default: return ''
    }
  }

  function getFieldValue(field: FieldDef): string {
    if (field.auto) return form[field.key] ?? getAutoValue(field) ?? ''
    return form[field.key] ?? ''
  }

  const handleFieldChange = (key: string, value: string) => {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if (key === 'StoreName') {
        next.NamaCRR = ''
        delete next.SM
        delete next.RSM
      }
      if (key === 'XLCName') {
        next.AgentWO = ''
        delete next.Leader
        delete next.RSM
      }
      if (key === 'ExpoName') {
        next.NamaPromotor = ''
        delete next.Leader
        delete next.RSM
      }
      if (key === 'Office') {
        next.Operator = ''
        delete next.RSM
        delete next.SM
      }
      if (key === 'NamaCRR') delete next.UsernameAgent
      if (key === 'NewConnection' || key === 'PrepaidToPostpaid') delete next.GrandTotal
      return next
    })
  }

  const openAdd = () => {
    setEditingIndex(null)
    resetForm()
    setDialogOpen(true)
  }

  const openEdit = (row: any, indexOrId: number) => {
    setEditingIndex(isTargetTab ? indexOrId : indexOrId)
    const defaults: Record<string, string> = {}
    for (const f of fields) {
      const val = row[f.key]
      defaults[f.key] = val !== undefined && val !== null ? String(val) : ''
    }
    defaults.Tanggal = row.Tanggal || TODAY
    if (isTargetTab) defaults.period = row.period || monthFilter
    else defaults.period = monthFilter
    setForm(defaults)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingIndex(null)
  }

  const handleSubmit = async () => {
    if (tab === 'Target') {
      const missing = fields.filter(f => f.required && !getFieldValue(f))
      if (missing.length > 0) {
        toast.error(`Lengkapi: ${missing.map(f => f.label).join(', ')}`)
        return
      }
      setSubmitting(true)
      try {
        const targetPeriodVal = form.period || monthFilter
        if (editingIndex !== null) {
          await api.deleteTarget(editingIndex)
        }
        await api.createTarget(
          form.channel,
          Number(form.targetValue),
          targetPeriodVal,
          '',
          form.staffName || undefined,
        )
        toast.success('Target tersimpan')
        await loadEntries()
        closeDialog()
        window.dispatchEvent(new Event('data-synced'))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
      } finally {
        setSubmitting(false)
      }
      return
    }

    const missing = fields.filter(f => f.required && !getFieldValue(f))
    if (missing.length > 0) {
      toast.error(`Lengkapi: ${missing.map(f => f.label).join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      const key = tab === 'XL Satu' ? 'XLSatu' : tab
      const dateStr = form.Tanggal || new Date().toISOString().slice(0, 10)
      const [y, m] = dateStr.slice(0, 7).split('-')
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
      const row: Record<string, any> = {
        Bulan: `${monthNames[parseInt(m) - 1] || ''} ${y}`,
      }
      for (const f of fields) {
        const val = getFieldValue(f)
        row[f.key] = f.type === 'number' ? (Number(val) || 0) : (val || '')
      }

      if (editingIndex !== null) {
        await api.deleteEntry(key, monthFilter, editingIndex)
      }
      await api.appendData(key, monthFilter, row)
      toast.success('Record tersimpan')
      await loadEntries()
      closeDialog()
      window.dispatchEvent(new Event('data-synced'))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (indexOrId: number) => {
    if (isTargetTab) {
      try {
        await api.deleteTarget(indexOrId)
        toast.success('Target dihapus')
        await loadEntries()
        window.dispatchEvent(new Event('data-synced'))
      } catch {
        toast.error('Gagal menghapus target')
      }
      return
    }
    const key = tab === 'XL Satu' ? 'XLSatu' : tab
    try {
      await api.deleteEntry(key, monthFilter, indexOrId)
      toast.success('Record dihapus')
      await loadEntries()
      window.dispatchEvent(new Event('data-synced'))
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  function renderField(f: FieldDef) {
    const val = getFieldValue(f)
    const opts = getFieldOptions(f)
    const disabled = isDisabled(f)

    if (f.type === 'month') {
      return (
        <input type="month" value={val}
          onChange={e => handleFieldChange(f.key, e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60" />
      )
    }

    if (f.dynamic || (f.type === 'select' && opts.length > 0)) {
      return (
        <select
          value={val}
          onChange={e => handleFieldChange(f.key, e.target.value)}
          disabled={disabled || !!f.auto}
          className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
        >
          <option value="">— Pilih {f.label}</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }

    return (
      <input
        type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
        value={val}
        onChange={e => handleFieldChange(f.key, e.target.value)}
        readOnly={!!f.auto}
        disabled={disabled}
        placeholder={f.placeholder ?? (!f.auto ? f.label : '')}
        className="w-full px-3 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
      />
    )
  }

  // ─── Table columns ──────────────────────────────────────
  const tableFields = useMemo(() => {
    if (isTargetTab) return [
      { key: 'channel', label: 'Channel' },
      { key: 'staffName', label: 'Staff' },
      { key: 'targetValue', label: 'Target', type: 'number' },
      { key: 'period', label: 'Periode' },
    ]
    return fields.filter(f => !f.auto)
  }, [isTargetTab, fields])

  // ─── Toolbar title ──────────────────────────────────────
  const totalCount = isTargetTab ? targets.length : displayEntries.length

  // ─── Render ─────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-headline font-bold text-on-surface">Input Data Manual</h1>
        <p className="text-body-sm text-on-surface-variant mt-1">Tambah, edit, dan monitor record.</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1">
        {TABS.filter(t => tabs.includes(t.id)).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              tab === t.id
                ? 'border-primary bg-primary-container text-on-primary-container'
                : 'border-outline-variant bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-surface-container rounded-xl p-1 border border-outline-variant">
          <Calendar className="h-4 w-4 ml-2 text-on-surface-variant" />
          <input type="month" value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-transparent border-none focus:outline-none cursor-pointer" />
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus className="h-4 w-4" /> Tambah Data
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-title-sm">
            {TABS.find(t => t.id === tab)?.label ?? tab} — {totalCount} record
          </CardTitle>
          <CardDescription>Bulan: {monthFilter}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {displayEntries.length === 0 ? (
            <p className="text-sm text-on-surface-variant px-6 py-8 text-center">
              Belum ada record. Klik "Tambah Data" untuk memulai.
            </p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low">
                  <th className="sticky left-0 bg-surface-container-low text-left py-3 px-4 text-xs font-bold text-on-surface-variant uppercase w-10">#</th>
                  {tableFields.map(f => {
                    const active = sortKey === f.key
                    return (
                      <th key={f.key}
                        onClick={() => {
                          if (sortKey === f.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
                          else { setSortKey(f.key); setSortDir('asc') }
                        }}
                        className="text-left py-3 px-3 text-xs font-bold uppercase whitespace-nowrap cursor-pointer select-none transition-colors hover:text-on-surface"
                        style={{ color: active ? 'var(--color-primary)' : 'var(--color-on-surface-variant)' }}>
                        {f.label}
                        {active && <span className="ml-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                      </th>
                    )
                  })}
                  <th className="sticky right-0 bg-surface-container-low text-right py-3 px-4 text-xs font-bold text-on-surface-variant uppercase w-24">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {displayEntries.map((row: any, i: number) => {
                  const actualIndex = isTargetTab ? i : entries.indexOf(row)
                  const rowKey = isTargetTab ? row.id ?? i : actualIndex
                  return (
                    <tr key={rowKey}
                      className="border-b border-outline-variant/30 hover:bg-surface-container-high transition-colors">
                      <td className="sticky left-0 bg-surface py-3 px-4 font-mono text-xs text-on-surface-variant">{i + 1}</td>
                      {tableFields.map(f => {
                        const val = row[f.key]
                        const display = f.type === 'number' && val
                          ? Number(val).toLocaleString('id-ID')
                          : String(val ?? '—').slice(0, 40)
                        return (
                          <td key={f.key} className="py-3 px-3 text-on-surface truncate max-w-[200px] whitespace-nowrap">
                            {display}
                          </td>
                        )
                      })}
                      <td className="sticky right-0 bg-surface py-3 px-4 text-right whitespace-nowrap">
                        <button onClick={() => openEdit(row, isTargetTab ? row.id : actualIndex)}
                          className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-primary-container/30 mr-1"
                          title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(isTargetTab ? row.id : actualIndex)}
                          className="p-1.5 text-on-surface-variant hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                          title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIndex !== null ? 'Edit Record' : 'Tambah Record'} — {TABS.find(t => t.id === tab)?.label ?? tab}
            </DialogTitle>
            <DialogDescription>Isi form di bawah untuk {editingIndex !== null ? 'mengubah' : 'menambah'} data.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {fields.map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-sm font-medium text-on-surface">
                  {f.label}
                  {f.required && <span className="text-red-500 ml-0.5">*</span>}
                  {f.auto && <span className="text-xs text-on-surface-variant ml-1">(auto)</span>}
                </label>
                {renderField(f)}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant">
            <Button variant="outline" onClick={closeDialog}>Batal</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
