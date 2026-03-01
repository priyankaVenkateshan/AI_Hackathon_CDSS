# Infrastructure

Unified Terraform configuration for **CDSS (Clinical Decision Support System)** and **Emergency Medical Triage** on AWS (ap-south-1, DISHA-aligned).

## Resources

| Resource | Description |
|----------|-------------|
| **VPC** | 10.0.0.0/16, 2 private subnets (RDS), optional bastion |
| **RDS Aurora** | PostgreSQL 15.10, Serverless v2, `cdssdb`, encrypted, IAM auth, private subnets |
| **S3** | Main bucket (backups, audit, media) + `documents` + `corpus` buckets; versioning and AES256 |
| **Bedrock** | IAM policy for invoking models (ap-south-1 + us-east-1/2, us-west-2); enable in Console |
| **API Gateway** | Single REST API: `/health`, `/triage`, `/api/{proxy+}` → CDSS router Lambda |
| **Lambda** | Health (Node), Triage (Python, optional build from `src/triage`), CDSS agents (Python, from `src/cdss`) |
| **DynamoDB** | Sessions, medication_schedules, patients, consultations, ot_slots, equipment, protocols (pay-per-request) |
| **EventBridge** | Event bus for async inter-agent messaging |
| **Secrets Manager** | Bedrock config, RDS config (no password in secret; use IAM auth) |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- AWS CLI configured with credentials
- Python 3.12 (for CDSS Lambda source under `src/`)

## Usage

1. Copy the example tfvars and set DB credentials:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars: db_username, db_password
   ```

2. Optional: configure remote backend (e.g. S3) via `backend.tfvars` or `-backend-config`:
   ```bash
   terraform init -backend-config=bucket=YOUR_TFSTATE_BUCKET -backend-config=key=cdss/terraform.tfstate -backend-config=region=ap-south-1
   ```
   Or use local backend: `terraform init`

3. Plan and apply:
   ```bash
   terraform plan
   terraform apply
   ```

4. **Bedrock**: In AWS Console → Bedrock → Model access → Enable Claude (or desired model) in **ap-south-1**.

5. **Aurora**: Cluster is in private subnets. To connect, use bastion (`enable_bastion=true`), VPN, or run Lambdas in VPC. IAM DB auth is enabled. One-time: connect with password and run `GRANT rds_iam TO <db_username>;`. Then enable **pgvector**: `CREATE EXTENSION IF NOT EXISTS vector;`

6. **Triage** (optional): Set `enable_triage = true` in tfvars only when you have real triage source under `src/triage` and `scripts/build_triage_lambda.sh`. Stub files exist so Terraform validates when `enable_triage = false` (default).

## Layout

- **infrastructure/** – Terraform root (this folder)
- **infrastructure/modules/** – `lambda`, `dynamodb`, `eventbridge` (and `api_gateway` for reference)
- **src/cdss/** – CDSS Lambda handlers (router, supervisor, patient, surgery, resource, scheduling, engagement); packaged into zip for deployment

## Outputs

After apply:

- `api_gateway_url`, `api_gateway_health_url`, `api_gateway_cdss_url`
- `aurora_cluster_endpoint`, `aurora_cluster_reader_endpoint`, `aurora_database_name`
- `s3_bucket_name`, `s3_bucket_arn`, `s3_bucket_documents`, `s3_bucket_corpus`
- `bedrock_policy_arn`, `bedrock_config_secret_name`, `rds_config_secret_name`
- `cdss_lambda_function_names`, `cdss_dynamodb_tables`, `cdss_event_bus_name`
- `bastion_public_ip` (when `enable_bastion=true`)
