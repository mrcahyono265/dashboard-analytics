import type { XLC, GSF, CrrReportRow, WoReportRow, ExpoReportRow, ReportData } from './data'

function extractDay(tanggal: string): number {
  const parts = tanggal.split(/[\s,/-]+/)
  const first = parseInt(parts[0], 10)
  if (!isNaN(first) && first >= 1 && first <= 31) return first
  return 0
}

function fillDaily<T extends { dailyActivity: number[] }>(
  rows: T[],
  getName: (row: T) => string,
  records: { Tanggal: string }[],
  getNameFromRecord: (rec: any) => string,
) {
  const dayCounts = new Map<string, number[]>()
  for (const rec of records) {
    const name = getNameFromRecord(rec)
    if (!name) continue
    let arr = dayCounts.get(name)
    if (!arr) {
      arr = new Array(31).fill(0)
      dayCounts.set(name, arr)
    }
    const day = extractDay(rec.Tanggal)
    if (day >= 1 && day <= 31) arr[day - 1]++
  }
  for (const row of rows) {
    const name = getName(row)
    if (!name) continue
    const arr = dayCounts.get(name)
    if (arr) row.dailyActivity = arr
  }
}

export function enrichDailyActivity(reportData: ReportData, xlc?: XLC[], gsf?: GSF[]): ReportData {
  const r = { ...reportData, xlcReport: reportData.xlcReport.map(r => ({ ...r, dailyActivity: [...r.dailyActivity] })), gsfReport: reportData.gsfReport.map(r => ({ ...r, dailyActivity: [...r.dailyActivity] })), woReport: reportData.woReport.map(r => ({ ...r, dailyActivity: [...r.dailyActivity] })), expoReport: reportData.expoReport.map(r => ({ ...r, dailyActivity: [...r.dailyActivity] })) }

  if (xlc?.length) {
    fillDaily(r.xlcReport, r => r.crrName, xlc, (rec: XLC) => rec.NamaCRR)
  }
  if (gsf?.length) {
    fillDaily(r.gsfReport, r => r.crrName, gsf, (rec: GSF) => rec.Operator)
  }

  return r
}
