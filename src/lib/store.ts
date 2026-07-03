import { create } from 'zustand'
import type { DashboardData } from './data'

export interface FilterState {
  bulan: string[]
  rsm: string[]
  sm: string[]
  store: string[]
  channel: string[]
}

interface AppState {
  data: DashboardData | null
  loading: boolean
  error: string | null
  filters: FilterState
  dataSource: 'excel' | 'google'
  setData: (data: DashboardData) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilter: (key: keyof FilterState, values: string[]) => void
  resetFilters: () => void
  setDataSource: (source: 'excel' | 'google') => void
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
  error: null,
  filters: defaultFilters,
  dataSource: 'excel',
  setData: (data) => set({ data, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setFilter: (key, values) =>
    set((state) => ({
      filters: { ...state.filters, [key]: values },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
  setDataSource: (source) => set({ dataSource: source }),
}))
