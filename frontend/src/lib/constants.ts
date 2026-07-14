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

// ─── Product Categorization ──────────────────────────────────
export function categorizeProduct(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('prioritas') || lower.includes('elite')) return 'Postpaid'
  if (lower.includes('xl satu') || lower.includes('xlsatu')) return 'XL Satu'
  if (lower.includes('5g')) return '5G'
  return 'Other'
}

export const PRODUCT_CATEGORIES = ['Postpaid', 'XL Satu', '5G', 'Other'] as const

export function getProductBreakdown(products: { product: string; achievement: number }[]): Record<string, number> {
  const result: Record<string, number> = { Postpaid: 0, 'XL Satu': 0, '5G': 0, Other: 0 }
  for (const p of products) {
    if (p.product === 'Total') continue
    const cat = categorizeProduct(p.product)
    result[cat] = (result[cat] || 0) + p.achievement
  }
  return result
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
