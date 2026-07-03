import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useStore } from '@/lib/store'
import { parseExcelData, parseXLC, parseGSF, parseMerchant, parseWO, parseEXPO, parseXLSatu, parseELITE, parsePromotor } from '@/lib/excel'
import type { DashboardData } from '@/lib/data'

export function useDataLoader() {
  const { setData, setLoading, setError, loading, error, data, dataSource } = useStore()
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')

  const loadFromExcel = useCallback(async (file: File) => {
    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseExcelData(buffer)
      setData(parsed)
    } catch (err) {
      setError(`Failed to parse Excel: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [setData, setLoading, setError])

  const loadFromGoogleSheets = useCallback(async (sheetId?: string) => {
    const id = sheetId || googleSheetUrl
    if (!id) {
      setError('Please enter a Google Sheet ID or URL')
      return
    }
    setLoading(true)
    try {
      const sheetIdExtracted = extractSheetId(id)
      if (!sheetIdExtracted) {
        setError('Invalid Google Sheet URL or ID')
        return
      }
      const sheetNames = ['XLC', 'GSF', 'Merchant', 'WO', 'EXPO', 'XLSatu', 'ELITE', 'Promotor']
      const allData: Partial<DashboardData> = {}
      const parsers: Record<string, (ws: XLSX.WorkSheet) => any[]> = {
        xlc: parseXLC, gsf: parseGSF, merchant: parseMerchant, wo: parseWO,
        expo: parseEXPO, xlsatu: parseXLSatu, elite: parseELITE, promotor: parsePromotor,
      }
      const sheetMap: Record<string, keyof DashboardData> = {
        XLC: 'xlc', GSF: 'gsf', Merchant: 'merchant', WO: 'wo',
        EXPO: 'expo', XLSatu: 'xlsatu', ELITE: 'elite', Promotor: 'promotor',
      }
      await Promise.all(sheetNames.map(async (name) => {
        try {
          const url = `https://docs.google.com/spreadsheets/d/${sheetIdExtracted}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
          const response = await fetch(url)
          if (!response.ok) return
          const csvText = await response.text()
          const wb = XLSX.read(csvText, { type: 'string', raw: true })
          const ws = wb.Sheets.Sheet1
          if (ws) {
            const jsonData = XLSX.utils.sheet_to_json<any>(ws, { defval: null })
            if (jsonData.length > 0) {
              const key = sheetMap[name]
              const parser = parsers[key]
              if (parser) {
                (allData as any)[key] = parser(XLSX.utils.json_to_sheet(jsonData))
              }
            }
          }
        } catch {
          // sheet might not exist
        }
      }))
      setData(allData as DashboardData)
    } catch (err) {
      setError(`Failed to load from Google Sheets: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [googleSheetUrl, setData, setLoading, setError])

  const loadDefaultExcel = useCallback(async () => {
    try {
      const response = await fetch('/data/Achievement%20Prio.xlsx')
      if (!response.ok) throw new Error('Default Excel file not found')
      const buffer = await response.arrayBuffer()
      const parsed = parseExcelData(buffer)
      setData(parsed)
    } catch (err) {
      console.warn('No default Excel file in public/data, please upload manually')
    }
  }, [setData])

  useEffect(() => {
    loadDefaultExcel()
  }, [loadDefaultExcel])

  return {
    data, loading, error, dataSource,
    loadFromExcel, loadFromGoogleSheets,
    googleSheetUrl, setGoogleSheetUrl,
  }
}

function extractSheetId(input: string): string | null {
  const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim()
  return null
}
