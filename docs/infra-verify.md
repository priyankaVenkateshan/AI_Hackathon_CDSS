# Infrastructure verification (infra-verify)

Use this checklist to verify the CDSS backend agent layer infrastructure. Aligns with [.cursor/rules/terraform-standards.mdc](../.cursor/rules/terraform-standards.mdc).

## 1. Region

- **Default:** `var.aws_region` in `infrastructure/variables.tf` defaults to `us-east-1`.
- **Override:** Set in `terraform.tfvars` (gitignored) or `TF_VAR_aws_region` for India/compliance (e.g. `ap-south-1`).
- **Verify:** `cd infrastructure && terraform console` then `var.aws_region` (or inspect `variables.tf`).
- **Keep existing resources:** If your stack was created in a specific region (e.g. `ap-south-1`), set `aws_region` in `terraform.tfvars` to that region so plan/apply do not replace resources. See [Region change options](region-change-options.md) if you want to move to another region (us-east-1) while keeping or migrating resources.

## 2. Terraform plan

From repo root:

```bash
cd infrastructure
terraform init -reconfigure
terraform validate
terraform plan -input=false -no-color
```

- **Expect:** No syntax errors; plan may show 0 changes if state is current, or changes only for new resources.
- **Secrets:** Do not commit `terraform.tfvars`; use `terraform.tfvars.example` as template.

## 3. Agent-related resources (must exist in plan/state)

| Resource | Terraform address | Standards check |
|----------|-------------------|-----------------|
| **EventBridge bus** | `module.cdss_eventbridge.aws_cloudwatch_event_bus.cdss` | Naming: `local.name_prefix` (e.g. cdss-events-dev) |
| **SQS agent_events** | `aws_sqs_queue.agent_events` | Naming, DLQ via redrive policy |
| **SQS agent_events_dlq** | `aws_sqs_queue.agent_events_dlq` | DLQ for failed messages |
| **SNS patient_reminders** | `aws_sns_topic.patient_reminders` | Naming |
| **SNS doctor_escalations** | `aws_sns_topic.doctor_escalations` | Naming |
| **Aurora cluster** | `aws_rds_cluster.aurora` | Encryption: `storage_encrypted = true`, IAM auth enabled |
| **S3 main** | `aws_s3_bucket.main` | Encryption, public access block |
| **S3 documents** | `aws_s3_bucket.documents` | Encryption, public access block |
| **S3 corpus** | `aws_s3_bucket.corpus` | Encryption, public access block |
| **SSM parameters** | `aws_ssm_parameter.transcriptions_enabled` etc. | Under `/cdss/*` |
| **Secrets Manager bedrock_config** | `aws_secretsmanager_secret.bedrock_config` | No secrets in .tf |
| **Secrets Manager rds_config** | `aws_secretsmanager_secret.rds_config` | No secrets in .tf |

## 4. Terraform standards alignment

- **Naming:** Resources use `local.name_prefix` (`${var.project_name}-${var.environment}`). Tags: Name, Project, Environment where applicable.
- **Security:** No secrets in `.tf`; sensitive values in variables with `sensitive = true` and supplied via tfvars/env.
- **Encryption:** RDS `storage_encrypted = true`; S3 buckets have `server_side_encryption_configuration` and `public_access_block`.
- **Structure:** One resource type per file where practical (s3.tf, rds.tf, secrets.tf, etc.); `terraform.tfvars.example` as template.
- **Observability:** API Gateway and Lambda are part of clinical flows; ensure CloudWatch Logs and any required retention are enabled (see project observability docs).

## 5. Quick verification commands

```bash
cd infrastructure
terraform output
terraform state list | findstr -i "eventbridge sqs sns rds s3 ssm secrets"
```

Expected outputs include: `cdss_event_bus_name`, `aurora_cluster_endpoint`, `s3_bucket_name`, `s3_bucket_documents`, `s3_bucket_corpus`, `bedrock_config_secret_name`, `rds_config_secret_name`, and from notifications: `sqs_queue_url`, `sns_patient_reminders_arn`, `sns_doctor_escalations_arn`.

## Sign-off

- [ ] Region confirmed (us-east-1 or intended override).
- [ ] `terraform validate` and `terraform plan` succeed.
- [ ] All agent-related resources above exist in plan/state.
- [ ] Terraform standards (naming, security, encryption, structure) met.
