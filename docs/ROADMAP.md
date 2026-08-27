# Roadmap

Milestone 1 is complete. The remaining milestones below keep the brief's ordering; the
foundations each one needs (schema tables, provider interfaces, draft/publish plumbing,
audit logging, pagination envelope) already exist.

## ✅ Milestone 1 — Foundation

- [x] pnpm + Turborepo monorepo, `apps/*` and `tooling/*` exactly as specified
- [x] Design tokens stored in `theme_settings`, applied at runtime as CSS variables
- [x] Off-black ink, grey confined to reviews, per-segment accent overrides
- [x] Draft → "Publish / Go Live" workflow for theme tokens
- [x] Sticky two-line header, top category bar, collapsible left panel, both mega-menus
- [x] Admin navigation editor (reorder / hide / add / delete), no deploy needed
- [x] Unified login/register bar with identifier detection
- [x] OTP login over a swappable SMS provider
- [x] Google + Facebook OAuth with account linking by verified email
- [x] Guest checkout auto-account with floating auto-dismissing notice
- [x] Forgot password over email/WhatsApp
- [x] EN/BN i18n with instant header toggle
- [x] RBAC, audit logging, paginated list envelope, integer money
- [x] Tests for the order state machine and profit calculator

## Milestone 2 — Catalog & PDP

- Product listing driven by both category systems, running independently
- AJAX filters: price slider, sub-category checkboxes, brand multi-select with search,
  skin-type — all without a full reload
- Per-category and per-brand banners, admin-editable (`banners` table is ready)
- Brand pages that echo each brand's own styling (`brands.theme_override` is ready)
- PDP: image/GIF/video gallery with hover-zoom, add to cart, wishlist, social share
- Bilingual description + usage, customer Q&A separate from admin FAQ
- Related products and personalised recommendations
- JSON-LD (Product, Offer, AggregateRating, Breadcrumb, FAQ) on every PDP

## Milestone 3 — Cart, checkout, orders

- Slide-out cart drawer with live quantity controls (store is in place)
- Guest + logged-in checkout, bKash / Nagad / Rocket / SSLCommerz / COD
- Coupon and bundle pricing engine (`coupons` table is ready)
- Order lifecycle wired to `planTransition()` with admin override at every step
- COD auto-verification over WhatsApp + IVR, manual phone-order entry form
- Courier adapters (Pathao, RedX, Steadfast, CarryBee) behind one interface, activated
  by an API key in the admin "Connect" box
- Bulk "Upload to Courier", printable PDF labels, live tracking sync
- Cancel/return workflows, stalled-return dashboard flag
- Milestone notifications via BullMQ so nothing blocks the request cycle

## Milestone 4 — Reviews & AI assistant

- Facebook review sync job (Graph API) with links back to the original post
- Floating AI chat widget answering from the live catalog via RAG, in English, Bangla
  and Banglish, with an admin-configurable icon

## Milestone 5 — Marketing, analytics, SEO

- Facebook Pixel + Conversions API, deduplicated by `marketing_events.event_id`
- GA4 + GTM, Google Merchant Center feed
- Full event stream including CancelPurchase/RealPurchase and order-status events
- Retargeting store syncing to Facebook Custom Audiences and Google Customer Match
- Abandoned-cart reminders as an independent job
- Clean URLs, canonical tags on filtered listings, editable meta per page, blog module

## Milestone 6 — Admin power tools

- Inventory with low-stock alerts and auto re-add on return
- Costing & profit module surfaced in the UI (calculator already implemented)
- Staff RBAC management screens
- Repo-wide staging → "Publish / Go Live" diff (theme already follows this pattern)
- Multi-channel order inbox (Facebook / Instagram / WhatsApp / Website / POS)
- POS billing screen sharing the same inventory
- Customer profiles, insights and COD risk score
- Accounting, COD reconciliation against courier payouts, per-channel profit reports
- Smart campaign links, bulk invoices, shareable catalog PDF
- AI product-adding (image cleanup, SEO copy, FAQ, Bangla translation) — always editable
- AI upsell/cross-sell learned from add-to-cart and purchase co-occurrence
- One-click 6–12 month report export

## Known follow-ups

- `Aabha_Website_Requirements_EN.md`, referenced by the brief as the source of truth
  for edge cases, was not present in the repository. Milestone 1 was built strictly
  from the brief; drop that document in and any deltas can be reconciled.
- Redis is optional in development (in-memory driver). Set `REDIS_URL` before running
  more than one API instance — the memory driver is per-process.
- Prisma was replaced with Drizzle ORM; see the README for the rationale.
