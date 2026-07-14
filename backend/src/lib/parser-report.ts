import * as XLSX from 'xlsx';

export interface ReportBreakdown {
  product: string
  target: number
  achievement: number
  gap: number
  achievementPct: number
}

export interface CrrReportRow {
  storeName: string
  storeManager: string
  crrName: string
  dailyActivity: number[]
  instore?: number
  merchant?: number
  achievement: number
  target: number
  gap: number
  dailyAch?: number
  proyeksi?: number
  dailyTarget?: number
  tMda?: number
  aMda?: number
  pctMda: number
  products: ReportBreakdown[]
}

export interface WoReportRow {
  storeName: string
  storeManager: string
  agentName: string
  dailyActivity: number[]
  prio?: number
  merchant?: number
  achievement: number
  target: number
  gap: number
  dailyAch?: number
  proyeksi?: number
  dailyTarget?: number
  tMda?: number
  aMda?: number
  pctMda: number
  products: ReportBreakdown[]
}

export interface ExpoReportRow {
  storeName: string
  promotorName: string
  dailyActivity: number[]
  achievement: number
  target: number
  gap: number
  dailyAch?: number
  proyeksi?: number
  dailyTarget?: number
  tMda?: number
  aMda?: number
  pctMda: number
  products: ReportBreakdown[]
}

export interface StoreMasterRow {
  no: number
  storeName: string
  region: string
  headRegion: string
  rse: string
  slocDesc?: string
  brand: string
  xlSatuProduct: string
  hcWi: number
  hcWo: number
  targetPrioMei: number
  targetPrioJuni: number
  perCrr: number
}

export interface RankingRow {
  section: 'CRR' | 'WO' | 'EXPO'
  storeName: string
  name: string
  achievement: number
  pctMda?: number
  rank: number
}

interface ParsedReport {
  xlcReport: CrrReportRow[]
  gsfReport: CrrReportRow[]
  woReport: WoReportRow[]
  expoReport: ExpoReportRow[]
  storeMaster: StoreMasterRow[]
  ranking: RankingRow[]
}

// Column indices in the XLC&GSF / WO / EXPO sheets (0-based)
const IDX_STORE = 0
const IDX_MANAGER = 1
const IDX_PERSON = 2
const IDX_DAILY_START = 3
const IDX_DAILY_END = 33 // 31 days: columns 3-33
const IDX_INSTORE = 34
const IDX_MERCHANT = 35
const IDX_ACHIEVEMENT = 36
const IDX_TARGET = 37
const IDX_GAP = 38
const IDX_DAILY_ACH = 39
const IDX_PROYEKSI = 40
const IDX_DAILY_TARGET = 41
const IDX_T_MDA = 42
const IDX_A_MDA = 43
const IDX_PCT_MDA = 44
const IDX_PRODUCT_NAME = 46
const IDX_PRODUCT_TARGET = 47
const IDX_PRODUCT_ACHIEVE = 48
const IDX_PRODUCT_GAP = 49
const IDX_PRODUCT_ACH = 50

function getDailyActivity(row: any[]): number[] {
  const activity: number[] = []
  for (let i = IDX_DAILY_START; i <= IDX_DAILY_END; i++) {
    const v = row[i]
    activity.push(v != null && v !== '' && v !== 'NULL' ? 1 : 0)
  }
  return activity
}

function getProducts(data: any[][], startRow: number): ReportBreakdown[] {
  const products: ReportBreakdown[] = []
  for (let i = startRow + 1; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[0] || !r[IDX_PRODUCT_NAME]) break
    const name = String(r[IDX_PRODUCT_NAME]).trim()
    if (name === 'Grand Total' || name === '(blank)') continue
    products.push({
      product: name,
      target: Number(r[IDX_PRODUCT_TARGET] ?? 0) || 0,
      achievement: Number(r[IDX_PRODUCT_ACHIEVE] ?? 0) || 0,
      gap: Number(r[IDX_PRODUCT_GAP] ?? 0) || 0,
      achievementPct: Number(r[IDX_PRODUCT_ACH] ?? 0) || 0,
    })
  }
  return products
}

function parseCrrRows(data: any[][]): { rows: CrrReportRow[]; lastDataRow: number } {
  const rows: CrrReportRow[] = []
  let lastDataRow = 0
  for (let i = 2; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[0]) { lastDataRow = i; break }
    const store = String(r[IDX_STORE]).trim()
    if (store === 'Grand Total' || store === '(blank)' || store.startsWith('XLSatu')) { lastDataRow = i; break }
    rows.push({
      storeName: store,
      storeManager: String(r[IDX_MANAGER] ?? '').trim(),
      crrName: String(r[IDX_PERSON] ?? '').trim(),
      dailyActivity: getDailyActivity(r),
      instore: Number(r[IDX_INSTORE] ?? 0) || 0,
      merchant: Number(r[IDX_MERCHANT] ?? 0) || 0,
      achievement: Number(r[IDX_ACHIEVEMENT] ?? 0) || 0,
      target: Number(r[IDX_TARGET] ?? 0) || 0,
      gap: Number(r[IDX_GAP] ?? 0) || 0,
      dailyAch: Number(r[IDX_DAILY_ACH] ?? 0) || 0,
      proyeksi: Number(r[IDX_PROYEKSI] ?? 0) || 0,
      dailyTarget: Number(r[IDX_DAILY_TARGET] ?? 0) || 0,
      tMda: Number(r[IDX_T_MDA] ?? 0) || 0,
      aMda: Number(r[IDX_A_MDA] ?? 0) || 0,
      pctMda: Number(r[IDX_PCT_MDA] ?? 0) || 0,
      products: [],
    })
    lastDataRow = i
  }
  // Parse product breakdowns after the main rows
  const productBreakdowns = getProducts(data, lastDataRow)
  if (productBreakdowns.length > 0 && rows.length > 0) {
    rows[rows.length - 1].products = productBreakdowns
  }
  return { rows, lastDataRow }
}

function parseXLCAndGSF(ws: XLSX.WorkSheet): { xlcReport: CrrReportRow[]; gsfReport: CrrReportRow[] } {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const xlc: CrrReportRow[] = []
  const gsf: CrrReportRow[] = []

  for (let i = 2; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[0]) break
    const store = String(r[IDX_STORE]).trim()
    if (store === 'Grand Total' || store === '(blank)' || store.startsWith('XLSatu')) break
    if (store === 'XL Center / Galeri' || store === 'Product' || store === 'Postpaid') continue

    const person = String(r[IDX_PERSON] ?? '').trim()
    if (!person) continue

    const row: CrrReportRow = {
      storeName: store,
      storeManager: String(r[IDX_MANAGER] ?? '').trim(),
      crrName: person,
      dailyActivity: getDailyActivity(r),
      instore: Number(r[IDX_INSTORE] ?? 0) || 0,
      merchant: Number(r[IDX_MERCHANT] ?? 0) || 0,
      achievement: Number(r[IDX_ACHIEVEMENT] ?? 0) || 0,
      target: Number(r[IDX_TARGET] ?? 0) || 0,
      gap: Number(r[IDX_GAP] ?? 0) || 0,
      dailyAch: Number(r[IDX_DAILY_ACH] ?? 0) || 0,
      proyeksi: Number(r[IDX_PROYEKSI] ?? 0) || 0,
      dailyTarget: Number(r[IDX_DAILY_TARGET] ?? 0) || 0,
      tMda: Number(r[IDX_T_MDA] ?? 0) || 0,
      aMda: Number(r[IDX_A_MDA] ?? 0) || 0,
      pctMda: Number(r[IDX_PCT_MDA] ?? 0) || 0,
      products: [],
    }
    // Also check for inline product row data in same row
    if (r[IDX_PRODUCT_NAME]) {
      row.products.push({
        product: String(r[IDX_PRODUCT_NAME]).trim(),
        target: Number(r[IDX_PRODUCT_TARGET] ?? 0) || 0,
        achievement: Number(r[IDX_PRODUCT_ACHIEVE] ?? 0) || 0,
        gap: Number(r[IDX_PRODUCT_GAP] ?? 0) || 0,
        achievementPct: Number(r[IDX_PRODUCT_ACH] ?? 0) || 0,
      })
    }

    if (store.startsWith('GSF') || store.startsWith('Smile')) {
      gsf.push(row)
    } else {
      xlc.push(row)
    }
  }

  // Parse product breakdowns (separate rows after main data)
  const productBreakdowns = getProducts(data, data.length)
  if (productBreakdowns.length > 0) {
    const all = [...xlc, ...gsf]
    if (all.length > 0) {
      all[all.length - 1].products = productBreakdowns
    }
  }

  return { xlcReport: xlc, gsfReport: gsf }
}

function parseWOSheet(ws: XLSX.WorkSheet): WoReportRow[] {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const rows: WoReportRow[] = []

  for (let i = 2; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[0]) break
    const store = String(r[IDX_STORE]).trim()
    if (store === 'Grand Total' || store === '(blank)' || !store) break
    const agent = String(r[2] ?? '').trim()
    if (!agent || agent === 'Vacant' || agent === 'NULL') continue

    rows.push({
      storeName: store,
      storeManager: String(r[1] ?? '').trim(),
      agentName: agent,
      dailyActivity: getDailyActivity(r),
      prio: Number(r[34] ?? 0) || 0,
      merchant: Number(r[35] ?? 0) || 0,
      achievement: Number(r[36] ?? 0) || 0,
      target: Number(r[37] ?? 0) || 0,
      gap: Number(r[38] ?? 0) || 0,
      dailyAch: Number(r[39] ?? 0) || 0,
      proyeksi: Number(r[40] ?? 0) || 0,
      dailyTarget: Number(r[41] ?? 0) || 0,
      tMda: Number(r[42] ?? 0) || 0,
      aMda: Number(r[43] ?? 0) || 0,
      pctMda: Number(r[44] ?? 0) || 0,
      products: [],
    })
  }

  const productBreakdowns = getProducts(data, data.length)
  if (productBreakdowns.length > 0 && rows.length > 0) {
    rows[rows.length - 1].products = productBreakdowns
  }

  return rows
}

function parseEXPOSheet(ws: XLSX.WorkSheet): ExpoReportRow[] {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const rows: ExpoReportRow[] = []

  for (let i = 2; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[0]) break
    const store = String(r[0]).trim()
    if (store === 'Grand Total' || store === '(blank)' || !store) break
    const promotor = String(r[1] ?? '').trim()
    if (!promotor || promotor === 'NULL') continue

    rows.push({
      storeName: store,
      promotorName: promotor,
      dailyActivity: getDailyActivity(r),
      achievement: Number(r[33] ?? 0) || 0,
      target: Number(r[34] ?? 0) || 0,
      gap: Number(r[35] ?? 0) || 0,
      dailyAch: Number(r[39] ?? 0) || 0,
      proyeksi: Number(r[36] ?? 0) || 0,
      dailyTarget: Number(r[37] ?? 0) || 0,
      tMda: Number(r[38] ?? 0) || 0,
      aMda: Number(r[39] ?? 0) || 0,
      pctMda: Number(r[40] ?? 0) || 0,
      products: [],
    })
  }

  const productBreakdowns = getProducts(data, data.length)
  if (productBreakdowns.length > 0 && rows.length > 0) {
    rows[rows.length - 1].products = productBreakdowns
  }

  return rows
}

function parseSheet1(ws: XLSX.WorkSheet): StoreMasterRow[] {
  const json = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return json
    .filter((r: any) => r['Store Name'] && r['No'])
    .map((r: any) => ({
      no: Number(r['No']),
      storeName: String(r['Store Name']).trim(),
      region: String(r['Region'] ?? '').trim(),
      headRegion: String(r['Head Region'] ?? r['Head\r\nRegion'] ?? '').trim(),
      rse: String(r['RSE'] ?? '').trim(),
      slocDesc: String(r['Sloc Desc'] ?? '').trim() || undefined,
      brand: String(r['Brand'] ?? '').trim(),
      xlSatuProduct: String(r['XL Satu'] ?? '').trim(),
      hcWi: Number(r['HC WI'] ?? 0) || 0,
      hcWo: Number(r['HC WO'] ?? 0) || 0,
      targetPrioMei: Number(r['Target Prio \r\nWI Mei'] ?? r['Target Prio WI Mei'] ?? 0) || 0,
      targetPrioJuni: Number(r['Target Prio \r\nWI Juni'] ?? r['Target Prio WI Juni'] ?? 0) || 0,
      perCrr: Number(r['PerCRR'] ?? 0) || 0,
    }))
}

function parseSheet2(ws: XLSX.WorkSheet): RankingRow[] {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const rankings: RankingRow[] = []

  // First section: CRR ranking (cols 0-4)
  for (let i = 1; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[0]) break
    const store = String(r[0]).trim()
    if (store === 'Grand Total' || store === '(blank)') break
    const rank = Number(r[4] ?? 0) || 0
    if (!rank) continue
    rankings.push({
      section: 'CRR',
      storeName: store,
      name: String(r[1] ?? '').trim(),
      achievement: Number(r[2] ?? 0) || 0,
      pctMda: Number(r[3] ?? 0) || 0,
      rank,
    })
  }

  // Second section: WO ranking (cols 6-9)
  for (let i = 1; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[6]) break
    const store = String(r[6]).trim()
    if (store === 'Grand Total' || store === '(blank)') break
    const rank = Number(r[9] ?? 0) || 0
    if (!rank) continue
    rankings.push({
      section: 'WO',
      storeName: store,
      name: String(r[7] ?? '').trim(),
      achievement: Number(r[8] ?? 0) || 0,
      rank,
    })
  }

  // Third section: EXPO ranking (cols 12-15)
  for (let i = 1; i < data.length; i++) {
    const r = data[i]
    if (!r || !r[12]) break
    const store = String(r[12]).trim()
    if (store === 'Grand Total' || store === '(blank)') break
    rankings.push({
      section: 'EXPO',
      storeName: store,
      name: String(r[13] ?? '').trim(),
      achievement: Number(r[14] ?? 0) || 0,
      pctMda: Number(r[15] ?? 0) || 0,
      rank: rankings.filter(ri => ri.section === 'EXPO').length + 1,
    })
  }

  return rankings
}

export function parseReport(workbook: XLSX.WorkBook): ParsedReport {
  const result: ParsedReport = {
    xlcReport: [],
    gsfReport: [],
    woReport: [],
    expoReport: [],
    storeMaster: [],
    ranking: [],
  }

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName]
    if (!ws) continue

    switch (sheetName) {
      case 'XLC&GSF':
      case 'XLC & GSF': {
        const { xlcReport, gsfReport } = parseXLCAndGSF(ws)
        result.xlcReport = xlcReport
        result.gsfReport = gsfReport
        break
      }
      case 'WO':
        result.woReport = parseWOSheet(ws)
        break
      case 'EXPO':
        result.expoReport = parseEXPOSheet(ws)
        break
      case 'Sheet1':
        result.storeMaster = parseSheet1(ws)
        break
      case 'Sheet2':
        result.ranking = parseSheet2(ws)
        break
    }
  }

  return result
}

export function detectReportFile(workbook: XLSX.WorkBook): boolean {
  return workbook.SheetNames.some((name) =>
    ['XLC&GSF', 'XLC & GSF'].includes(name)
  )
}
