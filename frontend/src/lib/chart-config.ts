// ─── Shared Chart Colors ─────────────────────────────────────
export const CHART_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
]

export const HEX_COLORS = [
  '#b4c5ff', // primary (blue)
  '#89ceff', // secondary (cyan)
  '#c0c1ff', // tertiary (violet)
  '#fbbf24', // amber
  '#f87171', // error (red)
  '#22d3ee', // cyan
  '#ec4899', // pink
  '#34d399', // success (green)
]

export const COLOR_ALIAS: Record<string, string> = {
  blue: HEX_COLORS[0],
  emerald: HEX_COLORS[7],
  violet: HEX_COLORS[2],
  orange: HEX_COLORS[3],
  rose: HEX_COLORS[4],
  cyan: HEX_COLORS[5],
  amber: HEX_COLORS[3],
  red: HEX_COLORS[4],
  teal: HEX_COLORS[5],
  green: HEX_COLORS[7],
  pink: HEX_COLORS[6],
}

// ─── Shared Chart Styling ────────────────────────────────────
export const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid var(--color-outline-variant)',
  background: 'var(--color-surface)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
}

export const AXIS_TICK_STYLE = {
  fill: 'var(--color-on-surface-variant)',
  fontSize: 12,
}

export const AXIS_LINE_STYLE = {
  stroke: 'var(--color-outline-variant)',
}

export const AXIS_PROPS = {
  tick: AXIS_TICK_STYLE,
  tickLine: false,
  axisLine: AXIS_LINE_STYLE,
}
