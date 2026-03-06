# Connect Local Frontend to Aurora (ap-south-1)

Use this when you want the **doctor-dashboard** (or other frontend) running on your machine to read/write data from **cdss-db** in `ap-south-1`. The database has no public internet access, so we use an **SSM port-forward** through the bastion, then run the local API with IAM auth over that tunnel.

## Architecture

- **Frontend** (localhost) → **Local API** (localhost:8080) → **Aurora** (via tunnel localhost:10021 → bastion → cluster:5432).
- Auth to Aurora: **IAM** (no DB password; token from `aws rds generate-db-auth-token`).

## What you need

| Item | Value / where |
|------|----------------|
| **Region** | `ap-south-1` |
| **DB instance** | `cdss-db` |
| **Secret** | `cdss-dev/rds-config` (host, port, database, username, region; no password) |
| **AWS credentials** | CLI configured (`aws configure` or `aws sso login`) with access to Secrets Manager and RDS `GenerateDBAuthToken` in `ap-south-1`. |

No database password is required; the API uses IAM auth over the tunnel.

## Step 1: Start the SSM tunnel

In a **first** PowerShell terminal (leave it open):

```powershell
cd D:\AI_Hackathon_CDSS
.\scripts\start_ssm_tunnel.ps1
```

Or the one-liner (single-quoted JSON so PowerShell does not mangle it):

```powershell
aws ssm start-session --target i-0fa9a34f73b201db2 --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["cdss-db.c3coggyeulk5.ap-south-1.rds.amazonaws.com"],"portNumber":["5432"],"localPortNumber":["10021"]}' --region ap-south-1
```

Wait until the session says the port is open (e.g. “Port 10021 opened”).

## Step 2: Start the local API (Aurora via tunnel)

In a **second** PowerShell terminal:

```powershell
cd D:\AI_Hackathon_CDSS
.\scripts\run_api_with_aurora.ps1
```

This sets `RDS_CONFIG_SECRET_NAME=cdss-dev/rds-config`, `AWS_REGION=ap-south-1`, `TUNNEL_LOCAL_PORT=10021`, and runs the API. You should see something like: `CDSS local API at http://localhost:8080 (mock DB: False)`.

## Step 3: Start the frontend

In a **third** terminal:

```powershell
cd D:\AI_Hackathon_CDSS\frontend\apps\doctor-dashboard
npm run dev
```

Ensure `frontend/apps/doctor-dashboard/.env.local` contains:

```
VITE_API_URL=http://localhost:8080
VITE_USE_MOCK=false
```

The app will call the local API, which uses the tunnel to Aurora with IAM auth.

## Optional: verify DB connection

With the tunnel and API running, in another terminal:

```powershell
cd D:\AI_Hackathon_CDSS
.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "src"
$env:RDS_CONFIG_SECRET_NAME = "cdss-dev/rds-config"
$env:AWS_REGION = "ap-south-1"
$env:TUNNEL_LOCAL_PORT = "10021"
python scripts/check_aurora_db.py
```

You should see “Database: connected” and table row counts.

## Troubleshooting

| Symptom | Cause | Fix |
|--------|--------|-----|
| “Unknown options” when running `aws ssm start-session` | Double-quoted JSON in PowerShell | Use the script or the single-quoted one-liner above. |
| “Connection refused” on port 10021 | Tunnel not running | Start Step 1 and leave that terminal open. |
| “Secret not found” / “Database not configured” | Wrong secret name or region / no AWS creds | Set `RDS_CONFIG_SECRET_NAME=cdss-dev/rds-config`, `AWS_REGION=ap-south-1`, and ensure `aws secretsmanager get-secret-value --secret-id cdss-dev/rds-config --region ap-south-1` works. |
| IAM auth / “password authentication failed” | DB user not granted `rds_iam` | One-time: connect with master password and run `GRANT rds_iam TO cdssadmin;` (or the username in your secret). |

## Bastion instance ID

If the bastion was recreated, get the new instance ID:

```powershell
cd D:\AI_Hackathon_CDSS\infrastructure
terraform output -raw bastion_instance_id
```

Or:

```powershell
aws ec2 describe-instances --filters "Name=tag:Name,Values=cdss-dev-bastion" "Name=instance-state-name,Values=running" --query "Reservations[0].Instances[0].InstanceId" --output text --region ap-south-1
```

Update `scripts/start_ssm_tunnel.ps1` with the new ID if it changes.
