# CDSS Architecture Alignment

This document aligns the codebase with the **CDSS (Clinical Decision Support System)** architecture: Supervisor + five domain agents (Patient, Surgery, Resource, Scheduling, Engagement) + MCP Adapter (Hospital, ABDM, Protocols, Telemedicine). **We only create and deploy for CDSS**; there is no separate "Triage" or "Tirage" project.

## Cleanup: Tirage / separate Triage project removed

The following **Tirage-related** (separate project) items were removed so the repo contains only CDSS:

- **Removed:** `src/triage/` (stub folder for a separate Triage Lambda); `scripts/build_triage_lambda.sh`; infrastructure references to `triage_lambda.zip`, `triage_lambda_src/`, optional Triage Lambda, "Emergency Medical Triage" in API description; `triagedb` / "triage repo" in docs; RDS comment `triagemaster` → generic `<db_username>`.
- **Kept:** `src/cdss/api/handlers/triage.py` is **CDSS severity assessment** (same Lambda as all other CDSS routes). It is not a separate Tirage product. POST `/api/v1/triage` remains the CDSS severity-assessment endpoint.

---

## Why `/api/v1/triage` Exists (No Separate Triage Agent)

In the CDSS architecture diagram:

- **BEDROCK MULTI-AGENT** layer shows: **Supervisor**, **Patient Agent**, **Surgery Agent**, **Resource Agent**, **Scheduling Agent**, **Engagement Agent**. There is **no** separate "Triage" agent box.
- **MCP ADAPTER** includes **Telemedicine** for "Specialist escalation (Phase 3)".

So:

- **Severity/urgency assessment** is part of CDSS. It is handled by:
  1. **Supervisor** – classifies intents (including "triage" for severity/emergency/priority) and routes to the appropriate handler.
  2. **POST /api/v1/triage** – a **CDSS endpoint** that performs **severity assessment** (priority, risk factors, recommendations, requires_senior_review). It runs in the **same CDSS router Lambda** as all other routes. It is **not** a separate Triage Lambda or Triage agent.
  3. **Telemedicine MCP (Phase 3)** – Specialist escalation; severity assessment output can feed into this flow.

The path `/api/v1/triage` is kept for backward compatibility and for "severity assessment" use cases. In docs and code it is referred to as **CDSS severity assessment**; the handler lives in `src/cdss/api/handlers/triage.py` and is part of the single CDSS API.

---

## What We Build (CDSS Only)

| Component | In architecture | In codebase |
|-----------|------------------|-------------|
| Supervisor | Yes | `src/cdss/api/handlers/supervisor.py` |
| Patient Agent | Yes | `src/cdss/api/handlers/patient.py`, `backend/agents/patient/` |
| Surgery Agent | Yes | `src/cdss/api/handlers/surgery.py`, `backend/agents/surgery_planning/` |
| Resource Agent | Yes | `src/cdss/api/handlers/resource.py`, `backend/agents/resource/` |
| Scheduling Agent | Yes | `src/cdss/api/handlers/scheduling.py`, `backend/agents/scheduling/` |
| Engagement Agent | Yes | `src/cdss/api/handlers/engagement.py`, `backend/agents/engagement/` |
| Hospital MCP / hospitals | Yes | `src/cdss/api/handlers/hospitals.py`, Gateway Lambda |
| Severity assessment | Yes (Supervisor flow; Telemedicine escalation) | `src/cdss/api/handlers/triage.py` – CDSS endpoint only |
| Separate Triage agent | No | Not present; not in architecture |

---

## Verification Steps (CDSS Only)

When verifying agents and Bedrock (see the earlier verification plan):

1. **Bedrock** – Raw Bedrock and CDSS Bedrock wrapper (steps 1–2).
2. **API + agents** – All routes under `/api/v1/*` are **CDSS** routes (patients, surgeries, resources, schedule, engagement, hospitals, **severity assessment** at `/api/v1/triage`, supervisor, admin). No separate Triage Lambda.
3. **AgentCore** – Single CDSS AgentCore runtime; Gateway for MCP tools. `/api/v1/triage` invokes the same runtime when intent is severity-related (or the triage handler calls AgentCore when `USE_AGENTCORE=true`).

References: [implementation-checklist.md](./implementation-checklist.md), [api_reference.md](./api_reference.md), [agentcore-implementation-plan.md](./agentcore-implementation-plan.md).
