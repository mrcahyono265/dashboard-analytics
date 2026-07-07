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

  // formatExcelDate output: "15/01/2024, 08.30" or "15 Jan 2024, 08:30"
  // Try DD/MM/YYYY, HH.MM
  const dmyDot = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2})[.:](\d{2})/)
  if (dmyDot) {
    const d = new Date(parseInt(dmyDot[3]), parseInt(dmyDot[2]) - 1, parseInt(dmyDot[1]), parseInt(dmyDot[4]), parseInt(dmyDot[5]))
    if (!isNaN(d.getTime())) return d
  }

  // DD/MM/YYYY (no time)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (dmy) {
    const d = new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]))
    if (!isNaN(d.getTime())) return d
  }

  // "15 Jan 2024, 08:30" or "15 Jan 2024"
  const dMonY = s.match(/^(\d{1,2})\s+(\w{3,})\s+(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/)
  if (dMonY) {
    const mi = getMonthIndex(dMonY[2])
    if (mi !== undefined) {
      const h = dMonY[4] ? parseInt(dMonY[4]) : 0
      const m = dMonY[5] ? parseInt(dMonY[5]) : 0
      const d = new Date(parseInt(dMonY[3]), mi, parseInt(dMonY[1]), h, m)
      if (!isNaN(d.getTime())) return d
    }
  }

  // "Januari 2024" or "Jan-24" or "Jan-2024" — month only, default day=1
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

  // ISO: "2024-01-15" or "2024-01"
  const iso = s.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/)
  if (iso) {
    const day = iso[3] ? parseInt(iso[3]) : 1
    const d = new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, day)
    if (!isNaN(d.getTime())) return d
  }

  // Numeric: "01/2024"
  const numMY = s.match(/^(\d{1,2})\/(\d{4})$/)
  if (numMY) {
    const d = new Date(parseInt(numMY[2]), parseInt(numMY[1]) - 1, 1)
    if (!isNaN(d.getTime())) return d
  }

  // Fallback: try native Date.parse
  const native = new Date(s)
  if (!isNaN(native.getTime())) return native

  return null
}

export function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function getYearKey(date: Date): string {
  return `${date.getFullYear()}`
}

export function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export type TimeMode = 'daily' | 'weekly' | 'monthly' | 'yearly'

export function getTimeKey(date: Date, mode: TimeMode): string {
  switch (mode) {
    case 'daily': return formatDateKey(date)
    case 'weekly': return getWeekKey(date)
    case 'monthly': return getMonthKey(date)
    case 'yearly': return getYearKey(date)
  }
}

export function formatTimeLabel(key: string, mode: TimeMode): string {
  switch (mode) {
    case 'daily': {
      const d = parseDate(key)
      if (d) return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
      return key
    }
    case 'weekly': {
      const [year, week] = key.split('-W')
      return `W${week} ${year}`
    }
    case 'monthly': {
      const [year, month] = key.split('-')
      const d = new Date(parseInt(year), parseInt(month) - 1, 1)
      return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })
    }
    case 'yearly': return key
    default: return key
  }
}

export function isDateInRange(dateStr: string, from: string, to: string): boolean {
  const d = parseDate(dateStr)
  if (!d) return false
  const f = parseDate(from)
  const t = parseDate(to)
  if (f && d < f) return false
  if (t) {
    const endOfDay = new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59)
    if (d > endOfDay) return false
  }
  return true
}

export function getStartOfPeriod(date: Date, mode: TimeMode): Date {
  switch (mode) {
    case 'daily': return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    case 'weekly': {
      const d = new Date(date)
      const day = d.getDay() || 7
      d.setDate(d.getDate() - day + 1)
      return new Date(d.getFullYear(), d.getMonth(), d.getDate())
    }
    case 'monthly': return new Date(date.getFullYear(), date.getMonth(), 1)
    case 'yearly': return new Date(date.getFullYear(), 0, 1)
  }
}

export function getEndOfPeriod(date: Date, mode: TimeMode): Date {
  switch (mode) {
    case 'daily': return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)
    case 'weekly': {
      const d = new Date(date)
      const day = d.getDay() || 7
      d.setDate(d.getDate() + (7 - day))
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
    }
    case 'monthly': return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    case 'yearly': return new Date(date.getFullYear(), 11, 31, 23, 59, 59)
  }
}

export function getTodayKey(): string {
  return formatDateKey(new Date())
}

export function getThisWeekKey(): string {
  return getWeekKey(new Date())
}

export function getThisMonthKey(): string {
  return getMonthKey(new Date())
}

export function getPreviousPeriodKey(key: string, mode: TimeMode): string | null {
  const d = parseDate(key)
  if (!d) return null
  switch (mode) {
    case 'daily': {
      d.setDate(d.getDate() - 1)
      return formatDateKey(d)
    }
    case 'weekly': {
      d.setDate(d.getDate() - 7)
      return getWeekKey(d)
    }
    case 'monthly': {
      d.setMonth(d.getMonth() - 1)
      return getMonthKey(d)
    }
    case 'yearly': {
      d.setFullYear(d.getFullYear() - 1)
      return getYearKey(d)
    }
  }
}
