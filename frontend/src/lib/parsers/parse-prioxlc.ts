import * as XLSX from 'xlsx'
import type { PrioXLCItem } from '../data'

export function parsePrioXLC(ws: XLSX.WorkSheet): PrioXLCItem[] {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const result: PrioXLCItem[] = []

  let inStoreSection = false
  let inCrrSection = false

  for (const row of data) {
    if (!row || !row[0]) continue
    const col0 = String(row[0]).trim()

    if (col0 === 'Store Name') { inStoreSection = true; inCrrSection = false; continue }
    if (col0 === 'Nama CRR') { inStoreSection = false; inCrrSection = true; continue }
    if (col0 === 'Grand Total') continue
    if (col0 === '(blank)') continue
    if (col0.startsWith('Count of ')) continue

    if (inStoreSection && row[1] != null) {
      const count = Number(row[1])
      if (!isNaN(count)) result.push({ label: col0, count })
    } else if (inCrrSection && row[1] != null) {
      const count = Number(row[1])
      if (!isNaN(count)) result.push({ label: col0, count })
    }
  }

  return result
}
