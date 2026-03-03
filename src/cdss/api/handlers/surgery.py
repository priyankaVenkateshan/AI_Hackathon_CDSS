"""Surgery agent handler - surgery list, detail, checklists (Phase 4 stubs)."""

import json

# Mock data until RDS is wired (aligned with frontend mockData)
MOCK_SURGERIES = [
    {"id": "SRG-001", "patient": "Arjun Nair", "type": "ACL Reconstruction", "complexity": "Moderate", "estimatedDuration": "90 min", "ot": "OT-3", "date": "2026-03-05", "time": "09:00", "status": "scheduled", "surgeon": "Dr. Vikram Patel"},
    {"id": "SRG-002", "patient": "Lakshmi Devi", "type": "Cardiac Catheterization", "complexity": "High", "estimatedDuration": "120 min", "ot": "OT-1", "date": "2026-03-06", "time": "10:00", "status": "pre-op", "surgeon": "Dr. Meena Rao"},
    {"id": "SRG-003", "patient": "Unknown", "type": "Appendectomy", "complexity": "Low", "estimatedDuration": "60 min", "ot": "OT-2", "date": "2026-03-04", "time": "14:00", "status": "in-prep", "surgeon": "Dr. Priya Sharma"},
]

DEFAULT_CHECKLIST = [
    {"id": 1, "text": "Confirm patient identity, site, and procedure", "completed": False},
    {"id": 2, "text": "Marking of surgical site complete", "completed": False},
    {"id": 3, "text": "Anesthesia safety check complete", "completed": False},
    {"id": 4, "text": "Pulse oximeter on patient and functioning", "completed": False},
    {"id": 5, "text": "Antibiotic prophylaxis administered", "completed": False},
    {"id": 6, "text": "Confirmation of sterility indicators", "completed": False},
]


def handler(event, context):
    """Handle GET /api/v1/surgeries and GET /api/v1/surgeries/:id."""
    try:
        method = (event.get("httpMethod") or "GET").upper()
        if method != "GET":
            return _json(405, {"error": "Method not allowed"})

        proxy = (event.get("pathParameters") or {}).get("proxy") or ""
        parts = [p for p in proxy.split("/") if p]
        # v1/surgeries or v1/surgeries/SRG-001
        if len(parts) < 2 or parts[0].lower() != "v1" or parts[1].lower() != "surgeries":
            return _json(404, {"error": "Not found"})
        surgery_id = parts[2] if len(parts) > 2 else None
        if surgery_id:
            return _get_surgery(surgery_id)
        return _list_surgeries()
    except Exception as e:
        return _json(500, {"error": str(e)})


def _list_surgeries():
    return _json(200, {"surgeries": MOCK_SURGERIES})


def _get_surgery(surgery_id: str):
    for s in MOCK_SURGERIES:
        if s["id"] == surgery_id:
            out = dict(s)
            out["checklist"] = DEFAULT_CHECKLIST
            out["requiredInstruments"] = ["Standard surgical set", "Electrocautery", "Suction", "Suture kit"]
            return _json(200, out)
    return _json(404, {"error": "Surgery not found"})


def _json(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
