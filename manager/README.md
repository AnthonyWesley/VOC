# VOC Church — Frontend

Church management system frontend built with React 19, TypeScript, Vite, and Tailwind CSS.

## Stack

- **Framework**: React 19 + TypeScript + Vite 6
- **Styling**: Tailwind CSS 4.1 + DaisyUI 5.4
- **State**: Zustand (modal, timer, tour)
- **Data Fetching**: TanStack React Query 5
- **Routing**: React Router DOM v7
- **HTTP**: Axios with automatic 401 refresh token queue
- **Auth**: Cookie-based (httpOnly) with encrypted sessionStorage fallback
- **Payments**: Mercado Pago SDK (key via env)

## Setup

```bash
cp .env.example .env
# Fill in VITE_API_URL, VITE_STORAGE_KEY, VITE_MERCADO_PAGO_KEY
npm install
npm run dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5174) |
| `npm run build` | Typecheck + build to `dist/` |
| `npm run typecheck` | Run TypeScript type check |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Env

- `VITE_API_URL` — Backend URL (default: `http://localhost:3333`)
- `VITE_STORAGE_KEY` — Encryption key for sessionStorage
- `VITE_MERCADO_PAGO_KEY` — Mercado Pago public key
