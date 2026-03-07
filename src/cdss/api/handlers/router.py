"""CDSS API router - proxy for API Gateway with Cognito RBAC and audit logging."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

from cdss.api.handlers.common import json_response
from cdss.api.handlers.dashboard import get_dashboard_data

logger = logging.getLogger(__name__)

# Path prefixes that require admin role
ADMIN_PATHS = ("/api/v1/admin", "/admin")


def _get_claims(event: Dict[str, Any]) -> Dict[str, Any]:
    """Extract JWT claims from API Gateway request context (Cognito authorizer)."""
    try:
        ctx = event.get("requestContext") or {}
        authorizer = ctx.get("authorizer") or {}
        # Cognito passes claims under authorizer.claims
        claims = authorizer.get("claims") or authorizer or {}
        return claims if isinstance(claims, dict) else {}
    except Exception as exc:  # best-effort; fall back to anonymous
        logger.warning("Failed to extract claims", extra={"error": str(exc)})
        return {}


def _get_role(claims: Dict[str, Any]) -> str:
    """Resolve role from Cognito custom attribute or claim."""
    return (
        (claims.get("custom:role") or claims.get("role") or "")
        .strip()
        .strip("'\"")
        .lower()
    )


def _get_user_id(claims: Dict[str, Any]) -> str:
    return (claims.get("sub") or claims.get("username") or "").strip()


def _get_email(claims: Dict[str, Any]) -> str:
    return (claims.get("email") or claims.get("cognito:username") or "").strip()


def _get_patient_id(claims: Dict[str, Any]) -> str:
    """
    Resolve patientId for patient-scoped RBAC.

    Prefer explicit Cognito attributes (custom:patientId / patientId); fall back to sub.
    """
    return (
        claims.get("custom:patientId")
        or claims.get("patientId")
        or claims.get("sub")
        or ""
    ).strip()


def _path_requires_admin(path: str) -> bool:
    """True if path is an admin-only path (handles /stage/api/v1/admin or /api/v1/admin)."""
    path_normalized = (path or "").strip().lower()
    # Strip leading stage segment if present (e.g. /dev/api/... -> /api/...)
    if path_normalized.startswith("/dev/") or path_normalized.startswith("/prod/"):
        path_normalized = "/" + path_normalized.split("/", 2)[-1]
    return any(path_normalized.startswith(p.strip().lower()) for p in ADMIN_PATHS)


def _audit_log(
    user_id: str,
    email: str,
    role: str,
    method: str,
    path: str,
    resource: str,
    status: int,
) -> None:
    """
    Emit structured audit log for DISHA/compliance.

    Writes to CloudWatch and, when configured, to the Aurora `audit_log` table via cdss.db.
    """
    # CloudWatch / structured log
    timestamp = datetime.now(timezone.utc)
    entry = {
        "audit": True,
        "user_id": user_id,
        "user_email": email,
        "role": role,
        "action": f"{method} {path}",
        "resource": resource or path,
        "timestamp": timestamp.isoformat(),
        "status": status,
    }
    logger.info("CDSS_AUDIT %s", json.dumps(entry))

    # Best-effort DB audit; never fail the request because of audit issues
    if not user_id:
        return
    try:
        from cdss.db.session import get_session
        from cdss.db.models import AuditLog

        with get_session() as session:
            record = AuditLog(
                user_id=user_id,
                user_email=email or None,
                action=entry["action"],
                resource=entry["resource"],
                timestamp=timestamp,
            )
            session.add(record)
    except Exception as exc:
        logger.warning(
            "Audit log DB write failed",
            extra={"error": str(exc), "resource": resource, "status": status},
        )


def _dashboard_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """GET /dashboard – aggregate stats, patient queue, AI alerts (frontend shape)."""
    data = get_dashboard_data()
    return json_response(200, data, event=event)


def _agent_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """POST /agent – delegate to Supervisor for intent-based routing."""
    try:
        from cdss.api.handlers.supervisor import handler as supervisor_handler
        return supervisor_handler(event, context)
    except Exception as e:
        logger.warning("Agent/Supervisor fallback: %s", e)
        # Fallback to simple chat if Supervisor fails
        body = {}
        try:
            raw = event.get("body")
            if raw:
                body = json.loads(raw) if isinstance(raw, str) else raw
        except Exception:
            pass
        user_message = (body.get("message") or body.get("prompt") or "").strip()
        try:
            from cdss.bedrock.chat import invoke_chat
            result = invoke_chat(user_message)
            return json_response(
                200,
                {
                    "message": result.message or "OK",
                    "reply": result.reply,
                    "safety_disclaimer": result.safety_disclaimer,
                },
                event=event,
            )
        except Exception:
            return json_response(
                200,
                {
                    "message": "Agent endpoint ready. Connect Bedrock for live responses.",
                    "reply": "Agent endpoint ready.",
                    "safety_disclaimer": "AI is not configured or unavailable.",
                },
                event=event,
            )


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    try:
        claims = _get_claims(event)
        role = _get_role(claims)
        user_id = _get_user_id(claims)
        email = _get_email(claims)

        method = (event.get("httpMethod") or event.get("requestMethod") or "GET").upper()
        path = event.get("path") or (event.get("requestContext") or {}).get("path") or "/api"
        resource = path


        # Direct routes: GET /dashboard, POST /agent (no proxy)
        if path.rstrip("/").endswith("/dashboard"):
            if method == "GET":
                return _dashboard_handler(event, context)
            _audit_log(user_id, email, role, method, path, resource, 405)
            return json_response(
                405,
                {"error": "MethodNotAllowed", "message": "GET only"},
                event=event,
            )
        if path.rstrip("/").endswith("/agent"):
            if method == "POST":
                return _agent_handler(event, context)
            _audit_log(user_id, email, role, method, path, resource, 405)
            return json_response(
                405,
                {"error": "MethodNotAllowed", "message": "POST only"},
                event=event,
            )

        # RBAC: admin-only paths
        if _path_requires_admin(path):
            if role != "admin":

                _audit_log(user_id, email, role, method, path, resource, 403)
                return json_response(
                    403,
                    {"error": "Forbidden", "message": "Admin role required"},
                    event=event,
                )

        # Dispatch target (used for patient-scoped RBAC and routing)
        proxy = (event.get("pathParameters") or {}).get("proxy") or ""

        # Patient-scoped paths: role `patient` may only access their own record.
        # - Disallow patient role listing all patients.
        # - For detail routes, enforce path id == patientId from claims.
        if role == "patient":
            # Normalize for patterns like "v1/patients" and "v1/patients/PT-1001"
            parts = [p for p in proxy.split("/") if p]
            # Block patient from list view of all patients
            if proxy in {"v1/patients", "patients"} or (
                len(parts) == 2
                and parts[0].lower() == "v1"
                and parts[1].lower() == "patients"
            ):
                _audit_log(user_id, email, role, method, path, resource, 403)
                return json_response(
                    403,
                    {"error": "Forbidden", "message": "Patients may only access their own record."},
                    event=event,
                )

            # For patient detail routes, enforce id match
            patient_id_in_path = None
            if proxy.startswith("v1/patients"):
                # e.g. v1/patients/PT-1001
                if len(parts) >= 3 and parts[0].lower() == "v1" and parts[1].lower() == "patients":
                    patient_id_in_path = parts[2]
            elif proxy.startswith("patients"):
                # e.g. patients/PT-1001
                if len(parts) >= 2 and parts[0].lower() == "patients":
                    patient_id_in_path = parts[1]

            if patient_id_in_path:
                patient_id_claim = _get_patient_id(claims)
                if not patient_id_claim or patient_id_in_path != patient_id_claim:
                    _audit_log(user_id, email, role, method, path, resource, 403)
                    return json_response(
                        403,
                        {"error": "Forbidden", "message": "Patients may only access their own record."},
                        event=event,
                    )

        # Audit successful access before dispatch
        _audit_log(user_id, email, role, method, path, resource, 200)

        # Dispatch to agent handlers by path
        if proxy.startswith("v1/patients"):
            from cdss.api.handlers.patient import handler as patient_handler
            return patient_handler(event, context)
        if proxy.startswith("v1/admin"):
            from cdss.api.handlers.admin import handler as admin_handler
            return admin_handler(event, context)
        if proxy.startswith("v1/surgeries"):
            from cdss.api.handlers.surgery import handler as surgery_handler
            return surgery_handler(event, context)
        if proxy.startswith("v1/resources"):
            from cdss.api.handlers.resource import handler as resource_handler
            return resource_handler(event, context)
        if proxy.startswith("v1/medications") or proxy.startswith("v1/reminders"):
            from cdss.api.handlers.engagement import handler as engagement_handler
            return engagement_handler(event, context)
        if proxy.startswith("v1/consultations"):
            from cdss.api.handlers.engagement import handler as engagement_handler
            return engagement_handler(event, context)
        if proxy.startswith("v1/schedule"):
            from cdss.api.handlers.scheduling import handler as scheduling_handler
            return scheduling_handler(event, context)
        if proxy.startswith("v1/activity"):
            from cdss.api.handlers.activity import handler as activity_handler
            return activity_handler(event, context)
        if proxy.startswith("v1/hospitals"):
            from cdss.api.handlers.hospitals import hospitals_handler
            return hospitals_handler(event, context)
        # NOTE: Triage route removed — CDSS uses 5 agents only (no Triage agent).
        if proxy.startswith("v1/supervisor"):
            from cdss.api.handlers.supervisor import handler as supervisor_handler
            return supervisor_handler(event, context)

        # Inject temporary seed route
        if proxy.startswith("v1/seed"):
            from cdss.db.seed import run_seed
            result = run_seed(force=True)
            return json_response(200, {"status": "seeded", "result": result}, event=event)

        # Default
        return json_response(
            200,
            {"service": "cdss", "status": "ok", "user_id": user_id or "anonymous"},
            event=event,
        )
    except Exception as e:
        logger.exception("Router error: %s", e)
        return json_response(
            500,
            {"error": "InternalServerError", "message": "Internal server error"},
            event=event,
        )
