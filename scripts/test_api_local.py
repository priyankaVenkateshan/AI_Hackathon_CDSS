#!/usr/bin/env python3
"""
Test CDSS API handlers locally (no AWS deploy needed).
Run from repo root: python scripts/test_api_local.py

Uses mock API Gateway events and optional Cognito-style claims.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

# Add src so we can import cdss
REPO_ROOT = Path(__file__).resolve().parent.parent
SRC = REPO_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))


def make_event(path_proxy: str, method: str = "GET", claims: dict | None = None):
    claims = claims or {}
    return {
        "httpMethod": method,
        "path": f"/dev/api/{path_proxy}",
        "pathParameters": {"proxy": path_proxy},
        "requestContext": {
            "path": f"/dev/api/{path_proxy}",
            "authorizer": {"claims": claims} if claims else {},
        },
        "body": None,
        "queryStringParameters": None,
    }


def main():
    from cdss.api.handlers.router import handler as router_handler

    admin_claims = {
        "sub": "admin-1",
        "email": "admin@cdss.ai",
        "custom:role": "admin",
        "cognito:username": "admin@cdss.ai",
    }
    doctor_claims = {
        "sub": "doc-1",
        "email": "priya@cdss.ai",
        "custom:role": "doctor",
        "cognito:username": "priya@cdss.ai",
    }

    tests = [
        ("GET /api/v1/patients", make_event("v1/patients", "GET", doctor_claims)),
        ("GET /api/v1/patients/PT-1001", make_event("v1/patients/PT-1001", "GET", doctor_claims)),
        ("GET /api/v1/surgeries", make_event("v1/surgeries", "GET", doctor_claims)),
        ("GET /api/v1/surgeries/SRG-001", make_event("v1/surgeries/SRG-001", "GET", doctor_claims)),
        ("GET /api/v1/resources", make_event("v1/resources", "GET", doctor_claims)),
        ("GET /api/v1/medications", make_event("v1/medications", "GET", doctor_claims)),
        ("GET /api/v1/schedule", make_event("v1/schedule", "GET", doctor_claims)),
        ("GET /api/v1/admin/audit", make_event("v1/admin/audit", "GET", admin_claims)),
        ("GET /api/v1/admin/users", make_event("v1/admin/users", "GET", admin_claims)),
        ("GET /api/v1/admin/config", make_event("v1/admin/config", "GET", admin_claims)),
        ("GET /api/v1/admin/analytics", make_event("v1/admin/analytics", "GET", admin_claims)),
        ("GET /api/v1/admin/resources", make_event("v1/admin/resources", "GET", admin_claims)),
    ]

    print("CDSS API – local handler test\n" + "=" * 50)
    for label, event in tests:
        try:
            result = router_handler(event, None)
            status = result.get("statusCode", "?")
            body = result.get("body", "{}")
            if isinstance(body, str):
                try:
                    body = json.loads(body)
                except Exception:
                    pass
            body_str = json.dumps(body)
            body_preview = body_str[:200] + ("..." if len(body_str) > 200 else "")
            print(f"\n{label}")
            print(f"  Status: {status}")
            print(f"  Body:   {body_preview}")
        except Exception as e:
            print(f"\n{label}")
            print(f"  ERROR: {e}")
    print("\n" + "=" * 50 + "\nDone.")


if __name__ == "__main__":
    main()
