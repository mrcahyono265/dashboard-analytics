import * as XLSX from 'xlsx';

// ─── Date formatter (ported from frontend parsers/format-date.ts) ──────────
export function formatExcelDate(value: any): string {
  if (value == null) return '';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return String(value);
    return value.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
  const num = Number(value);
  if (isNaN(num) || num < 1) return String(value);
  try {
    const date = new Date((num - 25569) * 86400000);
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

// ─── Per-sheet parsers (ported verbatim from frontend) ─────────────────────

function parseXLC(ws: XLSX.WorkSheet): any[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
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
    }));
}

function parseGSF(ws: XLSX.WorkSheet): any[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
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
    }));
}

function parseMerchant(ws: XLSX.WorkSheet): any[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
  return data
    .filter((r: any) => (r['No.'] || r['No']) && r['Bulan'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: formatExcelDate(r['Tanggal Aktivasi'] ?? r['Tanggal']),
      MSISDN: String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['Price Plan'] ?? r['PricePlan'] ?? 0),
      StoreName: r['Store Name'] ?? r['StoreName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaCRR: r['Nama CRR'] ?? r['NamaCRR'] ?? '',
      RSM: r['RSM'] ?? '',
      SM: r['SM'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }));
}

function parseWO(ws: XLSX.WorkSheet): any[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
  return data
    .filter((r: any) => (r['No.'] || r['No']) && r['Bulan'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: formatExcelDate(r['Tanggal Aktivasi'] ?? r['Tanggal']),
      MSISDN: String(r['MSISDN'] ?? ''),
      PackagePlan: r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['  Price Plan  '] ?? r['Price Plan'] ?? r['PricePlan'] ?? 0),
      XLCName: r['XLC Name'] ?? r['XLCName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      AgentWO: r['Agent WO'] ?? r['AgentWO'] ?? '',
      RSM: r['RSM'] ?? '',
      Leader: r['Leader'] ?? '',
      NewMigrate: r['New/Migrate'] ?? r['NewMigrate'] ?? '',
    }));
}

function parseEXPO(ws: XLSX.WorkSheet): any[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
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
    }));
}

function parseXLSatu(ws: XLSX.WorkSheet): any[] {
  const data = XLSX.utils.sheet_to_json<any>(ws, { defval: null });
  return data
    .filter((r: any) => (r['No.'] || r['No']) && r['Bulan'])
    .map((r: any) => ({
      No: r['No.'] ?? r['No'],
      Bulan: r['Bulan'] ?? '',
      Tanggal: formatExcelDate(r['Tanggal Aktivasi'] ?? r['Tanggal']),
      NoSO: Number(r['No. SO'] ?? r['NoSO'] ?? 0),
      PackagePlan: r['  Price Plan  '] ?? r['Package Plan'] ?? r['PackagePlan'] ?? '',
      PricePlan: Number(r['Price Plan'] ?? r['PricePlan'] ?? 0),
      StoreName: r['Store Name'] ?? r['StoreName'] ?? '',
      UsernameAgent: r['Username Agent'] ?? r['UsernameAgent'] ?? '',
      NamaCRR: r['Nama CRR'] ?? r['NamaCRR'] ?? '',
      RSM: r['RSM'] ?? '',
      SM: r['SM'] ?? '',
    }));
}

function parseELITE(ws: XLSX.WorkSheet): any[] {
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const result: any[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    if (String(r[0]).trim() === 'OPERATOR' && String(r[1]).trim() === 'New Connection') {
      for (let j = i + 1; j < rows.length; j++) {
        const row = rows[j];
        if (!row || !row[0]) break;
        const op = String(row[0]).trim();
        if (op === 'Grand Total' || op === '(blank)') break;
        result.push({
          Operator: op,
          NewConnection: Number(row[1] ?? 0),
          PrepaidToPostpaid: Number(row[2] ?? 0),
          GrandTotal: Number(row[3] ?? 0),
        });
      }
      break;
    }
  }
  return result;
}

function parsePromotor(ws: XLSX.WorkSheet): any[] {
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: null });
  const result: any[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r || !r[0]) continue;
    if (String(r[0]).trim() !== 'Nama Promotor') continue;
    const headers = r;
    for (let j = i + 1; j < rows.length; j++) {
      const row = rows[j];
      if (!row || !row[0]) break;
      const name = String(row[0]).trim();
      if (name === 'Grand Total') break;
      if (name === '(blank)') continue;
      const entry: any = { NamaPromotor: name };
      for (let k = 1; k < headers.length; k++) {
        if (headers[k] != null && !['Grand Total', '(blank)'].includes(String(headers[k]).trim())) {
          const key = String(headers[k]).trim();
          entry[key] = Number(row[k] ?? 0) || 0;
        }
      }
      result.push(entry);
    }
    break;
  }
  return result;
}

// ─── Dispatcher (matches frontend excel.ts exactly) ────────────────────────
// IMPORTANT: cellDates: true so Excel serials become Date objects for formatExcelDate

interface ParsedData {
  [sheetType: string]: any[];
}

const SHEET_PARSERS: Record<string, (ws: XLSX.WorkSheet) => any[]> = {
  'XLC': parseXLC,
  'GSF': parseGSF,
  'Merchant': parseMerchant,
  'WO': parseWO,
  'EXPO': parseEXPO,
  'XLSatu': parseXLSatu,
  'ELITE': parseELITE,
  'Promotor': parsePromotor,
};

export function parseExcelData(workbook: XLSX.WorkBook): ParsedData {
  const result: ParsedData = {};

  for (const sheetName of workbook.SheetNames) {
    const parser = SHEET_PARSERS[sheetName];
    if (!parser) continue;
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;
    const data = parser(ws);
    if (data.length > 0) {
      result[sheetName] = data;
    }
  }

  return result;
}

// For syncFromBuffer: read with cellDates to match frontend behavior
export function parseWorkbook(buffer: Buffer | Uint8Array): ParsedData {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  return parseExcelData(workbook);
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}
