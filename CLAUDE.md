# PicImpact

Self-deployable photography portfolio website built with Next.js 16 + Hono.js + PostgreSQL.

## Quick Reference

```bash
# Development
pnpm run dev:server          # Start dev server
pnpm run dev:turbopack       # Dev with Turbopack

# Build
pnpm run build               # Production build
pnpm run build:vercel        # Vercel deployment build
pnpm run build:node          # Node.js deployment build

# Database
pnpm run prisma:generate     # Generate Prisma client
pnpm run prisma:dev          # Run dev migrations
pnpm run prisma:deploy       # Deploy migrations
pnpm run prisma:seed         # Seed initial data

# Linting
pnpm run lint                # ESLint check
pnpm run lint:fix            # Auto-fix lint issues
```

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript (strict mode)
- **Backend API:** Hono.js (routes in `hono/`)
- **Database:** PostgreSQL + Prisma ORM (`prisma/schema.prisma`)
- **Auth:** better-auth (email/password, TOTP 2FA, WebAuthn Passkeys)
- **Styling:** Tailwind CSS v4 + Radix UI + shadcn/ui
- **State:** Zustand + SWR
- **i18n:** next-intl (zh, en, ja, zh-TW)
- **Storage:** AWS S3 / Cloudflare R2 / Open List API

## Project Structure

```
app/                    # Next.js app router
  (default)/            # Public gallery routes
  admin/                # Admin dashboard
  api/                  # API routes (auth + Hono)
  login/ sign-up/       # Auth pages
components/             # React components (admin/, gallery/, ui/, etc.)
hono/                   # Hono API route handlers
  open/                 # Public API endpoints
  storage/              # Storage-specific endpoints
server/                 # Server-side code
  auth/                 # better-auth config
  db/query/             # Database read queries
  db/operate/           # Database write operations
  lib/                  # Utilities (db client, S3, R2, uploads)
stores/                 # Zustand stores
hooks/                  # React hooks
types/                  # TypeScript type definitions
messages/               # i18n translation JSON files
prisma/                 # Schema, migrations, seed
style/                  # Global CSS
```

## Code Conventions

- **Quotes:** Single quotes (enforced by ESLint)
- **Semicolons:** Never (enforced by ESLint)
- **`any`:** Warned, avoid where possible
- **Path alias:** `~/` maps to project root
- **Components:** PascalCase filenames
- **Pages/routes:** lowercase (Next.js convention)
- **No unused variables/parameters** (TypeScript strict)

## Architecture Notes

- **API routes:** Hono handles `/api/v1/*` (protected) and `/api/open/*` (public). Auth routes at `/api/auth/[...all]` via better-auth.
- **Database queries:** Read operations in `server/db/query/`, write operations in `server/db/operate/`. Prisma singleton in `server/lib/db.ts`.
- **Auth:** Sessions stored in DB, cookie-based with 7-day duration. Protected routes require auth middleware.
- **Images:** Support EXIF extraction, thumbhash generation, Live Photos, WebGL viewer, map clustering via Supercluster.
- **Deployment:** Docker (multi-arch), Vercel, or bare Node.js. `script.sh` handles Docker startup (migrate + seed + start).

## Environment Variables

Key variables (see `.env.example` for full list):

- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL connections
- `BETTER_AUTH_SECRET` — Auth secret key
- `BETTER_AUTH_URL` — App base URL
- `BETTER_AUTH_PASSKEY_RP_ID` / `BETTER_AUTH_PASSKEY_RP_NAME` — WebAuthn config

## Git Workflow

Never commit directly to main. Use feature branches (`feat/<topic>`, `fix/<topic>`) and PRs.
