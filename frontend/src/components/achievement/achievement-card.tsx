import { Fragment, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber } from '@/lib/utils'
import type { CardData } from '@/lib/achievement-computer'

interface StoreSummary {
  store: string
  sm: string
  ach: number
  tgt: number
  gap: number
  pct: number
}

interface ChannelGroup {
  channel: string
  stores: StoreSummary[]
  ach: number
  tgt: number
}

function computeStoreSummary(channel: string, leaves: CardData['leaves']) {
  const storeMap = new Map<string, { sm: string; ach: number; tgt: number }>()
  for (const l of leaves) {
    const s = storeMap.get(l.store) || { sm: '', ach: 0, tgt: 0 }
    if (!s.sm && l.sm) s.sm = l.sm
    s.ach += l.achievement
    s.tgt += l.target
    storeMap.set(l.store, s)
  }
  const stores = Array.from(storeMap.entries())
    .map(([store, s]) => ({ store, sm: s.sm, ach: s.ach, tgt: s.tgt, gap: s.tgt - s.ach, pct: s.tgt > 0 ? (s.ach / s.tgt) * 100 : 0 }))
    .sort((a, b) => a.store.localeCompare(b.store))
  const ach = stores.reduce((s, x) => s + x.ach, 0)
  const tgt = stores.reduce((s, x) => s + x.tgt, 0)
  return { channel, stores, ach, tgt }
}

interface Props {
  card: CardData
}

export function AchievementCard({ card }: Props) {
  if (card.leaves.length === 0) return null

  const { detailRows, channelGroups, totalAch, totalTgt } = useMemo(() => {
    const sorted = [...card.leaves].sort((a, b) =>
      a.store.localeCompare(b.store) || a.sm.localeCompare(b.sm) || a.name.localeCompare(b.name)
    )

    const groups = new Map<string, CardData['leaves']>()
    for (const l of sorted) {
      const g = groups.get(l.channel) || []
      g.push(l)
      groups.set(l.channel, g)
    }

    const channelGroups = Array.from(groups.entries()).map(([ch, leaves]) =>
      computeStoreSummary(ch, leaves)
    ).sort((a, b) => a.channel.localeCompare(b.channel))

    const totalAch = sorted.reduce((s, l) => s + l.achievement, 0)
    const totalTgt = sorted.reduce((s, l) => s + l.target, 0)

    return { detailRows: sorted, channelGroups, totalAch, totalTgt }
  }, [card.leaves])

  const totalGap = totalTgt - totalAch
  const totalPct = totalTgt > 0 ? (totalAch / totalTgt) * 100 : 0
  const multiChannel = channelGroups.length > 1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{card.title}</span>
          <span className="text-sm font-normal text-on-surface-variant font-data-mono">
            {formatNumber(totalAch)} / {formatNumber(totalTgt)} ({totalPct.toFixed(1)}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
          <h4 className="text-sm font-semibold text-on-surface mb-3">Detail Pencapaian per CRR</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Store</th>
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">SM</th>
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">CRR / Agent</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Ach</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Target</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Gap</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">%</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((l, i) => {
                  const pct = l.target > 0 ? (l.achievement / l.target) * 100 : 0
                  const gapColor = l.gap <= 0 ? 'text-error' : 'text-secondary'
                  const pctColor = pct >= 100 ? 'text-secondary' : pct >= 75 ? 'text-tertiary' : 'text-error'
                  return (
                    <tr key={i} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                      <td className="py-1.5 px-2 text-on-surface text-xs">{l.store}</td>
                      <td className="py-1.5 px-2 text-on-surface-variant text-xs">{l.sm || '-'}</td>
                      <td className="py-1.5 px-2 font-medium text-on-surface">{l.name}</td>
                      <td className="py-1.5 px-2 text-right font-data-mono">{formatNumber(l.achievement)}</td>
                      <td className="py-1.5 px-2 text-right font-data-mono">{formatNumber(l.target)}</td>
                      <td className={`py-1.5 px-2 text-right font-data-mono ${gapColor}`}>{l.gap >= 0 ? '+' : ''}{formatNumber(l.gap)}</td>
                      <td className={`py-1.5 px-2 text-right font-data-mono ${pctColor}`}>{pct.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-on-surface mb-3">Ringkasan per Store</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Store</th>
                  <th className="text-left py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Store Manager</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Ach</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Target</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">Gap</th>
                  <th className="text-right py-2 px-2 text-xs font-bold text-on-surface-variant uppercase">%</th>
                </tr>
              </thead>
              <tbody>
                {channelGroups.map((cg, gi) => (
                  <Fragment key={cg.channel}>
                    {gi > 0 && multiChannel && (
                      <tr><td colSpan={6} className="h-2" /></tr>
                    )}
                    {cg.stores.map((s, i) => (
                      <tr key={`${gi}-${i}`} className="border-b border-outline-variant/30 hover:bg-surface-container-low transition-colors">
                        <td className="py-2 px-2 font-medium text-on-surface">{s.store}</td>
                        <td className="py-2 px-2 text-on-surface-variant">{s.sm || '-'}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{formatNumber(s.ach)}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{formatNumber(s.tgt)}</td>
                        <td className={`py-2 px-2 text-right font-data-mono ${s.gap <= 0 ? 'text-error' : 'text-secondary'}`}>{s.gap >= 0 ? '+' : ''}{formatNumber(s.gap)}</td>
                        <td className="py-2 px-2 text-right font-data-mono">{s.pct.toFixed(1)}%</td>
                      </tr>
                    ))}
                    {multiChannel && (
                      <tr className="font-semibold border-b border-outline-variant">
                        <td className="py-2 px-2 text-on-surface" colSpan={2}>{cg.channel} TOTAL</td>
                        <td className="py-2 px-2 text-right font-data-mono text-on-surface">{formatNumber(cg.ach)}</td>
                        <td className="py-2 px-2 text-right font-data-mono text-on-surface">{formatNumber(cg.tgt)}</td>
                        <td className={`py-2 px-2 text-right font-data-mono ${cg.ach >= cg.tgt ? 'text-secondary' : 'text-error'}`}>{cg.ach >= cg.tgt ? '+' : ''}{formatNumber(cg.tgt - cg.ach)}</td>
                        <td className="py-2 px-2 text-right font-data-mono text-on-surface">{cg.tgt > 0 ? ((cg.ach / cg.tgt) * 100).toFixed(1) : '0.0'}%</td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                <tr className="border-t-2 border-outline font-bold">
                  <td className="py-2.5 px-2 text-on-surface" colSpan={2}>GRAND TOTAL</td>
                  <td className="py-2.5 px-2 text-right font-data-mono text-on-surface">{formatNumber(totalAch)}</td>
                  <td className="py-2.5 px-2 text-right font-data-mono text-on-surface">{formatNumber(totalTgt)}</td>
                  <td className="py-2.5 px-2 text-right font-data-mono text-on-surface">{totalGap >= 0 ? '+' : ''}{formatNumber(totalGap)}</td>
                  <td className="py-2.5 px-2 text-right font-data-mono text-on-surface">{totalPct.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
