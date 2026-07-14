interface Props {
  period: string
  onChange: (period: string) => void
  availablePeriods: string[]
}

const MONTHS = [
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' },
]

export function PeriodFilter({ period, onChange, availablePeriods }: Props) {
  const parts = period.split('-')
  const year = parts[0] || String(new Date().getFullYear())
  const month = parts[1] || String(new Date().getMonth() + 1).padStart(2, '0')

  const years = availablePeriods.length > 0
    ? [...new Set(availablePeriods.map(p => p.split('-')[0]))].sort()
    : [String(new Date().getFullYear())]

  const selectClass = 'px-3 py-1.5 text-xs bg-surface-container border border-outline-variant rounded-lg focus:outline-none cursor-pointer text-on-surface'

  return (
    <div className="flex items-center gap-2">
      <select
        value={month}
        onChange={e => onChange(`${year}-${e.target.value}`)}
        className={selectClass}
      >
        {MONTHS.map(m => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        value={year}
        onChange={e => onChange(`${e.target.value}-${month}`)}
        className={selectClass}
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
