# Agent Notes

## Current DB Source of Truth
- Primary runtime database is Supabase Postgres (not local Docker/Postgres).
- `DATABASE_URL` in `.env` must point to Supabase with SSL **and PgBouncer flag**, e.g. `...?sslmode=require&pgbouncer=true`.
- The `pgbouncer=true` parameter is **mandatory** — Supabase pooler (port 6543) uses PgBouncer in transaction mode, which breaks Prisma's prepared statements without it.

## Setup Commands (Windows PowerShell)
- Install deps: `npm.cmd install`
- Regenerate Prisma client: `npm.cmd run db:generate`
- Run app: `npm.cmd run dev`
- **Important**: Stop the dev server before running `db:generate` — the Prisma engine DLL is locked while the server runs.

## Database Bootstrap Behavior
- `npm.cmd run db:bootstrap` should be used only for first-time initialization of an empty database or explicit reset scenarios.
- `scripts/bootstrap-db.mjs` loads `.env` and executes SQL files directly via `pg` using `DATABASE_URL`.
- Apply order is fixed:
  1. `ModelagemBanco/condoreserva_database.sql`
  2. `db/migrations/001_seed_usuarios_iniciais.sql`
  3. `db/migrations/002_auth_recuperacao_senha.sql`
  4. `db/migrations/003_reservas_aprovacao_notificacoes.sql`
- For focused fixes, run only migration 003: `npm.cmd run db:migrate:003`.

## Repo-Specific Gotchas
- `npm run lint` triggers interactive Next.js ESLint setup (no ESLint config committed yet). Do not rely on lint in non-interactive runs unless ESLint is configured first.
- Build is the safest non-interactive verification command right now: `npm.cmd run build`.
- Auth error messages in server actions should reference Supabase/DATABASE_URL, not local bootstrap/docker.
- Next.js dev indicator is disabled (`devIndicators: false` in `next.config.ts`).
- `staleTimes` experimental feature is enabled for client-side router cache (180s dynamic, 300s static).

## Architecture: Layout-Based Navigation
- Each role group (`/morador`, `/admin`, `/sindico`, `/perfil`) has a **shared `layout.tsx`** that renders the sidebar + header with user info.
- Layouts **persist across navigations** within the same group — only the page content re-renders.
- **`components/dashboard/sidebar.tsx`** — Client component (`"use client"`) using `usePathname()` for active nav highlighting.
- **`components/dashboard/page-header.tsx`** — Server component for per-page title/subtitle/roleLabel.
- **`components/dashboard/dashboard-shell.tsx`** — Legacy component, **no longer used** by any page. Kept for reference but can be deleted.
- Each **`loading.tsx`** (morador, admin, sindico) shows a spinner within the layout while page content loads.

## Main Runtime Areas
- App routes: `app/` (`/login/*`, `/morador/*`, `/admin/*`, `/sindico/*`, `/perfil`)
- Layouts: `app/morador/layout.tsx`, `app/admin/layout.tsx`, `app/sindico/layout.tsx`, `app/perfil/layout.tsx`
- Server actions: `app/actions/*.ts`
- Prisma schema: `prisma/schema.prisma`
- SQL base + migrations: `ModelagemBanco/` and `db/migrations/`
