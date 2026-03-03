"""Scheduling agent handler - schedule, slots (Phase 6 stubs)."""

import json

MOCK_SCHEDULE = [
    {"id": "slot-1", "ot": "OT-1", "date": "2026-03-05", "time": "09:00", "surgeryId": "SRG-001", "patient": "Arjun Nair", "status": "confirmed"},
    {"id": "slot-2", "ot": "OT-1", "date": "2026-03-06", "time": "10:00", "surgeryId": "SRG-002", "patient": "Lakshmi Devi", "status": "confirmed"},
]


def handler(event, context):
    try:
        if (event.get("httpMethod") or "GET").upper() != "GET":
            return _json(405, {"error": "Method not allowed"})
        proxy = (event.get("pathParameters") or {}).get("proxy") or ""
        parts = [p for p in proxy.split("/") if p]
        if len(parts) < 2 or parts[0].lower() != "v1" or parts[1].lower() != "schedule":
            return _json(404, {"error": "Not found"})
        return _json(200, {"schedule": MOCK_SCHEDULE})
    except Exception as e:
        return _json(500, {"error": str(e)})


def _json(status: int, body: dict):
    return {"statusCode": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(body)}
