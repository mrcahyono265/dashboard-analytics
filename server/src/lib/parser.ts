import * as XLSX from 'xlsx';

interface ParsedData {
  [sheetType: string]: any[];
}

const SHEET_MAPPING: Record<string, string> = {
  'XLC&GSF': 'XLC',
  'WO': 'WO',
  'EXPO': 'EXPO',
  'Sheet1': 'XLSatu',
  'Sheet2': 'Promotor'
};

export function parseExcelData(workbook: XLSX.WorkBook): ParsedData {
  const result: ParsedData = {};

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws) continue;

    // Convert to JSON with headers
    const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (data.length === 0) continue;

    // Determine sheet type from mapping or name
    const sheetType = SHEET_MAPPING[sheetName] || sheetName.toUpperCase();

    // Filter valid sheet types
    const validTypes = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor'];
    if (validTypes.includes(sheetType)) {
      result[sheetType] = data;
    }
  }

  return result;
}

export function getSheetNames(workbook: XLSX.WorkBook): string[] {
  return workbook.SheetNames;
}
