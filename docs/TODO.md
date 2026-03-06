# CDSS Development Todo List

Aligned with [requirements.md](requirements.md), [design.md](design.md), [implementation-plan.md](implementation-plan.md), [agentcore-implementation-plan.md](agentcore-implementation-plan.md), and project rules (python-standards, project-conventions).

**Scope note:** The **Patient_Module** is a **web Patient dashboard** (responsive portal). There is no native mobile app; patients use the browser (including on mobile). Staff use the **Doctor_Module** (Staff web app: Doctor + Admin); nurses use the Nurse dashboard (web).

---

## Standards to apply throughout

- **Security:** IAM & Secrets Manager only; no long-lived credentials or hardcoded keys. Never log raw Patient_ID/Doctor_ID/ABHA with clinical content.
- **RBAC:** Doctor_Module = full clinical access; Patient_Module = own data only; enforce in API and audit.
- **Python:** Type hints, PEP 8, Black/ruff; explicit error handling (no bare `except`); docstrings for public APIs and clinical intent.
- **Clinical safety:** AI is doctor-in-the-loop; Pydantic/strict schemas for agent outputs; safety disclaimers on patient-facing AI content; escalate to human when confidence is low.
- **Audit:** Log who, what, when, which patient/record for all clinically relevant actions (Req 1.4, 1.5; design Property 22).
- **India:** Data in ap-south-1; encryption at rest and in transit; design for DISHA/localization.

---

## 1. RBAC and auth (Req 1; design RBAC)

- [ ] **Patient-scoped RBAC in API**  
  For paths that include `patientId`, resolve identity from JWT and enforce: role `patient` may only access their own `patientId`. Return 403 for cross-patient or admin-only access. *(Req 1.2, 1.6)*

- [ ] **Router audit → RDS**  
  Persist each authenticated request to `audit_log` (user_id, action, resource, timestamp) in addition to or instead of CloudWatch, so Admin audit view and DISHA use one source. *(Req 1.4, 1.5)*

- [ ] **Cognito for Patient and Nurse dashboards**  
  Wire Patient dashboard and Nurse dashboard to Cognito (same pool or app clients); use JWT for all API calls. Remove mock-only auth so role-based redirect (Staff vs Patient) works end-to-end. *(Req 1.3, 1.7)*

- [ ] **Post-login redirect by role**  
  After login, redirect Doctor/Nurse/Admin → Staff app, Patient → Patient dashboard; ensure Patient cannot reach Staff app or Admin routes. *(Req 1.3)*

---

## 2. Patient Agent and data (Req 2; design Patient Agent)

- [ ] **Single Patient_ID and deduplication**  
  On registration/createPatient, create or retrieve unique Patient_ID; prevent duplicates (e.g. by abha_id or identity match). *(Req 2.1, 2.7; design Property 2)*

- [ ] **pgvector and RAG for summaries**  
  Enable pgvector in Aurora; store embeddings for patient history/consultations; Patient Agent getSummary / surgery readiness: retrieve relevant chunks, call Bedrock, return structured summary in ≤30s. *(Req 2.5; design Property 19)*

- [ ] **MCP adapter used by agents**  
  Have Patient (and Resource/Scheduling) agents call `get_hospital_data` / `get_abdm_record` from the MCP adapter where applicable; replace stub-only logic. *(Req 8; implementation-plan Phase 3)*

- [ ] **Patient dashboard – My history**  
  Patient dashboard shows own history and summaries via same backend; all endpoints enforce patient-scoped RBAC. *(Req 1.2; design Patient Module)*

- [ ] **Multilingual patient data**  
  Patient Agent supports Hindi, English, and regional languages for data and summaries; validate and normalize per design Property 21. *(Req 2.6)*

---

## 3. Surgery Agent and workflow (Req 3; design Surgery Agent)

- [ ] **Surgery classification and requirements**  
  Surgery Agent: classifySurgery, determineRequirements, generateChecklist with clinical guardrails and risk flags; store in RDS. *(Req 3.1–3.5; design Properties 4, 24)*

- [ ] **WebSocket for real-time surgical support**  
  WebSocket Lambda: store connectionId on connect; forward surgical events (instruments, steps, complications) to connected clients. *(Req 3.6, 3.7; design Property 5)*

- [ ] **Real-time procedure guidance**  
  Surgery Agent: provideProcedureGuidance, trackSurgicalProgress; consume EventBridge or WebSocket events; Staff app optional real-time surgery view. *(Req 3.6, 3.7)*

---

## 4. Resource Agent (Req 4; design Resource Agent)

- [ ] **Resource Agent + MCP**  
  Ingest OT/beds/equipment from MCP `get_hospital_data`; keep RDS copy with timestamps; implement getStaffAvailability, getEquipmentStatus, detectConflicts, allocateEquipment. *(Req 4.1–4.7; design Property 6)*

- [ ] **Staff app – Resources view**  
  OT availability, equipment status, staff list with specialty and status; conflict alerts. *(Req 4; implementation-plan Phase 5)*

---

## 5. Scheduling Agent (Req 5; design Scheduling Agent)

- [ ] **findReplacement**  
  When doctor unavailable, Scheduling Agent identifies qualified replacements (specialty, availability); expose via API; log in audit. *(Req 5.5, 5.6; design Property 8)*

- [ ] **Doctor and team notifications**  
  EventBridge/SNS → Lambda → SES (or in-app) to notify replacement doctors and team; audit trail for notifications. *(Req 5.6)*

- [ ] **OT utilization metrics**  
  Persist metrics in RDS; Admin analytics view (simple charts/tables). *(Req 5.7)*

---

## 6. Patient Engagement Agent (Req 6; design Patient Engagement)

- [ ] **Transcription and entity extraction**  
  Engagement Agent: transcribeConversation (Transcribe for voice), extractMedicalEntities (Bedrock), generatePatientSummary; store in RDS/S3. *(Req 6.1–6.3; design Properties 9, 10)*

- [ ] **Medication reminders and adherence**  
  createMedicationReminders, trackAdherence; send via Pinpoint (SMS) and optional voice; escalate to doctor on non-adherence. *(Req 6.4–6.7)*

- [ ] **Patient dashboard – summaries and reminders**  
  Patient dashboard: view conversation summaries, medications, reminder preferences; optional “record conversation” (upload → Transcribe → Engagement Agent). *(Req 1.2; design Patient Module)*

---

## 7. MCP and multi-agent (Req 8; design MCP)

- [ ] **MCP event logs and audit**  
  Maintain event logs of inter-agent communications; ensure agent communication does not compromise patient data privacy; handle failures with fallbacks. *(Req 8.4, 8.5, 8.6)*

- [ ] **Monitoring and alerting for agent health**  
  Monitoring and alerting for agent communication health and performance. *(Req 8.7)*

---

## 8. Notifications and emergency (Req 9)

- [ ] **Alert engine**  
  Severity-based routing; multi-channel escalation until acknowledged; audit trail for every notification and response time. *(Req 9.1, 9.6, 9.7)*

- [ ] **Clinical triggers**  
  Drug interaction → alert prescriber/pharmacist; critical vitals → emergency protocol; surgical complication → immediate alert and suggested interventions. *(Req 9.2–9.4)*

---

## 9. Multilingual and India-first (Req 7)

- [ ] **Amazon Translate**  
  Summaries, labels, patient-facing text in major Indian languages. *(Req 7.1, 7.2, 7.6)*

- [ ] **Cultural adaptation and terminology**  
  Prompt/content guidelines for regional practices; validate Indian drug names/terms (target 90% accuracy). *(Req 7.5, 7.7)*

---

## 10. AWS, compliance, hardening (Req 10)

- [ ] **Admin section**  
  Users/roles (Cognito), audit log search/export for DISHA, system config (MCP endpoints, feature flags), analytics from RDS. *(implementation-plan Phase 10)*

- [ ] **Performance and reliability**  
  Sub-2s routine APIs; ≤30s summary/readiness; health checks and alarms; 99.5% uptime target. *(Req 10.10)*

- [ ] **Testing**  
  Unit tests for auth, RBAC, agents; integration tests (API, MCP, Bedrock); property-based tests for design correctness properties where feasible (design Testing Strategy). *(project-conventions)*

---

## 11. AgentCore migration (agentcore-implementation-plan.md)

-- [ ] **AC-1: Runtime + Gateway + CDSS PoC agent**
  AgentCore Runtime workspace; Gateway (Lambda/synthetic tool); a CDSS PoC endpoint invokes AgentCore when `USE_AGENTCORE=true`; local/Converse fallback; basic tracing (e.g. CloudWatch: source=agentcore\|local, duration_ms). *(AgentCore Phase AC-1)*

- [ ] **AC-2: Triage + Observability**  
  Triage agent on AgentCore Runtime; full trace observability; trace review for Admin/Dev (medical audit); link traces to Patient_ID, Doctor_ID. *(AgentCore Phase AC-2; CDSS.mdc trace review)*

- [ ] **AC-3: Memory + Hospital MCP**  
  AgentCore Memory (short-term + long-term) for patient context; Gateway: Hospital Data MCP as tool source; Patient context across flows. *(Req 8 MCP; AgentCore Phase AC-3)*

- [ ] **AC-4: Routing + Identity**  
  Routing agent on AgentCore; AgentCore Identity (Cognito/IdP) for Doctor_Module and Patient_Module (Req 1 RBAC). *(AgentCore Phase AC-4)*

- [ ] **CDSS agents on AgentCore**  
  When AC-1 path is stable, migrate CDSS agents (Patient, Surgery, Resource, Scheduling, Engagement) to AgentCore; use strict assessment schemas (priority, confidence, risk_factors, surgery readiness) and safety disclaimers per CDSS.mdc. *(design; project-conventions)*

---

## 12. Python and code quality (python-standards, project-conventions)

- [ ] **Type hints and models**  
  Use type hints throughout; reference design data models (PatientRecord, Surgery, HospitalResource, ConversationRecord) or Pydantic equivalents instead of loose `dict` where appropriate.

- [ ] **Error handling**  
  No bare `except`; use explicit exception types (e.g. ClinicalRuleViolation, DataIntegrityError); map to HTTP/MCP responses; log with context (no PHI).

- [ ] **Docstrings**  
  Public functions, classes, and MCP tool handlers: docstrings with clinical intent and side-effects.

- [ ] **Format and lint**  
  Black (line length 100), ruff; consistent imports (stdlib → third-party → local).

---

## Suggested order (next 2–4 weeks)

1. Patient-scoped RBAC (Req 1.2, 1.6)  
2. Router audit → RDS (Req 1.4, 1.5)  
3. Cognito for Patient and Nurse dashboards (Req 1.3, 1.7)  
4. pgvector + RAG for patient summary/readiness (Req 2.5)  
5. MCP adapter called from agents (Req 8)  
6. WebSocket surgery flow (Req 3.6, 3.7)  
7. findReplacement + doctor notifications (Req 5.5, 5.6)  
8. AgentCore AC-1 (Runtime + Gateway + CDSS PoC agent + tracing)

Then: Engagement (transcription, reminders), Multilingual, Alerts, Admin compliance, and AgentCore AC-2–AC-4.
