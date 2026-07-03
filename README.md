# Prio Dashboard — XL Axiata Sales Analytics

Multi-channel sales performance dashboard with interactive charts, filters, and export capabilities. Built for XL Axiata achievement data (XLC, GSF, Merchant, WO, EXPO, XL Satu, ELITE, Promotor).

## Features

- **10 dashboard pages**: Overview, per-channel analytics, target vs realization
- **Interactive filters**: Bulan, RSM, SM, Store, Channel
- **Data sources**: Excel upload (.xlsx) or Google Sheets sync
- **Charts**: Area, Bar (vertical/horizontal), Pie/Donut, KPI cards with sparklines
- **Dark/light theme** with persistent preference
- **Export**: PDF, Excel (.xlsx), CSV
- **Responsive sidebar** with collapsible navigation

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + CSS variables theming
- Recharts (charts)
- Zustand (state management)
- TanStack Table (data tables)
- Radix UI (collapsible, tooltip, dropdown primitives)
- SheetJS / xlsx (Excel parsing)
- jsPDF + html2canvas (PDF export)
- Framer Motion (page transitions)

## Getting Started

```bash
npm install
npm run dev
```

Place your Excel data file at `public/data/Achievement%20Prio.xlsx` for auto-load on startup.

## Build

```bash
npm run build
```

Output goes to `dist/`, ready for static hosting (InfinityFree, Vercel, Netlify, etc.).

## Data Format

The dashboard parses an Excel file with 13 sheets: XLC, GSF, Merchant, WO, EXPO, XL Satu, ELITE, Promotor, Target, and supporting sheets. Each sheet is mapped to a typed interface in `src/lib/data.ts`.
