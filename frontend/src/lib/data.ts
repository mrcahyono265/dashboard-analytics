export interface XLC {
  No: number
  Bulan: string
  Tanggal: string
  MSISDN: string
  PackagePlan: string
  PricePlan: number
  StoreName: string
  UsernameAgent: string
  NamaCRR: string
  RSM: string
  SM: string
  NewMigrate: string
}

export interface GSF {
  Galeri: string
  Bulan: string
  Tanggal: string
  CashCycleID: number
  Operation: string
  OperationTime: string
  OperationSerial: string
  CurrencyType: string
  PreBalance: number
  Amount: number
  NextBalance: number
  PaymentCategory: string
  PaymentMethod: string
  TransactionType: string
  Office: string
  Operator: string
  EventName: string
  RelatedOperator: string
  TransactionNumber: string
  ReceiptNumber: string
  AccountNumber: string
  ServicesNumber: string
  Remarks: string
}

export interface Merchant {
  No: number
  Bulan: string
  Tanggal: string
  MSISDN: string
  PackagePlan: string
  PricePlan: number
  StoreName: string
  UsernameAgent: string
  NamaCRR: string
  RSM: string
  SM: string
  NewMigrate: string
}

export interface WO {
  No: number
  Bulan: string
  Tanggal: string
  MSISDN: string
  PackagePlan: string
  PricePlan: number
  XLCName: string
  UsernameAgent: string
  AgentWO: string
  RSM: string
  Leader: string
  NewMigrate: string
}

export interface EXPO {
  No: number
  Bulan: string
  Tanggal: string
  MSISDN: string
  PackagePlan: string
  PricePlan: number
  ExpoName: string
  UsernameAgent: string
  NamaPromotor: string
  RSM: string
  Leader: string
  NewMigrate: string
}

export interface XLSatu {
  No: number
  Bulan: string
  Tanggal: string
  NoSO: number
  PackagePlan: string
  PricePlan: number
  StoreName: string
  UsernameAgent: string
  NamaCRR: string
  RSM: string
  SM: string
}

export interface ELITE {
  Operator: string
  NewConnection: number
  PrepaidToPostpaid: number
  GrandTotal: number
}

export interface Promotor {
  NamaPromotor: string
  [key: string]: string | number
}

export interface PrioXLCItem {
  label: string
  count: number
}

export interface WOAgentItem {
  agentName: string
  storeName: string
  count: number
}

// ─── Report types (from XL Axiata pivot) ──────────────────────
export interface ReportBreakdown {
  product: string
  target: number
  achievement: number
  gap: number
  achievementPct: number
}

export interface CrrReportRow {
  storeName: string
  storeManager: string
  crrName: string
  dailyActivity: number[]
  instore?: number
  merchant?: number
  achievement: number
  target: number
  gap: number
  dailyAch?: number
  proyeksi?: number
  dailyTarget?: number
  tMda?: number
  aMda?: number
  pctMda: number
  products: ReportBreakdown[]
}

export interface WoReportRow {
  storeName: string
  storeManager: string
  agentName: string
  dailyActivity: number[]
  prio?: number
  merchant?: number
  achievement: number
  target: number
  gap: number
  dailyAch?: number
  proyeksi?: number
  dailyTarget?: number
  tMda?: number
  aMda?: number
  pctMda: number
  products: ReportBreakdown[]
}

export interface ExpoReportRow {
  storeName: string
  promotorName: string
  dailyActivity: number[]
  achievement: number
  target: number
  gap: number
  dailyAch?: number
  proyeksi?: number
  dailyTarget?: number
  tMda?: number
  aMda?: number
  pctMda: number
  products: ReportBreakdown[]
}

export interface StoreMasterRow {
  no: number
  storeName: string
  region: string
  headRegion: string
  rse: string
  brand: string
  xlSatuProduct: string
  hcWi: number
  hcWo: number
  targetPrioMei: number
  targetPrioJuni: number
  perCrr: number
}

export interface RankingRow {
  section: 'CRR' | 'WO' | 'EXPO'
  storeName: string
  name: string
  achievement: number
  pctMda?: number
  rank: number
}

export interface ReportData {
  xlcReport: CrrReportRow[]
  gsfReport: CrrReportRow[]
  woReport: WoReportRow[]
  expoReport: ExpoReportRow[]
  storeMaster: StoreMasterRow[]
  ranking: RankingRow[]
}

export interface DashboardData {
  xlc: XLC[]
  gsf: GSF[]
  merchant: Merchant[]
  wo: WO[]
  expo: EXPO[]
  xlsatu: XLSatu[]
  elite: ELITE[]
  promotor: Promotor[]
  prioXLC?: PrioXLCItem[]
  woAgent?: WOAgentItem[]
}

export type ActiveSource = 'upload' | 'excel365' | 'url'
