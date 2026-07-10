import { parseDate } from './parse'
import { formatDateKey, getWeekKey, getMonthKey, getYearKey, type TimeMode } from './keys'

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
      d.setDate(d.getDate() + (7 - (d.getDay() || 7)))
      return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
    }
    case 'monthly': return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
    case 'yearly': return new Date(date.getFullYear(), 11, 31, 23, 59, 59)
  }
}

export function getPreviousPeriodKey(key: string, mode: TimeMode): string | null {
  const d = parseDate(key)
  if (!d) return null
  switch (mode) {
    case 'daily': { d.setDate(d.getDate() - 1); return formatDateKey(d) }
    case 'weekly': { d.setDate(d.getDate() - 7); return getWeekKey(d) }
    case 'monthly': { d.setMonth(d.getMonth() - 1); return getMonthKey(d) }
    case 'yearly': { d.setFullYear(d.getFullYear() - 1); return getYearKey(d) }
  }
}
