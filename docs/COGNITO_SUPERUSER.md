# Creating a Superuser in Cognito

The CDSS backend supports a **superuser** role with full access: all admin endpoints and no patient-scope restrictions (can list all patients and access any patient record).

## Create superuser from the command line (no console)

From the repo root, with AWS credentials configured:

```bash
# Create a new superuser (default email: superuser@cdss.ai)
cd infrastructure && terraform output -raw cognito_user_pool_id
cd ..
export COGNITO_USER_POOL_ID=<paste the id>
python scripts/auth/create_superuser.py --email superuser@cdss.ai --password 'YourSecurePassword'
```

If Terraform state is available, the script can read the User Pool ID automatically:

```bash
python scripts/auth/create_superuser.py --email superuser@cdss.ai --password 'YourSecurePassword'
```

**Password:** Must meet the User Pool’s password policy (e.g. length, numeric and symbol characters). If you see `InvalidPasswordException`, use a stronger password (e.g. `YourSecurePassword1!`).

**Email-alias pools:** If the pool uses email as an alias, the script uses a UUID for the internal Cognito username; sign-in remains with the email above.

**Options:**

| Option | Description |
|--------|-------------|
| `--email` | Email (username). Default: `superuser@cdss.ai` or env `SUPERUSER_EMAIL` |
| `--password` | Password (required for new user). Or set `SUPERUSER_PASSWORD` |
| `--user-pool-id` | Cognito User Pool ID (or set `COGNITO_USER_POOL_ID`; script also tries Terraform output and app-config secret) |
| `--set-role-only` | Only set `custom:role=superuser` on an **existing** user; do not create or change password |
| `--region` | AWS region (default: `ap-south-1`) |

**Examples:**

```bash
# New superuser with custom email
python scripts/auth/create_superuser.py --email admin@hospital.in --password 'SecurePass123!'

# Promote existing user to superuser (password unchanged)
python scripts/auth/create_superuser.py --email admin@cdss.ai --set-role-only

# CI: use env vars
COGNITO_USER_POOL_ID=ap-south-1_xxx SUPERUSER_EMAIL=ops@cdss.ai SUPERUSER_PASSWORD=secret python scripts/auth/create_superuser.py
```

---

## Backend behavior

- **Router** (`src/cdss/api/handlers/router.py`): Role is read from JWT claim `custom:role` (or `role`).
- **Admin paths** (`/api/v1/admin`, `/admin`): Allowed for `admin` or `superuser`.
- **Patient scoping**: Applied only when `role == "patient"`. The `superuser` role is never restricted by patient scope.

---

## AWS Console (optional)

If you prefer to create the user in the console instead of the script:

1. Open **AWS Cognito** → your User Pool (e.g. `cdss-dev-user-pool`).
2. Go to **Users** → **Create user**.
3. Enter email (e.g. `superuser@cdss.ai`), temporary password, and mark **Send an email message** if desired.
4. After the user is created, open the user → **Edit** (or **Edit attribute**).
5. Add or edit the custom attribute **`custom:role`** and set its value to **`superuser`**.
6. Save. The user can sign in; after first login they may be required to set a new password.

### Option 2: AWS CLI (manual)

Replace `USER_POOL_ID` and email/password with your values:

```bash
USER_POOL_ID="ap-south-1_xxxxxxxxx"
EMAIL="superuser@cdss.ai"
TEMP_PASSWORD="ChangeMe123!"

aws cognito-idp admin-create-user \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true Name=custom:role,Value=superuser \
  --temporary-password "$TEMP_PASSWORD" \
  --message-action SUPPRESS
```

To set `custom:role` on an **existing** user:

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id "$USER_POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=custom:role,Value=superuser
```

## Frontend (mock / local)

When Cognito is disabled (e.g. local mock), the doctor dashboard's `AuthContext` includes a mock superuser:

- **Email:** `superuser@cdss.ai`
- **Password:** `***REDACTED***`
- **Role:** `superuser`

With Cognito enabled, use the same email/password for the Cognito user that has `custom:role = superuser`.

## Summary

| Where        | How superuser is defined |
|-------------|---------------------------|
| Backend     | JWT claim `custom:role` = `superuser`; allowed on admin paths and not restricted by patient scope. |
| Cognito     | User attribute `custom:role` = `superuser`. |
| Frontend    | `roles.SUPERUSER`; same UI as admin (admin nav, "Super Administrator" title). |
