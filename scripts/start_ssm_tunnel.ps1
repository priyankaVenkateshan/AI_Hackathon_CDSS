# Start SSM port-forward from local port to Aurora (bastion must be running).
# Usage: .\scripts\start_ssm_tunnel.ps1
# Then in another terminal set DATABASE_URL=postgresql://cdssadmin:PASSWORD@localhost:5433/cdssdb and run python -m cdss.db.seed

$ErrorActionPreference = "Stop"
$targetId = "i-08eca02993fe51295"
$hostName = "cdss-dev-aurora-instance.c3coggyeulk5.ap-south-1.rds.amazonaws.com"
$localPort = "5433"
$region = "ap-south-1"

# PowerShell-safe: pass parameters as comma-separated string (no JSON)
$params = "host=$hostName,portNumber=5432,localPortNumber=$localPort"

Write-Host "Starting tunnel: localhost:$localPort -> ${hostName}:5432 (region $region)"
Write-Host "In another terminal: `$env:DATABASE_URL=`"postgresql://cdssadmin:YOUR_PASSWORD@localhost:$localPort/cdssdb`"; python -m cdss.db.seed"
Write-Host ""
aws ssm start-session `
  --target $targetId `
  --document-name AWS-StartPortForwardingSessionToRemoteHost `
  --parameters $params `
  --region $region
