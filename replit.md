# ReviewIQ — Hotel Review Insights Dashboard

A production-quality hotel operations dashboard that helps managers monitor and analyse Booking.com reviews across four Sydney hotel properties: Olympic Paddington, Potts Point, Central Sydney, and Darling Harbour.

## Run & Operate

- `pnpm --filter @workspace/hotel-insights run dev` — run the React frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the Express API server
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, React Query, wouter
- API: Express 5 + Zod validation + Drizzle ORM
- DB: PostgreSQL (Replit managed)
- AI: OpenAI via Replit AI Integrations (no API key required)
- Codegen: Orval (OpenAPI → React Query hooks + Zod schemas)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (hotels, reviews, insights)
- `artifacts/api-server/src/routes/` — Express route handlers (hotels, reviews, analytics, insights)
- `artifacts/api-server/src/lib/reviewGenerator.ts` — realistic review seeder
- `artifacts/api-server/src/lib/insightGenerator.ts` — OpenAI-powered insight generation with fallback
- `artifacts/hotel-insights/src/` — React frontend (pages, components, hooks)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — auto-generated Zod validation schemas (do not edit)

## Hotel Properties

1. **Olympic Hotel Paddington** — Paddington, Sydney (hotel ID: 1)
2. **Venus Potts Point** — Potts Point, Sydney (hotel ID: 2)
3. **Venus Surry Hills** — Surry Hills, Sydney (hotel ID: 3)
4. **Chateau de Venus** — Darling Harbour, Sydney (hotel ID: 4)

## Architecture decisions

- Contract-first OpenAPI spec gates all codegen — never hand-write API types
- `type: number` used throughout spec instead of `type: integer` to avoid Orval/Zod v3 compatibility issue with `zod.int()`
- AI insights use OpenAI with a rule-based fallback (no hard dependency on AI being available)
- Reviews seeded with realistic data spread over 18 months; `externalId` column prevents duplicate imports
- Analytics computed live from the reviews table via Drizzle SQL queries (no materialized views needed at this scale)

## API Endpoints

- `GET /api/hotels` — list all 4 properties
- `GET /api/hotels/:id` — hotel with computed stats
- `GET /api/reviews` — paginated, filterable review feed
- `POST /api/reviews/import` — seed/generate reviews for a hotel `{ hotelId, count? }`
- `GET /api/analytics/overview` — KPI cards
- `GET /api/analytics/rating-trend` — monthly ratings per hotel
- `GET /api/analytics/hotel-comparison` — side-by-side comparison
- `GET /api/analytics/sentiment-distribution` — pos/neutral/neg counts per hotel
- `GET /api/analytics/complaint-categories` — top complaint topics
- `GET /api/insights` — AI-generated insights list
- `POST /api/insights/generate` — run OpenAI analysis for a hotel `{ hotelId }`

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` then `pnpm run typecheck:libs`
- After any `lib/db/src/schema/` change, run `pnpm run typecheck:libs` before checking artifact typechecks
- The `analytics/complaint-categories` endpoint uses raw SQL `unnest()` — keep in sync with the `topics` column type

## User preferences

_Populate as you build._
