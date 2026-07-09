import { create } from 'zustand'
import type { DashboardData } from './data'
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

interface AppState {
  data: DashboardData | null
  loading: boolean
  loadingMessage: string | null
  error: string | null
  filters: FilterState
  dataSource: 'excel' | 'google'
  timeMode: TimeMode
  customDateRange: DateRange | null
  setData: (data: DashboardData) => void
  setLoading: (loading: boolean, message?: string | null) => void
  setError: (error: string | null) => void
  setFilter: (key: keyof FilterState, values: string[]) => void
  resetFilters: () => void
  setDataSource: (source: 'excel' | 'google') => void
  setTimeMode: (mode: TimeMode) => void
  setCustomDateRange: (range: DateRange | null) => void
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
  loading: false,
  loadingMessage: null,
  error: null,
  filters: defaultFilters,
  dataSource: 'excel',
  timeMode: 'monthly',
  customDateRange: null,
  setData: (data) => set({ data, loading: false, loadingMessage: null, error: null }),
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
}))
