# Fix "Database temporarily unavailable" and make buttons work

When the Doctor Dashboard shows **"Database temporarily unavailable. Check RDS connectivity and tunnel"**, the Lambda cannot reach Aurora or IAM auth is not set up. Do the following so **Start consultation**, **New Prescription**, **Surgery Readiness**, and patient data all work.

---

## 1. One-time: RDS IAM grant (required for Lambda)

Lambda connects to Aurora using **IAM authentication**. The database user must have the `rds_iam` role granted **once**. After that, Lambda can connect without a password.

**Steps:**

1. **Start the SSH tunnel** so you can reach Aurora from your machine:
   ```powershell
   cd D:\AI_Hackathon_CDSS
   .\scripts\start_ssh_tunnel.ps1
   ```
   Leave this terminal open. The tunnel maps `localhost:5433` → Aurora:5432.

2. **Set `DATABASE_URL`** in the repo root `.env` (create from `.env.example` if needed). Use the **master password** from your `terraform.tfvars` (`db_password`):
   ```
   DATABASE_URL=postgresql://cdssadmin:YOUR_MASTER_PASSWORD@localhost:5433/cdssdb
   ```
   Use the same `cdssadmin` (or your `db_username`) and password that Terraform used to create the cluster.

3. **Run the IAM grant script** (one-time):
   ```powershell
   .\scripts\run_rds_iam_grant.ps1
   ```
   You should see: `GRANT rds_iam TO cdssadmin succeeded.`

4. After that, **Lambda** (in AWS) can connect to Aurora using the token from Secrets Manager. You do **not** need to keep the tunnel running for the deployed app; the tunnel is only for this one-time grant (and for local dev).

---

## 2. Ensure Lambda can reach Aurora (already in Terraform)

- Lambda is in the **same VPC** as Aurora (private subnets).
- **Aurora security group** allows inbound 5432 from the **Lambda security group**.
- **Secrets Manager** holds the RDS secret (`cdss-dev/rds-config`) with host, port, database, username (no password; Lambda uses IAM token).

If you changed the VPC or security groups, run **`terraform apply`** from `infrastructure/` so the Lambda role and network are correct.

---

## 3. Connect timeout (Aurora Serverless)

Lambda uses **`DB_CONNECT_TIMEOUT=10`** so Aurora Serverless has a few seconds to wake. If you still see timeouts, check CloudWatch Logs for the `api` or `engagement` Lambda for the exact error.

---

## 4. Verify connection and buttons

1. Open the **Doctor Dashboard** (CloudFront or local with `VITE_API_URL` set to the API Gateway URL).
2. **GET /health** should show `"database": "connected"` once Lambda can reach Aurora.
3. Open **Patients** → select **Mary Kom (PT-1025)**.
4. Click **Start consultation** → you should get **200** and the consultation panel (no "Database temporarily unavailable").
5. **Surgery Readiness (AI Agent)** and **New Prescription** will work once the DB is connected and (for AI) Bedrock is configured.

---

## Summary checklist

| Step | Action |
|------|--------|
| 1 | Start SSH tunnel: `.\scripts\start_ssh_tunnel.ps1` |
| 2 | Set `DATABASE_URL` in `.env` (password = Terraform `db_password`) |
| 3 | Run IAM grant once: `.\scripts\run_rds_iam_grant.ps1` |
| 4 | Redeploy Lambda if you changed env (e.g. timeout): `cd infrastructure; terraform apply -auto-approve` |
| 5 | Test: open patient → **Start consultation** → should succeed |

See also: **`docs/RUN_AFTER_TERRAFORM.md`** (tunnel, migrations, IAM grant), **`docs/DEBUGGING_API_AND_DATABASE.md`** (health, DB, Bedrock).
