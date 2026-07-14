import * as XLSX from 'xlsx'
import type { ELITE } from '../data'

export function parseELITE(ws: XLSX.WorkSheet): ELITE[] {
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const result: ELITE[] = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    if (!r || !r[0]) continue
    if (String(r[0]).trim() === 'OPERATOR' && String(r[1]).trim() === 'New Connection') {
      for (let j = i + 1; j < rows.length; j++) {
        const row = rows[j]
        if (!row || !row[0]) break
        const op = String(row[0]).trim()
        if (op === 'Grand Total' || op === '(blank)') break
        result.push({
          Operator: op,
          NewConnection: Number(row[1] ?? 0),
          PrepaidToPostpaid: Number(row[2] ?? 0),
          GrandTotal: Number(row[3] ?? 0),
        })
      }
      break
    }
  }
  return result
}
