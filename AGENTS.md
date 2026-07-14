# Analitics — AI Agent Context

## Project Identity

**Analitics** — Sales performance analytics dashboard for XL Axiata.

**Purpose:** Replace manual Excel reporting with an interactive web dashboard. Stakeholder (Manager/Owner) bisa lihat perkembangan data secara visual tanpa buka Excel.

**Users:** Staff → Supervisor → Manager → Owner

---

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Routing | React Router DOM 7 |
| Charts | Recharts |
| Tables | TanStack React Table 8 |
| UI Primitives | Radix UI (dialog, dropdown, collapsible, tooltip, tabs, select) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Excel Parse | SheetJS (xlsx) |
| PDF Export | jsPDF + html2canvas |
| Date Utils | date-fns |
| Toast | Sonner |

---

## Data Model

Source: Excel Spreadsheet (XLSX/CSV) → Upload → Client-side parsing → Zustand store

8 data sheets:

| Sheet | Key Fields | Used For |
|---|---|---|
| `XLC` | MSISDN, Bulan, Tanggal, PackagePlan, PricePlan, StoreName, RSM, SM, NewMigrate | Activation tracking |
| `GSF` | Amount, Office, Operator, EventName, TransactionNumber | Revenue/transaction |
| `Merchant` | MSISDN, StoreName, RSM, SM | Merchant activations |
| `WO` | MSISDN, XLCName, AgentWO, RSM, Leader | WO Agent activations |
| `EXPO` | MSISDN, ExpoName, NamaPromotor, RSM | EXPO activations |
| `XLSatu` | NoSO, StoreName, NamaCRR | XL Satu Home Broadband |
| `ELITE` | Operator, NewConnection, PrepaidToPostpaid | Operator comparison |
| `Promotor` | NamaPromotor, dynamic columns | Promotor performance |

**Date Fields:**
- `Bulan` — Month string: "Jan-24", "Januari 2024", "01/2024"
- `Tanggal` — Full date: "15/01/2024, 08.30" (output of formatExcelDate)

Parse all dates via `frontend/src/lib/date-parser.ts`.

---

## File Structure

```
frontend/                   # React 19 + Vite 8 app
├── src/
│   ├── lib/                # Utilities, config, constants
│   │   ├── api.ts          # API client (REST calls)
│   │   ├── auth.ts         # Login/session (API + localStorage fallback)
│   │   ├── chart-config.ts # Shared chart colors, tooltip, axis styles
│   │   ├── constants.ts    # CHANNEL_TARGETS, getTimeLabel, column factories
│   │   ├── data.ts         # TypeScript interfaces for all 8 data types
│   │   ├── date-parser.ts  # Parse all date formats, time grouping
│   │   ├── excel.ts        # Excel parsing + duplicate detection
│   │   ├── logger.ts       # Telemetry/logging system
│   │   ├── sparkline.ts    # Monthly sparkline computation
│   │   ├── store.ts        # Zustand store (data, filters, timeMode, dateRange)
│   │   └── utils.ts        # cn(), formatCurrency(), formatNumber(), formatCompact()
│   │
│   ├── hooks/              # React hooks
│   │   ├── use-auth.ts     # Login/logout/session
│   │   ├── use-channel-data.ts # useAllChannelData()
│   │   ├── use-data.ts     # useDataLoader() — Excel/Google Sheets import
│   │   ├── use-filtered-data.ts # apply Bulan/RSM/SM/Store/Channel filters
│   │   ├── use-page-context.ts # common page init
│   │   ├── use-perf.ts     # Performance tracking
│   │   └── use-time-data.ts # useTimeSeries(), useGroupedByCategory(), usePeriodComparison()
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app-layout.tsx  # Sidebar + Header + FilterBar + TimeFilter + Outlet
│   │   │   ├── header.tsx      # Title, upload, filter, theme, user, logout
│   │   │   └── sidebar.tsx     # Collapsible nav with groups
│   │   ├── charts/
│   │   │   ├── kpi-card.tsx    # KPI card with value, trend, sparkline
│   │   │   ├── bar-chart.tsx   # Vertical/horizontal bar chart
│   │   │   ├── pie-chart.tsx   # Donut/pie chart
│   │   │   ├── line-chart.tsx  # Multi-line chart
│   │   │   └── area-chart.tsx  # Multi-category area chart
│   │   ├── filters/
│   │   │   ├── filter-bar.tsx  # Multi-select dropdowns
│   │   │   └── time-filter.tsx # Daily/Weekly/Monthly/Yearly toggle + date range
│   │   ├── tables/
│   │   │   └── data-table.tsx  # TanStack table with search, sort, pagination
│   │   ├── export/
│   │   │   └── export-buttons.tsx # Export Excel/CSV/PDF
│   │   ├── dev/
│   │   │   └── log-viewer.tsx  # Dev-only log panel (Ctrl+`)
│   │   ├── error-boundary.tsx  # React error boundary
│   │   └── ui/                 # Reusable primitives (card, badge, button, skeleton)
│   │
│   ├── pages/
│   │   ├── login.tsx       # Login form
│   │   ├── overview.tsx    # Main dashboard (KPIs + charts)
│   │   ├── xlc.tsx         # XLC channel detail
│   │   ├── gsf.tsx         # GSF channel detail
│   │   ├── merchant.tsx    # Merchant channel detail
│   │   ├── wo.tsx          # WO Agent channel detail
│   │   ├── expo.tsx        # EXPO channel detail
│   │   ├── xlsatu.tsx      # XL Satu channel detail
│   │   ├── elite.tsx       # ELITE operator comparison
│   │   ├── promotor.tsx    # Promotor performance
│   │   ├── target.tsx      # Target vs Realisasi
│   │   ├── reporting.tsx   # Full reporting page
│   │   ├── monitoring.tsx  # Monitoring with progress bars
│   │   ├── upload.tsx      # Excel upload page
│   │   ├── excel365-settings.tsx # Microsoft 365 sync settings
│   │   └── not-found.tsx   # 404 page
│   │
│   ├── providers/
│   │   └── theme-provider.tsx # Light/dark theme context
│   │
│   ├── App.tsx             # Router + lazy loading + auth guard
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind + CSS variables + animations
│
├── public/                 # Static assets
│   ├── favicon.svg
│   └── icons.svg
│
├── index.html
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── package.json
└── .env

backend/                    # Express + Prisma + PostgreSQL API (Bun)
├── src/
│   ├── index.ts            # Express server entry
│   ├── routes/
│   │   ├── auth.ts         # Login/register/me
│   │   ├── data.ts         # CRUD data records, Excel upload
│   │   ├── targets.ts      # Target management
│   │   ├── sync.ts         # Microsoft 365 sync
│   │   └── users.ts        # User management (RSE only)
│   ├── middleware/
│   │   ├── auth.ts         # JWT auth middleware
│   │   └── rbac.ts         # Role-based access (RSE/STORE_MANAGER/CRR)
│   ├── lib/
│   │   ├── db.ts           # Prisma client
│   │   ├── parser.ts       # Server-side Excel parser
│   │   └── excel365.ts     # Microsoft Graph API client
│   └── jobs/
│       └── sync-excel365.ts # Auto-sync job
│
├── prisma/
│   ├── schema.prisma       # DB schema (User, DataRecord, Target, SyncLog)
│   └── seed.ts             # Seed data
│
├── package.json
├── tsconfig.json
└── .env.example

scripts/                    # DevOps scripts
├── deploy.sh               # Deploy to EC2
├── ec2-setup.sh            # Initial EC2 setup
├── backup-db.sh            # Database backup
├── health-check.sh         # Server health check
├── generate-dummy-data.mjs # Generate test data
├── test-ui.mjs             # UI test script
└── DEPLOY.md               # Deployment guide
```

---

## Routing

| Path | Page | Auth Required |
|---|---|---|
| `/login` | LoginPage | No |
| `/` | OverviewPage | Yes |
| `/xlc` | XLCPage | Yes |
| `/gsf` | GSFPage | Yes |
| `/merchant` | MerchantPage | Yes |
| `/wo` | WOPage | Yes |
| `/expo` | EXPOPage | Yes |
| `/xlsatu` | XLSatuPage | Yes |
| `/elite` | ELITEPage | Yes |
| `/promotor` | PromotorPage | Yes |
| `/target` | TargetPage | Yes |
| `/reporting` | ReportingPage | Yes |
| `/monitoring` | MonitoringPage | Yes |
| `*` | NotFoundPage | No |

All routes lazy-loaded via `React.lazy()`.

---

## Core Patterns

### 1. Channel Page Pattern

Every channel page follows this structure:

```tsx
export function ChannelPage() {
  const { data } = useStore()
  const timeMode = useStore((s) => s.timeMode)
  const pageRef = useRef<HTMLDivElement>(null)
  const channelData = useFilteredData(data?.channelKey, 'ChannelName')

  // KPIs
  const periodComparison = usePeriodComparison(channelData, extractDate)
  const timeSeries = useTimeSeries(channelData, extractDate)
  const chartByCategory = useGroupedByCategory(channelData, extractCategory, extractValue)

  const columns: ColumnDef<Type>[] = [...]

  return (
    <div ref={pageRef}>
      <PageHeader title="..." exportData={...} />
      <KPIGrid ... />
      <TrendChart ... />
      <CategoryCharts ... />
      <DataTable columns={columns} data={channelData} />
    </div>
  )
}
```

### 2. Multi-Channel Pages

Overview, Target, Reporting, Monitoring use `useAllChannelData()`:

```tsx
const { xlc, gsf, merchant, wo, expo, xlsatu, grandActivationCount } = useAllChannelData()
```

### 3. Time Aggregation

Controlled by `store.timeMode` ('daily' | 'weekly' | 'monthly' | 'yearly') + `store.customDateRange`.

All hooks automatically filter by current time mode.

### 4. Filtering

Filter state in Zustand: `{ bulan: [], rsm: [], sm: [], store: [], channel: [] }`

`useFilteredData(data, channel)` applies all active filters. If `channel` is provided and channel filter is active, returns `[]` if channel not selected.

---

## UI Guidelines

### Layout

- **Sidebar:** 240px expanded, 60px collapsed. Groups: Overview, Channels, Reports.
- **Header:** Fixed 64px. Contains: search, filter, theme, notifications, user info.
- **Filter Bar:** Collapsible below header. Multi-select dropdowns with checkboxes.
- **Time Filter:** Below filter bar. Toggle group (Daily/Weekly/Monthly/Yearly) + date range picker.
- **Main Content:** Scrollable area with 24px padding.

### Typography (Multi-Font System)

**Fonts:**
- **Inter** — Body text, UI labels (primary workhorse)
- **Hanken Grotesk** — Headlines, display numbers (sharp, contemporary)
- **JetBrains Mono** — KPI values, table data (character alignment)
- **Geist** — Labels, uppercase metadata (developer-centric feel)

**Type Scale:**
```css
display-lg: 32px/40px font-700 -0.02em tracking
headline-md: 24px/32px font-600 -0.01em tracking
title-sm: 18px/28px font-600
body-md: 16px/24px font-400
body-sm: 14px/20px font-400
label-caps: 12px/16px font-600 0.05em tracking (uppercase)
data-mono: 14px/20px font-500
```

### Color System (Stitch Design Tokens)

**Dark Mode (Primary — "Luminous Professional"):**
```css
/* Core surfaces */
--color-background: #0b1326     /* Deep obsidian slate */
--color-surface: #171f33        /* Card background */
--color-surface-container: #171f33
--color-surface-container-low: #131b2e
--color-surface-container-lowest: #060e20
--color-surface-container-high: #222a3d
--color-surface-container-highest: #2d3449
--color-surface-bright: #31394d

/* Text hierarchy */
--color-on-surface: #dae2fd       /* Primary text */
--color-on-surface-variant: #c3c6d7 /* Secondary text */
--color-on-background: #dae2fd

/* Primary blue */
--color-primary: #b4c5ff          /* Interactive elements */
--color-primary-container: #2563eb /* Buttons, active states */
--color-on-primary: #002a78
--color-on-primary-container: #eeefff

/* Semantic colors */
--color-secondary: #89ceff
--color-secondary-container: #00a2e6
--color-tertiary: #c0c1ff
--color-tertiary-container: #585be6
--color-error: #ffb4ab
--color-error-container: #93000a

/* Borders & outlines */
--color-outline: #8d90a0
--color-outline-variant: #434655
```

**Light Mode ("Analitics"):**
```css
/* Core surfaces */
--color-background: #f9f9ff     /* Light grayish blue */
--color-surface: #ffffff
--color-surface-container: #ecedf7
--color-surface-container-low: #f2f3fd
--color-surface-container-lowest: #ffffff
--color-surface-container-high: #e6e7f2
--color-surface-container-highest: #e1e2ec

/* Text hierarchy */
--color-on-surface: #191b23     /* Primary text — Navy Slate */
--color-on-surface-variant: #424754 /* Secondary text */

/* Primary blue */
--color-primary: #0058be
--color-primary-container: #2170e4
--color-on-primary: #ffffff
--color-on-primary-container: #fefcff

/* Semantic colors */
--color-secondary: #505f76
--color-secondary-container: #d0e1fb
--color-tertiary: #924700
--color-tertiary-container: #b75b00
--color-error: #ba1a1a
--color-error-container: #ffdad6

/* Borders & outlines */
--color-outline: #727785
--color-outline-variant: #c2c6d6
```

**Color Usage Rules:**
- **Primary Blue** — Interactive elements, primary actions, brand identification
- **Semantic Colors** (Green/Amber/Red) — Status indicators, trend direction, critical alerts ONLY
- **Neutral Scales** — Navy Slate for text (high contrast without harshness of pure black)
- **Surface Strategy** — Tiered background: main workspace = Light Grayish Blue, cards = pure white

### Cards

- Use `<Card>` wrapper with `border-l-4` for KPI cards
- KPI Card variants: `default` (blue), `success` (green), `warning` (amber), `danger` (red)
- Include: title, value (large, bold), subtitle, trend badge, optional sparkline
- Use `rounded-2xl` for modern aesthetic
- Add `shadow-sm` for subtle depth

### Charts

**Bar Chart:**
- Default layout: vertical (categories on Y-axis)
- Max 10 items, sort by value descending
- Rounded corners: `radius={[4, 4, 0, 0]}`
- Max bar size: 40px
- Colors: use named aliases (blue, emerald, violet, etc.) or hex

**Pie/Donut Chart:**
- Default: donut (`innerRadius={60}`, `outerRadius={90}`)
- Show total label below if donut
- Legend with circle icons

**Area Chart:**
- Gradient fills via `<linearGradient>`
- No dots, active dots only
- Multi-category with legend

**Line Chart:**
- `strokeWidth={2}`, dots with `r={3}`, active dots `r={5}`
- Multi-line with legend

**Chart Tooltip:**
```ts
contentStyle={{
  borderRadius: '8px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-surface)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}}
```

**Axis Styling:**
```ts
tick={{ fill: 'var(--color-text-tertiary)', fontSize: 12 }}
tickLine={false}
axisLine={{ stroke: 'var(--color-border)' }}
```

### Data Tables

- Use `<DataTable>` component (TanStack Table)
- Features: global search, column sorting, pagination (20 rows default)
- Compact mode for detail pages
- Striped rows, hover states
- Empty state: "No data found"

### Animations

- Page transitions: `AnimatePresence` + `motion.div` (fade + slide, 200ms ease-out)
- Overview: staggered entry for KPI cards and charts (`staggerChildren: 0.05`)
- Card hover: subtle lift effect
- Sidebar collapse: smooth width transition (300ms)

### Responsive

- Grid breakpoints: `sm:640px`, `lg:1024px`, `xl:1280px`
- KPI grid: 2 cols mobile → 3 cols tablet → 4-6 cols desktop
- Charts: full width, 300-350px height
- Sidebar: overlay on mobile (future)

---

## Shared Constants

### Channel Targets (`lib/constants.ts`)

```ts
const CHANNEL_TARGETS = {
  XLC: 500,
  GSF: 300_000_000,  // Revenue in IDR
  Merchant: 50,
  WO: 100,
  EXPO: 200,
  'XL Satu': 20,
}
```

### Time Labels

```ts
getTimeLabel('daily')   → 'Hari Ini'
getTimeLabel('weekly')  → 'Minggu Ini'
getTimeLabel('monthly') → 'Bulan Ini'
getTimeLabel('yearly')  → 'Tahun Ini'
```

### Target Status

```ts
getTargetStatus(100) → 'on-track'
getTargetStatus(80)  → 'need-improvement'
getTargetStatus(50)  → 'below-target'

getTargetStatusVariant('on-track') → 'success'
getTargetStatusVariant('need-improvement') → 'warning'
getTargetStatusVariant('below-target') → 'danger'
```

### Chart Colors

```ts
HEX_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6']

COLOR_ALIAS = {
  blue: '#3b82f6', emerald: '#10b981', violet: '#8b5cf6',
  orange: '#f59e0b', red: '#ef4444', cyan: '#06b6d4',
  amber: '#f59e0b', teal: '#14b8a6', green: '#10b981', pink: '#ec4899',
}
```

---

## Telemetry / Logging

Logger (`lib/logger.ts`):
- Levels: debug, info, warn, error
- `logger.info('category', 'message', { data })`
- `logger.startTimer('category', 'label')` → returns `(success?: boolean) => duration`
- Dev console output with colors
- Log viewer: `Ctrl+` ` to toggle (dev only)

Logged events:
- `data` — Excel import, Google Sheets fetch, data changes
- `filter` — Filter changes
- `auth` — Login, logout, session restore
- `render` — Component re-renders (dev)
- `chart` — Slow chart renders >100ms

---

## Code Conventions

### Naming

- Components: `PascalCase` (KPICard, BarChart, DataTable)
- Files: `kebab-case` (kpi-card.tsx, use-filtered-data.ts)
- Hooks: `use-` prefix (useFilteredData, useTimeSeries)
- Utils: `camelCase` (formatCurrency, getTimeKey)
- Constants: `UPPER_SNAKE_CASE` (CHANNEL_TARGETS, HEX_COLORS)
- Interfaces: `PascalCase`, no `I` prefix (FilterState, TimeBucket)

### Imports

```tsx
// 1. React
import { useMemo, useRef } from 'react'

// 2. External libs
import { useReactTable } from '@tanstack/react-table'

// 3. Internal components
import { Card, CardContent } from '@/components/ui/card'
import { BarChart } from '@/components/charts/bar-chart'

// 4. Hooks
import { useStore } from '@/lib/store'
import { useFilteredData } from '@/hooks/use-filtered-data'

// 5. Lib/utils
import { formatNumber } from '@/lib/utils'
import { getTimeLabel } from '@/lib/constants'

// 6. Types
import type { ColumnDef } from '@tanstack/react-table'
import type { XLC } from '@/lib/data'

// 7. Icons (last)
import { Smartphone, Users } from 'lucide-react'
```

### Component Structure

```tsx
interface Props {
  title: string
  data: any[]
  // ...
}

export function ComponentName({ title, data }: Props) {
  // 1. Hooks (useState, useRef, useStore, useMemo)
  // 2. Derived state (useMemo computations)
  // 3. Event handlers
  // 4. Render
  return (
    <div>
      {/* Content */}
    </div>
  )
}
```

### Styling

- Always use Tailwind classes
- Use `cn()` utility for conditional classes: `cn('base-class', condition && 'conditional')`
- CSS variables for theme colors: `text-text`, `bg-surface`, `border-border`
- No inline styles except dynamic values (width percentages, etc.)

### State Management

- **Zustand store** for global state (data, filters, timeMode, theme)
- **Local state** for UI-only state (open/close, selected tab)
- **useMemo** for expensive computations (filtering, aggregation)
- **Never** mutate state directly, always use store actions

---

## Build & Dev

```bash
npm run dev        # Start dev server (localhost:5173)
npm run build      # TypeScript check + production build
npm run lint       # Run oxlint
npm run preview    # Preview production build
```

Build output: `dist/` directory. Entry: `dist/index.html`.

---

## Design Reference Files

Stitch HTML references are in `stitch_prio_sales_dashboard.zip` (extracted to `/tmp/stitch_ref/`):

| File | Description |
|---|---|
| `prio_dashboard_overview_dark_mode/` | Overview dashboard (dark) |
| `prio_dashboard_xlc_channel_dark_mode/` | XLC channel detail (dark) |
| `prio_dashboard_gsf_revenue/` | GSF revenue (light) |
| `prio_dashboard_gsf_revenue_dark_mode/` | GSF revenue (dark) |
| `prio_dashboard_merchant/` | Merchant activations (light) |
| `prio_dashboard_merchant_dark_mode/` | Merchant activations (dark) |
| `prio_dashboard_wo_agent/` | WO Agent activations (light) |
| `prio_dashboard_wo_agent_dark_mode/` | WO Agent activations (dark) |
| `prio_dashboard_xl_satu/` | XL Satu broadband (light) |
| `prio_dashboard_xl_satu_dark_mode/` | XL Satu broadband (dark) |
| `prio_dashboard_target_vs_realisasi_dark_mode/` | Target vs Realisasi (dark) |
| `luminous_professional/DESIGN.md` | Dark mode design system |
| `prio_dashboard/DESIGN.md` | Light mode design system |

**Key Patterns from Reference:**
- Sidebar: Material Symbols icons, rounded-2xl nav items, active state with bg-primary-container
- Header: backdrop-blur-md, search input, filter/theme/notifications buttons, user avatar
- KPI Cards: text-4xl headline values, uppercase labels, trend badges with icons
- Charts: SVG-based with gradient fills, animated data points
- Tables: Monospace data (JetBrains Mono), status badges with colors, hover states
- Progress bars: Rounded-full with gradient fills

---

## Future Considerations

- Mobile responsive (sidebar overlay)
- Backend API + PostgreSQL database
- Auto-sync Google Sheets
- Multi-user with roles
- Dark mode (already implemented)
- Scheduled reports via email
- Notification system
- Multiple dashboard layouts
