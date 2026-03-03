"""Admin API handler - users, audit log, system config, analytics (Phase 10 stubs)."""

import json
from datetime import datetime, timezone

# Stub data until RDS/Cognito list APIs are wired
MOCK_AUDIT = [
    {"id": 1, "user_id": "u1", "user_email": "priya@cdss.ai", "action": "VIEW_PATIENT", "resource": "PT-1001", "timestamp": "2026-03-01T10:15:00Z"},
    {"id": 2, "user_id": "u2", "user_email": "vikram@cdss.ai", "action": "UPDATE_SURGERY", "resource": "SRG-001", "timestamp": "2026-03-01T09:45:00Z"},
    {"id": 3, "user_id": "u4", "user_email": "admin@cdss.ai", "action": "LOGIN", "resource": "—", "timestamp": "2026-03-01T08:00:00Z"},
]

MOCK_USERS = [
    {"id": "u1", "name": "Dr. Priya Sharma", "email": "priya@cdss.ai", "role": "doctor", "status": "active"},
    {"id": "u2", "name": "Dr. Vikram Patel", "email": "vikram@cdss.ai", "role": "surgeon", "status": "active"},
    {"id": "u3", "name": "Nurse Anjali", "email": "anjali@cdss.ai", "role": "nurse", "status": "active"},
    {"id": "u4", "name": "Admin Sameer", "email": "admin@cdss.ai", "role": "admin", "status": "active"},
]

MOCK_CONFIG = {
    "mcpHospitalEndpoint": "https://hospital-api.example.com",
    "mcpAbdmEndpoint": "https://abdm.example.com",
    "featureFlags": {"aiAssist": True, "voiceInput": False},
}

MOCK_ANALYTICS = {
    "otUtilization": [{"ot": "OT-1", "percent": 78}, {"ot": "OT-2", "percent": 45}, {"ot": "OT-3", "percent": 90}],
    "otRecommendations": "OT-2 underutilized (45%). Consider moving elective cases from OT-1 to balance load.",
    "otConflicts": [],
    "agentUsage": [{"agent": "Patient", "calls": 120}, {"agent": "Surgery", "calls": 34}, {"agent": "Engagement", "calls": 89}],
    "reminderStats": {"sent": 56, "acknowledged": 48, "overdue": 8},
}


def handler(event, context):
    """Handle GET/PUT /api/v1/admin/*. RBAC already enforced by router (admin only)."""
    try:
        method = (event.get("httpMethod") or "GET").upper()
        proxy = (event.get("pathParameters") or {}).get("proxy") or ""
        parts = [p for p in proxy.split("/") if p]

        # v1/admin or v1/admin/audit, v1/admin/users, v1/admin/config, v1/admin/analytics
        if len(parts) < 2 or parts[0].lower() != "v1" or parts[1].lower() != "admin":
            return _json(404, {"error": "Not found"})

        sub = parts[2].lower() if len(parts) > 2 else ""
        if not sub:
            return _json(200, {"admin": True, "endpoints": ["audit", "users", "config", "analytics"]})

        if sub == "audit":
            limit = _query_int(event, "limit", 100)
            items = MOCK_AUDIT[:limit]
            return _json(200, {"items": items})
        if sub == "users":
            return _json(200, {"users": MOCK_USERS})
        if sub == "config":
            if method == "GET":
                return _json(200, MOCK_CONFIG)
            if method == "PUT":
                body = _body_json(event)
                if body:
                    MOCK_CONFIG.update(body)
                return _json(200, MOCK_CONFIG)
            return _json(405, {"error": "Method not allowed"})
        if sub == "analytics":
            return _json(200, MOCK_ANALYTICS)
        if sub == "resources":
            return _json(200, {"resources": []})

        return _json(404, {"error": "Not found"})
    except Exception as e:
        return _json(500, {"error": str(e)})


def _json(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }


def _body_json(event):
    try:
        b = event.get("body")
        return json.loads(b) if isinstance(b, str) else (b or {})
    except Exception:
        return {}


def _query_int(event, key: str, default: int):
    try:
        q = (event.get("queryStringParameters") or {}) or {}
        v = q.get(key)
        return int(v) if v is not None else default
    except (TypeError, ValueError):
        return default
