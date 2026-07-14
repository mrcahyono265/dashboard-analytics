import * as XLSX from 'xlsx'
import type { GSF } from '../data'
import { formatExcelDate } from './format-date'

export function parseGSF(ws: XLSX.WorkSheet): GSF[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
  return data
    .filter((r: any) => r['AMOUNT'] || r['Amount'])
    .map((r: any) => ({
      Galeri: r['Galeri'] ?? '',
      Bulan: r['Bulan'] ?? '',
      Tanggal: formatExcelDate(r['Tanggal']),
      CashCycleID: Number(r['CASH_CYCLE_ID'] ?? r['CashCycleID'] ?? 0),
      Operation: r['OPERATION'] ?? r['Operation'] ?? '',
      OperationTime: formatExcelDate(r['OPERATION_TIME']) || (r['OperationTime'] ?? ''),
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
