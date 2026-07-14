import * as XLSX from 'xlsx'
import type { Promotor } from '../data'

export function parsePromotor(ws: XLSX.WorkSheet): Promotor[] {
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const result: Promotor[] = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0]) continue
    if (String(r[0]).trim() !== 'Nama Promotor') continue
    const headers = r
    for (let j = i + 1; j < rows.length; j++) {
      const row = rows[j]
      if (!row || !row[0]) break
      const name = String(row[0]).trim()
      if (name === 'Grand Total') break
      if (name === '(blank)') continue
      const entry: Promotor = { NamaPromotor: name }
      for (let k = 1; k < headers.length; k++) {
        if (headers[k] != null && !['Grand Total', '(blank)'].includes(String(headers[k]).trim())) {
          const key = String(headers[k]).trim()
          entry[key] = Number(row[k] ?? 0) || 0
        }
      }
      result.push(entry)
    }
    break
  }
  return result
}
