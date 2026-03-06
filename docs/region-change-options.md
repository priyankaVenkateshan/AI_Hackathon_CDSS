# Region Change Options (Keep Existing vs Move to us-east-1)

AWS resources are **region-bound**: you cannot move an existing RDS cluster, API Gateway, or Lambda from one region to another in place. Below are the only ways to “change region” and how they interact with **keeping existing resources**.

---

## Option A: Keep Existing Resources (Stay in Current Region)

**Use this when:** You want no disruption and to keep using the stack you already have (e.g. in **ap-south-1**).

**What to do:**

- Set **`aws_region`** in `infrastructure/terraform.tfvars` to the **region where the stack already lives** (e.g. `ap-south-1`).
- Run `terraform plan` / `terraform apply` as usual. Terraform will continue to manage the same resources; no replacement, no new region.

**Result:** Existing resources stay where they are. Region in code/config matches reality.

```hcl
# infrastructure/terraform.tfvars
aws_region = "ap-south-1"   # matches existing stack
```

---

## Option B: New Stack in us-east-1 (Keep Old Stack Running)

**Use this when:** You want a **second** stack in us-east-1 (e.g. for testing or a new environment) and are fine keeping the current stack in ap-south-1.

**What to do:**

1. Use a **separate Terraform state** for the us-east-1 stack so it does not overwrite the existing state:
   - **Workspaces:** e.g. `terraform workspace new us-east-1` and set `aws_region = "us-east-1"` in tfvars when using that workspace, **or**
   - **Separate state backend:** different S3 bucket/key (or backend config) for the us-east-1 stack.
2. Set **`aws_region = "us-east-1"`** (in tfvars or a tfvars file used only for this stack).
3. Run `terraform plan` / `terraform apply`. Terraform will **create new resources** in us-east-1.

**Result:** Two stacks: existing one in ap-south-1 (unchanged) and a new one in us-east-1. You manage them with different state (workspace or backend).

**Caveat:** If you use **local state** and only change `aws_region` to us-east-1 **without** a new state/workspace, the next `apply` will try to recreate resources in us-east-1 and can destroy or orphan the ap-south-1 resources in state. So for Option B you must use a separate state or workspace.

---

## Option C: Full Migration to us-east-1 (Move Everything, Decommission Old Region)

**Use this when:** You want to run **only** in us-east-1 and are okay recreating resources and migrating data.

**Steps (high level):**

1. **New stack in us-east-1**
   - Use a **new state** (new workspace or new backend) so the existing ap-south-1 state is not touched.
   - Set `aws_region = "us-east-1"` for this state.
   - Run `terraform apply` to create the full stack in us-east-1 (new Aurora, API Gateway, Lambda, S3, etc.).

2. **Migrate data**
   - **Aurora:** Export from ap-south-1 (e.g. `pg_dump` or Aurora snapshot restore to us-east-1), then run CDSS migrations on the new DB if needed.
   - **S3:** Copy objects from ap-south-1 buckets to the new us-east-1 buckets (e.g. `aws s3 sync` or replication).
   - **Secrets Manager:** Recreate or copy secret values into the new region if needed.

3. **Switch traffic**
   - Point clients (frontend, API consumers) to the new API Gateway URL (and new Cognito if recreated) in us-east-1.
   - Update any config (e.g. env vars, Parameter Store) to use the new endpoints.

4. **Decommission ap-south-1 (optional)**
   - When the new stack is fully in use, destroy the old stack using the **original** state (ap-south-1), or leave it read-only for a while.

**Result:** Single stack in us-east-1; old ap-south-1 stack can be destroyed or kept as backup.

---

## Summary

| Goal | Action |
|------|--------|
| **Keep existing resources, no region change** | Set `aws_region` in tfvars to current region (e.g. `ap-south-1`). Use same state. |
| **Also have a stack in us-east-1** | New state or workspace; set `aws_region = "us-east-1"` for that state. Apply to create new resources in us-east-1. |
| **Everything in us-east-1 only** | Option C: new state → create stack in us-east-1 → migrate data → switch traffic → optionally destroy old stack. |

**Important:** Changing only `aws_region` in tfvars **without** a separate state/workspace will make Terraform plan to create resources in the new region and destroy or replace the old ones. To keep existing resources, either keep `aws_region` equal to the current region (Option A) or use a separate state/workspace for the new region (Option B or C).
