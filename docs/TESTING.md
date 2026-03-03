# Testing the CDSS API and Frontend

Three ways to test and see output: **local handler**, **frontend app**, and **deployed API (curl)**.

---

## 1. Test handlers locally (no deploy)

Run the router and all agent handlers on your machine with mock API Gateway events.

**From repo root:**

```bash
python scripts/test_api_local.py
```

**What it does:** Calls the router with doctor/admin claims and exercises:

- `GET /api/v1/patients` and `GET /api/v1/patients/PT-1001`
- `GET /api/v1/surgeries` and `GET /api/v1/surgeries/SRG-001`
- `GET /api/v1/resources`, `GET /api/v1/medications`, `GET /api/v1/schedule`
- `GET /api/v1/admin/audit`, `users`, `config`, `analytics`, `resources`

**Expected:** Each line shows `Status: 200` (or 403 for admin routes if you change claims) and a short JSON body. No AWS or network required.

**Optional – test a single path:** In Python:

```python
import sys
sys.path.insert(0, "src")
from cdss.api.handlers.router import handler as router_handler

event = {
    "httpMethod": "GET",
    "path": "/dev/api/v1/patients",
    "pathParameters": {"proxy": "v1/patients"},
    "requestContext": {"authorizer": {"claims": {"custom:role": "doctor", "sub": "1", "email": "d@test.com"}}},
}
print(router_handler(event, None))
```

---

## 2. Test via the frontend (Staff app)

Use the React app with **mock mode off** so it calls your API.

### Option A – API not deployed yet (local Lambda not possible from browser)

Keep **mock mode on** to use in-app mock data:

```bash
cd frontend/apps/doctor-dashboard
npm run dev
```

Open http://localhost:5173. Log in with e.g. `priya@cdss.ai` / `password123`. You’ll see mock patients, surgeries, admin audit, etc., with no backend.

### Option B – API deployed; frontend calls real API

1. Deploy infrastructure (e.g. `cd infrastructure && terraform apply`).
2. Create a `.env.local` in `frontend/apps/doctor-dashboard/`:

   ```env
   VITE_API_URL=https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/dev
   VITE_USE_MOCK=false
   VITE_COGNITO_USER_POOL_ID=ap-south-1_xxxxx
   VITE_COGNITO_CLIENT_ID=xxxxx
   VITE_COGNITO_REGION=ap-south-1
   ```

   Use the Terraform outputs: `api_gateway_url` (no `/api`), `cognito_user_pool_id`, `cognito_staff_client_id`.

3. Create a user in Cognito and set the **role** custom attribute (e.g. `doctor` or `admin`).
4. Run the app and log in with that user:

   ```bash
   cd frontend/apps/doctor-dashboard
   npm run dev
   ```

5. Use the UI: Patients, Surgery, Admin (Audit, Users, Config, Analytics, Resources), Medications. All of these will hit the deployed API and you’ll see real responses (stub data until RDS is wired).

---

## 3. Test deployed API with curl

After `terraform apply`, use the CDSS API base URL from output `api_gateway_cdss_url` (e.g. `https://xxx.execute-api.ap-south-1.amazonaws.com/dev/api/`).

### If Cognito is **disabled** on the API (`api_require_cognito = false`)

```bash
BASE="https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/dev/api"

curl -s "${BASE}/v1/patients" | jq .
curl -s "${BASE}/v1/patients/PT-1001" | jq .
curl -s "${BASE}/v1/surgeries" | jq .
curl -s "${BASE}/v1/resources" | jq .
curl -s "${BASE}/v1/medications" | jq .
curl -s "${BASE}/v1/schedule" | jq .
```

Admin routes (audit, users, config, analytics) need a JWT; use the frontend or Postman with Cognito login to get a token.

### If Cognito is **enabled** (`api_require_cognito = true`)

You must send a valid Cognito Id token:

```bash
# Get token (e.g. from browser after login, or use AWS Amplify / Cognito auth flow),
# then:
TOKEN="eyJraWQ..."

curl -s -H "Authorization: Bearer $TOKEN" "${BASE}/v1/patients" | jq .
curl -s -H "Authorization: Bearer $TOKEN" "${BASE}/v1/admin/audit" | jq .
```

**Health (no auth):**

```bash
curl -s "https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/dev/health" | jq .
```

---

## Quick reference

| Goal                         | Use |
|-----------------------------|-----|
| See API responses, no AWS   | `python scripts/test_api_local.py` |
| Use the UI with fake data   | `npm run dev` with mock mode (default) |
| Use the UI with deployed API| Set `VITE_API_URL`, `VITE_USE_MOCK=false`, Cognito env, then `npm run dev` |
| Call API from command line  | `curl` to `.../dev/api/v1/...` (and token if Cognito is on) |
