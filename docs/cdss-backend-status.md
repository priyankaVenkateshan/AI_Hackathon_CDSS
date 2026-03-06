# CDSS Backend Status and Next Steps

## What’s in place

| Area | Status | Location |
|------|--------|----------|
| **Infra** | ✅ Lambda env (RDS_SECRET, BEDROCK_SECRET, S3, EventBridge, SQS), IAM for Secrets Manager, SSM, EventBridge, SQS, S3 | `infrastructure/main.tf`, `lambda_iam.tf` |
| **API Gateway** | ✅ GET /dashboard, POST /agent, /api/{proxy+} → CDSS Lambda | `infrastructure/api_gateway.tf` |
| **Data layer** | ✅ Aurora schema (SQLAlchemy 2.0 models), migrations, RDS connection helper (Secrets Manager + IAM auth) | `src/cdss/db/` |
| **Handlers** | ✅ Patient, Surgery, Resource, Scheduling, Engagement, Admin, Router — **wired to Aurora**; dashboard from DB; consultations, reminders, audit, analytics from DB | `src/cdss/api/handlers/` |
| **MCP** | ✅ Schemas (`schemas.py`), EventBridge publish (`events.py`), **async SQS consumer** (`consumer.py`) + worker Lambda; DLQ + trace_id on failure | `src/cdss/mcp/` |
| **Bedrock** | ✅ Config from Secrets Manager (`bedrock_config`); Converse API for POST /agent; Pydantic-validated output; safety disclaimer | `src/cdss/bedrock/` |

So: **infra, data layer, handlers (Aurora), MCP (publish + consume), and Bedrock /agent are implemented.**

---

## Implementation checklist (plan sections)

| Section | Description | Status |
|---------|-------------|--------|
| **1. Infrastructure** | Lambda env (RDS, Bedrock, S3, EventBridge, SQS), IAM, API Gateway /dashboard, /agent | ✅ Done |
| **2. Data layer** | Aurora schema, SQLAlchemy models, migrations, RDS connection (Secrets Manager + IAM) | ✅ Done |
| **3. MCP** | Message schemas, EventBridge publish, async SQS consumer + DLQ + trace_id | ✅ Done |
| **4. Agent handlers** | Patient, Surgery, Resource, Scheduling, Engagement, Admin, Dashboard — Aurora-backed; consultations, reminders | ✅ Done |
| **5. Bedrock and secrets** | Config from Secrets Manager, Converse for /agent, Pydantic-validated output, safety disclaimer | ✅ Done |
| **6. S3** | Documents/Corpus buckets and IAM in place; **handlers use documents bucket**: consultation transcript stored on POST consultations/start and POST consultations (transcript/transcriptText → S3 key in Visit.transcript_s3_key) | ✅ Done |
| **7. Observability** | Structured logging, audit log (router); CloudWatch/X-Ray via Lambda | 🔲 Optional enhancements |
| **8. Frontend alignment** | Routes and response shapes match client.js; CORS/auth per API Gateway | ✅ Done |
| **9. Architecture** | EventBridge, SQS, DLQ, Aurora, Bedrock, MCP stubs — aligned with plan | ✅ Done |

---

## What to provide for RDS config

You never put connection strings or passwords in code. You give **one** of the following.

### Option 1: Aurora in AWS (IAM auth) — for Lambda or migrations from a machine with AWS access

**You provide:**

1. **`RDS_CONFIG_SECRET_NAME`**  
   The **name** of the Secrets Manager secret where Terraform stores RDS connection info.  
   With default `project_name = "cdss"` and `environment = "dev"` it is:
   - **`cdss-dev/rds-config`**

2. **`AWS_REGION`**  
   The region where that secret (and the Aurora cluster) live.  
   In your setup (from tfvars) that is:
   - **`ap-south-1`**

3. **AWS credentials**  
   Same as for Terraform: profile or env vars that can call `secretsmanager:GetSecretValue` on that secret in that region.

**You do not provide:** host, port, database, username, or password. The code reads the secret (it contains `host`, `port`, `database`, `username`, `region`) and uses IAM auth (no password in the secret).

**Example (PowerShell):**

```powershell
$env:RDS_CONFIG_SECRET_NAME = "cdss-dev/rds-config"
$env:AWS_REGION = "ap-south-1"
# Ensure AWS credentials are set (e.g. aws configure, or AWS_PROFILE)
python -m cdss.db.migrations.run
# or
python -m cdss.db.check_db
```

**Check that the secret exists:**

```powershell
aws secretsmanager get-secret-value --secret-id "cdss-dev/rds-config" --region ap-south-1
```

If that fails, run `terraform apply` in the same region or fix credentials/region.

**Aurora in private VPC:** If Aurora is in private subnets (as in this project), `check_db` and migrations from your **laptop** will **time out** — your machine cannot reach the private IP. To verify the DB in AWS: (1) Run migrations and `check_db` from **inside the VPC** (e.g. EC2 bastion, or Lambda with `enable_lambda_vpc = true`), or (2) Use **DATABASE_URL** with a **local Postgres** for local development and verification.

---

### Option 2: Local Postgres (password-based) — for local dev without AWS

**You provide:**

- **`DATABASE_URL`**  
  A single connection string, including password, e.g.:
  - **`postgresql://user:password@localhost:5432/cdssdb`**

Do **not** set `RDS_CONFIG_SECRET_NAME` when using `DATABASE_URL`; the code will use the URL and skip Secrets Manager.

### Admin users and config (Cognito / SSM)

- **GET /api/v1/admin/users**: When **COGNITO_USER_POOL_ID** is set (Lambda env from Terraform), returns users from Cognito `list_users`. Otherwise returns `{ "users": [], "_stub": "..." }` (stub by design for local dev without Cognito).
- **GET/PUT /api/v1/admin/config**: When SSM parameter **/cdss/admin/config** exists and Lambda has permission, reads/writes JSON config. Otherwise uses in-memory fallback; response may include `_stub` indicating config is not persisted. Terraform creates the parameter and grants Lambda `ssm:PutParameter` on it.

**Example (PowerShell):**

```powershell
$env:DATABASE_URL = "postgresql://cdssadmin:yourpassword@localhost:5432/cdssdb"
$env:PYTHONPATH = "src"
python -m cdss.db.migrations.run
python -m cdss.db.check_db
```

---

## One-time in PostgreSQL (for IAM auth only)

If you use **Option 1** (Aurora + Secrets Manager), the DB user in the secret (e.g. `cdssadmin`) must be allowed to use IAM auth. Connect to Aurora **once** with the master password and run:

```sql
GRANT rds_iam TO cdssadmin;
```

(Use the same username as in `terraform.tfvars`: `db_username`.)

---

## Suggested next steps (in order)

1. **Run migrations**  
   With `RDS_CONFIG_SECRET_NAME` + `AWS_REGION` (and credentials) or `DATABASE_URL`, run:
   - `python -m cdss.db.migrations.run`
   Then:
   - `python -m cdss.db.check_db`
   to confirm the schema exists.

2. ~~**Wire handlers to Aurora**~~ ✅ **Done.** All handlers use `get_session()` and `src/cdss/db/models.py`.

3. ~~**MCP and EventBridge**~~ ✅ **Done.** Schemas, publish, async SQS consumer (worker Lambda), DLQ + trace_id.

4. ~~**Bedrock and dashboard/agent**~~ ✅ **Done.** Bedrock config from Secrets Manager; Converse for POST /agent with Pydantic-validated reply and safety disclaimer; dashboard aggregates from Aurora.

5. **Optional next:** Conversation summary / entity extraction in Engagement (Bedrock) for consultations; optional patient/surgery risk summary in Patient/Surgery agents; AgentCore migration per `docs/agentcore-implementation-plan.md`.

Full plan and todos: see the implementation plan (e.g. `cdss_backend_ai_agent_layer_*.plan.md`).

---

## Frontend–backend field alignment

The doctor-dashboard expects specific response shapes when `VITE_USE_MOCK=false`. Backend and DB are aligned as follows.

- **Patients (list/detail):** Backend returns `id`, `name`, `age` (from DOB), `gender`, `bloodGroup`, `ward`, `severity`, `status`, `vitals`, `conditions`, `lastVisit`; detail adds `surgeryReadiness`, `consultationHistory` (from Visit), optional `aiSummary` (Bedrock). Optional DB columns (migration 002): `blood_group`, `ward`, `severity`, `status`, `vitals`, `surgery_readiness`.
- **Surgeries:** List and detail include `checklist` (array) and `requiredInstruments`; checklist dict with `items` is normalized to an array.
- **Resources:** Response includes `ots`, `equipment`, `specialists`, plus `capacity` (staff/assets counts) and `inventory` (merged table shape: id, name, specialty, status, assignedTo, area) for Resources.jsx.
- **Admin users:** Cognito users mapped to `id`, `name`, `email`, `role`, `status` for AdminUsers.jsx.

Run `python -m cdss.db.migrations.run` to apply migration 002 (patient frontend fields).
