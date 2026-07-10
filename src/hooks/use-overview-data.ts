import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'
import { useTimeSeries, useGroupedByCategory, usePeriodComparison } from '@/hooks/use-time-data'
import { computeMonthlySparkline } from '@/lib/sparkline'
import { CHANNEL_TARGETS, computeTargetPercentage, getTargetStatus } from '@/lib/constants'

export function useOverviewData() {
  const { data } = useStore()
  const timeMode = useStore((s) => s.timeMode)

  const filteredXlc = useFilteredData(data?.xlc, 'XLC')
  const filteredGsf = useFilteredData(data?.gsf, 'GSF')
  const filteredMerchant = useFilteredData(data?.merchant, 'Merchant')
  const filteredWo = useFilteredData(data?.wo, 'WO')
  const filteredExpo = useFilteredData(data?.expo, 'EXPO')
  const filteredXlsatu = useFilteredData(data?.xlsatu, 'XL Satu')

  // ── Counts ──
  const xlcTotal = filteredXlc.length
  const xlcNew = filteredXlc.filter((d) => d.NewMigrate === 'New').length
  const xlcMigrate = filteredXlc.length - xlcNew
  const gsfTotal = filteredGsf.reduce((sum, d) => sum + d.Amount, 0)
  const gsfCount = filteredGsf.length
  const merchantTotal = filteredMerchant.length
  const woTotal = filteredWo.length
  const expoTotal = filteredExpo.length
  const xlsatuTotal = filteredXlsatu.length
  const grandTotal = xlcTotal + merchantTotal + woTotal + expoTotal + xlsatuTotal

  // ── Period comparison ──
  const xlcPeriod = usePeriodComparison(filteredXlc, (d) => d.Tanggal || d.Bulan)
  const gsfPeriod = usePeriodComparison(filteredGsf, (d) => d.Tanggal || d.Bulan)
  const merchantPeriod = usePeriodComparison(filteredMerchant, (d) => d.Tanggal || d.Bulan)
  const allActivationPeriod = usePeriodComparison(
    [...filteredXlc, ...filteredMerchant, ...filteredWo, ...filteredExpo, ...filteredXlsatu],
    (d: any) => d.Tanggal || d.Bulan
  )

  // ── Trend data ──
  const xlcTimeSeries = useTimeSeries(filteredXlc, (d) => d.Tanggal || d.Bulan)
  const merchantTimeSeries = useTimeSeries(filteredMerchant, (d) => d.Tanggal || d.Bulan)
  const woTimeSeries = useTimeSeries(filteredWo, (d) => d.Tanggal || d.Bulan)
  const expoTimeSeries = useTimeSeries(filteredExpo, (d) => d.Tanggal || d.Bulan)
  const xlsatuTimeSeries = useTimeSeries(filteredXlsatu, (d) => d.Tanggal || d.Bulan)

  const trendData = useMemo(() => {
    const allLabels = new Set<string>()
    ;[xlcTimeSeries, merchantTimeSeries, woTimeSeries, expoTimeSeries, xlsatuTimeSeries].forEach((ts) =>
      ts.forEach((p) => allLabels.add(p.label))
    )
    const maps = [
      new Map(xlcTimeSeries.map((p) => [p.label, p.count])),
      new Map(merchantTimeSeries.map((p) => [p.label, p.count])),
      new Map(woTimeSeries.map((p) => [p.label, p.count])),
      new Map(expoTimeSeries.map((p) => [p.label, p.count])),
      new Map(xlsatuTimeSeries.map((p) => [p.label, p.count])),
    ]
    const keys = ['XLC', 'Merchant', 'WO', 'EXPO', 'XL Satu']
    return Array.from(allLabels).sort().map((label) => ({
      label,
      ...Object.fromEntries(keys.map((k, i) => [k, maps[i].get(label) ?? 0])),
    }))
  }, [xlcTimeSeries, merchantTimeSeries, woTimeSeries, expoTimeSeries, xlsatuTimeSeries])

  // ── Sparklines ──
  const xlcSparkline = useMemo(() => computeMonthlySparkline(filteredXlc, () => 1), [filteredXlc])
  const gsfSparkline = useMemo(() => computeMonthlySparkline(filteredGsf, (d) => d.Amount), [filteredGsf])
  const merchantSparkline = useMemo(() => computeMonthlySparkline(filteredMerchant, () => 1), [filteredMerchant])
  const totalSparkline = useMemo(() => {
    const all = [...filteredXlc, ...filteredMerchant, ...filteredWo, ...filteredExpo, ...filteredXlsatu].map((d) => ({ Bulan: d.Bulan }))
    return computeMonthlySparkline(all, () => 1)
  }, [filteredXlc, filteredMerchant, filteredWo, filteredExpo, filteredXlsatu])

  // ── Category charts ──
  const chartByStore = useGroupedByCategory(filteredXlc, (d) => d.StoreName, () => 1, 10)
  const chartByPackage = useGroupedByCategory(filteredXlc, (d) => d.PackagePlan, () => 1, 8)
  const gsfChart = useGroupedByCategory(filteredGsf, (d) => d.EventName, () => 1, 8)

  const chartByRSM = useMemo(() => {
    const all = [...filteredXlc, ...filteredMerchant, ...filteredWo, ...filteredExpo, ...filteredXlsatu]
    const map = all.reduce<Record<string, number>>((acc, d: any) => {
      if (d.RSM) acc[d.RSM] = (acc[d.RSM] || 0) + 1
      return acc
    }, {})
    return Object.entries(map)
      .map(([name, Activations]) => ({ name, Activations }))
      .sort((a, b) => b.Activations - a.Activations)
  }, [filteredXlc, filteredMerchant, filteredWo, filteredExpo, filteredXlsatu])

  const channelMix = [
    { name: 'XLC', value: xlcTotal },
    { name: 'XL Satu', value: xlsatuTotal },
    { name: 'EXPO', value: expoTotal },
    { name: 'WO', value: woTotal },
    { name: 'Merchant', value: merchantTotal },
  ]

  // ── Target progress ──
  const targetData = useMemo(() => {
    const actuals: Record<string, number> = {
      XLC: xlcTotal, GSF: gsfTotal, Merchant: merchantTotal, WO: woTotal, EXPO: expoTotal, 'XL Satu': xlsatuTotal,
    }
    return Object.entries(CHANNEL_TARGETS).map(([channel, target]) => {
      const actual = actuals[channel] ?? 0
      const pct = computeTargetPercentage(actual, target)
      return { channel, target, actual, pct, status: getTargetStatus(pct) }
    })
  }, [xlcTotal, gsfTotal, merchantTotal, woTotal, expoTotal, xlsatuTotal])

  return {
    data, timeMode,
    // Counts
    xlcTotal, xlcNew, xlcMigrate, gsfTotal, gsfCount,
    merchantTotal, woTotal, expoTotal, xlsatuTotal, grandTotal,
    // Period
    xlcPeriod, gsfPeriod, merchantPeriod, allActivationPeriod,
    // Charts
    trendData, chartByStore, chartByPackage, chartByRSM, gsfChart, channelMix,
    // Sparklines
    xlcSparkline, gsfSparkline, merchantSparkline, totalSparkline,
    // Target
    targetData,
  }
}
