"""
MCP adapter layer - single entry point for external systems.
Phase 1: Hospital Systems MCP, ABDM EHR MCP (stubbed).
Design allows adding Clinical Protocols and Telemedicine MCPs later without changing agent interfaces.
"""


def get_hospital_data(data_type: str):
    """
    Fetch hospital data (OT status, beds, etc.) from Hospital Systems MCP.
    data_type: "ot_status" | "beds" | "equipment"
    """
    # Stub responses until external API is integrated
    if data_type == "ot_status":
        return {"ots": [{"id": "OT-1", "status": "available", "name": "OT 1"}]}
    if data_type == "beds":
        return {"beds": [{"id": "B-1", "status": "available", "ward": "General"}]}
    if data_type == "equipment":
        return {"equipment": []}
    return {"error": f"Unknown type: {data_type}"}


def get_abdm_record(patient_id: str):
    """
    Fetch patient record from ABDM EHR (or equivalent). Stubbed until ABDM API is ready.
    """
    if not patient_id:
        return {"error": "patient_id required"}
    return {
        "patient_id": patient_id,
        "abdm_linked": False,
        "summary": "ABDM integration pending",
    }
