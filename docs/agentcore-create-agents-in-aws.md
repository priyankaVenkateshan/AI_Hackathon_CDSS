# Create AgentCore agents in AWS

The **agents** (Runtime) are not created by Terraform. You create them using the **AgentCore starter toolkit** or the **AWS Console**. This doc explains both options so the agent exists in your AWS account and you can set `agent_runtime_arn` in Terraform.

See [agentcore-implementation-plan.md](./agentcore-implementation-plan.md) and [agentcore-gateway-manual-steps.md](./agentcore-gateway-manual-steps.md).

---

## Option A: Starter toolkit (recommended)

### 1. Install tools

```bash
# Python 3.10+ and uv (recommended) or pip
pip install bedrock-agentcore-starter-toolkit bedrock-agentcore
# Or with uv:
# uv add bedrock-agentcore
# uv add --dev bedrock-agentcore-starter-toolkit
```

### 2. Create agent project

From the **project root**:

```bash
cd agentcore/agent
agentcore create
```

When prompted:

- **Framework:** e.g. Strands Agents (or minimal/custom if available)
- **Project name:** e.g. `cdss-agent`
- **Template:** basic or production
- **Model / region:** choose a region where AgentCore is available (e.g. `us-east-1` or `ap-south-1` if listed)

This generates agent code, `requirements.txt`, and `.bedrock_agentcore.yaml`. You can replace or merge with the existing `main.py` in this folder if you want to keep the CDSS stub logic.

### 3. Test locally

```bash
agentcore dev
```

In another terminal:

```bash
curl -X POST http://localhost:8080/invocations -H "Content-Type: application/json" -d '{"prompt": "Hello"}'
```

Stop the dev server with `Ctrl+C`.

### 4. Deploy to AWS

```bash
agentcore launch
```

**Windows:** The toolkit needs a `zip` command. If you have **7-Zip** but not `zip` in PATH, use the project’s wrapper so `zip` is found:

```powershell
# From agent folder (e.g. agentcore\agent\cdssagent)
$env:PATH = "D:\AI_Hackathon_CDSS\scripts;$env:PATH"
agentcore deploy
```

(Or install a real `zip` via Chocolatey: `choco install zip`.)

First run may take a few minutes. When it finishes, note the **Agent Runtime ARN** (or Runtime identifier) from the output.

### 5. Wire CDSS to the runtime

In `infrastructure/terraform.tfvars` (gitignored):

```hcl
use_agentcore     = true
agent_runtime_arn = "<paste-the-arn-from-step-4>"
```

Then:

```bash
cd infrastructure
terraform apply
```

After that, `POST /api/v1/hospitals` and `POST /api/v1/triage` (CDSS severity assessment) will use AgentCore when the env is set.

---

## Option B: AWS Console

If you prefer not to use the CLI:

1. **Create deployment package**
   - Zip the contents of `agentcore/agent/` (including `main.py` and `requirements.txt`).
   - For direct code deployment, dependencies must be installed for **Linux arm64** (AgentCore Runtime environment). Use the same approach as in [AgentCore direct code deployment](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-get-started-code-deploy.html) (e.g. `uv pip install ... --target deployment_package` with `--python-platform aarch64-manylinux2014`), then zip the package.

2. **Upload to S3**
   - Create or use an S3 bucket in your account and region.
   - Upload the zip (e.g. `agentcore/agent/deployment_package.zip`) to a key like `cdss-agent/deployment_package.zip`.

3. **Create agent in Console**
   - **Bedrock** → **AgentCore** → **Agents** (or **Host Agent**).
   - Choose **S3 source** (or **Local upload** if the Console supports it) and point to your zip.
   - Set **Runtime** (e.g. Python 3.12/3.13), **Entry point** (e.g. `main.py`).
   - Create or select an **execution role** with [AgentCore Runtime permissions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html).
   - Create the agent.

4. **Create endpoint and get ARN**
   - Create an endpoint for the agent.
   - Copy the **Runtime ARN** (or agent identifier) from the console.

5. **Wire CDSS**
   - Set `use_agentcore = true` and `agent_runtime_arn = "<arn>"` in `infrastructure/terraform.tfvars`, then `terraform apply`.

---

## After the agent is created

- **Invoke from API:** Ensure `USE_AGENTCORE` and `AGENT_RUNTIME_ARN` are set on the CDSS Lambda (via Terraform above). Then `POST /api/v1/hospitals` and `POST /api/v1/triage` (CDSS severity assessment) will call this runtime.
- **Gateway:** The Gateway (created by `scripts/setup_agentcore_gateway.py`) can be used by this agent as a tool source once the Lambda target is added in the Console (see [agentcore-gateway-manual-steps.md](./agentcore-gateway-manual-steps.md)).
- **Observability:** Use Bedrock AgentCore observability / CloudWatch to trace requests and link to Patient_ID / Doctor_ID per CDSS.mdc.

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| `zip utility is required ... but was not found` (Windows) | Use the project’s 7-Zip wrapper: prepend `scripts` to PATH so `zip` runs `scripts\zip.cmd` (uses 7-Zip). Example: `$env:PATH = "D:\AI_Hackathon_CDSS\scripts;$env:PATH"` then run `agentcore deploy`. Or install `zip` via Chocolatey: `choco install zip`. |
| `pywin32` has no wheels for `manylinux_2_28_aarch64` (uv resolve fails on deploy) | The agent’s `pyproject.toml` already overrides `pywin32` so it’s only required on Windows. Run `uv lock` in the agent folder (e.g. `agentcore/agent/cdssagent`) to refresh the lockfile, then run `agentcore deploy` again. |
| OpenTelemetry instrumentation executable not found / ZIP requires OTEL dependencies but none are present | Observability is enabled but the deploy bundle doesn’t include the OTEL instrumentation. **Quick fix:** In the agent folder set `observability.enabled: false` in `.bedrock_agentcore.yaml`, then run `agentcore deploy` again. To use observability later, ensure `aws-opentelemetry-distro` (and optionally `strands-agents[otel]`) are installed in the bundle and the toolkit includes console scripts in the ZIP; or re-enable after confirming the runtime’s OTEL requirements. |
| `agentcore create` or `agentcore launch` not found | Install the toolkit: `pip install bedrock-agentcore-starter-toolkit`; ensure `agentcore` is on your PATH. |
| Region does not support AgentCore | Use a supported region (e.g. us-east-1, us-west-2) and set `AGENTCORE_GATEWAY_REGION` or deploy in that region. |
| Permission errors during launch | Ensure your AWS identity has [Runtime permissions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-permissions.html#runtime-permissions-starter-toolkit). |
| Lambda cannot invoke runtime | Set `agent_runtime_arn` in tfvars and run `terraform apply` so the Lambda has `USE_AGENTCORE` and `AGENT_RUNTIME_ARN` and the role has `bedrock-agentcore:InvokeAgentRuntime`. |
