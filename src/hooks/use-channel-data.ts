import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'

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

  const xlc = useFilteredData(data?.xlc, 'XLC')
  const gsf = useFilteredData(data?.gsf, 'GSF')
  const merchant = useFilteredData(data?.merchant, 'Merchant')
  const wo = useFilteredData(data?.wo, 'WO')
  const expo = useFilteredData(data?.expo, 'EXPO')
  const xlsatu = useFilteredData(data?.xlsatu, 'XL Satu')
  const elite = useFilteredData(data?.elite)
  const promotor = useFilteredData(data?.promotor)

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
