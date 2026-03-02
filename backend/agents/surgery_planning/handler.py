"""
CDSS Surgery Planning Agent — Lambda Handler
Manages pre-operative and post-operative checklists and surgical procedure analysis.
"""

import json
import logging
import os
import sys

# Add the lambda root to sys.path to import shared utilities
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared import (
    BedrockClient,
    SessionManager,
    EventPublisher,
    AIService,
    success_response,
    error_response,
    agent_response,
    SYSTEM_PROMPTS,
    AGENT_NAMES,
)

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize shared components
bedrock = BedrockClient()
session_manager = SessionManager()
event_publisher = EventPublisher()
ai_service = AIService()

# Define tools for the Surgery Planning Agent
SURGERY_TOOLS = [
    {
        "name": "generate_pre_op_checklist",
        "description": "Generate a clinical pre-operative checklist for a specific surgery and patient.",
        "input_schema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "surgery_type": {"type": "string", "description": "Type of surgery (e.g., 'ACL Reconstruction')."},
                "preferences": {"type": "string", "description": "Any specific clinical preferences."}
            },
            "required": ["patient_id", "surgery_type"]
        }
    },
    {
        "name": "analyse_requirements",
        "description": "Analyze required equipment, instruments, and personnel for a specific surgery.",
        "input_schema": {
            "type": "object",
            "properties": {
                "surgery_type": {"type": "string"},
                "patient_risk_factors": {"type": "string"}
            },
            "required": ["surgery_type"]
        }
    }
]

def handle_tool_call(tool_name, tool_input, session_id):
    """Execute surgery-specific logic."""
    logger.info(f"Executing surgery tool: {tool_name} with input: {tool_input}")
    
    patient_id = tool_input.get("patient_id")
    surgery_type = tool_input.get("surgery_type")
    
    if tool_name == "generate_pre_op_checklist":
        # Simulate checklist generation
        checklist = {
            "surgery": surgery_type,
            "patient_id": patient_id,
            "checklist": [
                "Confirm patient identity, surgical site, and procedure.",
                "Ensure anesthesia machine and medication check are complete.",
                "Verify pulse oximeter is on patient and functioning.",
                "Confirm all team members have introduced themselves by name and role.",
                "Does the patient have a known allergy?",
                "Is the risk of aspiration or difficult airway assessed?"
            ],
            "estimated_duration": "120 minutes",
            "special_prep": "Prophylactic antibiotics administered 60 min before skin incision."
        }
        
        # Publish event for the resource agent
        event_publisher.publish_surgery_event(
            surgery_id="NEW-SRG",
            status="checklist_generated",
            data=checklist
        )
        return json.dumps(checklist)
        
    elif tool_name == "analyse_requirements":
        # Use AI Service to extract surgical requirements from unstructured preferences
        analysis = ai_service.extract_medical_entities(tool_input.get("patient_risk_factors", ""))
        
        requirements = {
            "instruments": ["Orthopedic tray", "Arthroscopy tower"],
            "personnel": ["Main Surgeon", "Assistant Surgeon", "Anesthesiologist"],
            "extracted_risks": [e['text'] for e in analysis.get('MEDICAL_CONDITION', [])]
        }
        return json.dumps(requirements)
    
    return f"Unknown surgery action: {tool_name}"

def lambda_handler(event, context):
    """Main entry point for Surgery Planning Agent."""
    logger.info(f"Received event: {json.dumps(event)}")
    
    detail = event.get("detail", event)
    session_id = detail.get("session_id", "SESS-INTERNAL")
    user_message = detail.get("message")
    
    # Internal routing flow
    if detail.get("event_type") == "AgentActionRequested":
        action = detail.get("action")
        params = detail.get("params", {})
        result = handle_tool_call(action if action.startswith("generate") or action.startswith("analyse") else f"generate_pre_op_checklist", params, session_id)
        session_manager.add_message(session_id, "assistant", f"[Surgery Agent Output]: {result}", agent=AGENT_NAMES["surgery_planning"])
        return success_response({"status": "processed", "result": result})

    if not user_message:
        return error_response("Message is required for direct invocation", 400)
    
    try:
        response = bedrock.invoke_with_tools(
            user_message=user_message,
            system_prompt=SYSTEM_PROMPTS["surgery_planning"],
            tools=SURGERY_TOOLS
        )
        
        agent_content = response.get("content", "")
        tool_calls = response.get("tool_calls", [])
        
        tool_outputs = []
        for tool in tool_calls:
            output = handle_tool_call(tool["name"], tool["input"], session_id)
            tool_outputs.append(output)
        
        final_text = agent_content
        if tool_outputs:
            if final_text:
                final_text += "\n\n"
            final_text += "Action Results: " + "; ".join(tool_outputs)
            
        if session_id:
            session_manager.add_message(session_id, "assistant", final_text, agent=AGENT_NAMES["surgery_planning"])

        return success_response({
            "response": agent_response(
                content=final_text,
                agent_name=AGENT_NAMES["surgery_planning"],
                metadata={"type": "surgical_analysis"}
            )
        })
        
    except Exception as e:
        logger.error(f"Surgery Planning Agent error: {e}")
        return error_response(str(e), 500)
