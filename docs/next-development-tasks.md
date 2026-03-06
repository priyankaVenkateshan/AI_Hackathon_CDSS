# Next Development Tasks

Based on [implementation-plan.md](implementation-plan.md) and current codebase status. Phases 1–2 foundation and DB seeding are in place; below is a prioritized list of what to do next.

---

## Immediate (unblock usage and safety)

| Priority | Task | Phase | Description |
|----------|------|--------|-------------|
| 1 | **Patient-scoped RBAC** | 2 | In API router/handlers: for paths with `patientId`, enforce that role `patient` can only access their own id (from JWT). Return 403 for cross-patient access. |
| 2 | **Cognito for Patient/Nurse apps** | 2 | Wire Patient portal and Nurse dashboard to Cognito (same pool or app client); remove mock-only auth so all apps use JWT. |
| 3 | **Router audit → RDS** | 1 | Persist router audit entries to `audit_log` table (in addition to or instead of CloudWatch) for DISHA and admin audit view. |

---

## Phase 3 – Patient Agent and RAG

| Task | Description |
|------|-------------|
| **pgvector and RAG** | Enable pgvector in Aurora; store embeddings for patient history/consultations; Patient Agent “getSummary” / surgery readiness: retrieve chunks, call Bedrock, return in ≤30s. |
| **MCP adapter in agents** | Have Patient/Resource/Scheduling agents call `get_hospital_data` / `get_abdm_record` from the MCP adapter instead of only stub logic. |
| **Single Patient_ID / dedup** | Ensure createPatient and registration flows prevent duplicate patients (e.g. by abha_id or identity match). |

---

## Phase 4 – Surgery and real-time

| Task | Description |
|------|-------------|
| **WebSocket flow** | Implement WebSocket Lambda (beyond placeholder): store connectionId on connect, forward surgical events to connected clients for live checklist/instrument updates. |
| **Real-time procedure support** | Surgery Agent: consume EventBridge/WebSocket events for `provideProcedureGuidance`, `trackSurgicalProgress`; Staff app optional real-time surgery view. |

---

## Phase 5 – Resource Agent and data

| Task | Description |
|------|-------------|
| **Resource Agent + MCP** | Ingest OT/beds/equipment from MCP `get_hospital_data`; keep RDS copy with timestamps; implement `detectConflicts`, `allocateEquipment` using real data. |
| **Staff app – Resources** | OT availability, equipment status, staff list with specialty and status; conflict alerts (reuse existing Resources API and UI). |

---

## Phase 6 – Scheduling and replacement

| Task | Description |
|------|-------------|
| **findReplacement** | Scheduling Agent: when doctor unavailable, identify qualified replacements (specialty, availability); expose via API. |
| **Doctor notifications** | EventBridge/SNS → Lambda → SES (or in-app) to notify replacement doctors and team; log in audit. |
| **OT utilization metrics** | Persist metrics in RDS; Admin analytics view (simple charts/tables from RDS). |

---

## Phase 7 – Engagement and conversation

| Task | Description |
|------|-------------|
| **Transcription and entities** | Engagement Agent: transcribeConversation (Transcribe for voice), extractMedicalEntities (Bedrock), generatePatientSummary; store in RDS/S3. |
| **Medication reminders** | createMedicationReminders, trackAdherence; send via Pinpoint (SMS) and optional voice; escalate to doctor on non-adherence (SNS/SES). |
| **Patient portal** | Conversation summaries, medications, reminder preferences; optional “record conversation” (upload → Transcribe → Engagement Agent). |

---

## Phase 8 – Multilingual

| Task | Description |
|------|-------------|
| **Amazon Translate** | Use for summaries, labels, patient-facing text in major Indian languages. |
| **Cultural and terminology** | Prompt/content guidelines for regional practices; validate Indian drug names/terms (target 90% accuracy). |

---

## Phase 9 – Notifications and alerts

| Task | Description |
|------|-------------|
| **Alert engine** | Severity-based routing; multi-channel escalation until acknowledged; audit trail for every notification and response time. |
| **Clinical triggers** | Drug interaction check → alert prescriber/pharmacist; critical vitals → emergency protocol; surgical complication → immediate alert and suggested interventions. |

---

## Phase 10 – Compliance and hardening

| Task | Description |
|------|-------------|
| **Admin section** | Users/roles (Cognito), audit log search/export, system config (MCP endpoints, feature flags), analytics from RDS. |
| **Testing** | Unit tests for auth, RBAC, agents; integration tests (API, MCP, Bedrock); property-based tests for design properties where feasible. |
| **Performance** | Sub-2s routine APIs; ≤30s summary/readiness; health checks and alarms; 99.5% uptime target. |

---

## Suggested order (next 2–4 weeks)

1. **Patient-scoped RBAC** (1–2 days)  
2. **Router audit → RDS** (0.5 day)  
3. **Cognito for Patient/Nurse apps** (1 day)  
4. **pgvector + RAG for patient summary/readiness** (3–5 days)  
5. **MCP adapter called from agents** (1–2 days)  
6. **WebSocket surgery flow** (2–3 days)  
7. **findReplacement + doctor notifications** (2–3 days)  

Then continue with Phase 7 (engagement/transcription/reminders), Phase 8 (multilingual), Phase 9 (alerts), and Phase 10 (admin compliance and tests).
