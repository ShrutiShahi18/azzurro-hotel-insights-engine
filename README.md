# AzzurroIQ — Hotel Review Insights Dashboard

> A full-stack operations dashboard for monitoring and analysing guest reviews across the Azzurro Hotels portfolio in Sydney.

![TypeScript](https://img.shields.io/badge/TypeScript-96%25-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=flat&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT_Insights-412991?style=flat&logo=openai&logoColor=white)

---
## 🎥 Live Demo Video

A complete walkthrough of the application is available here:

[▶️ Watch the Demo Video](./Hotel%20Review%20Insights%20-%20Azzurro.mp4)

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

## Architecture Overview

![Architecture diagram](docs/architecture.svg)

### Monorepo layout

```
/
├── artifacts/
│   ├── hotel-insights/       # React 18 + Vite frontend
│   └── api-server/           # Express 5 REST API
├── lib/
│   ├── api-spec/             # openapi.yaml — single source of truth
│   ├── api-client-react/     # Auto-generated React Query hooks (via Orval)
│   ├── api-zod/              # Auto-generated Zod validators (via Orval)
│   └── db/                   # Drizzle ORM schema + migration config
```

The **OpenAPI spec** (`lib/api-spec/openapi.yaml`) is the contract between frontend and backend. Running `pnpm --filter @workspace/api-spec run codegen` regenerates all TypeScript types, React Query hooks, and Zod validators from the spec — any mismatch between client and server becomes a compile error, not a runtime surprise.

### Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter |
| Server state | React Query (auto-generated hooks via Orval) |
| Backend | Node.js, Express 5 |
| Validation | Zod (auto-generated from OpenAPI spec) |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| AI | OpenAI API (GPT), rule-based fallback |
| Monorepo | pnpm workspaces, TypeScript project references |
| Codegen | Orval |

---

## Setup & Installation

### Prerequisites

- **Node.js** 20+
- **pnpm** 9+
- **PostgreSQL** database (connection string in environment)

### 1. Clone and install

```bash
git clone https://github.com/ShrutiShahi18/AzzurroIQ.git
cd AzzurroIQ
pnpm install
```

### 2. Configure environment variables

Create a `.env` file in the project root (or set these in your environment):

```env
# Required — PostgreSQL connection string
DATABASE_URL=postgres://user:password@localhost:5432/azzurroiq

# Required — session signing key (any long random string)
SESSION_SECRET=your-random-secret-here

# Optional — enables AI-powered insights (falls back to rule-based if absent)
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1
```

### 3. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

This runs `drizzle-kit push` and creates the `hotels`, `reviews`, and `insights` tables.

### 4. Seed hotels

The four Azzurro Hotels properties are seeded automatically when the API server starts for the first time. If you need to re-seed manually, restart the API server with an empty `hotels` table.

---

## Running the App

### Start both servers (two terminals)

```bash
# Terminal 1 — API server (runs on port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port assigned automatically, opens in browser)
pnpm --filter @workspace/hotel-insights run dev
```

The frontend proxies `/api/*` requests to the API server, so no CORS configuration is needed in development.

---

## Running the Review Collector (Scraper)

AzzurroIQ uses a **server-side review generator** that simulates a review collection pipeline. It is triggered via a POST endpoint rather than a cron job or separate script, making it easy to call from the CLI, a scheduler, or the dashboard itself.

### Import reviews for a hotel

```bash
# Replace hotelId with 1, 2, 3, or 4
curl -X POST http://localhost:8080/api/reviews/import \
  -H "Content-Type: application/json" \
  -d '{"hotelId": 1, "count": 80}'
```

| Hotel | ID |
|---|---|
| Olympic Hotel Paddington | 1 |
| Venus Potts Point | 2 |
| Venus Surry Hills | 3 |
| Chateau de Venus | 4 |

### Import reviews for all 4 hotels

```bash
for id in 1 2 3 4; do
  curl -s -X POST http://localhost:8080/api/reviews/import \
    -H "Content-Type: application/json" \
    -d "{\"hotelId\": $id, \"count\": 80}" | jq .
done
```

### Generate AI insights after importing

```bash
curl -X POST http://localhost:8080/api/insights/generate \
  -H "Content-Type: application/json" \
  -d '{"hotelId": 1}'
```

---

## Review Collection Approach

Because direct scraping of platforms like Booking.com or TripAdvisor is against their terms of service and rate-limited behind login walls, AzzurroIQ implements a **structured synthetic review generator** that models realistic guest feedback patterns for each property.

### How it works

1. **Sentiment distribution per hotel** — Each property has a calibrated positive/neutral/negative split that reflects its real-world positioning. For example, Chateau de Venus (luxury, harbour views) has 75% positive reviews, while Venus Surry Hills (budget-friendly, noisy street) sits at 58%.

2. **Property-specific comment pools** — Reviews are drawn from curated positive, neutral, and negative comment banks written specifically for each hotel. Comments reference real local details: Paddington's heritage building, Potts Point nightlife, Surry Hills cafes, Darling Harbour views.

3. **Rating bands by sentiment** — Ratings are sampled from realistic ranges: positive reviews score 7.5–10, neutral 5.0–7.4, negative 1.0–4.9 (all on a 10-point scale, matching Booking.com's format).

4. **Reviewer diversity** — Each review is attributed to one of 20 named reviewers from 20 different countries (Australia, UK, Germany, Japan, UAE, etc.) to simulate an international guest mix.

5. **Stay type tagging** — Reviews are tagged with stay types (Leisure, Business, Couple, Solo, Family, Group) matching the comment context.

6. **Topic labelling** — Every review carries a topic array (e.g. `["noise", "air conditioning", "breakfast"]`) derived from the comment content. These feed directly into the complaint categories analytics endpoint.

7. **Temporal spread** — Review dates are randomly distributed across the past 18 months, producing realistic trend charts rather than a spike at import time.

8. **Deduplication** — Each review is assigned a unique `externalId` (`{slug}-{index}-{timestamp}-{random}`) so re-running the importer does not produce duplicate rows.

### Data model

```
reviews
├── id, hotelId (FK)
├── reviewerName, reviewerCountry
├── rating (1.0 – 10.0), sentiment (positive | neutral | negative)
├── text, positives, negatives
├── stayType, topics (text[])
├── reviewDate, externalId (unique)
└── createdAt
```

### AI insight generation

After reviews are collected, `POST /api/insights/generate` feeds up to 30 reviews as a prompt to GPT and returns three structured insights per hotel: a **summary**, a **trend alert**, and an **operational recommendation**. If the OpenAI API is unavailable or unconfigured, a rule-based fallback computes the same three insight types from topic frequencies and sentiment ratios.

---

## Sample Data

### Hotels

| ID | Name | Location |
|---|---|---|
| 1 | Olympic Hotel Paddington | Paddington, Sydney |
| 2 | Venus Potts Point | Potts Point, Sydney |
| 3 | Venus Surry Hills | Surry Hills, Sydney |
| 4 | Chateau de Venus | Darling Harbour, Sydney |

### Sample reviews

```json
{
  "hotelName": "Chateau de Venus",
  "reviewerName": "Emma L.",
  "reviewerCountry": "France",
  "rating": 9.2,
  "sentiment": "positive",
  "stayType": "Couple",
  "reviewDate": "2026-03-14",
  "text": "Spectacular Darling Harbour views from our room. The waterfront location makes this hotel extraordinary. Excellent service throughout.",
  "positives": "Harbour views, waterfront location, service",
  "negatives": null,
  "topics": ["view", "location", "service"]
}
```

```json
{
  "hotelName": "Venus Surry Hills",
  "reviewerName": "Tom H.",
  "reviewerCountry": "United States",
  "rating": 2.3,
  "sentiment": "negative",
  "stayType": "Business trip",
  "reviewDate": "2025-11-02",
  "text": "Arrived to find our room hadn't been cleaned from the previous guest — bed was unmade, used towels on floor. Unacceptable.",
  "positives": null,
  "negatives": "Room not cleaned, unhygienic conditions",
  "topics": ["cleanliness", "housekeeping", "hygiene", "room preparation"]
}
```

```json
{
  "hotelName": "Olympic Hotel Paddington",
  "reviewerName": "Priya S.",
  "reviewerCountry": "India",
  "rating": 6.1,
  "sentiment": "neutral",
  "stayType": "Solo traveller",
  "reviewDate": "2026-01-19",
  "text": "Decent hotel in a convenient location. Nothing particularly stood out — rooms were clean enough, staff were fine, breakfast was average.",
  "positives": "Location, value",
  "negatives": "Nothing exceptional",
  "topics": ["location", "value", "cleanliness"]
}
```

### Sample AI insight

```json
{
  "hotelName": "Chateau de Venus",
  "type": "recommendation",
  "title": "Maintain Service Consistency to Protect Premium Positioning",
  "content": "75% of guests rate their stay positively with an average of 8.4/10. Top praised areas are harbour views and service. However, 13% of reviews flag slow restaurant service and misleading room descriptions — address these two areas to protect the premium brand perception.",
  "metric": "8.4/10 avg rating"
}
```

### Sentiment distribution across all 4 hotels

| Hotel | Positive | Neutral | Negative |
|---|---|---|---|
| Olympic Hotel Paddington | 62% | 18% | 20% |
| Venus Potts Point | 70% | 16% | 14% |
| Venus Surry Hills | 58% | 20% | 22% |
| Chateau de Venus | 75% | 12% | 13% |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/hotels` | List all properties |
| `GET` | `/api/hotels/:id` | Hotel detail with computed stats |
| `GET` | `/api/reviews` | Paginated, filterable review feed |
| `POST` | `/api/reviews/import` | Generate and seed reviews for a hotel |
| `GET` | `/api/analytics/overview` | Portfolio KPI cards |
| `GET` | `/api/analytics/rating-trend` | Monthly average ratings per hotel |
| `GET` | `/api/analytics/hotel-comparison` | Side-by-side property metrics |
| `GET` | `/api/analytics/sentiment-distribution` | Positive / neutral / negative split |
| `GET` | `/api/analytics/complaint-categories` | Top recurring complaint topics |
| `GET` | `/api/insights` | List stored AI insights |
| `POST` | `/api/insights/generate` | Run fresh AI analysis for a hotel |

Full request/response schemas are in [`lib/api-spec/openapi.yaml`](lib/api-spec/openapi.yaml).

### Regenerate API types (after spec changes)

```bash
pnpm --filter @workspace/api-spec run codegen
pnpm run typecheck:libs
```

---

## Known Limitations & Assumptions

### Review data

- **Synthetic, not scraped** — All reviews are procedurally generated. They model realistic patterns but are not real guest reviews from Booking.com, TripAdvisor, or Google.
- **Fixed comment pools** — Each hotel has a small set of ~7–8 template comments per sentiment tier. With 80 reviews per hotel, comments repeat. A production system would need a much larger corpus or live scraping via a legitimate data partner API.
- **No multilingual reviews** — All reviews are in English. Real hotel portfolios receive reviews in dozens of languages.
- **Sentiment is pre-assigned** — Sentiment labels are set at generation time based on the rating band, not derived from NLP analysis of the review text. A production pipeline would run each review through a sentiment classifier.
- **No deduplication across re-runs** — The `externalId` unique constraint prevents inserting the same review twice only within a single import batch. Running the import multiple times for the same hotel will still add new rows (with new timestamps in their IDs).

### AI insights

- **Context window limit** — Only the most recent 30 reviews are sent to GPT. For hotels with hundreds of reviews, older feedback is excluded from AI analysis.
- **Model availability** — Insight generation depends on an active OpenAI API key. Without one, the rule-based fallback produces structurally correct but less nuanced insights.
- **No historical insight storage** — Each call to `/api/insights/generate` replaces existing insights for that hotel. There is no insight versioning or history.

### Architecture

- **Single-region, single-instance** — The API server is stateless but the Drizzle connection pool is not configured for horizontal scaling. A production deployment would need a connection pooler (PgBouncer) in front of PostgreSQL.
- **No authentication** — The dashboard has no login system. All endpoints are publicly accessible. Adding Clerk or Replit Auth would be the natural next step.
- **No real-time updates** — The frontend polls via React Query with default stale times. Live review ingestion (e.g. webhooks from a review platform) would require WebSocket or SSE support.

---

## Key Technical Decisions

**Contract-first API** — `lib/api-spec/openapi.yaml` is the single source of truth. Orval generates typed React Query hooks and Zod validators from it automatically. Frontend/backend type drift becomes a compile error.

**`type: number` not `type: integer` in the spec** — Orval generates `zod.int()` for integer fields, which does not exist in Zod v3. Using `type: number` throughout avoids this codegen incompatibility.

**AI with graceful degradation** — The insight engine calls OpenAI but falls back to deterministic rule-based generation if the API is unavailable, ensuring the dashboard always shows useful data.

**Drizzle `and(...conditions)` for dynamic filters** — The reviews and insights routes build filter arrays dynamically and spread them into Drizzle's `and()` helper. Using `reduce` with chained `eq` calls was an earlier bug that caused filters to overwrite each other.

---

## Author

**Shruti Shahi** — [yoshruti18@gmail.com](mailto:yoshruti18@gmail.com) · [GitHub](https://github.com/ShrutiShahi18)
