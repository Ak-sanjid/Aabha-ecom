# Architecture

## Separation of concerns

```
browser ──▶ Next.js (:3000) ──▶ /api/* rewrite ──▶ NestJS (:4000/api/v1) ──▶ Postgres
                │                                        │
                │                                        └─▶ Redis (cache, guest carts, queues)
                └─ CSS custom properties injected server-side from theme_settings
```

`apps/frontend` and `apps/backend` are independent deployables. They share only the
`tooling/` presets. The browser never addresses the API host directly — Next.js
proxies same-origin `/api/*`, so cookies stay first-party and no CORS or hard-coded
host leaks into client bundles.

## Backend module map

```
src/
├── main.ts                    Bootstrap: helmet, compression, cookies, versioned prefix,
│                              global validation pipe, Swagger, CORS allowlist
├── app.module.ts              Global guards (JWT, throttler), filter, interceptor
├── config/                    Zod-validated env + typed config namespaces
├── db/
│   ├── database.module.ts     pg Pool + Drizzle handle (DRIZZLE token)
│   ├── schema/                Section 6 data model, split by bounded context
│   └── seed.ts                Theme tokens, navigation, categories, brands, RBAC, users
├── cache/                     CacheDriver contract + Redis and in-memory drivers
├── common/
│   ├── decorators/            @Public, @CurrentUser, @Roles, @RequirePermissions
│   ├── guards/                JwtAuthGuard (global), RolesGuard (RBAC)
│   ├── filters/               Uniform error envelope
│   ├── interceptors/          Request logging
│   └── utils.ts               Phone normalisation, identifier classification, pagination
└── modules/
    ├── auth/                  Unified identify, password, OTP, OAuth, guest, reset
    ├── theme/                 Design tokens, draft → publish, token catalogue
    ├── navigation/            Header/category bar/side panel/mega-menus CRUD
    ├── catalog/               Categories (both systems) and brands
    ├── orders/                Order state machine (pure, tested)
    ├── costing/               Profit calculator (pure, tested)
    ├── notifications/         SmsProvider / WhatsAppProvider / EmailProvider contracts
    ├── audit/                 Central audit trail
    └── health/                Dependency-aware health probe
```

### Swappable providers

Anything that talks to a third party sits behind an abstract class, resolved by a
factory in the module:

| Contract | Implementations |
| --- | --- |
| `CacheDriver` | `RedisCacheDriver`, `MemoryCacheDriver` (dev fallback) |
| `SmsProvider` | `ConsoleSmsProvider`, `TwilioSmsProvider`, `BulkSmsBdProvider` |
| `WhatsAppProvider` | `ConsoleWhatsAppProvider` (Cloud API next) |
| `EmailProvider` | `ConsoleEmailProvider` (SMTP next) |

Courier adapters (Pathao, RedX, Steadfast, CarryBee) follow the same pattern in
Milestone 3, activated by an API key stored in `courier_accounts` — no code change.

## Frontend structure

```
src/
├── app/
│   ├── layout.tsx             Fetches theme + navigation server-side, injects CSS vars
│   ├── providers.tsx          React Query, ThemeProvider, I18nProvider, Toaster
│   ├── page.tsx               Home
│   ├── login/ · auth/callback/
│   ├── shop/                  Listing shell with the left category panel
│   ├── admin/                 Role-gated: dashboard, theme editor, navigation editor
│   ├── robots.ts · sitemap.ts
│   └── globals.css            Structural defaults only; all values are CSS variables
├── components/
│   ├── layout/                Header, mega-menus, side panel, footer, locale toggle
│   ├── admin/                 Admin shell, theme editor, navigation editor
│   ├── auth/                  Unified auth form
│   ├── home/ · shop/
│   └── ui/                    Button, Input, Toaster
├── theme/                     Token → CSS variable mapping, ThemeProvider
├── i18n/                      EN/BN dictionaries + provider
├── store/                     Zustand: auth, cart, toasts
└── lib/                       server-api (SSR), api-client (browser), utils
```

## Theming pipeline

1. `theme_settings` rows hold `value` (live) and `draft_value` (pending).
2. `GET /api/v1/theme` returns a flat token map plus per-segment overrides, cached in
   Redis for 60 s and invalidated on publish.
3. `app/layout.tsx` turns that into a `<style>` block of `--aabha-*` custom properties
   before first paint — no flash of unstyled content.
4. `tailwind.config.ts` maps `colors`, `fontFamily`, `borderRadius` and `boxShadow`
   onto those variables, so `bg-primary` follows the database.
5. The admin theme editor previews pending values by setting the same variables on
   `document.documentElement`, then publishes them in a single transaction.

## Data model highlights

- **Money**: every amount is an `integer` column named `*Minor`, in poisha.
- **Two category systems**: `categories.system` is `SIDE_PANEL` or `TOP_BAR`; the
  unique key is `(system, slug)` so the trees are independent.
- **Audience segments**: `UNISEX | WOMEN | MEN | MAKEUP` on categories, products,
  banners and menu items, driving the accent-colour overrides.
- **Per-locale content**: `*_en` / `*_bn` columns on products, categories, FAQs and
  menu items — translations are data, not a UI concern.
- **Draft columns**: `products.draft`, `menu_items.draft`, `theme_settings.draft_value`,
  `app_settings.draft` all feed the single "Publish / Go Live" action.
- **Audit**: `audit_logs` captures actor, entity, before/after JSON, IP and user agent.

## Testing strategy

`pnpm test` runs Jest in the backend. The two modules the brief flags as highest-risk
are pure functions with no I/O, so they are tested exhaustively:

- `modules/orders/order-state-machine.spec.ts` — legal/illegal transitions, admin
  overrides (and the mandatory reason), timestamp stamping, restock and notification
  side effects, the analytics event map, and the time-boxed cancel window.
- `modules/costing/profit-calculator.spec.ts` — landed cost, gateway/VAT basis points,
  loss detection, order-level aggregation with discounts and shipping subsidy,
  reverse price suggestion, and integer-only money invariants.

## Local PostgreSQL

`pnpm --filter @aabha/backend db:local` boots PostgreSQL 17 from npm-distributed
binaries into `apps/backend/.pgdata` (git-ignored), so no system package manager is
required. It is a development convenience only — production points `DATABASE_URL` at
a managed cluster.
