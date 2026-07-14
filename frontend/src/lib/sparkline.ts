const MONTH_MAP: Record<string, string> = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
  juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
}

function parseBulan(str: string): Date | null {
  if (!str) return null

  const shortMatch = str.match(/^([A-Za-z]{3})-(\d{2,4})$/)
  if (shortMatch) {
    const month = MONTH_MAP[shortMatch[1].toLowerCase()]
    let year = shortMatch[2]
    if (year.length === 2) year = '20' + year
    if (month) return new Date(parseInt(year), parseInt(month) - 1, 1)
  }

  const fullMatch = str.match(/^([A-Za-z]+)\s+(\d{4})$/)
  if (fullMatch) {
    const month = MONTH_MAP[fullMatch[1].toLowerCase()]
    if (month) return new Date(parseInt(fullMatch[2]), parseInt(month) - 1, 1)
  }

  const numMatch = str.match(/^(\d{1,2})[/-](\d{4})$/)
  if (numMatch) {
    return new Date(parseInt(numMatch[2]), parseInt(numMatch[1]) - 1, 1)
  }

  const isoMatch = str.match(/^(\d{4})-(\d{2})/)
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, 1)
  }

  return null
}

export function computeMonthlySparkline<T extends Record<string, any>>(
  data: T[],
  extractValue: (item: T) => number,
): { value: number }[] {
  const monthly: Record<string, number> = {}

  for (const item of data) {
    const bulan = item.Bulan ?? item.bulan
    if (bulan == null) continue
    monthly[bulan] = (monthly[bulan] ?? 0) + extractValue(item)
  }

  const sorted = Object.entries(monthly).sort(([a], [b]) => {
    const da = parseBulan(a)
    const db = parseBulan(b)
    if (da && db) return da.getTime() - db.getTime()
    if (da && !db) return -1
    if (!da && db) return 1
    return a.localeCompare(b)
  })

  return sorted.map(([, v]) => ({ value: v }))
}
