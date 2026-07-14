import { api } from './api'

export interface ExportSettings {
  mode: 'manual' | 'kop'
  paperSize: 'A4' | 'F4' | 'Legal' | 'Letter'

  // Manual mode
  companyName: string
  address: string
  phone: string
  email: string
  website: string
  npwp: string
  logoDataUrl: string | null

  // Upload KOP mode
  kopDataUrl: string | null

  // What to show (manual mode)
  showLogo: boolean
  showStoreName: boolean
  showAddress: boolean
  showPhone: boolean
  headerText: string

  // Margins (mm)
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number

  // Footer
  showFooter: boolean
  footerText: string
  showTimestamp: boolean
  showNpwp: boolean
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  mode: 'manual',
  paperSize: 'A4',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  npwp: '',
  logoDataUrl: null,
  kopDataUrl: null,
  showLogo: true,
  showStoreName: true,
  showAddress: true,
  showPhone: true,
  headerText: '',
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 25,
  marginRight: 20,
  showFooter: true,
  footerText: '',
  showTimestamp: true,
  showNpwp: false,
}

export function getExportSettings(): Promise<ExportSettings> {
  return api.request<ExportSettings>('/settings/export')
}

export function saveExportSettings(settings: ExportSettings): Promise<ExportSettings> {
  return api.request<ExportSettings>('/settings/export', {
    method: 'PUT',
    body: settings,
  })
}
