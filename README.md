# AzzurroIQ — Hotel Review Insights Dashboard

> A full-stack operations dashboard for monitoring and analysing guest reviews across the Azzurro Hotels portfolio in Sydney.

![TypeScript](https://img.shields.io/badge/TypeScript-96%25-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=flat&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT_Insights-412991?style=flat&logo=openai&logoColor=white)

---

## What is AzzurroIQ?

AzzurroIQ helps hotel operations teams stop reading reviews one by one. It aggregates guest feedback across all 4 Azzurro Hotels properties, runs AI analysis on the data, and surfaces the insights that actually matter — rating trends, sentiment shifts, recurring complaints, and actionable recommendations — all in one place.

**The 4 properties:**
| Property | Location |
|---|---|
| Olympic Hotel Paddington | Paddington, Sydney |
| Venus Potts Point | Potts Point, Sydney |
| Venus Surry Hills | Surry Hills, Sydney |
| Chateau de Venus | Darling Harbour, Sydney |

---

## Features

- **Portfolio Dashboard** — KPI cards, 6-month rating trend chart, sentiment breakdown, hotel comparison
- **Reviews Feed** — Searchable, filterable, paginated stream of guest reviews with sentiment tags and topic labels
- **Property Drilldown** — Per-hotel analytics scoped to a single property
- **AI Insights** — GPT-powered summaries, recommendations, and trend alerts per hotel, with a rule-based fallback if AI is unavailable
- **Contract-first API** — Single OpenAPI spec drives all type generation; frontend and backend stay in sync automatically

---

## Tech Stack

### Frontend
- **React 18** + **Vite** — fast dev experience and HMR
- **Tailwind CSS** + **shadcn/ui** — component library with Azzurro brand tokens
- **Recharts** — rating trend, sentiment pie, hotel comparison bar charts
- **React Query** — server state, caching, and loading states
- **Wouter** — lightweight client-side routing

### Backend
- **Node.js** + **Express 5** — REST API
- **Zod** — request/response validation on every endpoint
- **Drizzle ORM** + **PostgreSQL** — type-safe queries and schema management
- **OpenAI API** — AI insight generation with graceful fallback

### Tooling
- **pnpm workspaces** — monorepo managing frontend, backend, DB, and shared libs
- **Orval** — generates React Query hooks + Zod schemas from the OpenAPI spec
- **TypeScript** throughout — strict mode, project references across packages

---

## Project Structure

```
/
├── artifacts/
│   ├── hotel-insights/       # React + Vite frontend
│   └── api-server/           # Express API server
├── lib/
│   ├── api-spec/             # OpenAPI spec (source of truth)
│   ├── api-client-react/     # Auto-generated React Query hooks
│   ├── api-zod/              # Auto-generated Zod schemas
│   └── db/                   # Drizzle schema + migrations
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hotels` | List all properties |
| `GET` | `/api/hotels/:id` | Hotel detail with computed stats |
| `GET` | `/api/reviews` | Paginated, filterable review feed |
| `POST` | `/api/reviews/import` | Seed/generate reviews for a hotel |
| `GET` | `/api/analytics/overview` | Portfolio KPI cards |
| `GET` | `/api/analytics/rating-trend` | Monthly ratings per hotel |
| `GET` | `/api/analytics/hotel-comparison` | Side-by-side property comparison |
| `GET` | `/api/analytics/sentiment-distribution` | Positive / neutral / negative split |
| `GET` | `/api/analytics/complaint-categories` | Top complaint topics |
| `GET` | `/api/insights` | List AI-generated insights |
| `POST` | `/api/insights/generate` | Run fresh AI analysis for a hotel |

---

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm 9+
- PostgreSQL database

### Setup

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start the API server
pnpm --filter @workspace/api-server run dev

# Start the frontend (separate terminal)
pnpm --filter @workspace/hotel-insights run dev
```

### Seed data

```bash
# Import 80 reviews for each hotel (IDs 1–4)
curl -X POST http://localhost:8080/api/reviews/import \
  -H "Content-Type: application/json" \
  -d '{"hotelId": 1, "count": 80}'

# Generate AI insights for a hotel
curl -X POST http://localhost:8080/api/insights/generate \
  -H "Content-Type: application/json" \
  -d '{"hotelId": 1}'
```

### Regenerate API types (after spec changes)

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck:libs
```

---

## Key Technical Decisions

**Contract-first API design** — The OpenAPI spec in `lib/api-spec/` is the single source of truth. Orval auto-generates typed React Query hooks and Zod validators from it, eliminating an entire class of frontend/backend type mismatch bugs.

**AI with graceful degradation** — The insights engine calls OpenAI's API but falls back to a rule-based generator if the API is unavailable, so the dashboard always shows useful data.

**`type: number` not `type: integer` in the spec** — Orval generates `zod.int()` for integer fields, which doesn't exist in Zod v3. Using `type: number` throughout avoids this codegen incompatibility.

---

## Author

**ShrutiShahi18** — [yoshruti18@gmail.com](mailto:yoshruti18@gmail.com)
