import { create } from 'zustand'
import type { DashboardData, ReportData, ActiveSource } from './data'
import type { TimeMode } from './date-parser'

export interface FilterState {
  bulan: string[]
  rsm: string[]
  sm: string[]
  store: string[]
  channel: string[]
}

export interface DateRange {
  from: string
  to: string
}

export interface DrillDownState {
  center: string | null
  crr: string | null
}

interface AppState {
  data: DashboardData | null
  reportData: ReportData | null
  activeSource: ActiveSource
  loading: boolean
  loadingMessage: string | null
  error: string | null
  filters: FilterState
  dataSource: 'excel' | 'google'
  timeMode: TimeMode
  customDateRange: DateRange | null
  drillDown: DrillDownState
  setData: (data: DashboardData) => void
  setReportData: (data: ReportData) => void
  setActiveSource: (source: ActiveSource) => void
  setLoading: (loading: boolean, message?: string | null) => void
  setError: (error: string | null) => void
  setFilter: (key: keyof FilterState, values: string[]) => void
  resetFilters: () => void
  setDataSource: (source: 'excel' | 'google') => void
  setTimeMode: (mode: TimeMode) => void
  setCustomDateRange: (range: DateRange | null) => void
  setDrillDown: (d: Partial<DrillDownState>) => void
  resetDrillDown: () => void
}

const defaultFilters: FilterState = {
  bulan: [],
  rsm: [],
  sm: [],
  store: [],
  channel: [],
}

export const useStore = create<AppState>((set) => ({
  data: null,
  reportData: { xlcReport: [], gsfReport: [], woReport: [], expoReport: [], storeMaster: [], ranking: [] },
  activeSource: 'upload',
  loading: false,
  loadingMessage: null,
  error: null,
  filters: defaultFilters,
  dataSource: 'excel',
  timeMode: 'monthly',
  customDateRange: null,
  drillDown: { center: null, crr: null },
  setData: (data) => set({ data, loading: false, loadingMessage: null, error: null }),
  setReportData: (data) => set({ reportData: data }),
  setActiveSource: (source) => set({ activeSource: source }),
  setLoading: (loading, message = null) => set({ loading, loadingMessage: loading ? message : null }),
  setError: (error) => set({ error, loading: false, loadingMessage: null }),
  setFilter: (key, values) =>
    set((state) => ({
      filters: { ...state.filters, [key]: values },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setDataSource: (source) => set({ dataSource: source }),
  setTimeMode: (mode) => set({ timeMode: mode }),
  setCustomDateRange: (range) => set({ customDateRange: range }),
  setDrillDown: (d) => set((state) => ({ drillDown: { ...state.drillDown, ...d } })),
  resetDrillDown: () => set({ drillDown: { center: null, crr: null } }),
}))
