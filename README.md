# Aabha

Beauty & Personal Care e-commerce platform for the Bangladesh market.

A pnpm + Turborepo monorepo with a **fully separated** Next.js storefront/admin and
NestJS API. The two apps share nothing but the lint/tsconfig presets in `tooling/` —
no backend code is ever imported into the frontend, or vice versa.

> **Status — Milestone 1 (Foundation) complete.**
> Repo scaffold, DB-driven design tokens, runtime-editable navigation, and the full
> auth surface (unified login bar, OTP, OAuth, guest checkout, password reset) are
> implemented and running. Milestones 2–6 are scoped in [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## Repository structure

```
aabha/
├── apps/
│   ├── backend/          # NestJS + Drizzle ORM + PostgreSQL + Redis
│   └── frontend/         # Next.js App Router storefront + /admin
├── tooling/
│   ├── eslint-config/    # index.js (base) · node.js · react.js
│   └── tsconfig/         # base.json · node.json · react.json
├── docs/
├── .gitignore · .prettierignore · .prettierrc
├── package.json          # workspace scripts (dev, build, lint, format, typecheck)
├── pnpm-workspace.yaml
└── turbo.json
```

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, React Query, Zustand |
| Backend | NestJS 10, TypeScript, REST (`/api/v1`), Swagger at `/api/docs` |
| Database | PostgreSQL 17 + **Drizzle ORM** (see the note below) |
| Cache / queues | Redis via a swappable `CacheDriver` (in-memory fallback for local dev), BullMQ ready |
| Auth | JWT access + rotating refresh tokens, Passport (Google/Facebook), OTP over a swappable SMS provider |
| i18n | English + Bangla, instant header toggle, per-locale DB columns |

### Why Drizzle instead of Prisma

The brief specifies Prisma. Prisma's CLI and client download their Rust engine
binaries from `binaries.prisma.sh` at install time, and that host is unreachable from
this build environment (only the npm registry and GitHub are), so `prisma generate`
and `prisma db push` cannot run here.

Drizzle ORM is a drop-in-grade replacement for this use case: pure TypeScript, no
native binaries, first-class Postgres support, SQL-shaped queries and a
`drizzle-kit push/generate/migrate` workflow. The complete Section 6 data model is
implemented in `apps/backend/src/db/schema/`. If you deploy somewhere with access to
Prisma's CDN and prefer Prisma, the schema translates one-to-one.

---

## Getting started

Requirements: **Node ≥ 20.11**, **pnpm 9** (`corepack enable`), and a PostgreSQL 17
database. Redis is optional in development.

```bash
pnpm install

# 1. Environment
cp apps/backend/.env.example  apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# 2. Database — either point DATABASE_URL at your own Postgres, or run the
#    bundled dev instance (npm-distributed binaries, no apt/brew needed):
pnpm --filter @aabha/backend db:local     # keep this running in its own terminal

# 3. Schema + seed data
pnpm db:push
pnpm db:seed

# 4. Run both apps
pnpm dev
```

| Service | URL |
| --- | --- |
| Storefront | http://localhost:3000 |
| Admin panel | http://localhost:3000/admin |
| API | http://localhost:4000/api/v1 |
| API docs (Swagger) | http://localhost:4000/api/docs |

**Seeded accounts**

| Role | Identifier | Password |
| --- | --- | --- |
| Super admin | `admin@aabha.com.bd` | `Aabha@2026` |
| Customer | `shopper@example.com` | `Shopper@2026` |

The browser never calls the API host directly: Next.js proxies same-origin
`/api/*` to the backend (`next.config.js` → `rewrites`), which keeps auth cookies
first-party and works unchanged behind any preview/CDN proxy.

## Workspace scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Runs both apps in parallel via Turborepo |
| `pnpm build` | Production build of both apps |
| `pnpm lint` / `pnpm lint:fix` | ESLint 9 flat config from `tooling/eslint-config` |
| `pnpm typecheck` | `tsc --noEmit` in both apps |
| `pnpm test` | Jest suites (order state machine, profit calculator) |
| `pnpm format` | Prettier across the repo |
| `pnpm db:push` / `db:seed` / `db:migrate` / `db:studio` | Drizzle Kit, scoped to the backend |

---

## What Milestone 1 delivers

### Design tokens live in the database

Every colour, font, radius and shadow is a row in `theme_settings`. The Next.js
server fetches the active theme on each request and injects it as CSS custom
properties; Tailwind's config maps its colour/radius scales onto those variables.
Changing `color.primary` in the admin panel restyles the whole site — **no rebuild,
no redeploy**.

Palette rules enforced by the system:

- **No pure black.** `color.ink` is a warm off-black (`#211C1A`); an ESLint rule flags
  `#000` literals in JSX.
- **Grey only in reviews.** The grey tones live under `color.review.*` and are applied
  through the `.aabha-review-surface` component class.
- **Distinct men's / women's / makeup accents.** Tokens carry `segmentValues`, emitted
  as `[data-segment="MEN"]` scopes, so a page opts in with a single attribute while
  staying inside the same creamy-gold palette.

Admin edits are **staged**: they save to `draft_value` and only reach the live site
when "Publish / Go Live" promotes them in one transaction — the staging→live workflow
from Milestone 6, applied to theming from day one.

### Navigation is admin-editable

The sticky two-line header, top category bar, collapsible left category panel
(listing pages only) and both mega-menus ("Browse Category" and brand A–Z) all render
from the `menu_items` table. Admins reorder, hide/show, add and delete entries at
`/admin/navigation`; every mutation is written to the audit log.

The two parallel category systems (`SIDE_PANEL` and `TOP_BAR`) are modelled as a
`system` discriminator on `categories` and stay fully independent.

### Authentication

- **Unified login/register bar** — one input. `POST /auth/identify` classifies it as
  an email or a Bangladeshi mobile number, tells the UI whether to reveal a password
  field, an OTP field or the registration fields, and reports any linked social
  providers.
- **OTP over SMS** — provider chosen by config (`console` / `twilio` / `bulksmsbd`),
  all behind one `SmsProvider` interface. Rate-limited per number, hashed codes,
  attempt counting.
- **Google & Facebook OAuth** — strategies register only when credentials exist, and
  accounts link automatically by verified email.
- **Guest checkout** — auto-creates an account with the phone number as the default
  password, flags `mustChangePassword`, and returns a `notice` the storefront shows as
  a floating auto-dismissing toast.
- **Forgot password** — single-use hashed tokens delivered by email or WhatsApp;
  resetting revokes every existing session.

### Bilingual from the ground up

Both dictionaries ship with the bundle, so the header toggle switches the entire site
instantly with no reload; the choice persists in a cookie the server reads on the next
request. Bangla automatically switches to a Bangla-optimised font stack. Product
content is stored per-locale in the database (`title_en` / `title_bn`, …), never
machine-translated in the UI layer.

### Non-functional guarantees already in place

- **Money is always an integer** in poisha (1 BDT = 100). No floats anywhere in the
  money path — the profit calculator throws a `TypeError` on a fractional input.
- **Every admin mutation is audited** (actor, entity, before/after, IP, user agent).
- **Every list endpoint is paginated** with a consistent envelope.
- **RBAC** with module-scoped permissions (`theme:publish`, `orders:override`, …)
  enforced by a global guard.
- **Tests for the two highest-risk areas** named in the brief: the order-status state
  machine and the costing/profit calculator (36 tests).

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — module map, request flow, data model
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Milestones 2–6 broken down
- `apps/backend/.env.example` / `apps/frontend/.env.example` — every required variable

## Licence

UNLICENSED — proprietary.
