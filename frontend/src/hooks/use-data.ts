import { useCallback, useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { useStore } from '@/lib/store'
import { api } from '@/lib/api'
import { parseExcelData, parseXLC, parseGSF, parseMerchant, parseWO, parseEXPO, parseXLSatu, parseELITE, parsePromotor, parseReportData } from '@/lib/excel'
import { enrichDailyActivity } from '@/lib/daily-activity'
import type { DashboardData, ReportData } from '@/lib/data'

export function useDataLoader() {
  const { setData, setReportData, setLoading, setError, loading, error, data, dataSource } = useStore()
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
    setLoading(false)
  }, [setLoading])

  const fetchFromApi = useCallback(async (period?: string) => {
    try {
      setLoading(true)
      const allData = await api.getAllData(period)
      const parsed: Record<string, any> = {}
      const reportParts: import('@/lib/data').ReportData = { xlcReport: [], gsfReport: [], woReport: [], expoReport: [], storeMaster: [], ranking: [] }

      for (const [key, val] of Object.entries(allData)) {
        if (val && typeof val === 'object' && 'data' in val) {
          const low = key.toLowerCase()
          if (low === 'xlc_report') {
            reportParts.xlcReport = (val as any).data
          } else if (low === 'gsf_report') {
            reportParts.gsfReport = (val as any).data
          } else if (low === 'wo_report') {
            reportParts.woReport = (val as any).data
          } else if (low === 'expo_report') {
            reportParts.expoReport = (val as any).data
          } else if (low === 'store_master') {
            reportParts.storeMaster = (val as any).data
          } else if (low === 'ranking') {
            reportParts.ranking = (val as any).data
          } else if (val.data !== null) {
            parsed[low] = (val as any).data
          }
        }
      }

      setData(parsed as DashboardData)
      setReportData(reportParts as ReportData)

      const finalReport = enrichDailyActivity(reportParts as ReportData, parsed.xlc, parsed.gsf)
      setReportData(finalReport)
    } catch (err) {
      console.warn('API not available, falling back to local data')
    } finally {
      setLoading(false)
    }
  }, [setData, setReportData, setLoading])

  useEffect(() => {
    // If logged in, load from backend API. Otherwise try static demo file.
    if (api.getToken()) {
      fetchFromApi()
    } else {
      loadDefaultExcel()
    }
  }, [fetchFromApi, loadDefaultExcel])

  return {
    data, loading, error, dataSource,
    loadFromExcel, loadFromGoogleSheets, fetchFromApi,
    googleSheetUrl, setGoogleSheetUrl,
  }
}

function extractSheetId(input: string): string | null {
  const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (match) return match[1]
  if (/^[a-zA-Z0-9_-]{20,}$/.test(input.trim())) return input.trim()
  return null
}
