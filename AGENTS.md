# Agent Notes

## Current DB Source of Truth
- Primary runtime database is Supabase Postgres (not local Docker/Postgres).
- `DATABASE_URL` in `.env` must point to Supabase with SSL, e.g. `...?sslmode=require`.

## Setup Commands (Windows PowerShell)
- Install deps: `npm.cmd install`
- Regenerate Prisma client: `npm.cmd run db:generate`
- Run app: `npm.cmd run dev`

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

## Main Runtime Areas
- App routes: `app/` (`/login/*`, `/morador/*`, `/admin/*`, `/sindico/*`, `/perfil`)
- Server actions: `app/actions/*.ts`
- Prisma schema: `prisma/schema.prisma`
- SQL base + migrations: `ModelagemBanco/` and `db/migrations/`
