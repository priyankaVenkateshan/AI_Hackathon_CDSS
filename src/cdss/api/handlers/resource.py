"""Resource agent handler - OT, equipment, staff availability (Phase 5 stubs)."""

import json

# Mock data aligned with AdminResources frontend (can be replaced by MCP/RDS)
MOCK_OTS = [
    {"id": "OT-1", "name": "OT Room 1 (Main)", "status": "in-use", "nextFree": "2026-03-05 14:00", "lastUpdated": "2026-03-02T10:15:00Z"},
    {"id": "OT-2", "name": "OT Room 2 (Minor)", "status": "available", "nextFree": None, "lastUpdated": "2026-03-02T10:10:00Z"},
    {"id": "OT-3", "name": "Cardiac OT", "status": "maintenance", "nextFree": "2026-03-06 08:00", "lastUpdated": "2026-03-02T09:00:00Z"},
]
MOCK_EQUIPMENT = [
    {"id": "EQ-1", "name": "C-Arm Fluoroscopy", "status": "in-use", "location": "OT-1", "lastUpdated": "2026-03-02T10:00:00Z"},
    {"id": "EQ-2", "name": "Surgical Robot (Da Vinci)", "status": "available", "location": "OT-2", "lastUpdated": "2026-03-02T09:45:00Z"},
    {"id": "EQ-3", "name": "Laser Lithotripsy", "status": "available", "location": "—", "lastUpdated": "2026-03-02T08:30:00Z"},
]
MOCK_SPECIALISTS = [
    {"id": "DR-1", "name": "Dr. Vikram Patel", "specialty": "Orthopedics", "status": "available", "lastUpdated": "2026-03-02T10:00:00Z"},
    {"id": "DR-2", "name": "Dr. Meena Rao", "specialty": "Cardiology", "status": "busy", "lastUpdated": "2026-03-02T09:55:00Z"},
    {"id": "DR-3", "name": "Dr. Priya Sharma", "specialty": "General", "status": "available", "lastUpdated": "2026-03-02T10:05:00Z"},
    {"id": "DR-4", "name": "Dr. Suresh Reddy", "specialty": "General Surgery", "status": "on-call", "lastUpdated": "2026-03-02T08:00:00Z"},
]


def handler(event, context):
    """Handle GET /api/v1/resources. Optionally enrich OT from MCP."""
    try:
        if (event.get("httpMethod") or "GET").upper() != "GET":
            return _json(405, {"error": "Method not allowed"})
        proxy = (event.get("pathParameters") or {}).get("proxy") or ""
        parts = [p for p in proxy.split("/") if p]
        if len(parts) < 2 or parts[0].lower() != "v1" or parts[1].lower() != "resources":
            return _json(404, {"error": "Not found"})

        # OT data can be enriched from MCP when adapter returns full shape; use mock for now
        body = {
            "ots": MOCK_OTS,
            "equipment": MOCK_EQUIPMENT,
            "specialists": MOCK_SPECIALISTS,
        }
        return _json(200, body)
    except Exception as e:
        return _json(500, {"error": str(e)})


def _json(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
