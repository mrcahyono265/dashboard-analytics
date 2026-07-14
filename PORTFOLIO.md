---

title: "Analitics"
category: "Web Application"
status: "Production Ready"
framework: "React 19 + Express + Prisma"
language: "TypeScript"
repository: "https://github.com/mrcahyono265/dashboard-analytics"
demo: ""
started: "2025-01-01"
completed: "2026-07-14"
tags:
  - react
  - typescript
  - express
  - prisma
  - postgresql
  - docker
  - nginx
  - xl-axiata
  - sales-analytics
  - dashboard
--------

# Analitics

> Sales performance analytics dashboard for XL Axiata — replacing manual Excel reporting with interactive web visualization.

---

# Overview

Analitics is a full-stack web application that transforms raw Excel and Google Sheets sales data into interactive, real-time dashboards. Built for XL Axiata's multi-channel sales tracking across 8 data channels (XLC, GSF, Merchant, WO, EXPO, XL Satu, ELITE, Promotor).

The platform serves 4 user tiers (Staff → Supervisor → Manager → Owner) with role-based access control, real-time data sync via Microsoft 365 OneDrive, and comprehensive achievement tracking with target analysis.

---

# Business Problem

XL Axiata's sales teams across East Java relied on manual Excel spreadsheets to track daily activations, revenue, and team performance. This created several problems:

* **No real-time visibility**: Managers had to wait for end-of-day Excel reports to see performance.
* **Error-prone manual reporting**: Copy-pasting between sheets led to data inconsistency.
* **No centralized tracking**: Each channel (XLC, GSF, WO, EXPO, etc.) had separate Excel files.
* **No target tracking**: Achievement vs target comparison required manual calculation.
* **No historical analysis**: Trend analysis across months required manual pivot tables.

---

# Business Solution

Analitics replaces the manual Excel workflow with:

* **Centralized dashboard**: All 8 channels in one web application with real-time updates.
* **Automated data sync**: Excel upload, Google Sheets, or Microsoft 365 OneDrive auto-sync every 60 seconds.
* **Interactive achievement tracking**: Per-CRR performance with target gap analysis and period filtering.
* **Multi-level role access**: RSE (admin), Store Manager, and CRR (field staff) see appropriate data scopes.
* **Export capabilities**: PDF reports, Excel exports, and CSV for downstream analysis.
* **Mobile-responsive**: Field staff can check performance from their phones.

---

# Target Users

| Role | Access Level | Primary Use |
| --- | --- | --- |
| **RSE (Owner/Admin)** | All data, all channels | Full overview, user management, target setting |
| **Store Manager** | Their store only | Daily performance, team monitoring |
| **CRR (Field Staff)** | Their own data | Personal achievement tracking, data entry |

---

# Key Features

* **12+ dashboard pages** with interactive charts and data tables
* **Achievement system** with per-CRR target tracking and gap analysis
* **Multi-source data sync**: Excel upload, Google Sheets, OneDrive, URL polling
* **Manual data entry** with auto-fill from master assignments
* **Real-time SSE notifications** when data is updated
* **Period filtering** (monthly) with historical comparison
* **Role-based access control** (RBAC) with JWT authentication
* **Dark/light theme** with persistent preference
* **PDF/Excel/CSV export** for reporting
* **Responsive design** for desktop and mobile

---

# Technology Stack

| Category             | Technology |
| -------------------- | ---------- |
| Frontend             | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| State Management     | Zustand |
| Charts               | Recharts |
| Tables               | TanStack React Table 8 |
| Backend              | Bun, Express 4, TypeScript |
| Database             | PostgreSQL 16, Prisma ORM 6 |
| Auth                 | JWT, bcryptjs, Helmet, express-rate-limit |
| Container            | Docker, Docker Compose, Nginx |
| CI/CD                | Docker Compose on EC2 |

---

# Architecture

## Main Components

* **Frontend (React SPA)**: Vite-built single-page application with lazy-loaded routes. Zustand for global state, no Redux overhead. Served by internal Nginx container.
* **Backend (Bun + Express)**: RESTful API with Prisma ORM. Handles auth, data CRUD, file uploads, Microsoft 365 sync, and SSE real-time notifications.
* **Database (PostgreSQL)**: Stores user accounts, data records (JSON), targets, store/package master data, and sync logs.
* **Reverse Proxy (Nginx)**: Host-level nginx terminates SSL, proxies to the Docker web container which serves frontend static files and proxies `/api/*` to the backend.

## Data Flow

```
User Browser
    ↓ HTTPS
Host Nginx (reverse-proxy/conf.d/analitics.conf)
    ↓ :8082
Docker: Nginx Web Container (frontend/dist + /api proxy)
    ↓ :3001
Docker: Bun API Container (Express + Prisma)
    ↓ :5432
Docker: PostgreSQL Container
```

## Deployment Overview

* Single-host EC2 deployment
* Docker Compose manages 3 services (db, api, web)
* Host nginx shared across multiple projects via `~/reverse-proxy/conf.d/`
* SSL via Let's Encrypt
* Auto-sync from Microsoft 365 OneDrive every 60 seconds

---

# Engineering Decisions

| Decision | Reason | Trade-off |
| --- | --- | --- |
| Zustand over Redux | Simpler API, less boilerplate, sufficient for dashboard state | Less ecosystem tooling than Redux |
| JSON column for data records | Fast iteration, flexible schema for 8 different sheet types | No indexing on JSON fields; eventual normalization needed at scale |
| Bun over Node.js | Faster startup, native TypeScript, smaller runtime image | Smaller ecosystem than Node.js |
| Docker Compose over Kubernetes | Single-host simplicity, no orchestration overhead | No auto-scaling; manual scaling required |
| JWT in localStorage | Simple SPA auth without cookie infrastructure | XSS risk (mitigated with CSP + escape) |
| Nginx reverse-proxy over Traefik | Already running for other projects, minimal config change | Manual SSL management vs auto-cert |

---

# Challenges

* **Data format inconsistency**: Excel files had mixed date formats, inconsistent column names across sheets, and placeholder rows without MSISDN.
* **Period filtering bug**: `Bulan` field in manual data entry was stored as month abbreviation only ("Jul") without year, breaking period parsing.
* **Global data wipe on sync**: `clearAllUserData` function deleted ALL users and targets globally instead of scoping per-user.
* **Security audit findings**: 8 critical vulnerabilities including hardcoded secrets, no rate limiting, XSS in PDF export, and insecure fallback keys.
* **OAuth CSRF vulnerability**: Microsoft OAuth state parameter used raw userId, enabling account hijack via forged callback.

---

# Solutions

* **Data format**: Comprehensive date parser (`parseDate`) handling 8+ date formats. Field key normalization (`Tanggal` canonical).
* **Period filter**: Derived `Bulan` from `Tanggal` field with full month name + year. Two-dropdown period selector (month + year).
* **Data wipe**: Scoped `clearAllUserData` to user-owned records only. Wrapped in `prisma.$transaction` for atomicity.
* **Security hardening**: Fail-fast on missing secrets, rate limiting, Helmet headers, XSS escaping, magic byte upload validation, OAuth nonce state.
* **OAuth fix**: Random nonce stored in-memory Map with 5-minute expiry, verified on callback.

---

# Results

* **8 critical security vulnerabilities fixed** — production-safe authentication, authorization, and data protection
* **Enterprise-grade Docker setup** — multi-stage builds, health checks, graceful shutdown, non-root containers
* **18 performance optimizations** — Zustand selectors across all pages eliminating unnecessary re-renders
* **10 obsolete files/scripts removed** — clean codebase with no dead code
* **Data integrity restored** — transactions on all append/delete operations preventing race conditions

---

# Lessons Learned

* **Never use silent fallbacks for secrets**: A missing env var should crash the server, not silently use a public-known key.
* **Scope destructive operations per-user**: Global `deleteMany` calls are data-loss landmines in multi-user systems.
* **Validate file uploads beyond extension**: Client-controlled filenames and mimetypes are not security boundaries.
* **Normalize data at parse time**: Mixed date formats in storage mean every consumer re-parses, creating inconsistency points.
* **Use Zustand selectors**: `useStore()` without a selector re-renders on ANY state change, killing performance.

---

# Future Improvements

* **Prisma migrations**: Migrate from `db:push` to proper migration history for production schema evolution
* **API response typing**: Replace `any[]` with proper DTOs across the API client
* **Achievement page deduplication**: Consolidate 3 near-identical pages into a single parameterized component
* **Refresh token rotation**: Short-lived access tokens (15min) with refresh token rotation for better security
* **Monitoring**: Structured logging (pino) and health dashboards for production observability
* **GitHub Actions CI**: Automated lint, typecheck, and Docker build on pull requests

---

# Screenshots

## Desktop

*(Add screenshots after deployment)*

---

## Mobile

*(Add screenshots after deployment)*

---

# Repository

https://github.com/mrcahyono265/dashboard-analytics

---

# Live Demo

*(Deploy and add URL)*

---

# Project Status

* Status: Production Ready
* Last Updated: 2026-07-14

---

# Quick Summary

| Item             | Value                |
| ---------------- | -------------------- |
| Category         | Web Application      |
| Framework        | React 19 + Express   |
| Language         | TypeScript           |
| Database         | PostgreSQL 16        |
| Docker           | Yes (3 services)     |
| CI               | Manual (planned)     |
| AI Integration   | No                   |
| Responsive       | Yes                  |
| Production Ready | Yes                  |

---

# Notes

This project underwent a comprehensive enterprise-readiness audit covering security (10 critical fixes), bugs (6 fixes), code quality (9 improvements), and Docker/CI setup. All findings have been addressed. The project is ready for EC2 deployment via Docker Compose with shared nginx reverse-proxy.
