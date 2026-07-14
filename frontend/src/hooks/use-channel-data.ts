import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useRoleScopedData } from '@/hooks/use-role-scoped-data'

export interface AllChannelData {
  xlc: any[]
  gsf: any[]
  merchant: any[]
  wo: any[]
  expo: any[]
  xlsatu: any[]
  elite: any[]
  promotor: any[]
  allActivations: any[]
  grandActivationCount: number
}

export function useAllChannelData(): AllChannelData {
  const data = useStore((s) => s.data)

  const xlc = useRoleScopedData(data?.xlc, 'xlc')
  const gsf = useRoleScopedData(data?.gsf, 'gsf')
  const merchant = useRoleScopedData(data?.merchant, 'merchant')
  const wo = useRoleScopedData(data?.wo, 'wo')
  const expo = useRoleScopedData(data?.expo, 'expo')
  const xlsatu = useRoleScopedData(data?.xlsatu, 'xlsatu')
  const elite = useRoleScopedData(data?.elite)
  const promotor = useRoleScopedData(data?.promotor)

  const allActivations = useMemo(
    () => [...xlc, ...merchant, ...wo, ...expo, ...xlsatu],
    [xlc, merchant, wo, expo, xlsatu]
  )

  return useMemo(
    () => ({
      xlc, gsf, merchant, wo, expo, xlsatu, elite, promotor,
      allActivations,
      grandActivationCount: allActivations.length,
    }),
    [xlc, gsf, merchant, wo, expo, xlsatu, elite, promotor, allActivations]
  )
}
