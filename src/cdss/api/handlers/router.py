"""CDSS API router - proxy for API Gateway with Cognito RBAC and audit logging."""

import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Path prefixes that require admin role
ADMIN_PATHS = ("/api/v1/admin", "/admin")


def _get_claims(event):
    """Extract JWT claims from API Gateway request context (Cognito authorizer)."""
    try:
        ctx = event.get("requestContext") or {}
        authorizer = ctx.get("authorizer") or {}
        # Cognito passes claims under authorizer.claims
        return authorizer.get("claims") or authorizer or {}
    except Exception:
        return {}


def _get_role(claims):
    """Resolve role from Cognito custom attribute or claim."""
    return (
        claims.get("custom:role")
        or claims.get("role")
        or ""
    ).strip().lower()


def _get_user_id(claims):
    return claims.get("sub") or claims.get("username") or ""


def _get_email(claims):
    return claims.get("email") or claims.get("cognito:username") or ""


def _path_requires_admin(path):
    path = (path or "").strip().lower()
    return any(path.startswith(p.strip().lower()) for p in ADMIN_PATHS)


def _audit_log(user_id: str, email: str, role: str, method: str, path: str, resource: str, status: int):
    """Emit structured audit log for DISHA/compliance (CloudWatch)."""
    try:
        entry = {
            "audit": True,
            "user_id": user_id,
            "user_email": email,
            "role": role,
            "action": f"{method} {path}",
            "resource": resource or path,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": status,
        }
        logger.info("CDSS_AUDIT %s", json.dumps(entry))
    except Exception as e:
        logger.warning("Audit log write failed: %s", e)


def handler(event, context):
    try:
        claims = _get_claims(event)
        role = _get_role(claims)
        user_id = _get_user_id(claims)
        email = _get_email(claims)

        method = (event.get("httpMethod") or event.get("requestMethod") or "GET").upper()
        path = event.get("path") or (event.get("requestContext") or {}).get("path") or "/api"
        resource = path

        # RBAC: admin-only paths
        if _path_requires_admin(path):
            if role != "admin":
                _audit_log(user_id, email, role, method, path, resource, 403)
                return {
                    "statusCode": 403,
                    "headers": {"Content-Type": "application/json"},
                    "body": json.dumps({"error": "Forbidden", "message": "Admin role required"}),
                }

        # Patient-scoped paths: allow patient role only for own data (path param check can be added later)
        # For now, log and pass through
        _audit_log(user_id, email, role, method, path, resource, 200)

        # Dispatch to agent handlers by path
        proxy = (event.get("pathParameters") or {}).get("proxy") or ""
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
        if proxy.startswith("v1/schedule"):
            from cdss.api.handlers.scheduling import handler as scheduling_handler
            return scheduling_handler(event, context)

        # Default
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"service": "cdss", "status": "ok", "user_id": user_id or "anonymous"}),
        }
    except Exception as e:
        logger.exception("Router error: %s", e)
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": "InternalServerError", "message": str(e)}),
        }
