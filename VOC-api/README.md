# VOC Church — API

Backend API for church management (members, events, finances, ministries, posts, auth).

## Stack

- **Runtime**: Node + TypeScript
- **Framework**: Express 5
- **ORM**: Prisma 6 (SQLite / PostgreSQL-ready)
- **Auth**: JWT (access + refresh tokens) via httpOnly cookies
- **Hash**: bcrypt (12 rounds)
- **Validation**: Zod

## Setup

```bash
cp .env.example .env
# Fill in JWT_SECRET, ADMIN_PASSWORD
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 3333) |
| `npm run typecheck` | Run TypeScript type check |
| `npm run seed` | Seed database with sample data |

## Env

- `JWT_SECRET` — Secret for signing JWT (required, 256+ bits)
- `DATABASE_URL` — Prisma datasource URL
- `ADMIN_PASSWORD` — Password for admin seed user (required)
- `NODE_ENV` — `production` enables secure cookies
