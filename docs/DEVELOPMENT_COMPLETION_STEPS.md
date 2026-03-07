# CDSS Development & Completion Steps

This document consolidates [PROJECT_STATUS.md](PROJECT_STATUS.md), [requirements.md](requirements.md), and [PROJECT_REFERENCE.md](PROJECT_REFERENCE.md) into a single, actionable development and completion plan for the Clinical Decision Support System.

---

## 1. Current State Summary


| Area                                 | Status    | Notes                                                      |
| ------------------------------------ | --------- | ---------------------------------------------------------- |
| **5-Agent Architecture**             | ✅ Done    | Patient, Surgery, Resource, Scheduling, Engagement         |
| **Orchestrator & Prompts**           | ✅ Done    | `agentcore/agent/cdssagent/src/main.py`                    |
| **11 Clinical Tools (Lambda)**       | ✅ Done    | `infrastructure/gateway_tools_src/lambda_handler.py`       |
| **Pydantic Validation & Escalation** | ✅ Done    | Confidence < 0.85 → Senior Review                          |
| **RDS Schema & Audit**               | ✅ Done    | Patients, Surgeries, Shifts, Reminders, EventLog, AlertLog |
| **Frontend Base**                    | ✅ Done    | Doctor, Nurse, Patient dashboards in `frontend/apps`       |
| **Model Access & IAM**               | ⏳ Pending | Claude 3 Haiku + BedrockFullAccess on SDK Runtime          |
| **Real MCP / ABDM**                  | ⏳ Pending | Replace stubs with live hospital/ABDM connections          |
| **Frontend ↔ API**                   | ⏳ Pending | Verify React/Vite → AgentCore API connectivity             |
| **RBAC (Cognito)**                   | ⏳ Pending | Doctor vs Patient module access enforcement                |
| **Medical Audit Dashboard**          | ⏳ Pending | Trace review for clinical audit                            |
| **Multilingual**                     | ⏳ Pending | Hindi/regional expansion for agent responses               |


---

## 2. Requirements-to-Implementation Map


| Req     | Description                                  | Implementation                                                            | Status                                               |
| ------- | -------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| **R1**  | Role-Based Access (Doctor vs Patient)        | Cognito + module redirect + Doctor_ID/Patient_ID history                  | Partial (logic present; Cognito not finalized)       |
| **R2**  | Comprehensive Patient Management             | Patient Agent + RDS + ABHA + summaries/readiness                          | Partial (ABDM integration stubbed)                   |
| **R3**  | Surgical Workflow                            | Surgery Agent + tools (classification, checklists, blueprints)            | ✅ Implemented                                        |
| **R4**  | Real-Time Resource Optimization              | Resource Agent + OT/staff/equipment tools                                 | ✅ Implemented                                        |
| **R5**  | Scheduling & Doctor Replacement              | Scheduling Agent + booking/replacement tools                              | ✅ Implemented                                        |
| **R6**  | Patient Engagement & Conversation Analysis   | Engagement Agent + reminders/transcription/summaries                      | ✅ Implemented                                        |
| **R7**  | Multilingual & Cultural Adaptation           | Translation, regional languages, terminology                              | ⏳ Roadmap (Priority 2)                               |
| **R8**  | MCP Communication & Coordination             | AgentCore + event logs, context sharing                                   | ✅ Implemented (real MCP to external systems pending) |
| **R9**  | Real-Time Notifications & Emergency Response | Alert engine, drug interaction alerts, escalation                         | Partial (DB/engine in place; channels to be wired)   |
| **R10** | AWS Integration & Scalability                | Bedrock, MCP, multi-hospital, data localization, encryption, RBAC, uptime | Partial (core AWS in place; hardening pending)       |


---

## 3. Complete Development & Completion Steps

### Phase 1: Unblock Core Runtime (Priority 1 – Technical)


| Step | Action                                                                                                                                                                 | Owner        | Verification                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------- |
| 1.1  | **Enable Claude 3 Haiku** in AWS Bedrock console (ap-south-1) for tool-use stability                                                                                   | DevOps/Admin | Invoke model from Bedrock; confirm tool calls work |
| 1.2  | **Attach `AmazonBedrockFullAccess`** to execution role `AmazonBedrockAgentCoreSDKRuntime-ap-south-1-6eac3e734d`                                                        | DevOps/Admin | Deploy AgentCore; run end-to-end agent flow        |
| 1.3  | Run **local API** (`python scripts/run_api_local.py`) and **POST /api/v1/agent** with a sample payload; confirm orchestrator routes to correct agent and tools execute | Dev          | Response contains agent reply and tool results     |
| 1.4  | **Deploy Gateway Lambda** with latest `lambda_handler.py`; register tools with AgentCore per `agentcore-gateway-manual-steps.md`                                       | DevOps/Dev   | Agent can call real tools in AWS                   |


### Phase 2: Real Integrations (Priority 1 – Technical)


| Step | Action                                                                                                                        | Owner      | Verification                                        |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| 2.1  | **Define MCP contract** for each external system (hospital HIS, ABDM, etc.): endpoints, auth, payloads                        | Arch/Dev   | Document in api_reference or design.md              |
| 2.2  | **Implement or adopt MCP clients/servers** that call real hospital/ABDM APIs instead of stubs                                 | Dev        | Unit/integration tests with mock or sandbox         |
| 2.3  | **Wire Patient Agent** to real ABDM (or sandbox) for patient identity and history where applicable                            | Dev        | Patient summary includes real ABDM data in test env |
| 2.4  | **Wire Resource/Scheduling Agents** to real or simulated OT/staff/equipment data sources                                      | Dev        | Availability and conflict checks use live data      |
| 2.5  | **Secrets & config**: Ensure all external URLs and credentials come from **AWS Secrets Manager / IAM** only (no .env secrets) | DevOps/Dev | Security review; no hardcoded keys                  |


### Phase 3: Frontend & UX (Priority 2)


| Step | Action                                                                                                                                    | Owner | Verification                                          |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----- | ----------------------------------------------------- |
| 3.1  | **Verify frontend → API**: Point React/Vite app at AgentCore API (local or deployed); confirm CORS and auth headers                       | Dev   | Dashboard can send request and display agent response |
| 3.2  | **Doctor Module**: List patients, trigger Patient/Surgery/Resource/Scheduling flows, show summaries and audit context                     | Dev   | Acceptance criteria for R1, R2, R3, R4, R5            |
| 3.3  | **Patient Module**: Restrict to single Patient_ID; show own history, reminders, engagement summary only                                   | Dev   | R1 acceptance: patient cannot access other records    |
| 3.4  | **Multilingual support**: Expand agent responses (and UI labels) to Hindi + at least one regional language; use approved terminology list | Dev   | R7 acceptance: translation and terminology checks     |
| 3.5  | **Safety disclaimers**: All patient-facing AI summaries and educational content include required disclaimers (per project conventions)    | Dev   | Review checklist; no unbranded medical advice         |


### Phase 4: Safety & Compliance (Priority 3)


| Step | Action                                                                                                                                           | Owner      | Verification                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | -------------------------------------------- |
| 4.1  | **Medical audit dashboard**: Implement trace review UI (query AgentEventLog, filter by patient/doctor/time); export for audit                    | Dev        | Auditor can trace a request end-to-end       |
| 4.2  | **RBAC enforcement**: Finalize Cognito (or IdP) groups for Doctor vs Patient; enforce at API Gateway and in backend (reject cross-tenant access) | DevOps/Dev | R1: role-based redirect and access tests     |
| 4.3  | **Audit trails**: Confirm every clinically relevant action writes to RDS with who, what, when, which patient/record                              | Dev        | Audit log coverage review                    |
| 4.4  | **Data localization**: Confirm RDS, S3, and any PII stay in **ap-south-1** (or approved India regions); document in compliance doc               | DevOps     | Architecture review; no PII in other regions |
| 4.5  | **Encryption**: Verify encryption at rest and in transit for all patient data (RDS, S3, API)                                                     | DevOps     | Config review; TLS and KMS in place          |


### Phase 5: Notifications & Alerts (R9)


| Step | Action                                                                                                                                             | Owner | Verification                                        |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | --------------------------------------------------- |
| 5.1  | **Drug interaction alerts**: When detected, alert prescribing physician/pharmacist before administration (tool or pipeline step)                   | Dev   | Test case: interaction triggers alert and is logged |
| 5.2  | **Emergency protocols**: Define triggers (e.g., vitals thresholds, surgical complication flags) and wire to alert engine and notification channels | Dev   | Runbook + test for one emergency path               |
| 5.3  | **Escalation channels**: Implement multi-channel escalation (e.g., in-app + SMS/email) until acknowledgment; log response times                    | Dev   | R9: escalation and audit trail tests                |
| 5.4  | **Maintenance notifications**: Notify users in advance of maintenance; document alternative access if needed                                       | Ops   | Runbook updated                                     |


### Phase 6: Quality, Performance & Compliance (R10)


| Step | Action                                                                                                                                                                | Owner            | Verification                               |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------ |
| 6.1  | **Property-based / critical-path tests**: Add tests for safety-critical flows (scheduling surgery, drug interactions, emergency alerts) referencing design properties | Dev              | CI runs tests; coverage for critical paths |
| 6.2  | **RBAC boundary tests**: Explicit tests that Patient module cannot access other patients’ data or admin functions                                                     | Dev              | Automated test suite                       |
| 6.3  | **Performance**: Measure and tune so routine queries meet **sub-2-second** target; document bottlenecks                                                               | Dev/Perf         | Load test report                           |
| 6.4  | **Uptime target**: Define SLO (99.5%) and monitoring (alarms, runbooks); deploy in ap-south-1                                                                         | DevOps           | Dashboard and alerting in place            |
| 6.5  | **Regulatory & liability**: Keep doctor-in-the-loop design; maintain docs and audit trails for CDSCO/regulatory submission (see requirements.md Challenges 1–2)       | Legal/Compliance | Checklist and doc ownership                |


### Phase 7: Documentation & Handover


| Step | Action                                                                                                                              | Owner  | Verification                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------ |
| 7.1  | Keep **PROJECT_REFERENCE.md** as single source for IDs, ARNs, endpoints; update when config changes                                 | Dev    | Review on each release         |
| 7.2  | Update **api_reference.md** with any new endpoints or MCP contracts                                                                 | Dev    | All public APIs documented     |
| 7.3  | **Runbooks**: Deploy, scale, incident response, and rollback for AgentCore + Lambda + RDS                                           | DevOps | Ops team sign-off              |
| 7.4  | **Onboarding**: New developer can run local API + frontend and execute one full agent flow using PROJECT_STATUS + PROJECT_REFERENCE | Dev    | Onboarding checklist completed |


---

## 3.5 Master TODO & Verification Checklist

**How to use:** Work through each phase in order. For every item, perform the **Verify** step and confirm it passes before checking the box. This ensures completed steps are working properly.

### Phase 1: Unblock Core Runtime

- **1.1** Enable Claude 3 Haiku in Bedrock (ap-south-1)  
  - **Verify:** In AWS Console → Bedrock → Model access, confirm Claude 3 Haiku is enabled. Invoke the model (e.g. via AWS CLI or a small script); run a tool-use request and confirm tool calls are returned.
- **1.2** Attach `AmazonBedrockFullAccess` to role `AmazonBedrockAgentCoreSDKRuntime-ap-south-1-6eac3e734d`  
  - **Verify:** Deploy or invoke the AgentCore runtime; run one full agent conversation and confirm no permission errors and response is returned.
- **1.3** Run local API and test agent endpoint  
  - **Verify:** Run `python scripts/run_api_local.py`, then `POST http://localhost:8080/api/v1/agent` with a valid payload (e.g. patient summary request). Confirm 200 response, agent reply in body, and tool results (or tool-invocation evidence) in response/traces.
- **1.4** Deploy Gateway Lambda and register tools with AgentCore  
  - **Verify:** Deploy latest `lambda_handler.py`; in AgentCore config, confirm all 11 tools are registered. Send a request that triggers at least one tool (e.g. get_patient_summary); confirm Lambda is invoked (CloudWatch) and agent response includes real tool output.

**Phase 1 verification scripts (run from repo root):**
- **1.1** From **repo root**: `AWS_REGION=ap-south-1 python scripts/verify_bedrock_haiku_tool_use.py` — Confirms Claude 3 Haiku is enabled and returns tool-use. (PowerShell: `cd D:\AI_Hackathon_CDSS` then `$env:AWS_REGION="ap-south-1"; python scripts/verify_bedrock_haiku_tool_use.py`.)
- **1.2** (Manual) Attach `AmazonBedrockFullAccess` to role `AmazonBedrockAgentCoreSDKRuntime-ap-south-1-6eac3e734d`; run one AgentCore conversation to confirm no permission errors.
- **1.3** Start API: `PYTHONPATH=src python scripts/run_api_local.py`. Then: `PYTHONPATH=src python scripts/verify_phase1_local_api.py` — Or `POST http://localhost:8080/api/v1/agent` with body `{"message": "Give me a patient summary for PT-1001"}`; confirm 200, `intent`/`data`/`safety_disclaimer` in response.
- **1.4** Deploy: `cd infrastructure && terraform apply`; register Gateway tools per `docs/agentcore-gateway-manual-steps.md`. The 11 tools in `lambda_handler.py`: `get_hospitals`, `get_ot_status`, `get_abdm_record`, `get_patient`, `list_patients`, `get_surgeries`, `get_surgery`, `get_schedule`, `find_replacement`, `get_medications`, `get_reminders_adherence`. In AgentCore agent config, confirm all 11 are registered; send a request that triggers one (e.g. patient summary), then check CloudWatch for Lambda invocations and that the agent response includes real tool output.

### Phase 2: Real Integrations

- **2.1** Define MCP contract for hospital HIS and ABDM  
  - **Verify:** Document exists in api_reference.md or design.md with endpoints, auth, and payloads for each system.
- **2.2** Implement MCP clients/servers for real hospital/ABDM (replace stubs)  
  - **Verify:** Unit or integration tests pass against mock or sandbox; no stub-only path in production code for new integrations.
- **2.3** Wire Patient Agent to real ABDM (or sandbox)  
  - **Verify:** In test env, request patient summary for a known ABDM id; response includes data from ABDM (or sandbox) and not only static stub.
- **2.4** Wire Resource/Scheduling to real or simulated OT/staff/equipment  
  - **Verify:** Availability or conflict check returns results from live (or simulated) data source; logs show correct data source.
- **2.5** All external URLs/credentials from Secrets Manager or IAM only  
  - **Verify:** Grep/code review finds no hardcoded secrets or .env used for production; Secrets Manager keys documented.

### Phase 3: Frontend & UX

- **3.1** Frontend points to AgentCore API; CORS and auth work  
  - **Verify:** From browser at localhost:5173, trigger a request to the API; response displayed without CORS errors; auth headers sent if required.
- **3.2** Doctor Module: list patients, trigger flows, show summaries and audit context  
  - **Verify:** Manually test: list patients, run Patient/Surgery/Resource/Scheduling flows, see summaries and audit info; matches R1–R5 acceptance criteria.
- **3.3** Patient Module restricted to single Patient_ID  
  - **Verify:** Log in as patient; confirm only own history/reminders/summary visible; attempt to access another patient ID returns 403 or equivalent.
- **3.4** Multilingual: Hindi + one regional language and terminology  
  - **Verify:** Request response in Hindi (and one other language); check terminology list is used; R7 acceptance criteria met.
- **3.5** Safety disclaimers on all patient-facing AI content  
  - **Verify:** Review checklist: summaries and educational content include required disclaimer; no unbranded medical advice.

### Phase 4: Safety & Compliance

- **4.1** Medical audit dashboard: trace review UI  
  - **Verify:** Open dashboard; filter by patient/doctor/time; select one request and trace end-to-end; export works for audit.
- **4.2** RBAC: Cognito groups and enforcement at API and backend  
  - **Verify:** Doctor and Patient roles in Cognito; API rejects cross-tenant access; automated R1 role-based tests pass.
- **4.3** Every clinically relevant action written to RDS audit  
  - **Verify:** Audit log coverage review: key actions (e.g. view patient, create surgery, send reminder) have who/what/when/patient or record.
- **4.4** Data localization: RDS/S3/PII in ap-south-1 (or approved India regions)  
  - **Verify:** Architecture review; no PII stored or processed outside approved regions; documented in compliance doc.
- **4.5** Encryption at rest and in transit for patient data  
  - **Verify:** RDS, S3, and API config show TLS and encryption (e.g. KMS); config review signed off.

### Phase 5: Notifications & Alerts

- **5.1** Drug interaction alerts to physician/pharmacist before administration  
  - **Verify:** Test case: trigger interaction scenario; alert created and logged; recipient (or mock) receives notification.
- **5.2** Emergency protocols: triggers and wiring to alert engine  
  - **Verify:** Runbook lists triggers; at least one emergency path (e.g. vitals threshold) wired and tested.
- **5.3** Multi-channel escalation until acknowledgment; response times logged  
  - **Verify:** Test escalation path; confirm multiple channels and audit trail with response times (R9).
- **5.4** Maintenance notifications and alternative access  
  - **Verify:** Runbook includes how to notify users and alternative access; Ops sign-off.

### Phase 6: Quality, Performance & Compliance

- **6.1** Property-based / critical-path tests for safety-critical flows  
  - **Verify:** CI runs tests; scheduling surgery, drug interactions, emergency alerts covered; design properties referenced.
- **6.2** RBAC boundary tests: Patient cannot access others’ data or admin  
  - **Verify:** Automated test suite includes these cases and passes.
- **6.3** Routine queries meet sub-2-second target; bottlenecks documented  
  - **Verify:** Load test report shows latency and any tuning done.
- **6.4** SLO 99.5% and monitoring (alarms, runbooks) in ap-south-1  
  - **Verify:** Dashboard and alarms exist; runbooks updated; on-call can follow.
- **6.5** Regulatory: doctor-in-the-loop, docs and audit for CDSCO  
  - **Verify:** Checklist and doc ownership confirmed; no AI-only decisions.

### Phase 7: Documentation & Handover

- **7.1** PROJECT_REFERENCE.md is single source for IDs, ARNs, endpoints  
  - **Verify:** Spot-check on release: all referenced IDs/ARNs/endpoints match PROJECT_REFERENCE.md.
- **7.2** api_reference.md includes all public endpoints and MCP contracts  
  - **Verify:** Every public API and MCP contract has an entry; no undocumented endpoints.
- **7.3** Runbooks for deploy, scale, incident, rollback (AgentCore, Lambda, RDS)  
  - **Verify:** Ops team runs through runbooks and signs off.
- **7.4** Onboarding: new dev runs local API + frontend and one full agent flow  
  - **Verify:** New developer follows PROJECT_STATUS + PROJECT_REFERENCE and completes onboarding checklist.

---

## 4. Critical Implementation Challenges (from requirements.md)

- **Regulatory (CDSCO/SaMD)**: Proceed in parallel; start with non-diagnostic features; keep full audit and docs.
- **Medical liability**: Strict doctor-in-the-loop; all recommendations logged; disclaimers on patient-facing content.
- **Data privacy**: Encryption, India data localization, consent management—already reflected in Phase 4 and 6.
- **Doctor adoption**: Gradual rollout, training, feedback loops; AI as augmentation only.
- **Real-time sync**: Reliable status updates (Resource/Scheduling); fallbacks and manual override paths.
- **Government competition**: Differentiate on multi-agent design and advanced features; consider partnerships.

---

## 5. Success Criteria for “Project Complete”

Track detailed progress in **[§3.5 Master TODO & Verification Checklist](#35-master-todo--verification-checklist)**; the list below is the phase-level gate.

- All **Phase 1** steps done (and verified): Bedrock model + IAM working; local and deployed agent runs with real tools.
- **Phase 2** (real MCP/ABDM) either fully wired or clearly scoped and scheduled with no blocking stubs in production path.
- **Phase 3**: Frontend connected; Doctor and Patient modules meet R1; multilingual baseline and disclaimers in place.
- **Phase 4**: Audit dashboard live; RBAC enforced; audit trails and data localization verified.
- **Phase 5**: At least one end-to-end notification/alert path (e.g., drug interaction) implemented and tested.
- **Phase 6**: Critical-path and RBAC tests in CI; performance and uptime targets documented and monitored.
- **Phase 7**: Reference docs and runbooks updated; one successful onboarding run.

---

## 6. Quick Reference

- **Local API**: `python scripts/run_api_local.py` → `http://localhost:8080`
- **Agent endpoint**: `POST /api/v1/agent` or `POST /agent`
- **Health**: `GET /health`
- **Frontend**: `http://localhost:5173`
- **Key code**: `agentcore/agent/cdssagent/src/main.py`, `infrastructure/gateway_tools_src/lambda_handler.py`
- **Config**: [PROJECT_REFERENCE.md](PROJECT_REFERENCE.md) (ARNs, secrets, region)

---

> **Safety disclaimer**: This system is for decision support only. All medical decisions require the judgment of a qualified clinician.

