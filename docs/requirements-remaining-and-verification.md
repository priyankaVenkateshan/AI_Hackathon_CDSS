# Requirements: What’s Left & How to Verify Agents and MCP

This doc maps **docs/requirements.md** to remaining work (from **docs/implementation-checklist.md**) and gives **step-by-step verification** for every agent and MCP component.

---

## Part 1: What’s Left to Do (from requirements.md)

### By requirement area

| Req | Area | Status | Remaining work |
|-----|------|--------|----------------|
| **1** | Role-based access | ✅ Done | Ensure Cognito used by all three apps (doctor, nurse, patient). |
| **2** | Patient management | ⚠️ Partial | RAG/pgvector for summaries; enforce single Patient_ID (e.g. abha_id); MCP live for ABDM. |
| **3** | Surgical workflow | ⚠️ Partial | Full real-time flow (WebSocket + EventBridge); optional connectionId store in RDS. |
| **4** | Resource optimization | ⚠️ Partial | MCP ingestion for OT/beds (replace stub in `get_hospital_data`). |
| **5** | Scheduling & replacement | ⚠️ Partial | `findReplacement` + notifications (SNS/EventBridge); OT utilization metrics. |
| **6** | Patient engagement | ⚠️ Partial | Full transcription, entity extraction, reminders (Pinpoint/SNS), escalation to doctor. |
| **7** | Multilingual | ❌ Not started | Translate, multilingual labels, Transcribe, cultural/terminology (Phase 8). |
| **8** | MCP communication | ⚠️ Partial | MCP adapter is stubbed; live Hospital/ABDM integration; ensure event logs/audit for inter-agent. |
| **9** | Notifications & emergency | ❌ Not started | Alert engine, drug-interaction alerts, critical vitals, surgical alerts (Phase 9). |
| **10** | AWS & scalability | ✅ Mostly done | Performance tuning, sub-2s SLA, 99.5% uptime; optional CloudWatch alarms. |

### By phase (implementation checklist)

- **Phase 3:** RAG/pgvector, MCP live (Hospital + ABDM), single Patient_ID.
- **Phase 4:** Full real-time surgical flow; optional RDS connectionId store.
- **Phase 5:** Live MCP ingestion for OT/beds.
- **Phase 6:** findReplacement, notifications, OT utilization metrics.
- **Phase 7:** Transcription, entities, reminders, Pinpoint/SNS escalation.
- **Phase 8:** Multilingual (Translate, Transcribe, labels, cultural/terminology).
- **Phase 9:** Notifications and emergency response pipeline.
- **Phase 10:** Admin analytics from RDS, performance, tests, docs.
- **No DynamoDB:** Migrate `backend/agents` session/audit to RDS only; remove DynamoDB from config/docs.

---

## Part 2: How to Verify Every Agent and MCP

**Important:** The `cdss` package lives under **`src/`**. To avoid `ModuleNotFoundError: No module named 'cdss'`:

- **Option 1 (recommended):** Run commands from the **repository root** (`D:\AI_Hackathon_CDSS`) and use the **scripts** below (they set the path for you).
- **Option 2:** From repo root, set `$env:PYTHONPATH = "src"` (PowerShell) or `export PYTHONPATH=src` (Bash) before running `python -m cdss.db....` or `python scripts/test_api_local.py`.

If you see "No module named 'cdss'", you are either not in the repo root or PYTHONPATH is not set—use the scripts or set PYTHONPATH as above.

---

You have **three layers** to verify:

1. **REST API “agents” (handlers)** — `src/cdss/api/handlers/`: Patient, Surgery, Resource, Scheduling, Engagement, Admin. These are the main CDSS API.
2. **MCP adapter** — `src/cdss/mcp/adapter.py`: `get_hospital_data`, `get_abdm_record` (used by Resource and Patient handlers).
3. **Conversational agent (POST /agent)** — Bedrock Supervisor in `src/cdss/api/handlers/supervisor.py` (and optionally `backend/agents/` if wired). Uses Bedrock to route to “logical” agents.
4. **Backend MCP servers (optional)** — `backend/mcp/`: Hospital HIS and ABDM simulated tool servers (for future wiring).

---

### 2.1 Verify REST API handlers (all “agents” behind /api/v1)

**What it proves:** Patient, Surgery, Resource, Scheduling, Engagement, and Admin handlers (and thus “agents”) respond correctly.

**Option A – Local (no deploy, no DB)**

From **repository root** (`D:\AI_Hackathon_CDSS`):

```powershell
cd D:\AI_Hackathon_CDSS
$env:PYTHONPATH = "src"
python scripts/test_api_local.py
```

**Expected:** All listed routes return status **200** (or **404** for get-by-id when DB is empty). The script already covers:

- `GET /api/v1/patients`, `GET /api/v1/patients/PT-1001` → **Patient agent**
- `GET /api/v1/surgeries`, `GET /api/v1/surgeries/SRG-001` → **Surgery agent**
- `GET /api/v1/resources` → **Resource agent**
- `GET /api/v1/medications`, `GET /api/v1/schedule` → **Scheduling / Engagement**
- `POST /api/v1/reminders/nudge`, `POST /api/v1/consultations/start`, `POST /api/v1/consultations` → **Engagement agent**
- `GET /api/v1/admin/audit`, `users`, `config`, `analytics`, `resources` → **Admin**
- `GET /dashboard`, `POST /agent` → **Dashboard + Supervisor**

**Option B – With real DB (local or Aurora)**

If the database is **empty** (no CDSS tables yet), create the schema and tables first, then run the API test.

**Step 1 – Create schema and tables (empty DB)**

From **repository root**, set **one** of:

- **Local Postgres:**  
  `$env:DATABASE_URL = "postgresql://user:password@localhost:5432/cdssdb"`
- **Aurora (IAM auth):**  
  `$env:RDS_CONFIG_SECRET_NAME = "cdss-dev/rds-config"`  
  `$env:AWS_REGION = "ap-south-1"`  
  (and ensure AWS credentials can read the secret)

Then run **either** of these (script works from any directory; `-m` requires repo root + PYTHONPATH):

```powershell
cd D:\AI_Hackathon_CDSS
python scripts/run_migrations.py
# Or, with PYTHONPATH set:
# $env:PYTHONPATH = "src"
# python -m cdss.db.migrations.run
```

**Expected:** `CDSS schema: tables created successfully.`

- Dry-run (no DB):  
  `python scripts/run_migrations.py --dry-run`
- To verify schema and row counts:  
  `python scripts/check_aurora_db.py`  
  (or `$env:PYTHONPATH="src"; python -m cdss.db.check_db`)

**Step 2 – (Optional) Seed sample data**

From **repository root** (script sets path; works from any directory):

```powershell
cd D:\AI_Hackathon_CDSS
python scripts/seed_db.py
# Use --force to replace existing seed:
# python scripts/seed_db.py --force
```

**Step 3 – Run API verification**

From **repository root**, with the same env (DATABASE_URL or RDS_CONFIG_SECRET_NAME + AWS_REGION) set:

```powershell
cd D:\AI_Hackathon_CDSS
$env:PYTHONPATH = "src"
python scripts/test_api_local.py
```

You should see real data where the DB is populated (e.g. patients, surgeries, resources). If you did not seed, lists may be empty but status codes should still be 200.

For full migration options (Aurora in private VPC, tunnel, IAM auth), see [db-migrations.md](db-migrations.md).

**Option C – Deployed API (curl)**

```powershell
$BASE = "https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/dev/api"
# If Cognito is disabled:
curl -s "$BASE/v1/patients" | jq .
curl -s "$BASE/v1/surgeries" | jq .
curl -s "$BASE/v1/resources" | jq .
# If Cognito is enabled, add: -H "Authorization: Bearer $TOKEN"
```

Health (no auth):

```powershell
curl -s "https://YOUR_API_ID.execute-api.ap-south-1.amazonaws.com/dev/health" | jq .
```

---

### 2.2 Verify MCP adapter (get_hospital_data, get_abdm_record)

**What it proves:** The single MCP entry point used by Resource and Patient handlers works (currently stubbed).

**Option A – Via Resource API (uses get_hospital_data)**

- Run `test_api_local.py` as above: `GET /api/v1/resources` calls the resource handler, which calls `get_hospital_data("ot_status")`, `get_hospital_data("beds")`, `get_hospital_data("equipment")` and merges into the response.
- Check the JSON body for `ots`, `beds`, or `equipment` from the stub (e.g. `"id": "OT-1"`, `"status": "available"`).

**Option B – Via Patient API (uses get_abdm_record)**

- Call `GET /api/v1/patients/PT-1001` (with DB or mock). The patient handler calls `get_abdm_record(patient_id)` and includes it in the response.
- In the response, look for an ABDM-related field (e.g. `abdm_linked: false`, `summary: "ABDM integration pending"`).

**Option C – Direct Python check (adapter only)**

From repo root:

```powershell
$env:PYTHONPATH = "src"
python -c "
from cdss.mcp.adapter import get_hospital_data, get_abdm_record
print('get_hospital_data(ot_status):', get_hospital_data('ot_status'))
print('get_hospital_data(beds):', get_hospital_data('beds'))
print('get_abdm_record(PT-1):', get_abdm_record('PT-1'))
print('get_abdm_record(\"\"):', get_abdm_record(''))
"
```

**Expected:** Stub structures for OT/beds/equipment and for ABDM (no errors). Empty `patient_id` should return an error structure.

---

### 2.3 Verify conversational agent (POST /agent – Bedrock Supervisor)

**What it proves:** The Supervisor classifies intent and coordinates “logical” agents via Bedrock (and optional AgentCore).

**Option A – Local (mocked Bedrock)**

- `test_api_local.py` already sends `POST /agent` with `{"message": "hello"}`. You get a 200 and a body (may be stub if Bedrock is not configured).

**Option B – With Bedrock (local or deployed)**

1. Set Bedrock config (e.g. via `BEDROCK_CONFIG_SECRET_NAME` or env so the app can call Bedrock in `ap-south-1`).
2. Send a real request:

```powershell
# Local
$env:PYTHONPATH = "src"
# Set RDS/Bedrock secrets if you want DB + real model
python -c "
import json, sys
sys.path.insert(0, 'src')
from cdss.api.handlers.router import handler as router_handler
event = {
    'httpMethod': 'POST', 'path': '/dev/agent',
    'pathParameters': None,
    'requestContext': {'authorizer': {'claims': {'custom:role': 'doctor', 'sub': '1'}}},
    'body': json.dumps({'message': 'What is the surgery checklist for SRG-001?'}),
}
r = router_handler(event, None)
print('Status:', r.get('statusCode'))
print('Body:', r.get('body')[:500] if r.get('body') else None)
"
```

3. **Deployed:** Use the frontend (Staff app) or:

```powershell
curl -s -X POST "$BASE/../agent" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "{\"message\": \"List today's surgeries\"}" | jq .
```

**Expected:** Status 200 and a reply that reflects routing to the appropriate “agent” (surgery, patient, resource, etc.). If Bedrock or secrets are missing, you may get a safe fallback or error message.

---

### 2.4 Verify backend MCP servers (Hospital HIS, ABDM – optional)

**What it proves:** The simulated MCP tool servers in `backend/mcp/` expose tools and execute without errors. They are **not** yet wired to the main API; verification is for future integration.

From repo root:

```powershell
cd backend/mcp
python -c "
from hospital_server import HospitalHISMCPServer
from abdm_server import ABDMMCPServer
h = HospitalHISMCPServer()
a = ABDMMCPServer()
print('Hospital tools:', [t['name'] for t in h.get_tools()])
print('ABDM tools:', [t['name'] for t in a.get_tools()])
print('Hospital get_live_vitals:', h.execute_tool('get_live_vitals', {'patient_id': 'PT-1'}))
print('ABDM fetch_clinical_artifacts:', a.execute_tool('fetch_clinical_artifacts', {'patient_id': 'PT-1'}))
"
```

**Expected:** Tool names listed; `execute_tool` returns a string (simulated result) without exceptions.

---

## Part 3: Quick verification checklist

| Component | How to verify | Command / step |
|-----------|----------------|----------------|
| **Patient agent** | REST + optional MCP | `test_api_local.py` → GET /api/v1/patients, GET /api/v1/patients/PT-1001 |
| **Surgery agent** | REST | `test_api_local.py` → GET /api/v1/surgeries, GET /api/v1/surgeries/SRG-001 |
| **Resource agent** | REST + MCP | `test_api_local.py` → GET /api/v1/resources (stub MCP merged in) |
| **Scheduling agent** | REST | `test_api_local.py` → GET /api/v1/schedule |
| **Engagement agent** | REST | `test_api_local.py` → GET /api/v1/medications, POST reminders/nudge, POST consultations/start, POST consultations |
| **Admin** | REST | `test_api_local.py` → GET /api/v1/admin/audit, users, config, analytics, resources |
| **MCP adapter** | Direct or via handlers | Python `get_hospital_data` / `get_abdm_record` or call Resource + Patient APIs |
| **POST /agent (Supervisor)** | Local or deployed | `test_api_local.py` → POST /agent; or curl/frontend with Bedrock configured |
| **Backend MCP servers** | Optional | Run `backend/mcp` snippet above |

---

## Part 4: References

- **Requirements:** [docs/requirements.md](requirements.md)
- **Implementation status:** [docs/implementation-checklist.md](implementation-checklist.md)
- **API testing:** [docs/TESTING.md](TESTING.md)
- **API reference:** [docs/api_reference.md](api_reference.md)
- **Backend status:** [docs/cdss-backend-status.md](cdss-backend-status.md)
