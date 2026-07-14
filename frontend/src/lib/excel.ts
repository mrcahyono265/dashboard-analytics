import * as XLSX from 'xlsx'
import type { DashboardData, ReportData } from './data'
import { parseXLC } from './parsers/parse-xlc'
import { parseGSF } from './parsers/parse-gsf'
import { parseMerchant } from './parsers/parse-merchant'
import { parseWO } from './parsers/parse-wo'
import { parseEXPO } from './parsers/parse-expo'
import { parseXLSatu } from './parsers/parse-xlsatu'
import { parseELITE } from './parsers/parse-elite'
import { parsePromotor } from './parsers/parse-promotor'
import { parsePrioXLC } from './parsers/parse-prioxlc'
import { parseWOAgent } from './parsers/parse-woagent'
import { parseReportData } from './report-parser'

export { formatExcelDate } from './parsers/format-date'
export { parseXLC } from './parsers/parse-xlc'
export { parseGSF } from './parsers/parse-gsf'
export { parseMerchant } from './parsers/parse-merchant'
export { parseWO } from './parsers/parse-wo'
export { parseEXPO } from './parsers/parse-expo'
export { parseXLSatu } from './parsers/parse-xlsatu'
export { parseELITE } from './parsers/parse-elite'
export { parsePromotor } from './parsers/parse-promotor'
export { parseReportData } from './report-parser'

export function parseExcelData(buffer: ArrayBuffer): DashboardData {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheets: Record<string, XLSX.WorkSheet> = {}
  wb.SheetNames.forEach((name) => { sheets[name] = wb.Sheets[name] })

  return {
    xlc: sheets['XLC'] ? parseXLC(sheets['XLC']) : [],
    gsf: sheets['GSF'] ? parseGSF(sheets['GSF']) : [],
    merchant: sheets['Merchant'] ? parseMerchant(sheets['Merchant']) : [],
    wo: sheets['WO'] ? parseWO(sheets['WO']) : [],
    expo: sheets['EXPO'] ? parseEXPO(sheets['EXPO']) : [],
    xlsatu: sheets['XLSatu'] ? parseXLSatu(sheets['XLSatu']) : [],
    elite: sheets['ELITE'] ? parseELITE(sheets['ELITE']) : [],
    promotor: sheets['Promotor'] ? parsePromotor(sheets['Promotor']) : [],
    prioXLC: sheets['PrioXLC'] ? parsePrioXLC(sheets['PrioXLC']) : [],
    woAgent: sheets['WOAgent'] ? parseWOAgent(sheets['WOAgent']) : [],
  }
}
