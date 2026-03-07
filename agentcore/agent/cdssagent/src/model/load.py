from strands.models import BedrockModel

import os

# Default to a broadly-available Bedrock model in ap-south-1 unless overridden.
DEFAULT_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"

def load_model() -> BedrockModel:
    """
    Get Bedrock model client.
    Uses IAM authentication via the execution role.
    """
    model_id = (os.getenv("BEDROCK_MODEL_ID") or os.getenv("CDSS_BEDROCK_MODEL_ID") or "").strip() or DEFAULT_MODEL_ID
    return BedrockModel(model_id=model_id)