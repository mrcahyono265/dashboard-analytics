# Prio Dashboard API

Backend API for Prio Dashboard - XL Axiata Sales Analytics

## Tech Stack

- **Runtime**: Bun
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (JSON Web Tokens)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Setup environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Setup database

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database
bun run db:push

# Seed initial data
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
- `POST /api/sync/excel365` - Trigger Excel 365 sync
- `GET /api/sync/status` - Get sync status
- `POST /api/sync/webhook` - Microsoft Graph webhook

## Default Users

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| manager1 | manager123 | MANAGER |
| sales1 | sales123 | SALES |
| sales2 | sales123 | SALES |
| sales3 | sales123 | SALES |
