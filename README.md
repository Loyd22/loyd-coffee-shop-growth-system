# Loyd Coffee Shop Growth System

Loyd Coffee Shop Growth System is a full-stack analytics platform for a coffee shop business.

It helps you:
- upload and validate business CSV data
- view KPI dashboards and insights
- generate business recommendations
- generate AI summaries and next best actions from real metrics

## What This Project Is For

This project is for **data-driven decision making**.

Instead of guessing what to do next, managers can:
- see real performance across customers, branches, and products
- detect churn and weak areas
- get structured AI guidance based on computed metrics

## Current Core Features

- Dashboard KPIs (`total_revenue`, `total_orders`, `average_order_value`, etc.)
- Customer insights, segmentation, and churn detection
- Branch and product performance insights
- Rule-based recommendations
- AI Summary (Step 30)


## Data Management Capability (Important)

Right now, users can:
- **Upload data** via CSV
- **Update existing rows indirectly** via CSV re-upload (upsert behavior)

Right now, users cannot:
- **Delete rows from UI/API**
- **Directly edit single records from UI forms**

In short: current flow supports **upload + upsert**, not full CRUD yet.

## Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Supabase Auth (session + protected dashboard routes)

### Backend
- FastAPI
- Pydantic
- SQLAlchemy
- PostgreSQL-compatible database

## Architecture (Separation of Concerns)

### Backend
- `backend/app/api/routes` = HTTP endpoints only
- `backend/app/schemas` = request/response contracts
- `backend/app/services` = business logic, analytics, AI logic, fallback logic

### Frontend
- `frontend/app` = pages and UI
- `frontend/lib/backend-api.ts` = backend calls + runtime response guards
- `frontend/lib/backend-types.ts` = shared TypeScript response/request types

## AI Safety 

AI output is controlled with:
- structured prompt format
- strict JSON output requirement
- schema validation of AI output
- grounded metric checks (reject unsupported claims/numbers)
- deterministic fallback when AI output is invalid or unavailable

So frontend only receives validated, structured business data.

## API Overview

Base prefix: `/api/v1`

- Dashboard: `/dashboard/summary`
- Insights:
  - `/insights/customers`
  - `/insights/branches`
  - `/insights/products`
  - `/insights/segmentation`
  - `/insights/churn`
- Recommendations: `/recommendations`
- CSV:
  - `/csv/upload`
  - `/csv/validate`
  - `/csv/persist`
- AI:
  - `/ai/summary`
  - `/ai/next-best-actions`

## Quick Start

## 1) Clone and install dependencies

Backend:
```bash
cd backend
pip install -r requirements.txt
```

Frontend:
```bash
cd frontend
npm install
```

## 2) Configure environment variables

Common/Backend:
- `DATABASE_URL` (required)
- `OPENAI_API_KEY` (optional but needed for live AI responses)
- `OPENAI_MODEL` (optional, default is set in service)
- `BACKEND_CORS_ORIGINS` (optional, comma-separated)

Frontend:
- `NEXT_PUBLIC_BACKEND_API_URL` (usually `http://127.0.0.1:8000`)
- `BACKEND_API_URL` (optional server-side override)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3) Run backend

From `backend/`:
```bash
uvicorn app.main:app --reload
```

## 4) Run frontend

From `frontend/`:
```bash
npm run dev
```

Frontend runs at `http://localhost:3000` by default.

## Typical User Flow

1. Login
2. Go to Dashboard
3. Upload CSV data in **Dashboard > Upload Data**
4. Review KPIs and insights
5. Open Recommendations page
6. Review AI summary and next best actions

## Notes for Development

- Keep business logic in backend services, not in routes/pages.
- Keep schemas strict and synchronized with frontend types.
- Treat AI output as untrusted until validated.
- Use fallback behavior so the dashboard still works even when AI is down.

## Status

This is an actively evolving end-to-end project.
Current implementation is focused on production-style architecture and safe AI integration.
