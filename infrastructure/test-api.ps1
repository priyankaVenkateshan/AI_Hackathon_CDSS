# Test CDSS API after deployment
# Run from repo root. Requires: terraform output (state from successful apply), curl or Invoke-WebRequest

$ErrorActionPreference = "Stop"
$infraDir = Join-Path $PSScriptRoot "infrastructure"

if (-not (Test-Path (Join-Path $infraDir "terraform.tfstate"))) {
  Write-Host "No terraform.tfstate found. Deploy infrastructure first:"
  Write-Host "  cd infrastructure"
  Write-Host "  terraform apply -auto-approve"
  Write-Host ""
  Write-Host "Ensure your AWS user/role has permissions for: API Gateway, Lambda, IAM (CreateRole, CreatePolicy), S3, DynamoDB, EventBridge, Secrets Manager, EC2 (VPC), and tagging (iam:TagRole, apigateway:PUT, etc.)."
  exit 1
}

Push-Location $infraDir
try {
  $baseUrl = terraform output -raw api_gateway_url 2>$null
  if (-not $baseUrl) {
    Write-Host "Could not get api_gateway_url from terraform output."
    exit 1
  }
  $baseUrl = $baseUrl.TrimEnd("/")
  Write-Host "API base: $baseUrl"
  Write-Host ""

  Write-Host "1. GET /health"
  try {
    $r = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    Write-Host "   Status: $($r.StatusCode) $($r.Content)"
  } catch {
    Write-Host "   Error: $_"
  }
  Write-Host ""

  Write-Host "2. POST /triage (stub when enable_triage=false)"
  try {
    $r = Invoke-WebRequest -Uri "$baseUrl/triage" -Method POST -Body '{}' -ContentType "application/json" -UseBasicParsing
    Write-Host "   Status: $($r.StatusCode) $($r.Content)"
  } catch {
    Write-Host "   Error: $_"
  }
  Write-Host ""

  Write-Host "3. GET /api/ (CDSS router)"
  try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/" -Method GET -UseBasicParsing
    Write-Host "   Status: $($r.StatusCode) $($r.Content)"
  } catch {
    Write-Host "   Error: $_"
  }
} finally {
  Pop-Location
}

Write-Host ""
Write-Host "Done."
