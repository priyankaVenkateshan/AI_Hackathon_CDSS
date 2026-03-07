# CDSS Project Reference

This document serves as the single source of truth for the Clinical Decision Support System (CDSS) project configuration, architecture, and implementation status.

> [!TIP]
> **New Developer Onboarding**: See [PROJECT_STATUS.md](PROJECT_STATUS.md) for a high-level overview of "What's Been Done" and the Project Roadmap.


---

## 🚀 Current Status: Complete Multi-Agent Deployment
The system is now fully implemented with a **5-Agent Architecture** managed by **Amazon Bedrock AgentCore**.

### 🧩 Core Agents (5 Specialized Domains)
1.  **Patient Agent**: Patient history, summaries, surgery readiness, ABDM records.
2.  **Surgery Agent**: Surgery classification, checklists, procedural requirements.
3.  **Resource Agent**: OT availability, staff scheduling, equipment status.
4.  **Scheduling Agent**: Booking, replacements, team notifications.
5.  **Engagement Agent**: Medications, reminders, adherence tracking.

---

## 🛠 AWS Configuration & Endpoints

| Resource | Value / ID |
| :--- | :--- |
| **AWS Region** | `ap-south-1` (Mumbai) |
| **AWS Account ID** | `746412758276` |
| **AgentCore Runtime ARN** | `arn:aws:bedrock-agentcore:ap-south-1:746412758276:runtime/cdssagent_Agent-t2U3Q67I4j` |
| **AgentCore Agent ID** | `cdssagent_Agent-t2U3Q67I4j` |
| **Execution Role** | `AmazonBedrockAgentCoreSDKRuntime-ap-south-1-6eac3e734d` |
| **RDS Secret Name** | `cdss-dev/rds-config` |
| **Bedrock Secret Name** | `cdss-dev/bedrock-config` |
| **Memory ID** | `cdssagent_Agent_mem-nS20OrA6Kt` |
| **S3 Code Bucket** | `s3://bedrock-agentcore-codebuild-sources-746412758276-ap-south-1` |

### 🔐 AWS Secrets Manager (boto3)

All sensitive configuration (API keys, endpoints, DB credentials) must be stored in **AWS Secrets Manager** and retrieved at runtime via boto3. Do not use `.env` for secrets or hardcode credentials.

| Env var (secret name / config) | Secret ID (example) | Purpose |
| :--- | :--- | :--- |
| `RDS_CONFIG_SECRET_NAME` | `cdss-dev/rds-config` | RDS/Aurora host, port, database, username (password = IAM auth token at runtime). |
| `BEDROCK_CONFIG_SECRET_NAME` | `cdss-dev/bedrock-config` | Bedrock `model_id`, `region`; any API keys if required. |
| `CDSS_APP_CONFIG_SECRET_NAME` | `cdss-dev/app-config` | App-level config: Cognito, EventBridge, gateway ARNs, API base URLs. |
| `AWS_REGION` | — | AWS region (e.g. `ap-south-1`); not a secret, set by IaC or env. |

**RDS secret JSON** (e.g. `cdss-dev/rds-config`):
```json
{ "host": "<cluster>.ap-south-1.rds.amazonaws.com", "port": 5432, "database": "cdssdb", "username": "cdssadmin", "region": "ap-south-1" }
```
Connection uses IAM auth token generated at runtime; no password in the secret.

**Bedrock secret JSON** (e.g. `cdss-dev/bedrock-config`):
```json
{ "model_id": "anthropic.claude-3-haiku-20240307-v1:0", "region": "ap-south-1" }
```

**App config secret JSON** (e.g. `cdss-dev/app-config`):
```json
{
  "cognito_user_pool_id": "ap-south-1_xxxxx",
  "aws_region": "ap-south-1",
  "event_bus_name": "cdss-events",
  "agent_runtime_arn": "arn:aws:bedrock-agentcore:...",
  "gateway_get_hospitals_lambda_arn": "arn:aws:lambda:..."
}
```
Used by WebSocket authorizer, admin handler, and scripts that need Cognito/EventBridge/endpoints. Fallback: same values can be set via environment variables for local dev (secret names and non-secret IDs only; never commit credentials).

**Code:** `src/cdss/config/secrets.py` — `get_secret()`, `get_app_config()`, `get_rds_config()`, `get_bedrock_config()`.

### 🔗 API Endpoints (Local & Deployed)
*   **Local API**: `http://localhost:8080` (Run via `python scripts/run_api_local.py`)
*   **Main Supervisor Entry**: `POST /api/v1/agent` or `POST /agent`
*   **Health Check**: `GET /health`
*   **Frontend**: `http://localhost:5173` (Vite / React)

---

## ✅ What's Been Done
- [x] **Multi-Agent Orchestrator**: Implemented in `agentcore/agent/cdssagent/src/main.py`.
- [x] **5-Agent Domain Logic**: Specialized prompts for Patient, Surgery, Resource, Scheduling, and Engagement.
- [x] **Gateway Tools**: 11 clinical tools implemented in `infrastructure/gateway_tools_src/lambda_handler.py`.
- [x] **Triage Removal**: Architecture consolidated strictly to the 5-agent model.
- [x] **Clinical Safety**: Enforced Pydantic schemas and auto-escalation rules (confidence < 0.85 → Senior Review).
- [x] **Audit Trails**: Inter-agent event logging (RDS `AgentEventLog`) and Alert Engine (RDS `AlertLog`).
- [x] **Database Constraints**: Multi-table RDS schema for patients, surgeries, and resources.
- [x] **Frontend Dashboards**: Base implementation for Doctor, Nurse, and Patient modules in `frontend/apps`.


---

## ⏳ Remaining Actions (Immediate)
> [!IMPORTANT]  
> **IAM & Model Access required to finish verification in AWS Console:**
> 1.  **Model Access**: Enable `Claude 3 Haiku` in Bedrock console (Nova Lite has tool-use limitations).
> 2.  **IAM Policy**: Attach `AmazonBedrockFullAccess` to the role `AmazonBedrockAgentCoreSDKRuntime-ap-south-1-6eac3e734d`.

---

## 📂 Cleanup Log (Removed Files)
To keep the project clean, the following redundant or outdated files were removed:
- `TODO.md`, `cdss-backend-status.md`, `next-development-tasks.md`, `next-task-and-implementation.md`, `requirements-remaining-and-verification.md`
- `architecture-alignment.md`, `agentcore-next-steps-implementation.md`, `implementation-checklist.md`, `rules-and-docs-checklist.md`
- `infra-verify.md`, `region-change-options.md`, `cicd-and-monitoring.md`, `local-frontend-aurora.md`, `frontend-improvement-plan.md`
- `sample_api_responses.json`, `agentcore-create-agents-in-aws.md`, `cdss-requirements-completion-action-plan.md`

---

## 📖 Key Documentation to Keep
- [requirements.md](requirements.md): Clinical and technical scope.
- [design.md](design.md): Architectural design.
- [api_reference.md](api_reference.md): Full REST API specification.
- [agentcore-implementation-plan.md](agentcore-implementation-plan.md): Agent-specific technical plan.
- [agentcore-gateway-manual-steps.md](agentcore-gateway-manual-steps.md): Manual setup for MCP tools.
