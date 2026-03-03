# AgentCore Implementation Plan

**Purpose:** Migrate Emergency Medical Triage AI layer from classic Bedrock Converse API / Agents to **Amazon Bedrock AgentCore** for better MCP integration, observability, memory, and production readiness.

> **References:** [Implementation Plan](./implementation-plan.md) | [Implementation History](./implementation-history.md) | [AgentCore Docs](https://docs.aws.amazon.com/bedrock-agentcore/?region=us-east-1)

---

## Agreed Approach (Feb 2026)

| Topic | Decision |
|-------|----------|
| **Experience** | No prior AgentCore use; Console access available |
| **AC-1 scope** | Hospital Matcher only; migrate Triage, Routing once stable |
| **Gateway data** | Try MCP for hospital knowledge if available; otherwise synthetic data only |
| **IaC** | Terraform if not too time-consuming; otherwise Console |
| **Cutover** | Converse fallback during migration; switch fully once AgentCore path is stable |
| **Hospital data** | No MCP server for hackathon; synthetic/stub data is acceptable |
| **AC-1 observability** | Include basic tracing/metrics in AC-1 |

---

## Why AgentCore

| Need | Current (Converse/Classic Agents) | AgentCore |
|------|----------------------------------|-----------|
| Hospital Data MCP | Manual integration, stubs | **Gateway** – expose MCP tools natively |
| Trace review / medical audit | Custom logging | **Observability** – tracing, OpenTelemetry, CloudWatch |
| Patient context across sessions | Aurora only | **Memory** – short-term + long-term |
| Safe agent boundaries | Prompts | **Policy** (preview) – explicit action control |
| RMP / Admin auth | Custom | **Identity** – Cognito/IdP integration |

---

## AgentCore Capabilities to Adopt

| Capability | Priority | Use Case |
|------------|----------|----------|
| **Runtime** | P0 | Host Triage, Hospital Matcher, Routing agents |
| **Gateway** | P0 | Expose Hospital Data MCP, triage tools |
| **Observability** | P0 | Trace review, medical audit, debugging |
| **Memory** | P1 | Patient context, repeat visits, follow-up |
| **Identity** | P1 | RMP auth when frontend ready |
| **Policy** | P2 | Stricter safety boundaries (when GA) |
| **Code Interpreter** | P3 | Optional: scoring, travel time calculations |
| **Browser** | P3 | Optional: hospital availability lookup |
| **Evaluations** | P3 | Quality measurement (when GA) |

---

## Architecture (Target)

```
                    ┌─────────────────────────────────────────┐
                    │           API Gateway                    │
                    │  /triage  /hospitals  /route  /health   │
                    └─────────────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
             ┌──────────┐      ┌──────────────┐   ┌──────────┐
             │  Triage  │      │Hospital Match│   │ Routing  │
             │  Lambda  │      │   Lambda     │   │  Lambda  │
             └────┬─────┘      └──────┬───────┘   └────┬─────┘
                  │                   │                 │
                  └───────────────────┼─────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │      Bedrock AgentCore            │
                    │  ┌─────────┐  ┌──────────────┐   │
                    │  │Runtime  │  │   Gateway    │   │
                    │  │(agents) │  │(MCP tools)   │   │
                    │  └────┬────┘  └──────┬───────┘   │
                    │       │              │           │
                    │  ┌────┴──────────────┴───────┐   │
                    │  │ Memory │ Observability    │   │
                    │  └──────────────────────────┘   │
                    └─────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │  Aurora (triage_assessments,      │
                    │  hospital_matches)                │
                    └──────────────────────────────────┘
```

---

## Phases

### Phase AC-1: Foundation (AgentCore Runtime + Gateway + Observability)

**Goal:** Stand up AgentCore Runtime and Gateway; connect Hospital Matcher as proof of concept; add basic tracing/metrics.

**Deliverables:**
- [ ] AgentCore Runtime workspace/deployment — **In progress** (agentcore/agent/)
- [ ] AgentCore Gateway configured (Lambda or synthetic data; MCP if available) — **Deferred to AC-3** (using in-agent synthetic tool)
- [x] Hospital Matcher agent deployed to Runtime (or Lambda calling AgentCore API)
- [x] POST /hospitals invokes AgentCore when `use_agentcore=true` (Converse fallback)
- [x] Basic tracing/metrics (CloudWatch Logs: `HospitalMatcher source= duration_ms=`)
- [x] Terraform: `use_agentcore`, `agent_runtime_arn`, IAM for `InvokeAgentRuntime`

**Dependencies:** AgentCore API/SDK availability in us-east-1.

**Manual step:** Deploy the agent with `agentcore deploy` from `agentcore/agent/`, then set `agent_runtime_arn` in tfvars.

---

### Phase AC-2: Triage + Observability

**Goal:** Migrate Triage to AgentCore; enable full trace observability.

**Deliverables:**
- [ ] Triage agent on AgentCore Runtime
- [ ] AgentCore Observability: tracing, CloudWatch dashboards
- [ ] Trace review workflow for Admin/Dev (medical audit)
- [ ] POST /triage invokes AgentCore
- [ ] Persist triage to Aurora (unchanged)

---

### Phase AC-3: Memory + Hospital MCP

**Goal:** Add Memory for patient context; integrate Hospital Data MCP via Gateway.

**Deliverables:**
- [ ] AgentCore Memory: short-term (session) + long-term (patient)
- [ ] Gateway: Hospital Data MCP as tool source
- [ ] Hospital Matcher uses real hospital data (replace stubs)
- [ ] Patient context available across triage → hospital → routing flow

---

### Phase AC-4: Routing + Identity

**Goal:** Add Routing agent; enable Identity for RMP auth.

**Deliverables:**
- [ ] Routing agent on AgentCore Runtime
- [ ] POST /route endpoint
- [ ] AgentCore Identity: Cognito/IdP integration for RMP
- [ ] Policy (if GA): stricter agent action boundaries

---

## Migration Strategy

1. **Incremental:** Keep Converse API fallback until AgentCore path is stable; then hard cutover (no long-term feature flag).
2. **Feature flags:** `USE_AGENTCORE` env var to toggle during migration; remove once cutover complete.
3. **Preserve contracts:** API request/response schemas unchanged.
4. **Aurora unchanged:** Persistence layer stays; AgentCore replaces only the AI invocation path.

---

## Execution Order

| Phase | Focus | Status | Dependency |
|-------|-------|--------|------------|
| AC-1 | Runtime + Gateway + Hospital Matcher PoC | Next | None |
| AC-2 | Triage + Observability | Pending | AC-1 |
| AC-3 | Memory + Hospital MCP | Pending | AC-1, AC-2 |
| AC-4 | Routing + Identity | Pending | AC-1 |

---

## Technical Notes

- **AgentCore SDK:** Python SDK on [GitHub](https://github.com/aws/amazon-bedrock-agentcore-sdk-python)
- **Gateway:** Transforms APIs/Lambda/MCP into tools; MCP support via [Gateway tutorials](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-tutorials.html)
- **Runtime:** Serverless; supports extended sessions; any framework (LangGraph, CrewAI, etc.)
- **Region:** AgentCore available in us-east-1; verify other regions as needed

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AgentCore API changes / preview features | Pin SDK version; use feature flags |
| Migration breaks existing flows | Keep Converse fallback; A/B test |
| MCP not yet ready | Use Gateway with Lambda/API stubs until MCP available |

---

## Phase AC-1: Immediate Next Steps

1. **Explore AgentCore Console & API**
   - [AgentCore Get Started](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-get-started-toolkit.html)
   - [AgentCore Developer Guide](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/develop-agents.html)
   - [AgentCore Python SDK](https://github.com/aws/amazon-bedrock-agentcore-sdk-python)

2. **Create Runtime + Gateway (Terraform or Console)**
   - Provision AgentCore Runtime workspace
   - Configure Gateway with `submit_hospital_matches` (Lambda or synthetic data as tool source)

3. **Wire Hospital Matcher Lambda to AgentCore**
   - Add `USE_AGENTCORE` env var; when true, call AgentCore API instead of Converse
   - Preserve request/response contract
   - Converse fallback when `USE_AGENTCORE=false`; hard cutover once stable

4. **Basic tracing/metrics** ✓
   - CloudWatch Logs: `HospitalMatcher source=agentcore|converse|bedrock_agent duration_ms=...`
