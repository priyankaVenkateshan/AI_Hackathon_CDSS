# AgentCore Gateway: Manual Setup Steps

The Gateway itself is not managed by Terraform because the bedrock-agentcore-starter-toolkit creates Cognito, Gateway, and target resources via the AWS Control Plane API. Terraform manages only the **get_hospitals Lambda** that the Gateway invokes.

## Prerequisites

- Terraform apply completed (creates `gateway-get-hospitals` Lambda)
- Python 3.10+ with `bedrock-agentcore-starter-toolkit` and `boto3`
- AWS credentials configured (`aws configure` or env vars)
- Region: us-east-1 (or match `terraform.tfvars`)

## Step 1: Deploy Lambda via Terraform

```bash
cd infrastructure
terraform apply
```

Note the output:

```
gateway_get_hospitals_lambda_arn = "arn:aws:lambda:us-east-1:ACCOUNT:function:emergency-medical-triage-dev-gateway-get-hospitals"
```

## Step 2: Install Setup Script Dependencies

```bash
pip install bedrock-agentcore-starter-toolkit boto3
```

## Step 3: Run Gateway Setup Script

```bash
# Option A: Pass Lambda ARN as argument
python scripts/setup_agentcore_gateway.py $(cd infrastructure && terraform output -raw gateway_get_hospitals_lambda_arn)

# Option B: Use env var
export GATEWAY_GET_HOSPITALS_LAMBDA_ARN=$(cd infrastructure && terraform output -raw gateway_get_hospitals_lambda_arn)
python scripts/setup_agentcore_gateway.py
```

The script will:

1. Create Cognito OAuth authorizer
2. Create MCP Gateway with Cognito auth
3. Add the get_hospitals Lambda as a target with tool schema
4. Add Lambda permission for the Gateway execution role
5. Save `gateway_config.json` with `gateway_url`, `gateway_id`, `region`, `client_info`

## Step 4: Use the Gateway

- **MCP URL**: From `gateway_config.json` → `gateway_url`
- **Tool name**: `get-hospitals-target___get_hospitals` (target name + `___` + tool name)
- **Auth**: Use `client_info` (client_id, client_secret, token_endpoint, scope) for OAuth client-credentials flow

## Lambda Handler Format (Reference)

The Gateway invokes the Lambda with:

- **Event**: `{ "severity": "high", "limit": 3 }` (tool input props)
- **Context**: `client_context.custom["bedrockAgentCoreToolName"]` = `TARGET___get_hospitals`
- **Response**: `{ "hospitals": [...], "safety_disclaimer": "..." }`

Strip the `TARGET___` prefix to identify the tool when multiple tools share one Lambda.

## Troubleshooting

| Issue | Action |
|-------|--------|
| "Lambda permission already exists" | Safe to ignore; permission was added previously |
| "Could not add Lambda permission" | Manually add resource policy: allow `bedrock-agentcore.amazonaws.com` or Gateway execution role to invoke the Lambda |
| Toolkit creates default Lambda | Use boto3 `create_gateway_target` (as in the script) with your Lambda ARN and tool schema; do not use `target_payload=None` |
| Tool not found in MCP | Verify target name; full tool name is `{target_name}___get_hospitals` |
