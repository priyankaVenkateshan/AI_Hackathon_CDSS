"""
CDSS Shared Utilities — Bedrock Client
Wrapper around Amazon Bedrock Runtime for Claude 3 Haiku invocations.
"""

import json
import logging
from typing import Optional

import boto3
from botocore.config import Config

from .config import AWS_REGION, BEDROCK_MODEL_ID, BEDROCK_MAX_TOKENS, BEDROCK_TEMPERATURE

logger = logging.getLogger(__name__)


class BedrockClient:
    """Client for invoking Amazon Bedrock Claude 3 models."""

    def __init__(self, model_id: Optional[str] = None):
        self.model_id = model_id or BEDROCK_MODEL_ID
        self._client = boto3.client(
            "bedrock-runtime",
            region_name=AWS_REGION,
            config=Config(
                retries={"max_attempts": 3, "mode": "adaptive"},
                read_timeout=60,
            ),
        )

    def invoke(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: Optional[list] = None,
        max_tokens: int = BEDROCK_MAX_TOKENS,
        temperature: float = BEDROCK_TEMPERATURE,
    ) -> dict:
        """
        Invoke Claude 3 via Bedrock Messages API.

        Args:
            user_message: The current user message
            system_prompt: System-level instructions for the agent
            conversation_history: Optional list of previous messages
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature (0.0 - 1.0)

        Returns:
            dict with 'content' (str), 'usage' (dict), 'stop_reason' (str)
        """
        messages = []

        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg["role"],
                    "content": [{"type": "text", "text": msg["text"]}],
                })

        # Add current user message
        messages.append({
            "role": "user",
            "content": [{"type": "text", "text": user_message}],
        })

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": messages,
        }

        try:
            response = self._client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body),
            )

            result = json.loads(response["body"].read())

            return {
                "content": result["content"][0]["text"],
                "usage": result.get("usage", {}),
                "stop_reason": result.get("stop_reason", "end_turn"),
                "model": self.model_id,
            }

        except Exception as e:
            logger.error(f"Bedrock invocation failed: {e}")
            raise

    def invoke_with_tools(
        self,
        user_message: str,
        system_prompt: str,
        tools: list,
        conversation_history: Optional[list] = None,
        max_tokens: int = BEDROCK_MAX_TOKENS,
    ) -> dict:
        """
        Invoke Claude 3 with tool use capability.

        Args:
            user_message: The current user message
            system_prompt: System-level instructions
            tools: List of tool definitions
            conversation_history: Optional previous messages
            max_tokens: Maximum tokens

        Returns:
            dict with response content and any tool use requests
        """
        messages = []

        if conversation_history:
            for msg in conversation_history:
                messages.append({
                    "role": msg["role"],
                    "content": [{"type": "text", "text": msg["text"]}],
                })

        messages.append({
            "role": "user",
            "content": [{"type": "text", "text": user_message}],
        })

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": 0.1,  # Lower temp for tool use
            "system": system_prompt,
            "messages": messages,
            "tools": tools,
        }

        try:
            response = self._client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(body),
            )

            result = json.loads(response["body"].read())

            # Parse tool use from response
            tool_calls = []
            text_content = ""

            for block in result.get("content", []):
                if block["type"] == "text":
                    text_content += block["text"]
                elif block["type"] == "tool_use":
                    tool_calls.append({
                        "id": block["id"],
                        "name": block["name"],
                        "input": block["input"],
                    })

            return {
                "content": text_content,
                "tool_calls": tool_calls,
                "stop_reason": result.get("stop_reason", "end_turn"),
                "usage": result.get("usage", {}),
            }

        except Exception as e:
            logger.error(f"Bedrock tool invocation failed: {e}")
            raise
