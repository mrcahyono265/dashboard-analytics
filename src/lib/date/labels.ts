import { parseDate } from './parse'
import type { TimeMode } from './keys'

export function formatTimeLabel(key: string, mode: TimeMode): string {
  switch (mode) {
    case 'daily': {
      const d = parseDate(key)
      return d ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : key
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

export function getTimeLabel(mode: TimeMode): string {
  const labels: Record<TimeMode, string> = {
    daily: 'Hari Ini',
    weekly: 'Minggu Ini',
    monthly: 'Bulan Ini',
    yearly: 'Tahun Ini',
  }
  return labels[mode]
}
