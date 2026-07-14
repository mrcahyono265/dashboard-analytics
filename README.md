# Analitics — XL Axiata Sales Analytics

> Sales performance analytics dashboard for XL Axiata. Replaces manual Excel reporting with interactive web-based visualization.

---

## Overview

Analitics is a multi-channel sales performance dashboard that transforms raw Excel/Google Sheets data into interactive visual analytics. Built for XL Axiata's achievement tracking across 8 data channels (XLC, GSF, Merchant, WO, EXPO, XL Satu, ELITE, Promotor).

The platform enables staff, supervisors, managers, and owners to track daily activations, revenue, targets, and team performance — all in real-time, without opening Excel.

---

## Features

- **12+ dashboard pages**: Overview, per-channel analytics (XLC, GSF, Merchant, WO, EXPO, XL Satu, ELITE, Promotor), achievement tracking, target vs realization, monitoring, reporting
- **Achievement system**: Per-CRR performance with target tracking, gap analysis, and period filtering
- **Interactive filters**: Bulan (month), RSM, SM, Store, Channel with drill-down navigation
- **Data sources**: Excel upload (.xlsx), Google Sheets sync, Microsoft 365 OneDrive sync, URL auto-sync
- **Manual data entry**: Form-based entry with auto-fill from master data assignments
- **Charts**: Area, Bar (vertical/horizontal), Pie/Donut, KPI cards with sparklines, Recharts-powered
- **Tables**: TanStack React Table with search, sort, pagination
- **Export**: PDF, Excel (.xlsx), CSV
- **Dark/light theme** with persistent preference
- **Role-based access control**: RSE (admin), Store Manager, CRR (field staff)
- **Real-time updates**: SSE-powered live data sync notifications
- **Responsive design**: Mobile-friendly with collapsible sidebar

---

## Technology Stack

| Category             | Technology |
| -------------------- | ---------- |
| Frontend Framework   | React 19 + TypeScript |
| Build Tool           | Vite 8 |
| Styling              | Tailwind CSS 4 + CSS Variables |
| State Management     | Zustand |
| Routing              | React Router DOM 7 |
| Charts               | Recharts |
| Tables               | TanStack React Table 8 |
| UI Primitives        | Radix UI |
| Animations           | Framer Motion |
| Icons                | Lucide React |
| Excel Parsing        | SheetJS (xlsx) |
| PDF Export           | jsPDF + html2canvas |
| Date Utils           | date-fns |
| Notifications        | Sonner |
| Backend Runtime      | Bun + Express 4 |
| Database             | PostgreSQL 16 + Prisma ORM 6 |
| Auth                 | JWT + bcryptjs |
| File Upload          | Multer |
| Validation           | Zod |
| Security             | Helmet, express-rate-limit |
| Container            | Docker + Docker Compose |
| Reverse Proxy        | Nginx |

---

## Project Structure

```text
dashboard_analytics/
├── frontend/               # React 19 + Vite 8 SPA
│   ├── src/
│   │   ├── lib/            # Utils, config, constants, store, parsers
│   │   ├── hooks/          # React hooks (auth, data, filters, time)
│   │   ├── components/     # UI components (charts, tables, filters, layout)
│   │   ├── pages/          # Route pages (12+ dashboards)
│   │   └── providers/      # Theme provider
│   ├── Dockerfile          # Multi-stage: node build → nginx serve
│   ├── nginx.conf          # SPA serve + /api proxy + SSE support
│   └── package.json
│
├── backend/                # Bun + Express + Prisma API
│   ├── src/
│   │   ├── routes/         # auth, data, users, sync, targets, stores, etc.
│   │   ├── middleware/     # JWT auth, RBAC
│   │   ├── lib/            # Prisma client, parsers, token store, SSE
│   │   └── jobs/           # Excel 365 + URL auto-sync jobs
│   ├── prisma/             # Schema + seed
│   ├── Dockerfile          # Multi-stage: bun build → slim runtime
│   ├── entrypoint.sh       # DB migration + server start
│   └── package.json
│
├── deploy/                 # Deployment artifacts
│   ├── DEPLOY.md           # Step-by-step EC2 deploy guide
│   └── analitics.conf      # Nginx reverse-proxy config template
│
├── scripts/                # Dev tools
│   ├── generate-dummy-data.mjs
│   └── test-ui.mjs
│
├── docker-compose.yml      # 3 services: db + api + web
├── .dockerignore
├── .env.example
└── .gitignore
```

---

## Prerequisites

Before starting, ensure the following tools are installed:

- **Node.js** 22+ ([download](https://nodejs.org/))
- **Bun** runtime ([install](https://bun.sh/))
- **PostgreSQL** 16+ (or use Docker)
- **Docker** + **Docker Compose** (for containerized deployment)
- **Git**

---

## Installation

```bash
# Clone the repository
git clone <repository-url> dashboard_analytics
cd dashboard_analytics

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
bun install

# Generate Prisma client
bun run db:generate
```

---

## Environment Variables

Copy the example environment file.

```bash
cp .env.example .env
```

Configure the required environment variables before running the application.

**Key variables:**

| Variable | Description | Required |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Min 32 characters, random | Yes |
| `FRONTEND_URL` | Frontend origin for CORS | Yes |
| `MS_CLIENT_ID` | Microsoft 365 OAuth (OneDrive sync) | Optional |
| `MS_TOKEN_ENCRYPTION_KEY` | 64-char hex key for token encryption | If using MS sync |

---

## Development

Start the development environment.

```bash
# Terminal 1 — Backend (from backend/)
bun run dev

# Terminal 2 — Frontend (from frontend/)
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3001`.

---

## Testing

Run the project tests.

```bash
# Frontend (from frontend/)
npx tsc --noEmit        # Type checking
npm run lint             # Linting

# Backend (from backend/)
npx tsc --noEmit        # Type checking

# UI smoke test (from root)
node scripts/test-ui.mjs
```

---

## Linting & Formatting

```bash
# Frontend
cd frontend && npm run lint
```

```bash
# Backend
cd backend && npx tsc --noEmit
```

---

## Docker

The project is fully containerized with multi-stage Dockerfiles. Three services run via Docker Compose: PostgreSQL, Bun API, and Nginx (frontend static serve + API proxy).

Build

```bash
docker compose up -d --build
```

Run

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

Services:
- **web**: Nginx on port `${WEB_PORT:-8082}` → serves frontend + proxies `/api` to api
- **api**: Bun on port 3001 → Express API + Prisma
- **db**: PostgreSQL 16 on port 5432

---

## Deployment

Deployment target: **EC2 with Docker Compose + shared nginx reverse-proxy**.

See [`deploy/DEPLOY.md`](deploy/DEPLOY.md) for the complete step-by-step guide including:
- Git clone + `.env` setup
- Docker Compose build
- Prisma migrations + admin user creation
- Reverse-proxy config (`deploy/analitics.conf`)
- SSL setup via Let's Encrypt
- Update + backup procedures

---

## Documentation

Project documentation can be found in:

```text
AGENTS.md          # AI agent context — project identity, tech stack, patterns
deploy/DEPLOY.md   # EC2 deployment guide
backend/README.md  # Backend API documentation
```

Additional documents may include:

* Architecture
* API Documentation
* Decision Records
* User Guides

---

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit using Conventional Commits.
4. Open a Pull Request.

---

## License

Proprietary — XL Axiata Internal Use.
