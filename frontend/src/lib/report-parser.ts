import * as XLSX from 'xlsx'
import type { CrrReportRow, WoReportRow, ExpoReportRow, ReportData } from './data'

function parseRow(row: any[], colMap: Record<string, number>): number | null {
  for (const key of Object.keys(colMap)) {
    if (colMap[key] >= 0 && colMap[key] < row.length) {
      const v = row[colMap[key]]
      if (v != null && v !== '') return Number(v)
    }
  }
  return null
}

export function parseReportData(wb: XLSX.WorkBook): ReportData {
  const xlcReport = parseXLCGSF(wb.Sheets['XLC&GSF'])
  const woReport = parseWOSheet(wb.Sheets['WO'])
  const expoReport = parseEXPOSheet(wb.Sheets['EXPO'])
  const storeMaster = parseStoreMaster(wb.Sheets['Sheet1'])
  const ranking = parseRanking(wb.Sheets['Sheet2'])

  return { xlcReport, gsfReport: [], woReport, expoReport, storeMaster, ranking }
}

function findHeaderRow(ws: XLSX.WorkSheet, keyCol: string): { rows: any[][]; headerIdx: number } {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  let headerIdx = -1
  for (let i = 0; i < data.length; i++) {
    if (String(data[i]?.[0] ?? '').trim() === keyCol) { headerIdx = i; break }
  }
  return { rows: data, headerIdx }
}

function parseXLCGSF(ws: XLSX.WorkSheet): CrrReportRow[] {
  const { rows, headerIdx } = findHeaderRow(ws, 'XL Center / Galeri')
  if (headerIdx < 0) return []

  const isStoreMgrOrCRR = (v: any) => {
    const s = String(v ?? '').trim()
    return s && !s.match(/^\d+(\.\d+)?$/)
  }

  const crrMap = new Map<string, CrrReportRow & { productRows: number[] }>()
  const seenOrder: string[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue

    const store = String(row[0] ?? '').trim()
    if (!store || store === 'Grand Total' || store === '(blank)' || store === 'XL Center / Galeri') continue

    const manager = isStoreMgrOrCRR(row[1]) ? String(row[1]).trim() : ''
    const crrName = isStoreMgrOrCRR(row[2]) ? String(row[2]).trim() : ''

    const dailyActivity: number[] = []
    for (let d = 3; d <= 33; d++) {
      dailyActivity.push(Number(row[d] ?? 0))
    }

    const instore = Number(row[34] ?? 0) || undefined
    const merchant = Number(row[35] ?? 0) || undefined
    const achievement = Number(row[36] ?? 0)
    const target = Number(row[37] ?? 0)
    const gap = Number(row[38] ?? 0)
    const dailyAch = Number(row[39] ?? 0) || undefined
    const proyeksi = Number(row[40] ?? 0) || undefined
    const dailyTarget = Number(row[41] ?? 0) || undefined
    const tMda = Number(row[42] ?? 0) || undefined
    const aMda = Number(row[43] ?? 0) || undefined
    const pctMda = Number(row[44] ?? 0)
    const product = String(row[46] ?? '').trim()
    const prodTarget = Number(row[47] ?? 0)
    const prodAch = Number(row[48] ?? 0)
    const prodGap = Number(row[49] ?? 0)
    const prodPct = Number(row[50] ?? 0)

    const key = `${store}|${crrName}`
    if (!crrMap.has(key)) {
      crrMap.set(key, {
        storeName: store, storeManager: manager, crrName,
        dailyActivity, instore, merchant,
        achievement, target, gap, dailyAch, proyeksi, dailyTarget, tMda, aMda, pctMda,
        products: [],
        productRows: [],
      })
      seenOrder.push(key)
    }

    if (product && product !== 'Grand Total') {
      const existing = crrMap.get(key)!
      existing.products.push({
        product: product === 'Total' ? 'Total' : product,
        target: prodTarget, achievement: prodAch, gap: prodGap,
        achievementPct: prodPct,
      })
    }
  }

  return seenOrder.map((key) => {
    const { productRows: _, ...rest } = crrMap.get(key)!
    return rest
  })
}

function parseWOSheet(ws: XLSX.WorkSheet): WoReportRow[] {
  const { rows, headerIdx } = findHeaderRow(ws, 'XL Center / Galeri')
  if (headerIdx < 0) return []

  const map = new Map<string, WoReportRow & { productRows: number[] }>()
  const seenOrder: string[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue

    const store = String(row[0] ?? '').trim()
    if (!store || store === 'Grand Total' || store === '(blank)' || store === 'XL Center / Galeri') continue

    const manager = String(row[1] ?? '').trim()
    const agent = String(row[2] ?? '').trim()
    if (!agent) continue

    const dailyActivity: number[] = []
    for (let d = 3; d <= 33; d++) dailyActivity.push(Number(row[d] ?? 0))

    const prio = Number(row[34] ?? 0) || undefined
    const merchant = Number(row[35] ?? 0) || undefined
    const achievement = Number(row[36] ?? 0)
    const target = Number(row[37] ?? 0)
    const gap = Number(row[38] ?? 0)
    const dailyAch = Number(row[39] ?? 0) || undefined
    const proyeksi = Number(row[40] ?? 0) || undefined
    const dailyTarget = Number(row[41] ?? 0) || undefined
    const tMda = Number(row[42] ?? 0) || undefined
    const aMda = Number(row[43] ?? 0) || undefined
    const pctMda = Number(row[44] ?? 0)

    const product = String(row[46] ?? '').trim()
    const prodTarget = Number(row[47] ?? 0)
    const prodAch = Number(row[48] ?? 0)
    const prodGap = Number(row[49] ?? 0)
    const prodPct = Number(row[50] ?? 0)

    const key = `${store}|${agent}`
    if (!map.has(key)) {
      map.set(key, {
        storeName: store, storeManager: manager, agentName: agent,
        dailyActivity, prio, merchant,
        achievement, target, gap, dailyAch, proyeksi, dailyTarget, tMda, aMda, pctMda,
        products: [],
        productRows: [],
      })
      seenOrder.push(key)
    }

    if (product && product !== 'Grand Total') {
      const existing = map.get(key)!
      existing.products.push({
        product: product === 'Total' ? 'Total' : product,
        target: prodTarget, achievement: prodAch, gap: prodGap,
        achievementPct: prodPct,
      })
    }
  }

  return seenOrder.map((key) => {
    const { productRows: _, ...rest } = map.get(key)!
    return rest
  })
}

function parseEXPOSheet(ws: XLSX.WorkSheet): ExpoReportRow[] {
  const { rows, headerIdx } = findHeaderRow(ws, 'XL Center / Galeri')
  if (headerIdx < 0) return []

  const map = new Map<string, ExpoReportRow & { productRows: number[] }>()
  const seenOrder: string[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[0]) continue

    const store = String(row[0] ?? '').trim()
    if (!store || store === 'Grand Total' || store === '(blank)' || store === 'XL Center / Galeri') continue

    const promotor = String(row[1] ?? '').trim()
    if (!promotor) continue

    const dailyActivity: number[] = []
    for (let d = 2; d <= 32; d++) dailyActivity.push(Number(row[d] ?? 0))

    const achievement = Number(row[33] ?? 0)
    const target = Number(row[34] ?? 0)
    const gap = Number(row[35] ?? 0)
    const dailyAch = Number(row[36] ?? 0) || undefined
    const proyeksi = Number(row[37] ?? 0) || undefined
    const dailyTarget = Number(row[38] ?? 0) || undefined
    const tMda = Number(row[39] ?? 0) || undefined
    const aMda = Number(row[40] ?? 0) || undefined
    const pctMda = Number(row[41] ?? 0)

    const product = String(row[43] ?? '').trim()
    const prodTarget = Number(row[44] ?? 0)
    const prodAch = Number(row[45] ?? 0)
    const prodGap = Number(row[46] ?? 0)
    const prodPct = Number(row[47] ?? 0)

    const key = `${store}|${promotor}`
    if (!map.has(key)) {
      map.set(key, {
        storeName: store, promotorName: promotor,
        dailyActivity, achievement, target, gap,
        dailyAch, proyeksi, dailyTarget, tMda, aMda, pctMda,
        products: [],
        productRows: [],
      })
      seenOrder.push(key)
    }

    if (product && product !== 'Grand Total') {
      const existing = map.get(key)!
      existing.products.push({
        product: product === 'Total' ? 'Total' : product,
        target: prodTarget, achievement: prodAch, gap: prodGap,
        achievementPct: prodPct,
      })
    }
  }

  return seenOrder.map((key) => {
    const { productRows: _, ...rest } = map.get(key)!
    return rest
  })
}

function parseStoreMaster(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const result: any[] = []
  let started = false
  for (const row of data) {
    if (!row || !row[0]) continue
    if (!started) {
      if (String(row[0]).trim() === 'No') { started = true }
      continue
    }
    if (typeof row[0] === 'number' && row[1]) {
      result.push({
        no: row[0], storeName: String(row[1]).trim(),
        region: String(row[2] ?? '').trim(), headRegion: String(row[3] ?? '').trim(),
        rse: String(row[4] ?? '').trim(), brand: String(row[6] ?? '').trim(),
        xlSatuProduct: String(row[7] ?? '').trim(),
        hcWi: Number(row[8] ?? 0), hcWo: Number(row[9] ?? 0),
        targetPrioMei: Number(row[10] ?? 0), targetPrioJuni: Number(row[11] ?? 0),
        perCrr: Number(row[12] ?? 0),
      })
    }
  }
  return result
}

function parseRanking(ws: XLSX.WorkSheet) {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const result: any[] = []
  for (const row of data) {
    if (!row || !row[0]) continue
    if (String(row[0]).trim() === 'XL Center / Galeri') continue
    if (!row[1]) continue

    const store = String(row[0]).trim()
    const name = String(row[1]).trim()
    const achievement = Number(row[2] ?? 0)
    const pctMda = Number(row[3] ?? 0)
    const rank = Number(row[4] ?? 0)

    if (name && rank > 0) {
      result.push({ section: 'CRR' as const, storeName: store, name, achievement, pctMda, rank })
    }

    if (row[7]) {
      const woStore = String(row[7]).trim()
      const woName = String(row[8]).trim()
      const woPrio = Number(row[9] ?? 0)
      const woRank = Number(row[10] ?? 0)
      if (woName && woRank > 0) {
        result.push({ section: 'WO' as const, storeName: woStore, name: woName, achievement: woPrio, rank: woRank })
      }
    }

    if (row[12]) {
      const expoStore = String(row[12]).trim()
      const expoName = String(row[13]).trim()
      const expoAch = Number(row[14] ?? 0)
      const expoPct = Number(row[15] ?? 0)
      if (expoName && expoAch > 0) {
        const expoRank = result.filter(r => r.section === 'EXPO').length + 1
        result.push({ section: 'EXPO' as const, storeName: expoStore, name: expoName, achievement: expoAch, pctMda: expoPct, rank: expoRank })
      }
    }
  }
  return result
}
