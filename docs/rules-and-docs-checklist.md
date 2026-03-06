# Rules and Docs – Workstream and Review Checklist

**Purpose:** Use this checklist before starting each workstream and when reviewing code. All implementation must follow the Cursor rules and docs referenced here. See also [CDSS Backend AI Agent Layer – Implementation Plan](implementation-plan.md) Section 0.

---

## Rule and doc reference

| Rule / doc | Path | When to use |
|------------|------|-------------|
| **api-aws.mdc** | `.cursor/rules/api-aws.mdc` | Every API and AWS integration: regions/networking (India or us-east-1), Bedrock client, Lambda/MCP response format, Secrets Manager/SSM, Boto3 patterns, logging without PHI. |
| **bedrock-agents.mdc** | `.cursor/rules/bedrock-agents.mdc` | Any Bedrock usage: domain separation per agent, tool naming `^[a-zA-Z0-9_-]{1,64}$`, clinical safety (validated tools, no raw EMR writes), structured output and Pydantic, trace review and model invocation logging. |
| **python-standards.mdc** | `.cursor/rules/python-standards.mdc` | All Python: PEP 8, Black/ruff, type hints, error handling with custom exceptions for clinical logic, imports, CDSS data model types instead of raw dicts. |
| **project-conventions.mdc** | `.cursor/rules/project-conventions.mdc` | Overall CDSS: Doctor/Patient modules, multi-agent/MCP conventions, IAM & Secrets Manager only, RBAC and audit trails, doctor-in-the-loop, Indian data-localization, testing and feature flags. |
| **terraform-standards.mdc** | `.cursor/rules/terraform-standards.mdc` | All Terraform: naming, no secrets in .tf, encryption and region for PHI stores, structure and tfvars.example, observability for clinical flows. |
| **agentcore-implementation-plan.md** | `docs/agentcore-implementation-plan.md` | AgentCore migration path (Runtime, Gateway, Observability, Memory, Identity); CDSS alignment with Req 8/10; Converse fallback and feature flags; trace review and Patient_ID/Doctor_ID in traces; Gateway as MCP tool source. |
| **agentcore-gateway-manual-steps.md** | `docs/agentcore-gateway-manual-steps.md` | Gateway setup: Lambda as tool target, tool naming (`TARGET___tool_name`), handler format and response schema, safety disclaimers per CDSS.mdc; use when wiring MCP tools or Gateway-invoked Lambdas. |

---

## Before starting each workstream

- [ ] Identify which rules and docs apply to this workstream (API, Python, Terraform, Bedrock, AgentCore/Gateway).
- [ ] Open the relevant `.cursor/rules/*.mdc` and `docs/agentcore-*.md` (if using Bedrock AgentCore or Gateway).
- [ ] Confirm scope: region (India for patient data), no secrets in code, RBAC/audit if touching clinical actions.

---

## When reviewing code

- [ ] **API / Lambda:** Correct API Gateway proxy response shape; no raw PHI in logs; config from env/secrets; explicit region for clients.
- [ ] **Python:** Type hints, CDSS data models (not raw dicts), explicit error handling and no swallowed exceptions.
- [ ] **Bedrock:** Validated outputs (Pydantic), tool naming, domain separation, trace/model invocation logging.
- [ ] **Terraform:** No secrets in .tf; encryption and India region for PHI stores; observability for clinical flows.
- [ ] **AgentCore/Gateway:** Tool naming `TARGET___tool_name`, Lambda handler response schema, safety disclaimers; Converse fallback and feature flags per agentcore-implementation-plan.

---

## Verification (before marking a todo done)

Confirm the changed code and infra comply with the relevant rules above and, if using AgentCore/Gateway, with the agentcore docs.
