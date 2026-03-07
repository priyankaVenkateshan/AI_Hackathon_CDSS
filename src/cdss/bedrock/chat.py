"""
Bedrock chat helpers used by Supervisor/router fallbacks.

If Bedrock config is not available (no `BEDROCK_CONFIG_SECRET_NAME`), the functions
return safe stub responses instead of raising.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass


SAFETY_DISCLAIMER = (
    "AI is for clinical support only. All decisions require qualified medical judgment."
)


@dataclass(frozen=True)
class ChatResult:
    reply: str
    safety_disclaimer: str = SAFETY_DISCLAIMER
    message: str | None = None


def _load_bedrock_config() -> tuple[str, str] | None:
    secret_name = os.environ.get("BEDROCK_CONFIG_SECRET_NAME", "").strip()
    if not secret_name:
        return None
    try:
        import boto3

        region = os.environ.get("AWS_REGION", "ap-south-1")
        sm = boto3.client("secretsmanager", region_name=region)
        raw = sm.get_secret_value(SecretId=secret_name).get("SecretString", "{}")
        cfg = json.loads(raw)
        model_id = cfg.get("model_id") or "anthropic.claude-3-haiku-20240307-v1:0"
        bedrock_region = cfg.get("region") or region
        return model_id, bedrock_region
    except Exception:
        return None


def invoke_chat(prompt: str) -> ChatResult:
    cfg = _load_bedrock_config()
    if cfg is None:
        return ChatResult(
            reply="Bedrock is not configured. Set BEDROCK_CONFIG_SECRET_NAME to enable AI responses.",
            message="BedrockUnavailable",
        )
    model_id, bedrock_region = cfg
    try:
        import boto3

        client = boto3.client("bedrock-runtime", region_name=bedrock_region)
        system = (
            "You are a clinical decision support assistant. "
            "Be conservative, avoid definitive diagnosis, and recommend clinician review when uncertain."
        )
        resp = client.converse(
            modelId=model_id,
            system=[{"text": system}],
            messages=[{"role": "user", "content": [{"text": prompt[:6000]}]}],
            inferenceConfig={"maxTokens": 600, "temperature": 0.2},
        )
        content = resp.get("output", {}).get("message", {}).get("content", []) or []
        text = next((c.get("text", "") for c in content if isinstance(c, dict) and c.get("text")), "").strip()
        return ChatResult(reply=text or "OK")
    except Exception as exc:
        return ChatResult(reply="AI is temporarily unavailable.", message=str(exc))


def invoke_chat_with_context(user_message: str, context_label: str, data: dict) -> ChatResult:
    """
    Provide a response grounded in supplied (already authorized) structured data.
    """
    cfg = _load_bedrock_config()
    if cfg is None:
        return ChatResult(
            reply=json.dumps({"context": context_label, "data": data}, default=str)[:2000],
            message="BedrockUnavailable",
        )
    model_id, bedrock_region = cfg
    try:
        import boto3

        client = boto3.client("bedrock-runtime", region_name=bedrock_region)
        system = (
            "You are a clinical decision support assistant. "
            "Answer only using the provided structured context. If information is missing, say so and suggest next checks."
        )
        context_json = json.dumps(data, ensure_ascii=False, default=str)
        prompt = (
            f"Context label: {context_label}\n"
            f"Context JSON:\n{context_json[:12000]}\n\n"
            f"User question: {user_message[:1200]}"
        )
        resp = client.converse(
            modelId=model_id,
            system=[{"text": system}],
            messages=[{"role": "user", "content": [{"text": prompt}]}],
            inferenceConfig={"maxTokens": 700, "temperature": 0.2},
        )
        content = resp.get("output", {}).get("message", {}).get("content", []) or []
        text = next((c.get("text", "") for c in content if isinstance(c, dict) and c.get("text")), "").strip()
        return ChatResult(reply=text or "OK")
    except Exception as exc:
        return ChatResult(reply="AI is temporarily unavailable.", message=str(exc))
