export function formatExcelDate(value: any): string {
  if (value == null) return ''
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return String(value)
    return value.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  }
  const num = Number(value)
  if (isNaN(num) || num < 1) return String(value)
  try {
    const date = new Date((num - 25569) * 86400000)
    if (isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return String(value)
  }
}
