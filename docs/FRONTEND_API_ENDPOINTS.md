# Frontend API Endpoints

This document lists all API endpoints used by the CDSS frontend applications (doctor-dashboard, patient-dashboard, nurse-dashboard), including HTTP methods, calling components/files, purpose, and authentication requirements.

---

## Branch and merge (local only)

- **Push policy:** All pushes go to your **feature branch only** (e.g. `choros`), **not to `main`**. Use `git push origin <your-branch>` so changes stay on your branch.
- **Frontend merge (local only):** To bring in the frontend commit `259586a573fb4e0ad0af35441b4f633b4cddede5` **only on your machine** (no push to GitHub):
  1. `git fetch origin`
  2. `git merge 259586a573fb4e0ad0af35441b4f633b4cddede5 --no-edit`
  - Resolve any merge conflicts if they appear, then `git add` and `git commit`.
  - Do **not** run `git push` after this merge if you want that merge to stay local and not affect `main` or the remote branch.

---

## Base URL and environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | doctor-dashboard, patient-dashboard | REST API base URL (trailing slash stripped). When empty and `VITE_USE_MOCK` is false, app shows a warning. |
| `VITE_USE_MOCK` | doctor-dashboard, patient-dashboard | `"true"` or `"1"` = use mock data; otherwise calls go to `VITE_API_URL`. |
| `VITE_WS_URL` | doctor-dashboard only | WebSocket URL for real-time updates (e.g. surgery events). Optional. |
| `VITE_COGNITO_USER_POOL_ID` | doctor-dashboard, patient-dashboard | Cognito User Pool ID for auth. |
| `VITE_COGNITO_CLIENT_ID` | doctor-dashboard, patient-dashboard | Cognito App Client ID. |
| `VITE_COGNITO_REGION` | doctor-dashboard, patient-dashboard | AWS region for Cognito (default: `ap-south-1`). |

**Auth:** When Cognito or a token getter is configured, the doctor-dashboard API client sends `Authorization: Bearer <token>` on all requests. The token is provided via `setAuthTokenGetter()` from `AuthApiBridge.jsx`.

---

## REST endpoints

All REST calls from the doctor-dashboard go through `frontend/apps/doctor-dashboard/src/api/client.js` unless noted. The client uses `config.apiUrl` from `frontend/apps/doctor-dashboard/src/api/config.js` and sends `Content-Type: application/json` and optional `Authorization: Bearer <token>`.

| Endpoint | Method | Component / File | Purpose | Headers / Auth |
|----------|--------|------------------|---------|----------------|
| `/health` | GET | `patient-dashboard/src/pages/Debug/Debug.jsx` | API health check (dev only) | Optional: `Authorization: Bearer <token>` |
| `/health` | GET | `doctor-dashboard/src/pages/Debug/Debug.jsx` | API health check (dev only) | None (no auth) |
| `/dashboard` | GET | `doctor-dashboard/src/pages/Debug/Debug.jsx` | Debug panel auth test (dev only) | `Authorization: Bearer <token>` |
| `/dashboard` | GET | `doctor-dashboard/src/pages/Dashboard/Dashboard.jsx` | Fetch dashboard data (KPIs, tasks, etc.) | Bearer token when set |
| `/api/v1/patients` or `/patients` | GET | `doctor-dashboard/src/api/client.js` → `getPatients()` | List patients | Bearer token |
| `/api/v1/patients` | GET | `doctor-dashboard/src/pages/Patients/Patients.jsx` | Display patient list | Bearer token |
| `/api/v1/patients` | GET | `doctor-dashboard/src/pages/Medications/Medications.jsx` | Patient list for medications view | Bearer token |
| `/api/v1/patients/:id` or `/patients/:id` | GET | `doctor-dashboard/src/api/client.js` → `getPatient(patientId)` | Get single patient | Bearer token |
| `/api/v1/patients/:id` | GET | `doctor-dashboard/src/pages/PatientConsultation/PatientConsultation.jsx` | Load patient for consultation | Bearer token |
| `/api/v1/consultations/start` | POST | `doctor-dashboard/src/api/client.js` → `startConsultation()` | Start consultation | Bearer token; body: `{ patient_id, doctor_id }` |
| `/api/v1/consultations/start` | POST | `doctor-dashboard/src/pages/PatientConsultation/PatientConsultation.jsx` | Start consultation flow | Bearer token |
| `/api/v1/consultations` | POST | `doctor-dashboard/src/api/client.js` → `saveConsultation()` | Save consultation | Bearer token; body: `{ patient_id, ... }` |
| `/api/v1/consultations` | POST | `doctor-dashboard/src/pages/PatientConsultation/PatientConsultation.jsx` | Save consultation notes/results | Bearer token |
| `/agent` | POST | `doctor-dashboard/src/api/client.js` → `postAgent(body)` | AI/agent chat or recommendations | Bearer token |
| `/agent` | POST | `doctor-dashboard/src/pages/AIChat/AIChat.jsx` | Send message to agent | Bearer token |
| `/agent` | POST | `doctor-dashboard/src/pages/PatientConsultation/PatientConsultation.jsx` | Agent-assisted consultation | Bearer token |
| `/api/v1/medications` or `/medications` | GET | `doctor-dashboard/src/api/client.js` → `getMedications()` | List medications | Bearer token |
| `/api/v1/medications` | GET | `doctor-dashboard/src/pages/Medications/Medications.jsx` (via client) | Display medications | Bearer token |
| `/api/v1/surgeries` or `/surgeries` | GET | `doctor-dashboard/src/api/client.js` → `getSurgeries()` | List surgeries | Bearer token |
| `/api/v1/surgeries` | GET | `doctor-dashboard/src/pages/Surgery/Surgery.jsx` | Surgical schedule list | Bearer token |
| `/api/v1/surgeries` | GET | `doctor-dashboard/src/pages/Schedule/Schedule.jsx` | Schedule view with surgeries | Bearer token |
| `/api/v1/surgeries/:id` or `/surgeries/:id` | GET | `doctor-dashboard/src/api/client.js` → `getSurgery(surgeryId)` | Get single surgery | Bearer token |
| `/api/v1/surgeries/:id` | GET | `doctor-dashboard/src/pages/SurgeryPlanning/SurgeryPlanning.jsx` | Surgery detail for planning | Bearer token |
| `/api/v1/resources` or `/resources` | GET | `doctor-dashboard/src/api/client.js` → `getResources()` | List resources | Bearer token |
| `/api/v1/resources` | GET | `doctor-dashboard/src/pages/Resources/Resources.jsx` | Resources view | Bearer token |
| `/api/v1/resources` | GET | `doctor-dashboard/src/pages/Admin/AdminResources.jsx` | Admin resources view | Bearer token |
| `/api/v1/schedule` or `/schedule` | GET | `doctor-dashboard/src/api/client.js` → `getSchedule()` | Get schedule | Bearer token |
| `/api/v1/schedule` | GET | `doctor-dashboard/src/pages/Schedule/Schedule.jsx` | Schedule page | Bearer token |
| `/api/v1/reminders/nudge` | POST | `doctor-dashboard/src/api/client.js` → `sendNudge()` | Send medication nudge | Bearer token; body: `{ patient_id, medication_id }` |
| `/api/v1/reminders` | POST | `doctor-dashboard/src/api/client.js` → `scheduleReminder()` | Schedule reminder | Bearer token; body: `{ patient_id, medication_id, scheduled_at }` |
| `/api/v1/admin/users` | GET | `doctor-dashboard/src/api/client.js` → `getUsers()` | List users (admin) | Bearer token |
| `/api/v1/admin/users` | GET | `doctor-dashboard/src/pages/Admin/AdminUsers.jsx` | Admin user management | Bearer token |
| `/api/v1/admin/audit` | GET | `doctor-dashboard/src/api/client.js` → `getAuditLog(params)` | Audit log with optional query params | Bearer token |
| `/api/v1/admin/audit` | GET | `doctor-dashboard/src/pages/Admin/AdminAudit.jsx` | Admin audit log page | Bearer token |
| `/api/v1/admin/audit` | GET | `doctor-dashboard/src/pages/Debug/Debug.jsx` (RBAC tests) | Dev RBAC test | Bearer token |
| `/api/v1/activity` | POST | `doctor-dashboard/src/api/client.js` → `postActivityLog(body)` | Log doctor activity (Criteria 4) | Bearer token; best-effort |
| `/api/v1/activity` | POST | `doctor-dashboard/src/context/ActivityContext.jsx` | Log provider actions for My Activity / audit | Bearer token |
| `/api/v1/admin/config` | GET | `doctor-dashboard/src/api/client.js` → `getSystemConfig()` | Get system config | Bearer token |
| `/api/v1/admin/config` | GET | `doctor-dashboard/src/pages/Admin/AdminConfig.jsx` | Admin config page | Bearer token |
| `/api/v1/admin/config` | PUT | `doctor-dashboard/src/api/client.js` → `updateSystemConfig(body)` | Update system config | Bearer token |
| `/api/v1/admin/config` | PUT | `doctor-dashboard/src/pages/Admin/AdminConfig.jsx` | Save config changes | Bearer token |
| `/api/v1/admin/analytics` | GET | `doctor-dashboard/src/api/client.js` → `getAnalytics()` | Admin analytics | Bearer token |
| `/api/v1/admin/analytics` | GET | `doctor-dashboard/src/pages/Admin/AdminAnalytics.jsx` | Admin analytics page | Bearer token |

**Debug (dev only)**  
In `doctor-dashboard/src/pages/Debug/Debug.jsx`, the RBAC quick tests call these with `Authorization: Bearer <token>`:  
`GET /dashboard`, `GET /api/v1/patients`, `GET /api/v1/schedule`, `GET /api/v1/admin/audit`.

---

## WebSocket (doctor-dashboard only)

| Connection | Config | Component / File | Purpose | Auth |
|------------|--------|------------------|---------|------|
| WebSocket URL | `VITE_WS_URL` → `config.wsUrl` in `api/config.js` | `doctor-dashboard/src/api/websocket.js` | Real-time updates (surgery, vitals) | Optional `doctor_id` query param on connect |
| `subscribe_surgery` | Sent as JSON: `{ action: 'subscribe_surgery', surgery_id }` | `doctor-dashboard/src/api/websocket.js` → `subscribeSurgery(surgeryId)` | Subscribe to surgery updates | — |
| `subscribe_patient` | Sent as JSON: `{ action: 'subscribe_patient', patient_id }` | `doctor-dashboard/src/api/websocket.js` → `subscribePatient(patientId)` | Subscribe to patient updates | — |

**Used by:**
- `doctor-dashboard/src/pages/SurgeryPlanning/SurgeryPlanning.jsx` — connects and subscribes to surgery by ID.
- `doctor-dashboard/src/pages/Debug/Debug.jsx` — WebSocket monitor (connect/disconnect, view messages).

---

## Patient-dashboard and nurse-dashboard

- **Patient-dashboard:** No dedicated API client. Only direct `fetch` in **dev-only** `patient-dashboard/src/pages/Debug/Debug.jsx` to `GET /health` (optional Bearer token). Config: `patient-dashboard/src/api/config.js` (same env vars as above, no `VITE_WS_URL`).
- **Nurse-dashboard:** No API client or `fetch` usage found in the scanned frontend; likely uses mock data or is wired to the same backend in a separate layer.

---

## Summary table (by endpoint)

| Endpoint | Method | Component/File | Purpose | Headers/Auth |
|----------|--------|----------------|---------|--------------|
| `/health` | GET | `patient-dashboard/.../Debug.jsx`, `doctor-dashboard/.../Debug.jsx` | Health check | Optional Bearer (patient); none or Bearer (doctor debug) |
| `/dashboard` | GET | `doctor-dashboard/.../Dashboard.jsx`, `.../Debug.jsx` | Dashboard data; debug auth test | Bearer token |
| `/api/v1/patients` | GET | `api/client.js` → Patients.jsx, Medications.jsx | Patient list | Bearer token |
| `/api/v1/patients/:id` | GET | `api/client.js` → PatientConsultation.jsx | Patient details | Bearer token |
| `/api/v1/consultations/start` | POST | `api/client.js` → PatientConsultation.jsx | Start consultation | Bearer token |
| `/api/v1/consultations` | POST | `api/client.js` → PatientConsultation.jsx | Save consultation | Bearer token |
| `/agent` | POST | `api/client.js` → AIChat.jsx, PatientConsultation.jsx | AI/agent | Bearer token |
| `/api/v1/medications` | GET | `api/client.js` → Medications.jsx | Medications list | Bearer token |
| `/api/v1/surgeries` | GET | `api/client.js` → Surgery.jsx, Schedule.jsx | Surgeries list | Bearer token |
| `/api/v1/surgeries/:id` | GET | `api/client.js` → SurgeryPlanning.jsx | Surgery detail | Bearer token |
| `/api/v1/resources` | GET | `api/client.js` → Resources.jsx, AdminResources.jsx | Resources | Bearer token |
| `/api/v1/schedule` | GET | `api/client.js` → Schedule.jsx | Schedule | Bearer token |
| `/api/v1/reminders/nudge` | POST | `api/client.js` | Nudge reminder | Bearer token |
| `/api/v1/reminders` | POST | `api/client.js` | Schedule reminder | Bearer token |
| `/api/v1/admin/users` | GET | `api/client.js` → AdminUsers.jsx | Admin users | Bearer token |
| `/api/v1/admin/audit` | GET | `api/client.js` → AdminAudit.jsx, Debug.jsx | Audit log | Bearer token |
| `/api/v1/activity` | POST | `api/client.js` → ActivityContext.jsx | Activity log | Bearer token |
| `/api/v1/admin/config` | GET | `api/client.js` → AdminConfig.jsx | System config | Bearer token |
| `/api/v1/admin/config` | PUT | `api/client.js` → AdminConfig.jsx | Update config | Bearer token |
| `/api/v1/admin/analytics` | GET | `api/client.js` → AdminAnalytics.jsx | Analytics | Bearer token |

All paths are relative to `VITE_API_URL`. Fallback legacy paths (e.g. `/patients` instead of `/api/v1/patients`) are implemented in `client.js` where indicated.
