# Next Task and Implementation

**Source:** [design.md](design.md), [requirements.md](requirements.md), [implementation-plan.md](implementation-plan.md), [next-development-tasks.md](next-development-tasks.md), [TODO.md](TODO.md), and current codebase review.

---

## Current Status (What’s Done)

| Area | Status |
|------|--------|
| **Phase 1 – Foundation** | API Gateway REST, Lambda router, RDS/Aurora, Cognito (Terraform), initial schema and seed |
| **Phase 2 – RBAC (partial)** | Router: admin-only paths; **patient-scoped RBAC for `/api/v1/patients`** (patient cannot list all; can only access own record by path id). Router **audit → RDS** (`audit_log` table) and Admin GET `/api/v1/admin/audit` |
| **Staff app (Doctor dashboard)** | React shell, Cognito + mock auth, API client with JWT, Dashboard, Patients, Surgery Planning, Resources, Medications, Admin placeholder |
| **Patient/Nurse apps** | Shells with AuthContext that *reference* Cognito via `isCognitoEnabled()` but **no `api/config.js`** in patient-dashboard or nurse-dashboard (only doctor-dashboard has it); mock login works, Cognito path would fail without config |
| **Backend handlers** | Patient, Surgery, Resource, Scheduling, Engagement, Admin, Dashboard, router dispatch and proxy |
| **AgentCore (AC-1)** | CDSS AgentCore PoC runtime + Gateway with fallback and basic tracing (per agentcore-implementation-plan.md) |

---

## Immediate Next Task (Priority 1): Extend Patient-Scoped RBAC to All Patient Data Paths

**Why:** Req 1.2, 1.6 and design RBAC require that the Patient_Module can only access that patient’s own data. The router currently enforces this only for `v1/patients` and `v1/patients/{id}`. It does **not** enforce it for:

- `v1/consultations` (body/query `patient_id`)
- `v1/medications` (body/query `patient_id`)
- `v1/reminders` (body/query `patient_id`)
- `v1/surgeries` (patient’s own surgeries only)
- `v1/schedule` (if any route is patient-scoped)

So a patient could call e.g. `GET /api/v1/consultations?patient_id=OTHER_PATIENT` and get data if the backend doesn’t reject it.

**Implementation:**

1. **Router (`src/cdss/api/handlers/router.py`)**  
   When `role == "patient"` and the request is to a patient-scoped path, resolve `patient_id` from:
   - Path: `v1/patients/{id}`, `v1/consultations/{id}` (if visit belongs to patient), etc.
   - Query: `patient_id` or `patientId` for `v1/consultations`, `v1/medications`, `v1/reminders`, `v1/surgeries`, `v1/schedule` (where applicable).
   - Body: `patient_id` or `patientId` for POST/PUT.
   If any such `patient_id` is present and does **not** match `_get_patient_id(claims)`, return **403** and audit.

2. **List routes for patient role**  
   For patient role, allow only:
   - `GET /api/v1/patients/{own_id}` (already enforced),
   - `GET /api/v1/consultations` (backend must filter by own patient_id from claims),
   - `GET /api/v1/medications`, `v1/reminders`, `v1/surgeries`, `v1/schedule` only when query param `patient_id` equals claim (or backend injects it from claims and ignores client-supplied value).

3. **Handlers**  
   In engagement, scheduling, surgery handlers: when the caller is a patient (e.g. from a shared helper that reads role from event/claims), filter all queries by `patient_id == claim_patient_id` and reject body/query `patient_id` that does not match claim.

**Deliverable:** No patient can read or write another patient’s consultations, medications, reminders, surgeries, or schedule slots. All such attempts return 403 and are audited.

---

## Immediate Next Task (Priority 2): Cognito and API Config for Patient and Nurse Dashboards

**Why:** Req 1.3, 1.7 and Phase 2 require that after login, Staff (doctor/nurse/admin) and Patient use the same auth and that role-based redirect works. Today only the doctor-dashboard has `api/config.js` and an API client that sends JWT; patient-dashboard and nurse-dashboard import `../api/config` but that file does not exist in those apps, so Cognito cannot be used there.

**Implementation:**

1. **Patient dashboard**
   - Add `src/api/config.js` (reuse logic from doctor-dashboard: `VITE_API_URL`, `VITE_USE_MOCK`, `VITE_COGNITO_*`, `isCognitoEnabled()`).
   - Add `src/api/client.js` (or equivalent) that sends `Authorization: Bearer <token>` when user has token (from Cognito or mock).
   - Ensure all API calls use this client and that login stores token (Cognito idToken or mock token) in the same shape as doctor-dashboard (e.g. `user.token`).
   - Optionally add `AuthApiBridge`-style wiring so a global `getToken()` is set from AuthContext and the client uses it.

2. **Nurse dashboard**
   - Same as above: `src/api/config.js`, `src/api/client.js`, and use token on all API calls.

3. **Cognito custom attributes**
   - Ensure User Pool has `custom:role` and, for patients, `custom:patientId` (or `patientId`) set on sign-up or by Admin so the router’s `_get_patient_id(claims)` resolves correctly for patient users.

4. **Post-login redirect**
   - After login, redirect by role: Doctor/Nurse/Admin → Staff app (doctor-dashboard or nurse-dashboard URL); Patient → Patient portal URL (Req 1.3). This may be handled by a single entry URL that redirects based on role, or by separate URLs per app with role check on load.

**Deliverable:** Patient and Nurse dashboards can use Cognito when env is set; all three apps send JWT; patient role has `patientId` in claims for RBAC.

---

## Immediate Next Task (Priority 3): Router Audit Status Code and Failures

**Why:** Audit entries are written with a fixed `status: 200` before dispatch; 4xx/5xx responses from handlers are not reflected in the audit record. For DISHA and Admin audit view, it helps to record the actual HTTP status.

**Implementation:**

- In `router.py`, do **not** call `_audit_log(..., 200)` before dispatching. Instead, call `_audit_log` in a `finally` block (or after receiving the handler response) with the **actual** status code from the handler response (e.g. `response.get("statusCode", 200)`). Ensure both success and failure (403, 404, 500) are audited with the correct status.

**Deliverable:** Every authenticated request has one audit row with the real response status.

---

## Suggested Order (Next 1–2 Weeks)

1. **Patient-scoped RBAC for all patient data paths** (Priority 1) – 1–2 days  
2. **Router audit with real status code** (Priority 3) – ~0.5 day  
3. **Cognito + API config for Patient and Nurse dashboards** (Priority 2) – ~1 day  

Then continue with:

- **Phase 3:** pgvector + RAG for patient summary/surgery readiness; MCP adapter called from agents; single Patient_ID/dedup.
- **Phase 4:** WebSocket flow for real-time surgical support.
- **Phase 6:** findReplacement + doctor/team notifications; OT utilization metrics.
- **Phase 7:** Engagement (transcription, entity extraction, reminders, adherence).
- **Phase 10:** Admin section (users, audit export, config, analytics); testing; performance.
- **AgentCore:** AC-2 (Triage + observability), AC-3 (Memory + MCP), AC-4 (Routing + Identity) per [agentcore-implementation-plan.md](agentcore-implementation-plan.md).

---

## References

- **Requirements:** Req 1 (RBAC), Req 2 (Patient), Req 3–7 (Agents), Req 8 (MCP), Req 9 (Notifications), Req 10 (AWS, compliance).
- **Design:** RBAC architecture, Properties 2 (Patient_ID), 22 (Audit), 19 (Performance).
- **Implementation plan:** Phases 1–10; dependency graph (Phase 1 → 2 → 3, then 4/5/7 parallel, etc.).
- **TODO.md:** Full checklist; suggested order aligns with this document.
