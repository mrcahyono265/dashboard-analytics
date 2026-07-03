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

export interface DashboardData {
  xlc: XLC[]
  gsf: GSF[]
  merchant: Merchant[]
  wo: WO[]
  expo: EXPO[]
  xlsatu: XLSatu[]
  elite: ELITE[]
  promotor: Promotor[]
}
