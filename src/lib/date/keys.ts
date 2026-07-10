export type TimeMode = 'daily' | 'weekly' | 'monthly' | 'yearly'

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

export function getTimeKey(date: Date, mode: TimeMode): string {
  switch (mode) {
    case 'daily': return formatDateKey(date)
    case 'weekly': return getWeekKey(date)
    case 'monthly': return getMonthKey(date)
    case 'yearly': return getYearKey(date)
  }
}

export function getTodayKey(): string { return formatDateKey(new Date()) }
export function getThisWeekKey(): string { return getWeekKey(new Date()) }
export function getThisMonthKey(): string { return getMonthKey(new Date()) }
