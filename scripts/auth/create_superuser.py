#!/usr/bin/env python3
"""
Create or update a Cognito user with the superuser role (full access).

No console required: uses boto3 to create the user and set custom:role=superuser.
User Pool ID can come from env, Terraform output, or Secrets Manager app-config.

Usage:
  # From repo root (picks up Terraform output if run from infrastructure/)
  python scripts/auth/create_superuser.py --email superuser@cdss.ai --password 'YourSecurePassword'

  # With explicit User Pool ID
  COGNITO_USER_POOL_ID=ap-south-1_xxxxxxxxx python scripts/auth/create_superuser.py \\
    --email superuser@cdss.ai --password 'YourSecurePassword'

  # Update existing user to superuser (keeps current password if you omit --password)
  python scripts/auth/create_superuser.py --email admin@cdss.ai --set-role-only

Environment:
  COGNITO_USER_POOL_ID  Optional; can also get from Terraform (cd infrastructure && terraform output -raw cognito_user_pool_id)
  AWS_REGION            Default ap-south-1
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _get_user_pool_id_from_terraform() -> str | None:
    """Try to get cognito_user_pool_id from Terraform output."""
    infra = _REPO_ROOT / "infrastructure"
    if not (infra / "terraform.tfstate").exists() and not (infra / ".terraform").exists():
        return None
    try:
        out = subprocess.run(
            ["terraform", "output", "-raw", "cognito_user_pool_id"],
            cwd=infra,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if out.returncode == 0 and out.stdout:
            return out.stdout.strip()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return None


def _get_user_pool_id_from_secrets() -> str | None:
    """Try to get cognito_user_pool_id from CDSS app config secret."""
    try:
        import boto3
        secret_name = os.environ.get("CDSS_APP_CONFIG_SECRET_NAME", "cdss-dev/app-config")
        region = os.environ.get("AWS_REGION", "ap-south-1")
        client = boto3.client("secretsmanager", region_name=region)
        resp = client.get_secret_value(SecretId=secret_name)
        import json
        data = json.loads(resp.get("SecretString", "{}"))
        return (data.get("cognito_user_pool_id") or "").strip() or None
    except Exception:
        return None


def ensure_superuser(
    user_pool_id: str,
    email: str,
    password: str | None = None,
    set_role_only: bool = False,
    region: str = "ap-south-1",
) -> str:
    """
    Create or update a Cognito user with custom:role=superuser.

    :param user_pool_id: Cognito User Pool ID
    :param email: User email (used as username)
    :param password: Permanent password (required unless set_role_only and user exists)
    :param set_role_only: If True, only update custom:role; do not set password (user must already exist)
    :param region: AWS region
    :return: Message string (e.g. "Created" or "Updated")
    :raises: RuntimeError on failure
    """
    try:
        import boto3
    except ImportError:
        raise RuntimeError("boto3 is required. Install with: pip install boto3") from None

    client = boto3.client("cognito-idp", region_name=region)
    username = email.strip().lower()

    user_attributes = [
        {"Name": "email", "Value": username},
        {"Name": "email_verified", "Value": "true"},
        {"Name": "custom:role", "Value": "superuser"},
    ]

    # Check if user exists
    try:
        client.admin_get_user(UserPoolId=user_pool_id, Username=username)
        user_exists = True
    except client.exceptions.UserNotFoundException:
        user_exists = False

    if user_exists:
        if set_role_only:
            client.admin_update_user_attributes(
                UserPoolId=user_pool_id,
                Username=username,
                UserAttributes=[
                    {"Name": "custom:role", "Value": "superuser"},
                ],
            )
            return "Updated existing user to superuser role (custom:role=superuser)."
        # Update role and optionally set new password
        client.admin_update_user_attributes(
            UserPoolId=user_pool_id,
            Username=username,
            UserAttributes=[{"Name": "custom:role", "Value": "superuser"}],
        )
        if password:
            client.admin_set_user_password(
                UserPoolId=user_pool_id,
                Username=username,
                Password=password,
                Permanent=True,
            )
            return "Updated existing user to superuser role and set new password."
        return "Updated existing user to superuser role (password unchanged)."

    # Create new user
    if not password:
        raise RuntimeError("Password required when creating a new user (or use --set-role-only for existing user).")

    client.admin_create_user(
        UserPoolId=user_pool_id,
        Username=username,
        UserAttributes=user_attributes,
        TemporaryPassword=password,
        MessageAction="SUPPRESS",
    )
    # Set permanent password immediately so user is not forced to change on first login
    client.admin_set_user_password(
        UserPoolId=user_pool_id,
        Username=username,
        Password=password,
        Permanent=True,
    )
    return "Created new superuser and set permanent password."


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create or update a Cognito user with superuser role (no console).",
    )
    parser.add_argument(
        "--email",
        default=os.environ.get("SUPERUSER_EMAIL", "superuser@cdss.ai"),
        help="User email (Username in Cognito). Default: superuser@cdss.ai or SUPERUSER_EMAIL",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("SUPERUSER_PASSWORD", ""),
        help="Password (required for new user). Use SUPERUSER_PASSWORD in CI.",
    )
    parser.add_argument(
        "--user-pool-id",
        default=(
            os.environ.get("COGNITO_USER_POOL_ID")
            or _get_user_pool_id_from_terraform()
            or _get_user_pool_id_from_secrets()
        ),
        help="Cognito User Pool ID (default: env, Terraform output, or app-config secret)",
    )
    parser.add_argument(
        "--set-role-only",
        action="store_true",
        help="Only set custom:role=superuser on an existing user; do not create or change password",
    )
    parser.add_argument(
        "--region",
        default=os.environ.get("AWS_REGION", "ap-south-1"),
        help="AWS region (default: ap-south-1)",
    )
    args = parser.parse_args()

    user_pool_id = (args.user_pool_id or "").strip()
    email = (args.email or "").strip()
    password = (args.password or "").strip() or None

    if not user_pool_id:
        print(
            "Error: Cognito User Pool ID required. Set COGNITO_USER_POOL_ID or run from repo with Terraform state, or pass --user-pool-id.",
            file=sys.stderr,
        )
        return 1
    if not email:
        print("Error: --email or SUPERUSER_EMAIL required.", file=sys.stderr)
        return 1
    if not args.set_role_only and not password:
        print(
            "Error: --password or SUPERUSER_PASSWORD required when creating a new user (omit --set-role-only to create).",
            file=sys.stderr,
        )
        return 1

    try:
        msg = ensure_superuser(
            user_pool_id=user_pool_id,
            email=email,
            password=password,
            set_role_only=args.set_role_only,
            region=args.region,
        )
        print(msg)
        print(f"  User: {email}")
        print(f"  Pool: {user_pool_id}")
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
