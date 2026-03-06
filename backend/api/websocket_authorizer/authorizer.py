"""
WebSocket $connect Lambda authorizer — validates Cognito JWT from ?token=.

Used only for the $connect route. Validates the token using Cognito JWKS
and returns an IAM policy Allow (with context: sub, role) or Deny.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict

import jwt
try:
    from jwt import PyJWKClient
except ImportError:
    from jwt.jwks_client import PyJWKClient

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

COGNITO_USER_POOL_ID = os.environ.get("COGNITO_USER_POOL_ID", "")
COGNITO_REGION = os.environ.get("AWS_REGION", "ap-south-1")
JWKS_URI = (
    f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json"
    if COGNITO_USER_POOL_ID
    else ""
)


def _generate_policy(
    principal_id: str,
    effect: str,
    resource: str,
    context: Dict[str, str] | None = None,
) -> Dict[str, Any]:
    """Build IAM policy response for API Gateway authorizer."""
    auth_response: Dict[str, Any] = {"principalId": principal_id}
    if effect and resource:
        auth_response["policyDocument"] = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "execute-api:Invoke",
                    "Effect": effect,
                    "Resource": resource,
                }
            ],
        }
    if context:
        auth_response["context"] = {k: str(v)[:1024] for k, v in context.items()}
    return auth_response


def _allow(principal_id: str, method_arn: str, context: Dict[str, str] | None = None) -> Dict[str, Any]:
    return _generate_policy(principal_id, "Allow", method_arn, context)


def _deny(principal_id: str, method_arn: str) -> Dict[str, Any]:
    return _generate_policy(principal_id, "Deny", method_arn)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    REQUEST authorizer for WebSocket $connect.
    Expects event.queryStringParameters.token (Cognito id_token).
    """
    method_arn = event.get("methodArn") or ""
    query = event.get("queryStringParameters") or {}
    token = (query.get("token") or "").strip()

    if not token:
        logger.warning("WebSocket $connect: missing token in query string")
        return _deny("anonymous", method_arn)

    if not COGNITO_USER_POOL_ID or not JWKS_URI:
        logger.warning("WebSocket authorizer: COGNITO_USER_POOL_ID not set")
        return _deny("anonymous", method_arn)

    try:
        jwks_client = PyJWKClient(JWKS_URI)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=None,  # Cognito id_tokens may not have aud in some configs
            options={"verify_aud": False, "verify_exp": True},
        )
    except jwt.ExpiredSignatureError:
        logger.warning("WebSocket $connect: token expired")
        return _deny("anonymous", method_arn)
    except jwt.PyJWTError as e:
        logger.warning("WebSocket $connect: invalid token: %s", e)
        return _deny("anonymous", method_arn)
    except Exception as e:
        logger.exception("WebSocket authorizer error: %s", e)
        return _deny("anonymous", method_arn)

    principal_id = (payload.get("sub") or "unknown").strip()
    role = (
        (payload.get("custom:role") or payload.get("role") or "")
        .strip()
        .strip("'\"")
        .lower()
    )
    ctx = {"sub": principal_id, "role": role or "unknown"}
    return _allow(principal_id, method_arn, ctx)
