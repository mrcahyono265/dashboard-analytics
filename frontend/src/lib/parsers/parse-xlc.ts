import * as XLSX from 'xlsx'
import type { XLC } from '../data'
import { formatExcelDate } from './format-date'

export function parseXLC(ws: XLSX.WorkSheet): XLC[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => (r['No.'] || r['No']) && r['Bulan'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: formatExcelDate(r['Tanggal Aktivasi'] ?? r['Tanggal']),
      MSISDN: r['MSISDN'] ?? String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['  Price Plan  '] ?? r['Price Plan'] ?? r['PricePlan'] ?? 0),
      StoreName: r['Store Name'] ?? r['StoreName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaCRR: r['Nama CRR'] ?? r['NamaCRR'] ?? '',
      RSM: r['RSM'] ?? '',
      SM: r['SM'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }))
}
