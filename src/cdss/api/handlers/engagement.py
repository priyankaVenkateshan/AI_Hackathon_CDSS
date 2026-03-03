"""Engagement agent handler - medications, reminders (Phase 7 stubs)."""

import json

MOCK_MEDICATIONS = [
    {"id": "MED-001", "patient": "Rajesh Kumar", "medication": "Metformin 500mg", "frequency": "Twice daily", "nextDose": "2026-03-01T13:00:00", "status": "on-time", "interactions": []},
    {"id": "MED-002", "patient": "Rajesh Kumar", "medication": "Amlodipine 10mg", "frequency": "Once daily", "nextDose": "2026-03-01T08:00:00", "status": "overdue", "interactions": []},
    {"id": "MED-003", "patient": "Lakshmi Devi", "medication": "Warfarin 5mg", "frequency": "Once daily", "nextDose": "2026-03-01T20:00:00", "status": "on-time", "interactions": ["Aspirin — HIGH RISK"]},
    {"id": "MED-004", "patient": "Lakshmi Devi", "medication": "Digoxin 0.25mg", "frequency": "Once daily", "nextDose": "2026-03-01T09:00:00", "status": "given", "interactions": []},
]


def handler(event, context):
    try:
        method = (event.get("httpMethod") or "GET").upper()
        proxy = (event.get("pathParameters") or {}).get("proxy") or ""
        parts = [p for p in proxy.split("/") if p]
        if len(parts) < 2 or parts[0].lower() != "v1":
            return _json(404, {"error": "Not found"})

        if parts[1].lower() == "medications":
            if method == "GET":
                return _json(200, {"medications": MOCK_MEDICATIONS})
            return _json(405, {"error": "Method not allowed"})

        if parts[1].lower() == "reminders":
            if method == "POST":
                if len(parts) > 2 and parts[2].lower() == "nudge":
                    return _json(200, {"ok": True, "message": "Nudge sent"})
                return _json(200, {"ok": True, "message": "Reminder scheduled"})
            return _json(405, {"error": "Method not allowed"})

        return _json(404, {"error": "Not found"})
    except Exception as e:
        return _json(500, {"error": str(e)})


def _json(status: int, body: dict):
    return {"statusCode": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(body)}
