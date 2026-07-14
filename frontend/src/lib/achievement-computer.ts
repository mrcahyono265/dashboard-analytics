import type { XLC, GSF, WO, EXPO, XLSatu } from './data'

export interface LeafRow {
  store: string
  sm: string
  name: string
  channel: string
  achievement: number
  target: number
  gap: number
  pct: number
}

export interface CardData {
  title: string
  leaves: LeafRow[]
}

const PER_CRR_DEFAULTS: Record<string, number> = {
  XLC: 68,
  GSF: 66,
  'XL Satu': 15,
  WO: 10,
  EXPO: 10,
}

function buildTargetMap(targets: any[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of targets || []) {
    map.set(`${t.channel}|${t.center ?? ''}|${t.staffName ?? ''}`, Number(t.targetValue) || 0)
  }
  return map
}

function getTargetFromMap(map: Map<string, number>, channel: string, center?: string, staffName?: string): number | null {
  if (staffName && center) {
    const v = map.get(`${channel}|${center}|${staffName}`)
    if (v != null) return v
  }
  if (center) {
    const v = map.get(`${channel}|${center}|`)
    if (v != null) return v
  }
  const v = map.get(`${channel}||`)
  if (v != null) return v
  return null
}

function groupBy<T>(records: T[], keyFn: (r: T) => string, valFn: (r: T) => { store: string; sm: string; name: string }, channel: string): LeafRow[] {
  const groups = new Map<string, { store: string; sm: string; name: string; count: number }>()
  for (const r of records) {
    const k = keyFn(r)
    if (!k) continue
    const v = valFn(r)
    const g = groups.get(k) || { store: v.store, sm: v.sm, name: v.name, count: 0 }
    g.count++
    groups.set(k, g)
  }
  return Array.from(groups.values()).map(g => ({
    store: g.store, sm: g.sm, name: g.name, channel, achievement: g.count, target: 0, gap: 0, pct: 0,
  }))
}

function assignTargets(leaves: LeafRow[], map: Map<string, number>, channel: string) {
  const storeCrrCount = new Map<string, number>()
  for (const l of leaves) storeCrrCount.set(l.store, (storeCrrCount.get(l.store) || 0) + 1)

  const hasStoreTargets = leaves.some(l => {
    const v = getTargetFromMap(map, channel, l.store)
    return v != null && v > 0
  })

  const defaultTarget = PER_CRR_DEFAULTS[channel] ?? 0

  return leaves.map(l => {
    let target = 0
    if (hasStoreTargets) {
      const st = getTargetFromMap(map, channel, l.store) ?? 0
      // Store has API target → split across CRRs. No API target for this store → fall back to default.
      target = st > 0 ? st / (storeCrrCount.get(l.store) || 1) : defaultTarget
    } else {
      target = defaultTarget
    }
    const gap = target - l.achievement
    const pct = target > 0 ? (l.achievement / target) * 100 : 0
    return { ...l, target, gap, pct }
  })
}

function is5G(pkg: string) {
  return /5g|ultra/i.test(pkg)
}

function transformGSFStore(name: string): string {
  return name
    .replace(/^Gal\.\s*/i, 'GSF ')
    .replace(/^Galeri\s*/i, 'GSF ')
    .replace(/^Gal\s+/i, 'GSF ')
    .trim()
}

function lookupSm(smMap: Map<string, string>, channel: string, store: string, fallback?: string): string {
  return smMap.get(`${channel}|${store}`) || smMap.get(`${channel}|*`) || fallback || ''
}

export function computeXLCGSFReport(xlc: XLC[], gsf: GSF[], xlsatu: XLSatu[], targets: any[], smMap: Map<string, string> = new Map()): CardData[] {
  const tmap = buildTargetMap(targets)
  const validXLC = xlc.filter(r => r.MSISDN && r.NamaCRR)

  const prioritasRecs = validXLC.filter(r => !is5G(r.PackagePlan))
  const fiveGRecs = validXLC.filter(r => is5G(r.PackagePlan))
  const xlSatuRecs = xlsatu.filter(r => r.NamaCRR)

  const prioritasLeaves = assignTargets(
    groupBy(prioritasRecs, r => `${r.StoreName}|${r.SM || ''}|${r.NamaCRR}`, r => ({ store: r.StoreName, sm: lookupSm(smMap, 'XLC', r.StoreName, r.SM || ''), name: r.NamaCRR }), 'XLC'),
    tmap, 'XLC'
  )

  const eliteLeaves = assignTargets(
    groupBy(
      gsf.filter(r => r.Office && r.Operator),
      r => `${transformGSFStore(r.Office)}|${r.Operator}`,
      r => ({ store: transformGSFStore(r.Office), sm: lookupSm(smMap, 'GSF', transformGSFStore(r.Office)), name: r.Operator || '' }),
      'GSF'
    ),
    tmap, 'GSF'
  )

  const fiveGLeaves = assignTargets(
    groupBy(fiveGRecs, r => `${r.StoreName}|${r.SM || ''}|${r.NamaCRR}`, r => ({ store: r.StoreName, sm: lookupSm(smMap, 'XLC', r.StoreName, r.SM || ''), name: r.NamaCRR }), 'XLC'),
    tmap, 'XLC'
  )

  const xlSatuLeaves = assignTargets(
    groupBy(xlSatuRecs, r => `${r.StoreName}|${r.SM || ''}|${r.NamaCRR}`, r => ({ store: r.StoreName, sm: lookupSm(smMap, 'XL Satu', r.StoreName, r.SM || ''), name: r.NamaCRR }), 'XL Satu'),
    tmap, 'XL Satu'
  )

  const cards: CardData[] = []
  const postpaidLeaves = [...prioritasLeaves, ...eliteLeaves]
  if (postpaidLeaves.length > 0) cards.push({ title: 'Postpaid', leaves: postpaidLeaves })
  if (xlSatuLeaves.length > 0) cards.push({ title: 'XL Satu', leaves: xlSatuLeaves })
  if (fiveGLeaves.length > 0) cards.push({ title: '5G Package', leaves: fiveGLeaves })
  return cards
}

export function computeWOReport(wo: WO[], xlsatu: XLSatu[], targets: any[], smMap: Map<string, string> = new Map()): CardData[] {
  const tmap = buildTargetMap(targets)
  const validWO = wo.filter(r => r.AgentWO)

  const prioritasLeaves = assignTargets(
    groupBy(validWO, r => `${r.XLCName || ''}|${r.Leader || ''}|${r.AgentWO}`, r => ({ store: r.XLCName || '', sm: lookupSm(smMap, 'WO', r.XLCName || '', r.Leader || ''), name: r.AgentWO }), 'WO'),
    tmap, 'WO'
  )

  const xlSatuLeaves = assignTargets(
    groupBy(xlsatu.filter(r => r.NamaCRR), r => `${r.StoreName}|${r.SM || ''}|${r.NamaCRR}`, r => ({ store: r.StoreName, sm: lookupSm(smMap, 'XL Satu', r.StoreName, r.SM || ''), name: r.NamaCRR }), 'XL Satu'),
    tmap, 'XL Satu'
  )

  const cards: CardData[] = []
  if (prioritasLeaves.length > 0) cards.push({ title: 'Prioritas', leaves: prioritasLeaves })
  if (xlSatuLeaves.length > 0) cards.push({ title: 'XL Satu', leaves: xlSatuLeaves })
  return cards
}

export function computeEXPOReport(expo: EXPO[], targets: any[], smMap: Map<string, string> = new Map()): CardData[] {
  const tmap = buildTargetMap(targets)
  const validEXPO = expo.filter(r => r.NamaPromotor)

  const regularRecs = validEXPO.filter(r => !is5G(r.PackagePlan))
  const fiveGRecs = validEXPO.filter(r => is5G(r.PackagePlan))

  const regularLeaves = assignTargets(
    groupBy(regularRecs, r => `${r.ExpoName || ''}|${r.NamaPromotor}`, r => ({ store: r.ExpoName || '', sm: lookupSm(smMap, 'EXPO', r.ExpoName || '', r.Leader || ''), name: r.NamaPromotor }), 'EXPO'),
    tmap, 'EXPO'
  )

  const fiveGLeaves = assignTargets(
    groupBy(fiveGRecs, r => `${r.ExpoName || ''}|${r.NamaPromotor}`, r => ({ store: r.ExpoName || '', sm: lookupSm(smMap, 'EXPO', r.ExpoName || '', r.Leader || ''), name: r.NamaPromotor }), 'EXPO'),
    tmap, 'EXPO'
  )

  const cards: CardData[] = []
  if (regularLeaves.length > 0) cards.push({ title: 'Reguler', leaves: regularLeaves })
  if (fiveGLeaves.length > 0) cards.push({ title: '5G Package', leaves: fiveGLeaves })
  return cards
}

const CHART_LABEL_LENGTH = 16

function truncateLabel(name: string) {
  return name.length > CHART_LABEL_LENGTH ? name.slice(0, CHART_LABEL_LENGTH - 1) + '\u2026' : name
}

export interface AchievementChartData {
  crrChart: { name: string; achievement: number; target: number }[]
  storeChart: { name: string; achievement: number; target: number }[]
  distributionDonut: { name: string; value: number }[]
}

export function computeAchievementCharts(cards: CardData[]): AchievementChartData {
  const allLeaves = cards.flatMap(c => c.leaves)

  const crrChart = [...allLeaves]
    .sort((a, b) => b.pct - a.pct)
    .map(l => ({
      name: l.name,
      achievement: l.achievement,
      target: l.target,
    }))

  const storeMap = new Map<string, { ach: number; tgt: number }>()
  for (const l of allLeaves) {
    const s = storeMap.get(l.store) || { ach: 0, tgt: 0 }
    s.ach += l.achievement
    s.tgt += l.target
    storeMap.set(l.store, s)
  }
  const storeChart = Array.from(storeMap.entries())
    .map(([name, s]) => ({ name, achievement: s.ach, target: s.tgt }))
    .sort((a, b) => b.achievement - a.achievement)

  const distributionDonut = cards
    .map(c => ({ name: c.title, value: c.leaves.reduce((s, l) => s + l.achievement, 0) }))
    .filter(d => d.value > 0)

  return { crrChart, storeChart, distributionDonut }
}
