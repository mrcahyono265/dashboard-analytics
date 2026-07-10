import type { TimeMode } from './date-parser'
import type { ColumnDef } from '@tanstack/react-table'
import { formatNumber } from './utils'

// ─── Time Labels ─────────────────────────────────────────────
export function getTimeLabel(timeMode: TimeMode): string {
  switch (timeMode) {
    case 'daily': return 'Hari Ini'
    case 'weekly': return 'Minggu Ini'
    case 'monthly': return 'Bulan Ini'
    case 'yearly': return 'Tahun Ini'
  }
}

// ─── Channel Targets ─────────────────────────────────────────
export const CHANNEL_TARGETS: Record<string, number> = {
  XLC: 10_000,
  GSF: 50_000_000,
  Merchant: 150,
  WO: 200,
  EXPO: 200,
  'XL Satu': 10_000,
}

export type TargetStatus = 'on-track' | 'need-improvement' | 'below-target'

export function getTargetStatus(percentage: number): TargetStatus {
  if (percentage >= 100) return 'on-track'
  if (percentage >= 75) return 'need-improvement'
  return 'below-target'
}

export function getTargetStatusLabel(status: TargetStatus): string {
  switch (status) {
    case 'on-track': return 'On Target'
    case 'need-improvement': return 'Need Improvement'
    case 'below-target': return 'Below Target'
  }
}

export function getTargetStatusVariant(status: TargetStatus): 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'on-track': return 'success'
    case 'need-improvement': return 'warning'
    case 'below-target': return 'danger'
  }
}

export function computeTargetPercentage(actual: number, target: number): number {
  return target > 0 ? Math.round((actual / target) * 100) : 0
}

// ─── Shared Column Factories ─────────────────────────────────
export function createPriceColumn<T extends Record<string, any>>(): ColumnDef<T> {
  return {
    header: 'Price',
    accessorKey: 'PricePlan',
    cell: ({ row }) => `Rp ${formatNumber(row.original.PricePlan)}`,
  }
}

export function createMsisdnColumn<T extends Record<string, any>>(): ColumnDef<T> {
  return {
    header: 'MSISDN',
    accessorKey: 'MSISDN',
  }
}

export function createRsmColumn<T extends Record<string, any>>(): ColumnDef<T> {
  return {
    header: 'RSM',
    accessorKey: 'RSM',
  }
}

export function createPackageColumn<T extends Record<string, any>>(): ColumnDef<T> {
  return {
    header: 'Package',
    accessorKey: 'PackagePlan',
  }
}

// ─── Channel Config ──────────────────────────────────────────
export interface ChannelConfig {
  key: string
  label: string
  sheetKey: keyof import('./data').DashboardData
  filterChannel: string
  filename: string
}

export const CHANNELS: ChannelConfig[] = [
  { key: 'xlc', label: 'XLC', sheetKey: 'xlc', filterChannel: 'XLC', filename: 'XLC_Activation' },
  { key: 'gsf', label: 'GSF', sheetKey: 'gsf', filterChannel: 'GSF', filename: 'GSF_Transactions' },
  { key: 'merchant', label: 'Merchant', sheetKey: 'merchant', filterChannel: 'Merchant', filename: 'Merchant' },
  { key: 'wo', label: 'WO Agent', sheetKey: 'wo', filterChannel: 'WO', filename: 'WO_Agent' },
  { key: 'expo', label: 'EXPO', sheetKey: 'expo', filterChannel: 'EXPO', filename: 'EXPO' },
  { key: 'xlsatu', label: 'XL Satu', sheetKey: 'xlsatu', filterChannel: 'XL Satu', filename: 'XL_Satu' },
]
