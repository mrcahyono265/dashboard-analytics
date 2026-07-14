import * as XLSX from 'xlsx'
import type { EXPO } from '../data'
import { formatExcelDate } from './format-date'

export function parseEXPO(ws: XLSX.WorkSheet): EXPO[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => (r['No.'] || r['No']) && r['Bulan'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: formatExcelDate(r['Tanggal Aktivasi'] ?? r['Tanggal']),
      MSISDN: String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['  Price Plan  '] ?? r['Price Plan'] ?? r['PricePlan'] ?? 0),
      ExpoName: r['Expo Name'] ?? r['ExpoName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaPromotor: r['Nama Promotor'] ?? r['NamaPromotor'] ?? '',
      RSM: r['RSM'] ?? '',
      Leader: r['Leader'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }))
}
