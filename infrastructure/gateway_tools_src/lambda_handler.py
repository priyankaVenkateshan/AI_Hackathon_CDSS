"""
AgentCore Gateway tool Lambda – get_hospitals, get_ot_status, get_abdm_record.

Invoked by Bedrock AgentCore Gateway. Event = tool input props; tool name from
client_context.custom["bedrockAgentCoreToolName"] as TARGET___tool_name.
Response must match declared schema and include safety_disclaimer per CDSS.mdc.
See docs/agentcore-gateway-manual-steps.md.

When RDS_CONFIG_SECRET_NAME is set, queries live Aurora database;
otherwise returns synthetic/stub data.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict

logger = logging.getLogger(__name__)

SAFETY_DISCLAIMER = (
    "Hospital availability and suitability are indicative. "
    "Confirm capacity and eligibility with the facility before referral. "
    "This is not medical advice."
)


def _get_tool_name(event: Dict[str, Any], context: Any) -> str:
    """Strip TARGET___ prefix from bedrockAgentCoreToolName (context or event) to get tool name."""
    try:
        if context is not None and hasattr(context, "client_context") and context.client_context is not None:
            custom = getattr(context.client_context, "custom", None) or {}
            if hasattr(custom, "get"):
                tool_name = custom.get("bedrockAgentCoreToolName", "")
            else:
                tool_name = getattr(custom, "bedrockAgentCoreToolName", "") or ""
            if tool_name and "___" in str(tool_name):
                return str(tool_name).split("___", 1)[1]
            if tool_name:
                return str(tool_name)
    except Exception:
        pass
    return str(event.get("tool_name", event.get("__tool", "get_hospitals")))


# ─── Database helpers ───────────────────────────────────────────────

_db_engine = None


def _get_db_engine():
    """Lazily create a SQLAlchemy engine from Secrets Manager or DATABASE_URL."""
    global _db_engine
    if _db_engine is not None:
        return _db_engine

    db_url = os.environ.get("DATABASE_URL", "").strip()
    secret_name = os.environ.get("RDS_CONFIG_SECRET_NAME", "").strip()

    if not db_url and secret_name:
        try:
            import boto3
            from urllib.parse import quote_plus

            region = os.environ.get("AWS_REGION", "ap-south-1")
            sm = boto3.client("secretsmanager", region_name=region)
            raw = sm.get_secret_value(SecretId=secret_name).get("SecretString", "{}")
            cfg = json.loads(raw)
            host = cfg.get("host", "")
            port = cfg.get("port", 5432)
            database = cfg.get("database", "cdssdb")
            username = cfg.get("username", "")
            rds_client = boto3.client("rds", region_name=region)
            password = rds_client.generate_db_auth_token(
                DBHostname=host, Port=port, DBUsername=username, Region=region,
            )
            db_url = f"postgresql+psycopg2://{username}:{quote_plus(password)}@{host}:{port}/{database}"
        except Exception as e:
            logger.warning("Cannot build DB URL from secret: %s", e)
            return None

    if not db_url:
        return None

    try:
        from sqlalchemy import create_engine
        _db_engine = create_engine(db_url, pool_pre_ping=True, pool_size=1, max_overflow=0)
        return _db_engine
    except Exception as e:
        logger.warning("Cannot create engine: %s", e)
        return None


def _query_hospitals_from_db(severity: str, limit: int) -> list | None:
    """Query hospitals table. Returns list of dicts or None if DB unavailable."""
    engine = _get_db_engine()
    if engine is None:
        return None
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT id, name, city, state, specialties, available_beds, "
                    "icu_beds, available_icu_beds, tier, emergency_available, contact_phone, "
                    "latitude, longitude "
                    "FROM hospitals WHERE status = 'active' "
                    "ORDER BY available_beds DESC LIMIT :lim"
                ),
                {"lim": limit},
            ).fetchall()
        hospitals = []
        for r in rows:
            hospitals.append({
                "id": r[0],
                "name": r[1],
                "city": r[2],
                "state": r[3],
                "specialties": r[4] if r[4] else [],
                "available_beds": r[5],
                "icu_beds": r[6],
                "available_icu_beds": r[7],
                "tier": r[8],
                "emergency_available": r[9],
                "contact_phone": r[10],
                "latitude": r[11],
                "longitude": r[12],
                "available": (r[5] or 0) > 0,
            })
        return hospitals
    except Exception as e:
        logger.warning("Hospital DB query failed: %s", e)
        return None


def _query_ot_status_from_db() -> list | None:
    """Query resources + schedule_slots for OT availability."""
    engine = _get_db_engine()
    if engine is None:
        return None
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            rows = conn.execute(
                text(
                    "SELECT r.id, r.name, r.status, r.availability, "
                    "  (SELECT COUNT(*) FROM schedule_slots ss "
                    "   WHERE ss.ot_id = r.id AND ss.status = 'available' "
                    "   AND ss.slot_date >= CURRENT_DATE) AS open_slots "
                    "FROM resources r WHERE r.type = 'ot' ORDER BY r.id"
                )
            ).fetchall()
        ots = []
        for r in rows:
            avail = r[3] if r[3] else {}
            ots.append({
                "ot_id": r[0],
                "name": r[1],
                "status": r[2],
                "area": avail.get("area", ""),
                "floor": avail.get("floor", ""),
                "next_free": avail.get("nextFree"),
                "open_slots_upcoming": r[4],
            })
        return ots
    except Exception as e:
        logger.warning("OT status DB query failed: %s", e)
        return None


# ─── Tool handlers ──────────────────────────────────────────────────

def _get_hospitals(event: Dict[str, Any]) -> Dict[str, Any]:
    """Hospital list from DB or synthetic fallback."""
    severity = (event.get("severity") or "medium").lower()
    limit = min(int(event.get("limit", 5)), 20)

    hospitals = _query_hospitals_from_db(severity, limit)
    if hospitals is not None:
        return {"hospitals": hospitals, "source": "database", "safety_disclaimer": SAFETY_DISCLAIMER}

    # Fallback synthetic
    hospitals = [
        {"id": f"H{i}", "name": f"Hospital {i} ({severity})", "distance_km": 2 + i, "available": True}
        for i in range(1, limit + 1)
    ]
    return {"hospitals": hospitals, "source": "synthetic", "safety_disclaimer": SAFETY_DISCLAIMER}


def _get_ot_status(event: Dict[str, Any]) -> Dict[str, Any]:
    """OT status from DB or stub."""
    ots = _query_ot_status_from_db()
    if ots is not None:
        return {"operation_theaters": ots, "source": "database", "safety_disclaimer": SAFETY_DISCLAIMER}

    return {
        "available_slots": [],
        "message": "OT status unavailable; database not connected.",
        "source": "synthetic",
        "safety_disclaimer": SAFETY_DISCLAIMER,
    }


def _get_abdm_record(event: Dict[str, Any]) -> Dict[str, Any]:
    """Stub for ABDM record lookup."""
    return {
        "record_found": False,
        "message": "ABDM integration pending.",
        "safety_disclaimer": SAFETY_DISCLAIMER,
    }


TOOL_HANDLERS: Dict[str, Any] = {
    "get_hospitals": _get_hospitals,
    "get_ot_status": _get_ot_status,
    "get_abdm_record": _get_abdm_record,
}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Gateway invokes with tool input in event; dispatch by tool name from context.
    Returns JSON matching tool schema with safety_disclaimer for clinical tools.
    """
    tool_name = _get_tool_name(event, context)
    fn = TOOL_HANDLERS.get(tool_name, _get_hospitals)
    try:
        result = fn(event)
        return result
    except Exception as e:
        logger.exception("Gateway tool %s failed: %s", tool_name, e)
        return {
            "hospitals": [],
            "error": str(e),
            "safety_disclaimer": SAFETY_DISCLAIMER,
        }
