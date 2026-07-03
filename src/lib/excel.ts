import * as XLSX from 'xlsx'
import type { DashboardData, XLC, GSF, Merchant, WO, EXPO, XLSatu, ELITE, Promotor } from './data'

function cleanKey(key: string): string {
  return key
    .replace(/[\s\n]+/g, ' ')
    .trim()
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(' ')
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('')
}

function parseXLC(ws: XLSX.WorkSheet): XLC[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['No.'] || r['No'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: r['Tanggal'] ? String(r['Tanggal']) : '',
      MSISDN: r['MSISDN'] ?? String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['Price Plan'] ?? r['PricePlan'] ?? 0),
      StoreName: r['Store Name'] ?? r['StoreName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaCRR: r['Nama CRR'] ?? r['NamaCRR'] ?? '',
      RSM: r['RSM'] ?? '',
      SM: r['SM'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }))
}

function parseGSF(ws: XLSX.WorkSheet): GSF[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['AMOUNT'] || r['Amount'])
    .map((r: any) => ({
      Galeri: r['Galeri'] ?? '',
      Bulan: r['Bulan'] ?? '',
      Tanggal: r['Tanggal'] ? String(r['Tanggal']) : '',
      CashCycleID: Number(r['CASH_CYCLE_ID'] ?? r['CashCycleID'] ?? 0),
      Operation: r['OPERATION'] ?? r['Operation'] ?? '',
      OperationTime: r['OPERATION_TIME'] ?? r['OperationTime'] ?? '',
      OperationSerial: String(r['OPERATION_SERIAL'] ?? r['OperationSerial'] ?? ''),
      CurrencyType: r['CURRENCY_TYPE'] ?? r['CurrencyType'] ?? '',
      PreBalance: Number(r['PRE_BALANCE'] ?? r['PreBalance'] ?? 0),
      Amount: Number(r['AMOUNT'] ?? r['Amount'] ?? 0),
      NextBalance: Number(r['NEXT_BALANCE'] ?? r['NextBalance'] ?? 0),
      PaymentCategory: r['PAYMENT_CATEGORY'] ?? r['PaymentCategory'] ?? '',
      PaymentMethod: r['PAYMENT_METHOD'] ?? r['PaymentMethod'] ?? '',
      TransactionType: r['TRANSACTION_TYPE'] ?? r['TransactionType'] ?? '',
      Office: r['OFFICE'] ?? r['Office'] ?? '',
      Operator: r['OPERATOR'] ?? r['Operator'] ?? '',
      EventName: r['EVENT_NAME'] ?? r['EventName'] ?? '',
      RelatedOperator: r['CUSTOMER/RELATED_OPERATOR'] ?? r['RelatedOperator'] ?? '',
      TransactionNumber: r['TRANSACTION_NUMBER/ORDER_NUMBER'] ?? r['TransactionNumber'] ?? '',
      ReceiptNumber: r['RECEIPT_NUMBER'] ?? r['ReceiptNumber'] ?? '',
      AccountNumber: r['ACCOUNT_NUMBER'] ?? r['AccountNumber'] ?? '',
      ServicesNumber: r['SERVICES_NUMBER'] ?? r['ServicesNumber'] ?? '',
      Remarks: r['REMARKS'] ?? r['Remarks'] ?? '',
    }))
}

function parseMerchant(ws: XLSX.WorkSheet): Merchant[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['No.'] || r['No'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: r['Tanggal'] ? String(r['Tanggal']) : '',
      MSISDN: String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['Price Plan'] ?? r['PricePlan'] ?? 0),
      StoreName: r['Store Name'] ?? r['StoreName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaCRR: r['Nama CRR'] ?? r['NamaCRR'] ?? '',
      RSM: r['RSM'] ?? '',
      SM: r['SM'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }))
}

function parseWO(ws: XLSX.WorkSheet): WO[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['No.'] || r['No'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: r['Tanggal'] ? String(r['Tanggal']) : '',
      MSISDN: String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['Price Plan'] ?? r['PricePlan'] ?? 0),
      XLCName: r['XLC Name'] ?? r['XLCName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      AgentWO: r['Agent WO'] ?? r['AgentWO'] ?? '',
      RSM: r['RSM'] ?? '',
      Leader: r['Leader'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }))
}

function parseEXPO(ws: XLSX.WorkSheet): EXPO[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['No.'] || r['No'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: r['Tanggal'] ? String(r['Tanggal']) : '',
      MSISDN: String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['Price Plan'] ?? r['PricePlan'] ?? 0),
      ExpoName: r['Expo Name'] ?? r['ExpoName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaPromotor: r['Nama Promotor'] ?? r['NamaPromotor'] ?? '',
      RSM: r['RSM'] ?? '',
      Leader: r['Leader'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }))
}

function parseXLSatu(ws: XLSX.WorkSheet): XLSatu[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['No.'] || r['No'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: r['Tanggal'] ? String(r['Tanggal']) : '',
      NoSO: Number(r['No. SO'] ?? r['NoSO'] ?? 0),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['Price Plan'] ?? r['PricePlan'] ?? 0),
      StoreName: r['Store Name'] ?? r['StoreName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaCRR: r['Nama CRR'] ?? r['NamaCRR'] ?? '',
      RSM: r['RSM'] ?? '',
      SM: r['SM'] ?? '',
    }))
}

function parseELITE(ws: XLSX.WorkSheet): ELITE[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['OPERATOR'] || r['Operator'])
    .map((r: any) => ({
      Operator: r['OPERATOR'] ?? r['Operator'] ?? '',
      NewConnection: Number(r['New Connection'] ?? r['NewConnection'] ?? 0),
      PrepaidToPostpaid: Number(r['Prepaid to Postpaid'] ?? r['PrepaidToPostpaid'] ?? 0),
      GrandTotal: Number(r['Grand Total'] ?? r['GrandTotal'] ?? 0),
    }))
    .filter((r) => r.Operator && r.Operator !== 'Grand Total' && r.Operator !== '(blank)')
}

function parsePromotor(ws: XLSX.WorkSheet): Promotor[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['Nama Promotor'] && r['Nama Promotor'] !== 'Grand Total' && r['Nama Promotor'] !== '(blank)')
    .map((r: any) => {
      const entry: Promotor = { NamaPromotor: r['Nama Promotor'] }
      Object.keys(r).forEach((key) => {
        if (key !== 'Nama Promotor' && key !== 'Grand Total') {
          entry[key] = Number(r[key]) || 0
        }
      })
      return entry
    })
}

export function parseExcelData(buffer: ArrayBuffer): DashboardData {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheets: Record<string, XLSX.WorkSheet> = {}
  wb.SheetNames.forEach((name) => {
    sheets[name] = wb.Sheets[name]
  })

  return {
    xlc: sheets['XLC'] ? parseXLC(sheets['XLC']) : [],
    gsf: sheets['GSF'] ? parseGSF(sheets['GSF']) : [],
    merchant: sheets['Merchant'] ? parseMerchant(sheets['Merchant']) : [],
    wo: sheets['WO'] ? parseWO(sheets['WO']) : [],
    expo: sheets['EXPO'] ? parseEXPO(sheets['EXPO']) : [],
    xlsatu: sheets['XLSatu'] ? parseXLSatu(sheets['XLSatu']) : [],
    elite: sheets['ELITE'] ? parseELITE(sheets['ELITE']) : [],
    promotor: sheets['Promotor'] ? parsePromotor(sheets['Promotor']) : [],
  }
}
