# Connect Deployed Backend to Database (Remove "Backend is not connected" Banner)

When the **deployed** doctor dashboard shows:

> Backend is not connected to the database. You may see mock or empty data…

the API (Lambda) cannot reach Aurora yet. Complete these steps **once** so the deployed API returns real data and the banner goes away.

**See also:** [DEBUGGING_REPORT_2026_03_08.md](DEBUGGING_REPORT_2026_03_08.md) for SSH/SSM tunnel failures and Aurora IAM auth.

---

## Important: Aurora uses IAM authentication

The Aurora cluster has **IAM database authentication** enabled. A static password in `.env` will **not** work (you get `PAM authentication failed`). You must use a **short-lived IAM token** from AWS. Use the SSM tunnel (no port 22) and the IAM token–based flow below.

---

## Option A: One-shot script (recommended)

From repo root, with **AWS CLI configured**, secret `cdss-dev/rds-config`, and **SSH key** matching `bastion_ssh_public_key` in Terraform (e.g. `.ssh/bastion_id_rsa` or `~/.ssh/id_rsa`):

```powershell
.\scripts\connect_backend_to_db.ps1
```

This script:

1. **Tunnel:** If port 5433 is not listening, opens a **new window** running `.\scripts\start_ssh_tunnel.ps1`, which connects to the **deployed** bastion and Aurora using Terraform outputs (`bastion_public_ip`, `aurora_cluster_endpoint`).
2. **IAM token:** Sets `DATABASE_URL` with a fresh IAM auth token (Aurora uses IAM auth).
3. **Migrations + seed + RDS IAM grant:** Runs in order.

Leave the tunnel window open until the script finishes. Ensure your IP is in `infrastructure/terraform.tfvars` → `bastion_allowed_cidr`. Then refresh the deployed dashboard; the banner should be gone.

---

## Option B: Manual steps

### Step 1: Start the DB tunnel (SSH to deployed Aurora)

From repo root, in a terminal you leave open:

```powershell
.\scripts\start_ssh_tunnel.ps1
```

This uses **Terraform output** from your deployed stack: `bastion_public_ip` and `aurora_cluster_endpoint`. It forwards `localhost:5433` → Aurora `:5432` via the bastion. Ensure your IP is in `infrastructure/terraform.tfvars` → `bastion_allowed_cidr`, and you have the matching SSH key (e.g. `.ssh/bastion_id_rsa` or `~/.ssh/id_rsa`).

**If SSH times out** (port 22 blocked or IP not in `bastion_allowed_cidr`), use the SSM tunnel instead: `.\scripts\start_ssm_tunnel.ps1` (uses HTTPS 443; see debug report §6).

### Step 2: Set DATABASE_URL with IAM token

In a **second** terminal, do **not** use a static password. Set the URL with a fresh IAM token:

```powershell
cd D:\AI_Hackathon_CDSS
.\scripts\set_db_url_iam.ps1
```

Then run migrations and seed:

```powershell
.\scripts\run_migrations_and_seed.ps1
```

(If you run `run_migrations_and_seed.ps1` in the same terminal right after `set_db_url_iam.ps1`, `DATABASE_URL` is already set with the token.)

### Step 3: RDS IAM grant (one-time)

In the same terminal (so `DATABASE_URL` with IAM token is still set):

```powershell
.\scripts\run_rds_iam_grant.ps1
```

This runs `GRANT rds_iam TO cdssadmin` so Lambda can use IAM auth.

### Step 4: Verify

1. Open the deployed dashboard (e.g. https://d2yy4v2hr1otkm.cloudfront.net).
2. Call the health endpoint:  
   `https://b1q9qcuqia.execute-api.ap-south-1.amazonaws.com/dev/health`  
   You should see `"database": "connected"`.
3. Refresh the dashboard; the yellow banner should be gone and you should see real data.

---

## If SSH tunnel fails (connection timed out)

Per **DEBUGGING_REPORT_2026_03_08.md §6**:

- Your machine may not reach the bastion on **port 22** (firewall, VPN, or `bastion_allowed_cidr` does not include your current IP).
- **Fix:** Use the **SSM tunnel** instead: `.\scripts\start_ssm_tunnel.ps1`. It uses AWS Systems Manager over **HTTPS (443)**.
- Optional: Update your IP in `infrastructure/terraform.tfvars` (`bastion_allowed_cidr = "YOUR_IP/32"`), run `terraform apply`, then you can use `.\scripts\start_ssh_tunnel.ps1` again.

---

## If migrations fail (PAM / password authentication failed)

Per **DEBUGGING_REPORT_2026_03_08.md §2, §5**:

- Aurora has IAM auth enabled; a static password in `.env` is **ignored**.
- **Fix:** Use **IAM token** only. Run `.\scripts\set_db_url_iam.ps1` in the same terminal before migrations/seed, or use `.\scripts\connect_backend_to_db.ps1` which does this for you. Do **not** rely on `DATABASE_URL=...***REDACTED***...` in `.env` for Aurora.

---

## Summary

| Method | Command |
|--------|--------|
| **One-shot** | `.\scripts\connect_backend_to_db.ps1` (SSH tunnel to deployed Aurora + IAM token + migrations + seed + RDS IAM grant) |
| **Manual tunnel** | `.\scripts\start_ssh_tunnel.ps1` (uses Terraform outputs; ensure bastion_allowed_cidr and SSH key) |
| **Manual DB** | `.\scripts\set_db_url_iam.ps1` then `.\scripts\run_migrations_and_seed.ps1` then `.\scripts\run_rds_iam_grant.ps1` |

No need to restart the API or redeploy: Lambda will use the existing secret and, after the IAM grant, connect to Aurora on the next request.
