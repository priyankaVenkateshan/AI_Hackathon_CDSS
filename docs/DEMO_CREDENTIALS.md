# Demo User Login (Deployed Dashboard)

---

## Quick reference — one portal, two roles

Use **the same deployed URL** (e.g. `https://d2yy4v2hr1otkm.cloudfront.net/login`) for both roles. The app redirects you to the right dashboard based on your role.

| Role | User ID (email) | Password | After login |
|------|------------------|----------|-------------|
| **Admin / Doctor** | `demo@cdss.ai` | `***REDACTED***` | Doctor dashboard → click **Admin** for admin |
| **Patient** | `patient@cdss.ai` | `***REDACTED***` | Patient dashboard |

**One-time setup:** Create both demo users in Cognito (from repo root, AWS configured):

```bash
python scripts/auth/create_superuser.py --demo          # admin/doctor
python scripts/auth/create_superuser.py --demo-patient  # patient
```

---

Use these credentials to log in to the **deployed** app. Both users exist in the same Cognito User Pool; the app sends doctors/admins to the main dashboard and patients to the patient dashboard.

---

## One portal: how to access Admin and Patient

**URL:** Your deployed staff app (e.g. `https://<staff_app_cf_url>` from `terraform output staff_app_cf_url`).

### Admin / Doctor

1. Create the demo user once: `python scripts/auth/create_superuser.py --demo`
2. Open the portal URL → log in with **User ID:** `demo@cdss.ai`, **Password:** `***REDACTED***`
3. After login you see the doctor dashboard. Click **Admin** in the sidebar (or go to `/admin` or `/admin/dashboard`) for the admin dashboard.

### Patient (same portal)

1. Create the demo patient user once: `python scripts/auth/create_superuser.py --demo-patient`
2. Open the **same** portal URL → log in with **User ID:** `patient@cdss.ai`, **Password:** `***REDACTED***`
3. After login you are redirected to the **patient dashboard** (`/patient-portal`). No separate URL.

---

## Demo credentials (same portal)

| Role | Email / User ID | Password |
|------|------------------|----------|
| **Admin / Doctor** | `demo@cdss.ai` | `***REDACTED***` |
| **Patient** | `patient@cdss.ai` | `***REDACTED***` |

---

## Enable demo login on your deployed link

The deployed app uses **AWS Cognito**. Create demo users in your Cognito User Pool once (e.g. after first deploy).

### One-time setup (from repo root, AWS credentials configured)

```bash
# Admin / Doctor (full dashboard + Admin section)
python scripts/auth/create_superuser.py --demo

# Patient (redirects to patient dashboard after login)
python scripts/auth/create_superuser.py --demo-patient
```

Both users use the **same portal URL**; the app redirects by role after login.

### Optional: custom User Pool or region

```bash
# If Terraform state is not available, set the User Pool ID:
export COGNITO_USER_POOL_ID=ap-south-1_xxxxxxxxx
python scripts/auth/create_superuser.py --demo

# Or pass explicitly:
python scripts/auth/create_superuser.py --demo --user-pool-id ap-south-1_xxxxxxxxx --region ap-south-1
```

### Optional: different demo password

```bash
DEMO_PASSWORD='YourOwnDemoPass1!' python scripts/auth/create_superuser.py --demo
```

---

## After setup

1. Open your **deployed app URL** (e.g. `https://d2yy4v2hr1otkm.cloudfront.net/login`).
2. **Admin/Doctor:** Log in with `demo@cdss.ai` / `***REDACTED***` → doctor dashboard → click **Admin** for admin.
3. **Patient:** Log in with `patient@cdss.ai` / `***REDACTED***` → you are taken to the patient dashboard.

---

## Local / mock login (no Cognito)

When running the doctor dashboard **locally without** Cognito (no `VITE_COGNITO_USER_POOL_ID`), the app uses built-in mock users. You can log in with:

- **Email:** `superuser@cdss.ai`
- **Password:** `***REDACTED***`

See [COGNITO_SUPERUSER.md](COGNITO_SUPERUSER.md) for superuser and Cognito details.
