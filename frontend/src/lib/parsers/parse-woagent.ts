import * as XLSX from 'xlsx'
import type { WOAgentItem } from '../data'

export function parseWOAgent(ws: XLSX.WorkSheet): WOAgentItem[] {
  const data = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null })
  const result: WOAgentItem[] = []
  let inAgentSection = false

  for (const row of data) {
    if (!row || !row[0]) continue
    const col0 = String(row[0]).trim()

    if (col0 === 'Agent WO') { inAgentSection = true; continue }
    if (col0 === 'Grand Total') { inAgentSection = false; continue }
    if (col0 === '(blank)') continue

    if (inAgentSection && row[1] != null) {
      result.push({ agentName: col0, storeName: '', count: Number(row[1] ?? 0) })
    }
  }

  return result
}
