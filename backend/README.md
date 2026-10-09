# Analitics API

Backend API for Analitics - XL Axiata Sales Analytics

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT in an HttpOnly, SameSite cookie

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Setup environment

```bash
cp .env.example .env
# Edit DATABASE_URL for your local PostgreSQL credentials
```

Make sure PostgreSQL is running and the database named in `DATABASE_URL` already exists. The example URL uses the local database `prio_dashboard` and PostgreSQL account `postgres`.

Create the database once if needed:

```bash
createdb -U postgres prio_dashboard
```

### 3. Setup database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Create the development login and default targets (safe to rerun)
bun run db:seed
```

### 4. Start development server

```bash
bun run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Revoke all sessions for the current user
- `POST /api/auth/register` - Register (admin only)
- `GET /api/auth/me` - Get current user

### Data
- `GET /api/data` - Get all data overview
- `GET /api/data/:sheetType` - Get data for specific sheet
- `POST /api/data/upload` - Upload Excel file
- `GET /api/data/overview/stats` - Get statistics

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Sync
- `POST /api/sync/connect` - Get Microsoft OAuth URL
- `GET /api/sync/callback` - OAuth callback
- `POST /api/sync/excel365` - Trigger OneDrive sync
- `POST /api/sync/url` - Sync from URL
- `GET /api/sync/status` - Get sync status
- `GET /api/sync/events` - SSE real-time notifications
- `POST /api/sync/files` - List OneDrive files
- `GET /api/sync/download` - Download current data as Excel

### Targets
- `GET /api/targets` - List targets
- `POST /api/targets` - Create target
- `DELETE /api/targets/:id` - Delete target
- `POST /api/targets/bulk` - Bulk create targets

### Master Data
- `GET/POST/PUT/DELETE /api/stores` - Store management
- `GET/POST/PUT/DELETE /api/packages` - Package management
- `GET/POST/PUT/DELETE /api/user-assignments` - User-store-role assignments
- `GET/POST/PUT/DELETE /api/event-types` - Event type management
- `GET/PATCH /api/settings` - User settings

## Default Users (Seed — Dev Only)

Seed runs only when `NODE_ENV !== 'production'`.
It creates the default user and missing targets without deleting existing users, uploaded data, or customized targets.

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| adam.bakhtiar.muqsith | admin123 | RSE | Full admin access |

**Note:** In production, create the admin user manually after migration. See `deploy/DEPLOY.md`.
