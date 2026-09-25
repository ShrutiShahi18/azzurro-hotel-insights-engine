# AzzurroIQ — Hotel Review Insights Dashboard

> A full-stack operations dashboard for monitoring and analysing guest reviews across the Azzurro Hotels portfolio in Sydney.

![TypeScript](https://img.shields.io/badge/TypeScript-96%25-3178C6?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle_ORM-4169E1?style=flat&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT_Insights-412991?style=flat&logo=openai&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?style=flat&logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-Local_Deployment-326CE5?style=flat&logo=kubernetes&logoColor=white)

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
├── k8s/                      # Kubernetes Deployments, Services, Secret, PVC
├── compose.yaml              # Local Docker Compose stack
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
| Containers | Docker, Docker Compose |
| Orchestration | Kubernetes (Docker Desktop local cluster) |

### Containerized architecture

AzzurroIQ can also be run as a containerized three-tier application:

```text
                         Docker Compose / Kubernetes
                                  │
                 ┌────────────────┼────────────────┐
                 │                │                │
          Frontend + Nginx       API          PostgreSQL
                 │                │                │
                 │          Express 5          Drizzle ORM
                 │                │                │
                 └──── /api ─────┘                │
                          │                        │
                          └──── DATABASE_URL ─────┘
```

The frontend image uses a multi-stage build: Node.js builds the Vite application, then a lightweight Nginx image serves the generated static assets and reverse-proxies `/api/*` requests to the API service. PostgreSQL data is persisted through a named volume in Docker Compose and a `PersistentVolumeClaim` in Kubernetes.

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

## Running with Docker

### Prerequisites

- **Docker Desktop** with Docker Engine running
- **Docker Compose** (included with current Docker Desktop releases)

AzzurroIQ includes separate Dockerfiles for the API and frontend plus a root `compose.yaml`. The Compose stack runs three services:

| Service | Container | Port / Access |
|---|---|---|
| Frontend | Nginx-served React app | `http://localhost:8081` |
| API | Express 5 | `http://localhost:3000` |
| Database | PostgreSQL 16 | Internal to Compose network |

### Build the images

From the project root:

```bash
docker build -t azzurroiq-api -f ./artifacts/api-server/Dockerfile .
docker build -t azzurroiq-frontend -f ./artifacts/hotel-insights/Dockerfile .
```

The frontend uses a multi-stage Docker build so the final runtime image contains Nginx and the compiled frontend rather than the Node.js build toolchain.

### Start the full stack

```bash
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

Open the dashboard at `http://localhost:8081`. PostgreSQL is not published to the host; the API reaches it through the Compose service name `db`.

### Initialize the database

On a fresh database, push the Drizzle schema from the API container:

```bash
docker compose exec api pnpm --filter @workspace/db push
```

Then use the review import endpoint described below to populate the demo data.

### Stop the stack

```bash
docker compose stop
```

Use `docker compose down` when you also want to remove the Compose containers and network. Keep the named PostgreSQL volume when you want the database data to persist between stack restarts.

---

## Running with Kubernetes

AzzurroIQ has been deployed locally on Kubernetes using Docker Desktop's integrated Kubernetes cluster. The deployment uses Kubernetes **Deployments**, **Services**, a **Secret**, and a **PersistentVolumeClaim**.

### Kubernetes architecture

```text
Kubernetes Cluster
│
├── frontend Deployment
│   └── frontend Pod
│       └── Nginx + React static assets
│
├── api Deployment
│   └── API Pod
│       └── Express 5
│
├── db Deployment
│   └── PostgreSQL Pod
│       └── PersistentVolumeClaim
│
├── frontend Service ──► frontend Pod
├── api Service ───────► API Pod
└── db Service ────────► PostgreSQL Pod
```

### 1. Enable local Kubernetes

In Docker Desktop, enable the integrated Kubernetes cluster. Verify the active context and node:

```bash
kubectl config current-context
kubectl get nodes
```

### 2. Build the application images

Build the images using the Docker commands above:

```bash
docker build -t azzurroiq-api -f ./artifacts/api-server/Dockerfile .
docker build -t azzurroiq-frontend -f ./artifacts/hotel-insights/Dockerfile .
```

Because the local Kubernetes cluster uses the locally built images, the deployment manifests use `imagePullPolicy: Never`. Docker Desktop's integrated Kubernetes cluster may require the locally built images to be imported into its container runtime before applying the manifests.

For the Docker Desktop integrated cluster, the following imports copy the locally built Linux/amd64 images into the Kubernetes container runtime:

```powershell
cmd /c "docker image save --platform linux/amd64 azzurroiq-api:latest | docker exec -i desktop-control-plane ctr --namespace=k8s.io images import -"
cmd /c "docker image save --platform linux/amd64 azzurroiq-frontend:latest | docker exec -i desktop-control-plane ctr --namespace=k8s.io images import -"
```

Verify the images are available to Kubernetes:

```powershell
docker exec desktop-control-plane crictl images | Select-String "azzurroiq"
```

### 3. Deploy PostgreSQL, API, and frontend

The Kubernetes manifests live under `k8s/`:

```bash
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/api.yaml
kubectl apply -f k8s/frontend.yaml
```

Verify the workloads and Services:

```bash
kubectl get pods
kubectl get services
```

### 4. Initialize the Kubernetes database

The Kubernetes PostgreSQL instance has its own persistent storage, so a new cluster starts with an empty database. Push the schema from the API Pod:

```bash
kubectl exec deployment/api -- pnpm --filter @workspace/db push
```

Verify the tables:

```bash
kubectl exec deployment/db -- psql -U azzurro -d azzurroiq -c "\dt"
```

### 5. Seed the demo hotels

The Kubernetes database is separate from the Compose database. Seed the four demo properties before importing reviews.

```bash
kubectl exec deployment/db -- psql -U azzurro -d azzurroiq -c "INSERT INTO hotels (name, slug, location, booking_url, description) VALUES ('Olympic Hotel Paddington', 'olympic-hotel-paddington', 'Paddington, Sydney', 'https://example.com/olympic-hotel-paddington', 'Heritage-style hotel in Paddington, Sydney.'), ('Venus Potts Point', 'venus-potts-point', 'Potts Point, Sydney', 'https://example.com/venus-potts-point', 'Boutique hotel in Potts Point, Sydney.'), ('Venus Surry Hills', 'venus-surry-hills', 'Surry Hills, Sydney', 'https://example.com/venus-surry-hills', 'Modern hotel in Surry Hills, Sydney.'), ('Chateau de Venus', 'chateau-de-venus', 'Darling Harbour, Sydney', 'https://example.com/chateau-de-venus', 'Luxury hotel overlooking Darling Harbour, Sydney.');"
```

### 6. Access the Kubernetes frontend locally

Expose the frontend Service with port-forwarding:

```bash
kubectl port-forward service/frontend 8082:80
```

Then open `http://localhost:8082`. The frontend's Nginx configuration routes `/api/*` to the Kubernetes `api` Service, so the browser only needs the frontend URL.

### 7. Seed reviews

In a second terminal, forward the API Service:

```bash
kubectl port-forward service/api 3000:3000
```

Then import reviews for each hotel using the existing `/api/reviews/import` endpoint. For example, this PowerShell loop imports 50 reviews per property:

```powershell
for ($id = 1; $id -le 4; $id++) {
    $body = @{
        hotelId = $id
        count   = 50
    } | ConvertTo-Json

    Invoke-RestMethod `
        -Uri "http://localhost:3000/api/reviews/import" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
}
```

Verify the review counts:

```bash
kubectl exec deployment/db -- psql -U azzurro -d azzurroiq -c "SELECT hotel_id, COUNT(*) AS reviews FROM reviews GROUP BY hotel_id ORDER BY hotel_id;"
```

### Kubernetes resources

| Resource | Purpose |
|---|---|
| Deployment | Maintains the desired frontend, API, and PostgreSQL Pods |
| Service | Stable DNS/network endpoint for each application component |
| Secret | Stores database credentials and the application `DATABASE_URL` |
| PersistentVolumeClaim | Persists PostgreSQL data outside the Pod lifecycle |
| `imagePullPolicy: Never` | Tells Kubernetes to use the preloaded local application images |

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

### Deployment

- **Local Kubernetes deployment** — The Kubernetes manifests are designed and tested against Docker Desktop's local Kubernetes cluster. This demonstrates container orchestration locally; it is not a claim of deployment to a managed cloud Kubernetes service such as AKS, EKS, or GKE.
- **No production ingress/TLS setup** — The local Kubernetes deployment uses `kubectl port-forward` for browser access rather than a public Ingress, load balancer, or TLS termination layer.

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
