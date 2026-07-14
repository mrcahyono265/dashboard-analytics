const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11,
}

function getMonthIndex(str: string): number | undefined {
  return MONTH_MAP[str.toLowerCase()]
}

export function parseDate(str: string | null | undefined): Date | null {
  if (!str || typeof str !== 'string') return null
  const s = str.trim()
  if (!s) return null

  // DD/MM/YYYY, HH.MM
  const dmyDot = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2})[.:](\d{2})/)
  if (dmyDot) {
    const d = new Date(parseInt(dmyDot[3]), parseInt(dmyDot[2]) - 1, parseInt(dmyDot[1]), parseInt(dmyDot[4]), parseInt(dmyDot[5]))
    if (!isNaN(d.getTime())) return d
  }

  // DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) {
    const d = new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]))
    if (!isNaN(d.getTime())) return d
  }

  // "15 Jan 2024, 08:30"
  const dMonY = s.match(/^(\d{1,2})\s+(\w{3,})\s+(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/)
  if (dMonY) {
    const mi = getMonthIndex(dMonY[2])
    if (mi !== undefined) {
      const d = new Date(parseInt(dMonY[3]), mi, parseInt(dMonY[1]), dMonY[4] ? parseInt(dMonY[4]) : 0, dMonY[5] ? parseInt(dMonY[5]) : 0)
      if (!isNaN(d.getTime())) return d
    }
  }

  // "Januari 2024" or "Jan-24"
  const monY3 = s.match(/^(\w{3,})\s+(\d{4})$/)
  if (monY3) {
    const mi = getMonthIndex(monY3[1])
    if (mi !== undefined) {
      const d = new Date(parseInt(monY3[2]), mi, 1)
      if (!isNaN(d.getTime())) return d
    }
  }

  const shortMonY = s.match(/^(\w{3})-(\d{2,4})$/)
  if (shortMonY) {
    const mi = getMonthIndex(shortMonY[1])
    if (mi !== undefined) {
      let year = parseInt(shortMonY[2])
      if (year < 100) year += 2000
      const d = new Date(year, mi, 1)
      if (!isNaN(d.getTime())) return d
    }
  }

  // ISO: "2024-01-15"
  const iso = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (iso) {
    const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, iso[3] ? parseInt(iso[3]) : 1)
    if (!isNaN(d.getTime())) return d
  }

  // Numeric: "01/2024"
  const numMY = s.match(/^(\d{1,2})\/(\d{4})$/)
  if (numMY) {
    const d = new Date(parseInt(numMY[2]), parseInt(numMY[1]) - 1, 1)
    if (!isNaN(d.getTime())) return d
  }

  const native = new Date(s)
  if (!isNaN(native.getTime())) return native

  return null
}
