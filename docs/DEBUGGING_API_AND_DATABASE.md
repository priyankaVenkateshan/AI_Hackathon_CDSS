# CDSS API and Database Debugging Report

This document summarizes the data flow from **database → backend → API → frontend** and the fixes applied so the doctor dashboard shows **real data** (not mock) when the backend and database are configured.

---

## 1. API Routes Verified

| Frontend call | Backend route | Handler | Status |
|---------------|---------------|---------|--------|
| `GET /api/v1/patients` | `proxy: v1/patients` | `patient.handler` → `_list_patients()` | ✅ Match |
| `GET /api/v1/patients/:id` | `proxy: v1/patients/:id` | `patient.handler` → `_get_patient()` | ✅ Match |
| `GET /dashboard` | path `/dashboard` | `router` → `get_dashboard_data()` | ✅ Match |
| `GET /api/v1/surgeries` | `proxy: v1/surgeries` | `surgery.handler` → `_list_surgeries()` | ✅ Match |
| `GET /api/v1/surgeries/:id` | `proxy: v1/surgeries/:id` | `surgery.handler` → `_get_surgery()` | ✅ Match |

- **HTTP methods**: Frontend uses GET for list/detail; backend expects GET. ✅
- **Response shape**: Patient list returns `{ "patients": [...] }`; surgery list returns `{ "surgeries": [...] }`. Frontend uses `data.patients` / `data.surgeries`. ✅

**No route mismatches found.**

---

## 2. Backend Data Source (DB vs Mock)

- **When `DATABASE_URL` or `RDS_CONFIG_SECRET_NAME` is set** (in `.env` or environment):
  - `run_api_local.py` sets `USE_DB = True`.
  - The router and handlers use **real** `get_session()` from `cdss.db.session`.
  - All patient, surgery, and dashboard data come from the **database**.

- **When neither is set**:
  - `USE_DB = False`; the local server **patches** `get_session` with an in-memory mock.
  - `/api/v1/patients` and `/api/v1/surgeries` return **mock** data so the UI can run without a DB.
  - Dashboard uses stub when DB is not configured.

**No mock data is returned when a database is configured.**

---

## 3. Database Connection

- **Configuration**: `cdss.db.session` uses:
  - **`DATABASE_URL`**: PostgreSQL URL. For Aurora behind a bastion, use the **SSH tunnel** (recommended): start `.\scripts\start_ssh_tunnel.ps1`, then set `DATABASE_URL=postgresql://cdssadmin:PASSWORD@localhost:5433/cdssdb`.
  - **`RDS_CONFIG_SECRET_NAME`** + **`AWS_REGION`**: for Aurora IAM auth from Lambda via Secrets Manager.
- **Loading**: `run_api_local.py` loads `.env` from the repo root (if present) so `DATABASE_URL` can be set there.
- **Check**: If the backend fails with "Database not configured", set `DATABASE_URL` in `.env` or export it before running the server.

---

## 4. Database Content and Seeding

- **Tables**: Handlers use `cdss.db.models` (Patient, Surgery, Visit, Resource, etc.). Migrations live under `src/cdss/db/migrations/`.
- **Seeding**:
  - **API**: `GET /api/v1/seed` (or POST) runs `run_seed(force=True)` and inserts minimal demo patients and resources.
  - **CLI**: From repo root, `python scripts/seed_db.py [--force]` runs the full seed (many patients, surgeries, visits, etc.) when `DATABASE_URL` or RDS secret is set.
- **If tables are empty**: Run migrations (if any), then call `GET http://localhost:8081/api/v1/seed` or run `python scripts/seed_db.py`.

---

## 5. API Responses (How to Test)

- **Health**: `GET http://localhost:8081/health` → `{"service":"cdss","status":"ok","database":"connected"|"unavailable",...}`.
  - When the backend has no database (no `DATABASE_URL` / RDS), `database` is `"unavailable"`. The frontend shows a banner in that case so you know to start the tunnel and set `DATABASE_URL`.
- **Patients**: `GET http://localhost:8081/api/v1/patients` → `{"patients":[...]}`.
- **Surgeries**: `GET http://localhost:8081/api/v1/surgeries` → `{"surgeries":[...]}`.
- **Dashboard**: `GET http://localhost:8081/dashboard` → `{"stats":{...},"patientQueue":[],...}`.

Use **Swagger UI** at `http://localhost:8081/api/docs` or **curl/Postman** with the base URL above.

---

## 6. Frontend API Integration – Fixes Applied

| Issue | Fix |
|-------|-----|
| **Mock mode when API URL empty** | `isMockMode()` now returns true **only** when `VITE_USE_MOCK=true`. With `VITE_USE_MOCK=false`, the app **always** calls the API (no fallback to local mock JSON). |
| **"NetworkError when attempting to fetch resource"** | API client treats any network/fetch error (including Firefox’s "NetworkError") as unreachable backend and shows a clear message: ensure backend is running and `VITE_API_URL` is correct. |
| **Retry** | Patients and Surgery pages use a **Retry** button that refetches from the API instead of reloading the page. |

- **Frontend does not** import or use mock JSON when `VITE_USE_MOCK=false`; it only uses data returned by the API.
- **Required `.env.local`** (doctor-dashboard):
  - `VITE_API_URL=http://localhost:8081` (or the port your backend uses)
  - `VITE_USE_MOCK=false`

---

## 7. End-to-End Data Flow

```
Database (PostgreSQL / Aurora)
    ↓
get_session() → SQLAlchemy (when DATABASE_URL or RDS secret set)
    ↓
Handlers (patient.py, surgery.py, dashboard.py) query and return JSON
    ↓
Local server (run_api_local.py) or Lambda → HTTP response
    ↓
Frontend fetch (config.apiUrl + path) → setList(data.patients / data.surgeries)
    ↓
UI (Patients.jsx, Surgery.jsx, Dashboard) render
```

**Break points and checks:**

1. **Check SSH/tunnel before relying on real data**: If using Aurora behind a bastion, start the tunnel **before** starting the API and setting `DATABASE_URL`:
   - **SSH**: `.\scripts\start_ssh_tunnel.ps1` (recommended; leave that terminal open), then `DATABASE_URL=postgresql://cdssadmin:PASSWORD@localhost:5433/cdssdb`.
   - Call `GET /health`; if `database` is `"unavailable"`, the backend is not connected to the DB (tunnel down or `DATABASE_URL` unset).
2. **Backend not running** → "Cannot reach API at ..." (start `python scripts/run_api_local.py`).
2. **Wrong port** → Set `VITE_API_URL` to the same port (e.g. 8081) and restart the frontend dev server.
3. **No database** → Set `DATABASE_URL` in `.env` and restart the backend; use mock only when no DB is configured.
4. **Empty tables** → Run seed via `GET /api/v1/seed` or `python scripts/seed_db.py`.

---

## 8. Summary of Changes Made

| Area | Change |
|------|--------|
| **Frontend config** | `isMockMode()` = `config.useMock` only; no fallback to mock when API URL is empty. |
| **Frontend client** | Network errors (including "NetworkError when attempting to fetch resource") show a clear “Cannot reach API” message. |
| **Frontend Patients/Surgery** | Retry button triggers refetch instead of full page reload. |
| **Backend** | Already uses DB when `DATABASE_URL` or `RDS_CONFIG_SECRET_NAME` is set; mock only when neither is set. |
| **Frontend .env.example** | Defaults: `VITE_API_URL=http://localhost:8080`, `VITE_USE_MOCK=false` so new setups use real API. |
| **Frontend ApiHealthBanner** | When using live API, calls `GET /health`; if `database` is `unavailable`, shows a dismissible banner to start tunnel and set `DATABASE_URL`. |
| **Frontend Dashboard** | When not in mock mode, fetches `GET /dashboard` and uses `stats.totalPatients` and `stats.activeSurgeries` for KPIs. |
| **Backend /health** | Returns `database: "connected"` when DB is reachable, `"unavailable"` otherwise. |
| **Backend router** | Accepts both `/api/v1/patients` and legacy `/api/patients` (and `/api/patients/:id`). |
| **Local server** | Loads `.env` from repo root; logs "Data source: database" vs "mock data" at startup. | Loads `.env` from repo root; logs "Data source: database" vs "mock data" at startup. |
| **Docs** | This debugging report added; `.env.example` documents `DATABASE_URL`. |

---

## 9. Confirmation Checklist

- [x] API routes: frontend paths and methods match backend.
- [x] Backend uses database when `DATABASE_URL` or RDS secret is set; no mock in that case.
- [x] Database connection: `DATABASE_URL` or RDS secret in `.env` / environment.
- [x] Seed: `/api/v1/seed` or `scripts/seed_db.py` to populate data.
- [x] Frontend: no mock fallback when `VITE_USE_MOCK=false`; clear error when API is unreachable.
- [x] Data flow: DB → backend query → API response → frontend fetch → UI.

When the backend is running with a configured database and the frontend has `VITE_API_URL` and `VITE_USE_MOCK=false`, the doctor dashboard **fetches real data from the database** via the API.
