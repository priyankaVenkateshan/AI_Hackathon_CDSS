"""
MCP adapter layer – single entry point for external systems.

CDSS agents: Patient, Surgery, Resource, Scheduling, Engagement.
Design allows adding Clinical Protocols and Telemedicine MCPs later without
changing agent interfaces.

All calls are logged via event_log for Req 8 audit (inter-agent communication).
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def get_hospital_data(data_type: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch hospital data (OT status, beds, etc.) from Hospital Systems MCP.
    data_type: "ot_status" | "beds" | "equipment"

    Logged as inter-agent event for audit (Req 8).
    """
    start = time.perf_counter()
    result: Dict[str, Any]

    # Stub responses until external API is integrated
    if data_type == "ot_status":
        result = {"ots": [{"id": "OT-1", "status": "available", "name": "OT 1"}]}
    elif data_type == "beds":
        result = {"beds": [{"id": "B-1", "status": "available", "ward": "General"}]}
    elif data_type == "equipment":
        result = {"equipment": []}
    else:
        result = {"error": f"Unknown type: {data_type}"}

    duration_ms = int((time.perf_counter() - start) * 1000)

    # Log inter-agent event
    _log_mcp_event(
        action=f"get_hospital_data:{data_type}",
        success="error" not in result,
        duration_ms=duration_ms,
        correlation_id=correlation_id,
    )

    return result


def get_abdm_record(patient_id: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Fetch patient record from ABDM EHR (or equivalent). Stubbed until ABDM API is ready.

    Logged as inter-agent event for audit (Req 8).
    """
    start = time.perf_counter()

    if not patient_id:
        result: Dict[str, Any] = {"error": "patient_id required"}
    else:
        result = {
            "patient_id": patient_id,
            "abdm_linked": False,
            "summary": "ABDM integration pending",
        }

    duration_ms = int((time.perf_counter() - start) * 1000)

    _log_mcp_event(
        action="get_abdm_record",
        success="error" not in result,
        duration_ms=duration_ms,
        correlation_id=correlation_id,
    )

    return result


def _log_mcp_event(
    action: str,
    success: bool,
    duration_ms: int,
    correlation_id: Optional[str] = None,
) -> None:
    """Log MCP adapter call as inter-agent event."""
    try:
        from cdss.services.event_log import log_agent_event

        log_agent_event(
            source_agent="mcp_adapter",
            target_agent="hospital_mcp",
            action=action,
            correlation_id=correlation_id,
            success=success,
            duration_ms=duration_ms,
        )
    except Exception:
        # Non-fatal — don't break the adapter if logging fails
        pass
