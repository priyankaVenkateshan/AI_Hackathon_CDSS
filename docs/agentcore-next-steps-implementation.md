# AgentCore – Next Steps Implementation

This document defines **concrete implementation steps** to adopt Amazon Bedrock AgentCore in the CDSS project, following [agentcore-implementation-plan.md](./agentcore-implementation-plan.md) and [agentcore-gateway-manual-steps.md](./agentcore-gateway-manual-steps.md), and aligning with [.cursor/rules/CDSS.mdc](../.cursor/rules/CDSS.mdc) and [.cursor/rules/bedrock-agents.mdc](../.cursor/rules/bedrock-agents.mdc).

---

## Overview

| Phase | Focus | Deliverables in this implementation |
|-------|--------|-------------------------------------|
| **AC-1** | Runtime + Gateway + CDSS PoC agent + tracing | Terraform (use_agentcore, agent_runtime_arn, IAM), Gateway Lambda, setup script, initial CDSS tools with AgentCore/fallback and CloudWatch tracing |
| **AC-2** | Triage + Observability | Documented as next; trace review workflow |
| **AC-3** | Memory + Hospital MCP | Documented as next; Gateway MCP tools |
| **AC-4** | Routing + Identity | Documented as next |

---

## Step 1: Terraform – AgentCore feature flag and IAM

**Files:** `infrastructure/variables.tf`, `infrastructure/bedrock.tf`, `infrastructure/main.tf`, `infrastructure/terraform.tfvars.example`

- Add variables:
  - `use_agentcore` (bool, default `false`): when true, Lambda may call AgentCore Runtime.
  - `agent_runtime_arn` (string, default `""`): ARN of the deployed AgentCore Runtime (set after `agentcore deploy`).
- Add IAM policy for Bedrock AgentCore:
  - `bedrock-agentcore:InvokeAgentRuntime` on the Runtime ARN (or `*` when ARN not yet known).
  - Attach this policy to the CDSS Lambda role when `use_agentcore` is true.
- Pass into Lambda env: `USE_AGENTCORE` = `"true"` when `use_agentcore` is true; `AGENT_RUNTIME_ARN` = `agent_runtime_arn`.

**Reference:** [agentcore-implementation-plan.md](./agentcore-implementation-plan.md) Phase AC-1 deliverables; [AWS Runtime permissions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html).

---

## Step 2: Gateway Lambda (tool target for AgentCore Gateway)

**Files:** `infrastructure/agentcore_gateway.tf` (new), `infrastructure/gateway_tools_src/lambda_handler.py` (new), `infrastructure/outputs.tf`

- Create a dedicated Lambda that the AgentCore Gateway invokes as a tool target:
  - Handler implements tools: `get_hospitals` (and optionally `get_ot_status`, `get_abdm_record` stub).
  - Event shape: tool input props (e.g. `severity`, `limit`).
  - Context: `client_context.custom["bedrockAgentCoreToolName"]` = `TARGET___tool_name`; strip `TARGET___` to dispatch.
  - Response: JSON with tool schema; include `safety_disclaimer` per CDSS.mdc.
- Terraform: build zip from `gateway_tools_src/`, deploy Lambda, output `gateway_get_hospitals_lambda_arn` (or `gateway_tools_lambda_arn`) for the setup script.

**Reference:** [agentcore-gateway-manual-steps.md](./agentcore-gateway-manual-steps.md) Lambda handler format; [CDSS.mdc](../.cursor/rules/CDSS.mdc) safety disclaimers.

---

## Step 3: Setup script for AgentCore Gateway

**File:** `scripts/setup_agentcore_gateway.py`

- Input: Lambda ARN (from Terraform output or env `GATEWAY_GET_HOSPITALS_LAMBDA_ARN`).
- Steps (using boto3 / bedrock-agentcore-starter-toolkit where available):
  1. Create Cognito OAuth app for Gateway auth (or document manual creation).
  2. Create MCP Gateway with Cognito authorizer.
  3. Add Lambda as gateway target with tool schema(s) for `get_hospitals` (and CDSS tools if present).
  4. Add Lambda resource policy allowing Gateway execution role to invoke.
  5. Write `gateway_config.json` with `gateway_url`, `gateway_id`, `region`, `client_info`.
- Document in script docstring and in [agentcore-gateway-manual-steps.md](./agentcore-gateway-manual-steps.md).

**Reference:** [agentcore-gateway-manual-steps.md](./agentcore-gateway-manual-steps.md) Step 3.

---

## Step 4: API route and handler – POST /api/v1/hospitals

**Files:** `src/cdss/api/handlers/router.py`, optional `src/cdss/api/handlers/hospitals.py`

- Add route: `POST /api/v1/hospitals` (and optionally `GET`) via existing `{proxy+}` → router.
- Handler logic:
  - Read `USE_AGENTCORE` and `AGENT_RUNTIME_ARN` from env.
  - If `USE_AGENTCORE` is true and `AGENT_RUNTIME_ARN` is set: call AgentCore `InvokeAgentRuntime` (or SDK equivalent) with request body; return response; on failure, fall back to fallback path.
  - Fallback: Converse API or stub response (e.g. synthetic hospital list) so contract remains unchanged.
  - **Tracing:** Log to CloudWatch: `HospitalMatcher source=agentcore|converse|bedrock_agent duration_ms=<ms>`. Include no PHI in logs (per project-conventions and api-aws).
- Preserve existing API request/response contract (e.g. `{ "severity": "high", "limit": 5 }` → `{ "hospitals": [...], "safety_disclaimer": "..." }`).

**Reference:** [agentcore-implementation-plan.md](./agentcore-implementation-plan.md) "AgentCore Runtime + Gateway foundation" and "Basic tracing/metrics"; [CDSS.mdc](../.cursor/rules/CDSS.mdc) trace review.

---

## Step 5: AgentCore Runtime workspace (placeholder and deploy steps)

**Files:** `agentcore/README.md`, `agentcore/agent/` (minimal placeholder or config)

- `agentcore/README.md`: Describe how to deploy an agent to AgentCore Runtime (e.g. `agentcore deploy` from `agentcore/agent/`), and that after deploy the output ARN must be set in `terraform.tfvars` as `agent_runtime_arn`.
- `agentcore/agent/`: Minimal structure (e.g. `main.py` or config) that references [AgentCore Get Started](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-get-started-toolkit.html) and [AgentCore Python SDK](https://github.com/aws/amazon-bedrock-agentcore-sdk-python). No need to implement full agent logic here; focus on "deploy and get ARN" flow.

**Reference:** [agentcore-implementation-plan.md](./agentcore-implementation-plan.md) "Phase AC-1: Immediate Next Steps" and "Manual step: Deploy the agent".

---

## Step 6: Implementation checklist (for reviewers)

Before marking AC-1 "done":

- [ ] Terraform: `use_agentcore`, `agent_runtime_arn` variables; AgentCore IAM policy attached when `use_agentcore` is true; Lambda env has `USE_AGENTCORE` and `AGENT_RUNTIME_ARN`.
- [ ] Gateway Lambda exists and implements `get_hospitals` (and optional CDSS tools) with safety disclaimer; Terraform output exposes its ARN.
- [ ] `scripts/setup_agentcore_gateway.py` runs and produces `gateway_config.json` (or manual steps documented).
- [ ] `POST /api/v1/hospitals` invokes AgentCore when `USE_AGENTCORE=true` and ARN set; otherwise uses fallback; CloudWatch shows `HospitalMatcher source=... duration_ms=...`.
- [ ] `agentcore/` has README and placeholder so a deploy yields an ARN to put in `agent_runtime_arn`.

---

## Execution order

1. Apply Terraform (Step 1 + 2) → Lambda env and Gateway Lambda deployed.
2. (Optional) Deploy agent to Runtime (Step 5) → set `agent_runtime_arn` in tfvars and re-apply.
3. Run `scripts/setup_agentcore_gateway.py` (Step 3).
4. Deploy API/router (Step 4) → test `POST /api/v1/hospitals` with and without `USE_AGENTCORE`.

---

## References

- [agentcore-implementation-plan.md](./agentcore-implementation-plan.md)
- [agentcore-gateway-manual-steps.md](./agentcore-gateway-manual-steps.md)
- [.cursor/rules/CDSS.mdc](../.cursor/rules/CDSS.mdc)
- [.cursor/rules/bedrock-agents.mdc](../.cursor/rules/bedrock-agents.mdc)
- [.cursor/rules/project-conventions.mdc](../.cursor/rules/project-conventions.mdc)
- [docs/rules-and-docs-checklist.md](./rules-and-docs-checklist.md)
