"""Patient agent handler - patient CRUD, history, surgery readiness (Phase 3)."""

import json

from cdss.mcp.adapter import get_abdm_record

# In-memory mock until RDS is wired (Phase 3)
_MOCK_PATIENTS = [
    {
        "id": "PT-1001",
        "name": "Rajesh Kumar",
        "dateOfBirth": "1985-06-15",
        "conditions": ["Hypertension"],
        "medications": [],
        "lastVisit": "2026-02-28",
        "nextAppointment": "2026-03-15T10:00:00Z",
    },
    {
        "id": "PT-1002",
        "name": "Priya Nair",
        "dateOfBirth": "1990-11-20",
        "conditions": ["Type 2 Diabetes"],
        "medications": [],
        "lastVisit": "2026-03-01",
        "nextAppointment": None,
    },
]


def handler(event, context):
    """Handle GET /api/v1/patients and GET /api/v1/patients/:id. Event is API Gateway proxy format."""
    try:
        method = (event.get("httpMethod") or "GET").upper()
        proxy = (event.get("pathParameters") or {}).get("proxy") or ""
        parts = [p for p in proxy.split("/") if p]

        if method != "GET":
            return _json_response(405, {"error": "Method not allowed"})

        # GET /api/v1/patients -> list
        if len(parts) <= 1 and (not parts or parts[0].lower() == "patients"):
            return _list_patients(event)
        # GET /api/v1/patients/:id
        if len(parts) >= 2 and parts[0].lower() == "v1" and parts[1].lower() == "patients":
            patient_id = parts[2] if len(parts) > 2 else None
            if patient_id:
                return _get_patient(patient_id, event)
            return _list_patients(event)
        return _json_response(404, {"error": "Not found"})
    except Exception as e:
        return _json_response(500, {"error": str(e)})


def _list_patients(event):
    """Return patient list (mask sensitive fields for list view)."""
    list_view = []
    for p in _MOCK_PATIENTS:
        list_view.append({
            "id": p["id"],
            "name": p["name"],
            "lastVisit": p.get("lastVisit"),
            "nextAppointment": p.get("nextAppointment"),
        })
    return _json_response(200, {"patients": list_view})


def _get_patient(patient_id: str, event):
    """Return single patient with optional ABDM stub."""
    for p in _MOCK_PATIENTS:
        if p["id"] == patient_id:
            out = dict(p)
            # Optional: enrich with ABDM (stub)
            abdm = get_abdm_record(patient_id)
            if not abdm.get("error"):
                out["abdm"] = abdm
            return _json_response(200, out)
    return _json_response(404, {"error": "Patient not found"})


def _json_response(status: int, body: dict):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
