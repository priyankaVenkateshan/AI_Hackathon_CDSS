# CDSS Connectivity & Data Troubleshooting Report (March 8, 2026)

This document summarizes the major connectivity and data serialization issues diagnosed and resolved to enable the Doctor Dashboard to function with live Aurora database data.

---

## Resolve "Backend is not connected to the database" on the deployed dashboard

The deployed dashboard (e.g. d2yy4v2hr1otkm.cloudfront.net) shows this banner when the **deployed API (Lambda)** cannot reach Aurora. Fix it in **two steps**:

1. **Terminal 1 – start the DB tunnel** (leave this window open):
   - **SSH:** `.\scripts\start_ssh_tunnel.ps1`  
     (Uses Terraform output: bastion + Aurora. Your IP must be in `infrastructure/terraform.tfvars` → `bastion_allowed_cidr`; you need the matching SSH key.)
   - **If SSH times out (port 22):** `.\scripts\start_ssm_tunnel.ps1`  
     (Uses HTTPS 443; see §6 below.)
   - Wait until something is listening on **localhost:5433** (tunnel ready).

2. **Terminal 2 – run migrations, seed, and RDS IAM grant** (per §2, §5: Aurora uses IAM auth; script sets `DATABASE_URL` with a fresh IAM token):
   ```powershell
   cd D:\AI_Hackathon_CDSS
   .\scripts\run_after_tunnel.ps1
   ```
   Or use the full script (it will open a tunnel window for you if port 5433 is not yet up):  
   `.\scripts\connect_backend_to_db.ps1`

3. **Refresh the deployed dashboard.** The banner should be gone and you should see real data. No redeploy or API restart needed; Lambda will connect on the next request.

See **[CONNECT_DEPLOYED_BACKEND_TO_DATABASE.md](CONNECT_DEPLOYED_BACKEND_TO_DATABASE.md)** for more detail.

---

## 1. Frontend Connectivity: "Cannot reach API at http://localhost:8080"

### Symptom
The frontend (Vite/React) failed to fetch any data from the local backend API running on `localhost:8080`, even when the backend was verified to be running.

### Root Cause: Duplicate CORS Headers
The browser's `fetch()` call was blocked because the `Access-Control-Allow-Origin` header was being sent **twice** (`*, *`).
- The local Python HTTP server wrapper (`scripts/run_api_local.py`) was adding its own CORS headers.
- The Lambda router handler (`src/cdss/api/handlers/router.py`) was also adding CORS headers.
- Browsers reject multiple values for this header.

### Fix
Modified `scripts/run_api_local.py` to skip any `Access-Control-*` headers returned by the Lambda handler if they were already set by the local wrapper.

---

## 2. Database Connectivity: "PAM authentication failed"

### Symptom
When connecting to the Aurora database over the SSH tunnel (`localhost:5433`), the backend received a `FATAL: PAM authentication failed for user "cdssadmin"`.

### Root Cause: IAM Database Authentication
The Aurora cluster has `iam_database_authentication_enabled = true`. Standard passwords are not accepted even through the tunnel; the client must provide a short-lived AWS IAM authentication token.

### Fix
Updated Local Backend scripts (`scripts/run_dev_backend.ps1` and `scripts/run_api_local.py`) to:
1.  Fetch the database cluster hostname from AWS Secrets Manager.
2.  Generate a temporary IAM authentication token using `boto3.client('rds').generate_db_auth_token()`.
3.  Inject this token into the `DATABASE_URL` as the password.

---

## 3. Configuration Errors (DATABASE_URL)

### Symptom
Even with auth tokens, the database connection failed with "database not found" or "connection reset".

### Root Cause
1.  The `DATABASE_URL` in the root `.env` pointed to the default `postgresql` database instead of the project-specific `cdssdb`.
2.  The connection lacked `sslmode=require`, which AWS Aurora enforces.

### Fix
Updated `.env` to:
`DATABASE_URL=postgresql://cdssadmin:TOKEN@localhost:5433/cdssdb?sslmode=require`

---

## 4. UI Bug: "Conditions" Serialization

### Symptom
The Patients page displayed patient cards where "Medical Condition" showed a raw Python object string: `<cdss.db.models.MedicalCondition object at 0x...>`

### Root Cause
The patient API handler returned the raw SQLAlchemy relationship list (`patient.conditions`) instead of serializing the individual objects to strings.

### Fix
Updated `src/cdss/api/handlers/patient.py` to map the `conditions` relationship and extract the `condition_name` attribute for each entry.

---

## Final Verification
The following components are now fully operational:
- ✅ **Local API Gateway Wrapper** (Port 8080)
- ✅ **SSH Tunnel to Aurora** (Port 5433)
- ✅ **Doctor Dashboard** (Port 5173 / Vite)
- ✅ **Live Database Data** (25 patients, 5 surgeries successfully loaded)

---

## 5. What Went Wrong (Automated Run) & Next Steps

### Errors encountered when running verification automatically

| Error | Process / context | Cause |
|-------|-------------------|--------|
| **`FATAL: PAM authentication failed for user "cdssadmin"`** | Direct DB connection test (e.g. `python -c "create_engine('postgresql://cdssadmin:***REDACTED***@localhost:5433/...')"`) | Aurora has **IAM database authentication** enabled. The password in `.env` (`***REDACTED***` or any static value) is **ignored**; the client must use a **short‑lived IAM token** from `boto3.client('rds').generate_db_auth_token()`. |
| **`GET /health` → `database: "unavailable"`** | API started with `DATABASE_URL` from `.env` (static password) | Same as above: static password fails at connection time, so the health check reports DB unavailable. |
| **API process exits immediately (no output)** | Background start of `python scripts/run_api_local.py` from a script/automation | Environment (e.g. `DATABASE_URL` or `PYTHONPATH`) may not be passed correctly to the child process; or port 8080 was already in use so the server failed to bind and exited. |
| **`ConnectionRefusedError` on `localhost:8080`** | Health check after starting the API | The API process was not actually running (crashed or never bound) — e.g. wrong env, or another process was still on 8080. |

### Correct way to run backend with real Aurora (per §2)

1. **Start the DB tunnel** (if not already up):
   - **Preferred:** Run `.\scripts\start_ssm_tunnel.ps1` (no port 22; use this if SSH times out) and **leave that window open**.
   - Or run `.\scripts\start_ssh_tunnel.ps1` if your IP is in `bastion_allowed_cidr` and port 22 is open.
   - Ensure something is listening on **localhost:5433**.

2. **Start the backend using the script that injects the IAM token**:
   - From repo root run: **`.\scripts\run_dev_backend.ps1`**
   - This script:
     - Loads `.env` from repo root.
     - Checks port 5433; if nothing is listening, **opens a new window to run the SSM tunnel** (not SSH) and waits ~60s.
     - **Generates a fresh IAM token** via Python/boto3 and sets `DATABASE_URL=postgresql+psycopg2://cdssadmin:TOKEN@localhost:5433/cdssdb?sslmode=require`.
     - Runs `python scripts/run_api_local.py` in the **foreground** (leave this window open).

3. **Do not** rely on a static `DATABASE_URL=...***REDACTED***...` in `.env` for Aurora — it will always result in **PAM authentication failed**. Use **`run_dev_backend.ps1`** so the token is generated and injected before starting the API.

4. **Run Phase 1–4 verification** (in a **second** terminal):
   - `$env:BASE_URL="http://localhost:8080"; python scripts/verify_phases_1_to_4_real_db.py`
   - Or: `.\scripts\run_phases_1_to_4_verify.ps1`
   - Expect: `GET /health` → `database: "connected"`, and `GET /api/v1/patients` → 200 with a list of patients.

### If you prefer to start the API manually (without `run_dev_backend.ps1`)

- In a **first** terminal: start your SSH/SSM tunnel so that **localhost:5433** forwards to Aurora.
- In a **second** terminal, generate the IAM token and start the API in one go:
  ```powershell
  cd D:\AI_Hackathon_CDSS
  $env:PYTHONPATH = "src"
  $env:DATABASE_URL = python -c "
  import boto3, json
  from urllib.parse import quote_plus
  host = json.loads(boto3.client('secretsmanager', region_name='ap-south-1').get_secret_value(SecretId='cdss-dev/rds-config')['SecretString'])['host']
  token = boto3.client('rds', region_name='ap-south-1').generate_db_auth_token(DBHostname=host, Port=5432, DBUsername='cdssadmin')
  print('postgresql+psycopg2://cdssadmin:' + quote_plus(token) + '@localhost:5433/cdssdb?sslmode=require')
  "
  python scripts/run_api_local.py
  ```
- Then in a **third** terminal run the verification script as above.

---

## 6. SSH Tunnel: "Connection timed out" to bastion (port 22)

### Symptom
When running `.\scripts\start_ssh_tunnel.ps1`, the connection to the bastion fails with:
`ssh: connect to host 13.235.241.92 port 22: Connection timed out`

### Root Cause
Your machine cannot reach the bastion’s public IP on **port 22**. Common causes:
- **Security group:** `bastion_allowed_cidr` in Terraform does not include your current IP (e.g. you moved networks or use a VPN).
- **Firewall:** Corporate or home firewall blocks outbound port 22.
- **Bastion in private subnet** or network path issues.

### Fix: Use the SSM tunnel instead (no port 22)

The **SSM tunnel** uses AWS Systems Manager over **HTTPS (443)**. It does not require port 22 to the bastion.

1. **Start the SSM tunnel** (in its own terminal; leave it open):
   ```powershell
   .\scripts\start_ssm_tunnel.ps1
   ```
   Wait until you see *"Bastion is running and SSM is Online"* and *"Starting tunnel"*. The script starts the bastion if stopped and waits for SSM to be ready.

2. **In a second terminal**, set `DATABASE_URL` with an IAM token and run your command:
   ```powershell
   .\scripts\set_db_url_iam.ps1
   python scripts/list_aurora_tables.py
   ```
   Or start the backend (API + IAM token) with:
   ```powershell
   .\scripts\run_dev_backend.ps1
   ```
   When port 5433 is not listening, `run_dev_backend.ps1` now opens the **SSM tunnel** (not SSH) in a new window and waits for it.

3. **If you must use SSH:** Update your IP in `infrastructure/terraform.tfvars` (`bastion_allowed_cidr = "YOUR_IP/32"`), run `terraform apply`, then run `.\scripts\start_ssh_tunnel.ps1` again.

