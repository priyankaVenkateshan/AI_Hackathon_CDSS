# CDSS Implementation Checklist

**Sources:** [implementation-plan.md](implementation-plan.md), [design.md](design.md)  
**Constraints:** All resources in **ap-south-1** (Mumbai, DISHA); **no DynamoDB** (RDS + S3 only per plan).

---

## Region (ap-south-1)

| Item | Status | Notes |
|------|--------|--------|
| Terraform default region | ✅ Done | `terraform.tfvars`: `aws_region = "ap-south-1"` |
| VPC / subnets / Aurora | ✅ Done | Use `var.aws_region` (a/b AZs) |
| Bedrock IAM policy | ✅ Done | `bedrock.tf` includes `ap-south-1` foundation-model and inference-profile ARNs |
| WebSocket Lambda | ✅ Done | `backend/api/websocket/handler.py`: `AWS_REGION = "ap-south-1"` |
| Backend agents config | ✅ Done | `backend/agents/shared/config.py`: `AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")` |
| **Action** | ⚠️ Verify | Ensure `terraform.tfvars` (or CI) always sets `aws_region = "ap-south-1"`; do not use `us-east-1` for data. |

---

## No DynamoDB (RDS + S3 only)

Per implementation plan §1.4: *"The plan uses **two storage services** (RDS + S3). No DynamoDB in MVP."*

| Item | Status | Notes |
|------|--------|--------|
| Terraform infra | ✅ No DynamoDB | No DynamoDB module or resources in `infrastructure/`; RDS Aurora + S3 only |
| WebSocket handler | ✅ No DynamoDB | `backend/api/websocket/handler.py` is stateless; connectionId not stored (Aurora-only constraint) |
| **backend/agents** | ❌ **Uses DynamoDB** | See “DynamoDB removal” section below |
| **Docs / IAM** | ⚠️ Cleanup | Remove DynamoDB from README, AWS-PERMISSIONS.md, variable descriptions where they imply DynamoDB is used |

### DynamoDB removal (to complete “no DynamoDB”)

| Location | Current use | Required change |
|----------|-------------|------------------|
| `backend/agents/shared/config.py` | `SESSIONS_TABLE`, `MEDICATIONS_TABLE` env vars | Remove or repurpose: sessions → RDS `agent_sessions` (or in-memory per request); medications → RDS `medications` / `reminders` |
| `backend/agents/shared/session_manager.py` | Full DynamoDB session CRUD | Replace with RDS-backed session store (e.g. `agent_sessions` + `conversation` tables in Aurora) or stateless context per request |
| `backend/agents/shared/audit_logger.py` | Writes to RDS + DynamoDB session | Keep only RDS audit; remove `SessionManager` / DynamoDB dependency |
| `backend/agents/supervisor/handler.py` | Comment “DynamoDB + RDS” | Update to “RDS only” and use RDS for session/audit |
| `infrastructure/variables.tf` | `websocket_connections_table_name` (DynamoDB) | Variable is unused (WebSocket uses no table); remove or document “reserved for future RDS table name” |
| `infra/lib/cdss-stack.ts` (CDK) | Creates DynamoDB SessionsTable | If this stack is used, replace with RDS or remove; if unused, delete or mark deprecated |

---

## Phase 1: Foundation and Infrastructure

| Task | Status | Notes |
|------|--------|--------|
| AWS account and region ap-south-1 | ✅ Done | tfvars and Bedrock policy |
| VPC, private subnets, IAM for Lambda/API GW | ✅ Done | vpc.tf, lambda in modules |
| Cognito User Pool + app clients (Staff, Patient) | ✅ Done | auth.tf |
| JWT with role, doctorId/patientId | ✅ Done | Router uses custom:role, patientId |
| RDS PostgreSQL (Aurora) in private subnet | ✅ Done | rds.tf, db subnet group |
| Schema: users link, audit_log, patients, consultations, surgeries, resources, schedules, medication_schedules, agent_sessions, etc. | ✅ Done | src/cdss/db/models.py, migrations |
| pgvector extension | ⬜ Todo | Enable in Aurora after first apply: `CREATE EXTENSION IF NOT EXISTS vector;` |
| Secrets Manager for DB (and Bedrock) | ✅ Done | secrets.tf |
| API Gateway REST: /api/v1, Lambda proxy | ✅ Done | api_gateway.tf → CDSS router Lambda |
| API Gateway WebSocket: connect, disconnect, default | ✅ Done | web_socket_api.tf, backend/api/websocket |
| Lambda router/gateway → Supervisor or direct routes | ✅ Done | Router dispatches to patient, surgery, resource, scheduling, engagement, admin |
| Lambda authorizer (Cognito) | ✅ Done | api_require_cognito, cognito authorizer |
| Audit every request to RDS audit table | ✅ Done | Router _audit_log → cdss.db AuditLog |

**Phase 1 deliverable:** ✅ Cognito, RDS, REST + WebSocket, authorizer, audit logging in place.

---

## Phase 2: Staff and Patient Web Apps (Shells) and RBAC

| Task | Status | Notes |
|------|--------|--------|
| Staff web app (React, e.g. Vite + React Router) | ✅ Done | doctor-dashboard, nurse-dashboard |
| Login via Cognito; JWT role → doctor/nurse/admin → Staff app | ⚠️ Partial | Doctor dashboard has Cognito; nurse may need same pool |
| Shell: Doctor (dashboard, patients, surgery, scheduling, resources), Admin (Users, Audit, Config, Analytics) | ✅ Done | Pages present in doctor-dashboard |
| Patient portal (React) | ✅ Done | patient-dashboard |
| Login via Cognito; role === patient → Patient portal only | ⚠️ Partial | Wire patient app to Cognito (next-development-tasks) |
| Shell: My history, Summaries, Medications, Reminders | ✅ Done | MyRecords, MyMedications, Dashboard, etc. |
| RBAC in API: resolve user from JWT, check role and patientId | ✅ Done | Router: admin paths, patient-scoped v1/patients |
| 403 for cross-patient or admin-only | ✅ Done | Router returns 403 for patient listing all / wrong patientId |

**Phase 2 deliverable:** ✅ Staff and Patient apps exist; RBAC enforced; ⬜ ensure Cognito used by all three apps (doctor, nurse, patient).

---

## Phase 3: MCP Adapter and Patient Agent (with RAG)

| Task | Status | Notes |
|------|--------|--------|
| MCP adapter layer (Lambda or module) | ⚠️ Stub | getHospitalData, getABDMRecord stubbed or partial |
| Patient data model in RDS (PatientRecord, design.md) | ✅ Done | patients, visits, surgeries in models.py |
| Patient Agent: createPatient, getPatientHistory, updateRecord, assessSurgeryReadiness | ✅ Done | src/cdss/api/handlers/patient.py |
| Single Patient_ID, no duplicates (Property 2) | ⚠️ Partial | Enforce in createPatient (e.g. abha_id) |
| RAG: embeddings in RDS pgvector, chunk history, Bedrock summary/readiness ≤30s | ⬜ Todo | pgvector + RAG pipeline |
| Staff app: Patient list/detail, history, summary, surgery readiness | ✅ Done | Patients, PatientPortal* pages |
| Patient portal: own history and summaries | ✅ Done | MyRecords, etc.; backend enforces patientId |

**Phase 3 deliverable:** ⚠️ MCP stubbed; RAG and pgvector not yet done.

---

## Phase 4: Surgery Agent and Surgical Workflow

| Task | Status | Notes |
|------|--------|--------|
| Surgery data model in RDS (Surgery, SurgeryRequirements, design.md) | ✅ Done | surgeries table, checklist/requirements JSONB |
| Surgery Agent: classifySurgery, determineRequirements, generateChecklist | ✅ Done | surgery handler |
| Real-time: provideProcedureGuidance, trackSurgicalProgress (EventBridge/WebSocket) | ⚠️ Partial | WebSocket exists; EventBridge integration partial |
| Supervisor routes surgery intents to Surgery Agent | ✅ Done | Router v1/surgeries → surgery handler |
| Staff app: Surgery planning UI, checklist, optional real-time view | ✅ Done | SurgeryPlanning, Surgery pages |
| WebSocket: forward surgical events to connected clients | ⚠️ Partial | Handler echoes checklist_update; no connectionId store (Aurora-only) |

**Phase 4 deliverable:** ✅ Surgery Agent and planning UI; ⬜ full real-time flow and optional RDS table for connectionIds if needed.

---

## Phase 5: Resource Agent and Real-Time Resource Tracking

| Task | Status | Notes |
|------|--------|--------|
| Resource data model in RDS (HospitalResource, staff, equipment, OT) | ✅ Done | resources, schedule_slots |
| Resource Agent: getStaffAvailability, getEquipmentStatus, getOTAvailability, detectConflicts, allocateEquipment | ✅ Done | resource handler |
| Ingest from MCP (Hospital Systems) for OT/beds; local RDS copy | ⚠️ Stub | MCP adapter to be wired |
| Staff app: OT availability, equipment status, staff list, conflict alerts | ✅ Done | Resources page |

**Phase 5 deliverable:** ✅ Resource Agent and UI; ⬜ live MCP ingestion.

---

## Phase 6: Scheduling Agent and Doctor Replacement

| Task | Status | Notes |
|------|--------|--------|
| optimizeSchedule, findReplacement, balanceWorkload, prioritizeEmergencies | ⚠️ Partial | scheduling handler exists; findReplacement and notifications to complete |
| Scheduling Agent: bookSlot, resolveConflict; use Resource Agent | ✅ Done | scheduling handler |
| EventBridge/SNS → notify replacement doctors; audit | ⬜ Todo | Notifications pipeline |
| Staff app: OT booking, schedule view, replacement suggestions | ✅ Done | Schedule page; replacement flow to wire |
| OT utilization metrics in RDS; Admin analytics | ⬜ Todo | Persist metrics, AdminAnalytics from RDS |

**Phase 6 deliverable:** ⚠️ Booking and conflict resolution in place; ⬜ findReplacement + notifications + utilization metrics.

---

## Phase 7: Patient Engagement Agent and Conversation Intelligence

| Task | Status | Notes |
|------|--------|--------|
| ConversationRecord, transcripts, entities, medication_schedules, reminder_log in RDS (and S3 if needed) | ✅ Done | visits, medications, reminders models |
| Engagement Agent: transcribeConversation, extractMedicalEntities, generatePatientSummary, createMedicationReminders, trackAdherence | ⚠️ Partial | engagement handler; Transcribe/Bedrock/Pinpoint to wire |
| Reminders via Pinpoint (SMS/voice); escalate to doctor on non-adherence | ⬜ Todo | Pinpoint/SNS/SES integration |
| Patient portal: summaries, medications, reminder preferences; optional record conversation | ✅ Done | UI shells; backend engagement to complete |
| Staff app: trigger summary, adherence reports, escalation config | ⚠️ Partial | Pages exist; backend to complete |

**Phase 7 deliverable:** ⬜ Full transcription, entities, reminders, and escalation pipeline.

---

## Phase 8: Multilingual and India-First Localization

| Task | Status | Notes |
|------|--------|--------|
| Amazon Translate for summaries, labels, patient-facing text | ⬜ Todo | |
| Prescription labels and education in multiple languages | ⬜ Todo | |
| Transcribe (speech-to-text); optional synthesis for voice reminders | ⬜ Todo | |
| Cultural adaptation and prompt guidelines (Properties 11, 21) | ⬜ Todo | |
| Indian drug names/terms validation (target 90%) | ⬜ Todo | |

**Phase 8 deliverable:** ⬜ Not started.

---

## Phase 9: Notifications and Emergency Response

| Task | Status | Notes |
|------|--------|--------|
| Alert engine: severity-based routing, multi-channel escalation, audit (Properties 14, 15) | ⬜ Todo | |
| Drug interaction check → alert prescriber/pharmacist | ⬜ Todo | |
| Critical vitals → emergency protocol | ⬜ Todo | |
| Surgical complication → immediate alert and interventions | ⬜ Todo | |
| Maintenance advance notice and alternative access | ⬜ Todo | |

**Phase 9 deliverable:** ⬜ Not started.

---

## Phase 10: Admin Section, Compliance, and Hardening

| Task | Status | Notes |
|------|--------|--------|
| Admin: Users and roles (Cognito + RDS) | ✅ Done | AdminUsers, Cognito list |
| Admin: Audit log searchable table, export for DISHA | ✅ Done | AdminAudit, audit_log in RDS |
| Admin: System config (MCP endpoints, feature flags) | ✅ Done | AdminConfig |
| Admin: Analytics (OT utilization, agent usage, reminders) from RDS | ⚠️ Partial | AdminAnalytics placeholder; wire to RDS |
| Data protection: encryption at rest/transit, ap-south-1, RBAC, audit | ✅ Done | Aurora encrypted; API RBAC and audit |
| Performance: sub-2s routine APIs, ≤30s summary/readiness; health checks and alarms | ⬜ Todo | Tuning and CloudWatch |
| Testing: unit (auth, RBAC, agents), integration (API, MCP, Bedrock), property-based where feasible | ⬜ Todo | |
| Documentation and regulatory prep | ⚠️ Partial | design.md, implementation-plan.md, this checklist |

**Phase 10 deliverable:** ✅ Admin section largely done; ⬜ analytics from RDS, performance, tests, docs.

---

## AgentCore (AC-1) – Runtime, Gateway, CDSS PoC Agent, Tracing

Per [agentcore-implementation-plan.md](agentcore-implementation-plan.md) and [agentcore-next-steps-implementation.md](agentcore-next-steps-implementation.md).

| Task | Status | Notes |
|------|--------|--------|
| Terraform: use_agentcore, agent_runtime_arn, AgentCore IAM | ✅ Done | variables.tf, bedrock.tf, main.tf |
| Gateway Lambda (get_hospitals, get_ot_status, get_abdm_record stub) | ✅ Done | infrastructure/agentcore_gateway.tf, gateway_tools_src/lambda_handler.py |
| Output gateway_get_hospitals_lambda_arn | ✅ Done | outputs.tf |
| scripts/setup_agentcore_gateway.py | ✅ Done | Creates Gateway + target; writes gateway_config.json |
| CDSS endpoints can call AgentCore when USE_AGENTCORE + AGENT_RUNTIME_ARN are set (with local fallback) | ✅ Done | router/supervisor wiring; CloudWatch logs source=agentcore\|local, duration_ms= |
| agentcore/ README + agent placeholder | ✅ Done | agentcore/README.md, agentcore/agent/README.md |
| Gateway created (script run) | ✅ Done | gateway_config.json; add Lambda target in Console per agentcore-gateway-manual-steps.md |
| Deploy CDSS AgentCore runtime → set agent_runtime_arn in tfvars | ⬜ Manual | Run agentcore deploy from agentcore/agent/; then terraform apply |
| Run setup_agentcore_gateway.py after terraform apply | ⬜ Manual | Uses gateway_get_hospitals_lambda_arn |

---

## Design Correctness Properties (design.md)

| Property | Summary | Status |
|----------|---------|--------|
| 1 | RBAC enforcement | ✅ Router + handlers |
| 2 | Patient identity and record uniqueness | ⚠️ Enforce in createPatient |
| 3 | Medical data persistence | ✅ RDS models and audit |
| 4 | Surgery classification and requirements | ✅ Surgery Agent |
| 5 | Real-time surgical procedural support | ⚠️ WebSocket + EventBridge partial |
| 6 | Real-time resource tracking and conflicts | ✅ Resource Agent |
| 7 | Intelligent scheduling optimization | ⚠️ Scheduling partial |
| 8 | Automatic specialist replacement | ⬜ findReplacement + notifications |
| 9 | Medical conversation intelligence | ⬜ Engagement pipeline |
| 10 | Medication adherence management | ⬜ Reminders and escalation |
| 11 | Multilingual support | ⬜ Phase 8 |
| 12 | MCP agent coordination | ⚠️ EventBridge in place; agents to use it fully |
| 13 | Secure agent communication | ⚠️ Depends on removing DynamoDB and hardening |
| 14–15 | Alert and maintenance management | ⬜ Phase 9 |
| 16 | AWS/Bedrock integration | ✅ Bedrock in use |
| 17 | Scalability and flexibility | ✅ Serverless + Aurora |
| 18 | Data protection and compliance | ✅ ap-south-1, encryption, RBAC, audit |
| 19 | Performance and reliability | ⬜ Tuning and SLA |
| 20 | Clinical assessment generation | ✅ Surgery readiness in Patient Agent |
| 21 | Multilingual patient data | ⬜ Phase 8 |
| 22 | Complete activity audit trails | ✅ audit_log in RDS |
| 23 | Multilingual content generation | ⬜ Phase 8 |
| 24 | Surgery assessment and blueprint | ✅ Surgery Agent |
| 25 | Inventory and equipment management | ✅ Resource Agent |

---

## Summary

| Area | Done | To complete |
|------|------|-------------|
| **Region** | ap-south-1 in tfvars, Bedrock, WebSocket, agents config | Keep tfvars and docs consistent |
| **No DynamoDB** | Terraform and WebSocket use no DynamoDB | Migrate backend/agents session + audit to RDS only; remove DynamoDB from config/docs |
| **Phase 1** | Cognito, RDS, REST + WebSocket, audit | pgvector in Aurora |
| **Phase 2** | Staff/Patient apps, RBAC in API | Cognito for all three apps |
| **Phase 3** | Patient Agent, MCP stub, UI | RAG/pgvector, MCP live, single Patient_ID |
| **Phase 4** | Surgery Agent, WebSocket, planning UI | Real-time flow and optional connectionId store in RDS |
| **Phase 5** | Resource Agent and UI | MCP ingestion for OT/beds |
| **Phase 6** | Scheduling and booking | findReplacement, notifications, OT metrics |
| **Phase 7** | Engagement handler and UI shells | Transcription, entities, reminders, Pinpoint/SNS |
| **Phase 8** | — | Translate, multilingual, cultural/terminology |
| **Phase 9** | — | Alert engine, clinical triggers, maintenance |
| **Phase 10** | Admin users/audit/config | Analytics from RDS, performance, tests, docs |
| **AgentCore AC-1** | Runtime + Gateway + /hospitals + tracing | See [agentcore-next-steps-implementation.md](agentcore-next-steps-implementation.md) |

Use this checklist for sprint planning and to ensure every deployment stays **ap-south-1** and **DynamoDB-free**.
