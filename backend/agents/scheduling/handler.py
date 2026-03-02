"""
CDSS Scheduling Agent — Lambda Handler
Manages clinician appointments and OT scheduling.
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

# Define tools for the Scheduling Agent
SCHEDULING_TOOLS = [
    {
        "name": "book_slot",
        "description": "Book a clinical appointment or OT slot.",
        "input_schema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "doctor_id": {"type": "string"},
                "slot_type": {"type": "string", "enum": ["appointment", "ot"]},
                "start_time": {"type": "string", "description": "ISO format start time."},
                "end_time": {"type": "string", "description": "ISO format end time."}
            },
            "required": ["patient_id", "slot_type", "start_time"]
        }
    },
    {
        "name": "get_doctor_schedule",
        "description": "Retrieve the current schedule for a specific doctor.",
        "input_schema": {
            "type": "object",
            "properties": {
                "doctor_id": {"type": "string"},
                "date": {"type": "string", "description": "ISO format date (YYYY-MM-DD)."}
            },
            "required": ["doctor_id"]
        }
    }
]

def handle_tool_call(tool_name, tool_input, session_id):
    """Execute scheduling-specific logic."""
    logger.info(f"Executing scheduling tool: {tool_name} with input: {tool_input}")
    
    doctor_id = tool_input.get("doctor_id")
    
    if tool_name == "book_slot":
        # Simulate booking
        slot_type = tool_input.get("slot_type")
        logger.info(f"Booking {slot_type} slot for doctor {doctor_id} at {tool_input.get('start_time')}")
        
        # Publish event for tracking/engagement
        event_publisher.publish(
            source_agent="scheduling",
            event_type="SlotBooked",
            detail=tool_input
        )
        return f"Successfully booked {slot_type} slot at {tool_input.get('start_time')}."
        
    elif tool_name == "get_doctor_schedule":
        # Simulate schedule retrieval
        schedule = [
            {"time": "09:00", "patient": "Rajesh Kumar", "type": "Consultation", "status": "Confirmed"},
            {"time": "10:30", "patient": "Ananya Singh", "type": "Follow-up", "status": "Confirmed"},
            {"time": "14:00", "patient": "Mohammed Farhan", "type": "Surgery Prep", "status": "In Progress"}
        ]
        return json.dumps(schedule)
    
    return f"Unknown scheduling action: {tool_name}"

def lambda_handler(event, context):
    """Main entry point for Scheduling Agent."""
    logger.info(f"Received event: {json.dumps(event)}")
    
    detail = event.get("detail", event)
    session_id = detail.get("session_id", "SESS-INTERNAL")
    user_message = detail.get("message")
    
    # Internal routing flow
    if detail.get("event_type") == "AgentActionRequested":
        action = detail.get("action")
        params = detail.get("params", {})
        result = handle_tool_call(action if action.startswith("book") or action.startswith("get") else f"get_doctor_schedule", params, session_id)
        session_manager.add_message(session_id, "assistant", f"[Scheduling Agent Output]: {result}", agent=AGENT_NAMES["scheduling"])
        return success_response({"status": "processed", "result": result})

    if not user_message:
        return error_response("Message is required for direct invocation", 400)
    
    try:
        response = bedrock.invoke_with_tools(
            user_message=user_message,
            system_prompt=SYSTEM_PROMPTS["scheduling"],
            tools=SCHEDULING_TOOLS
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
            session_manager.add_message(session_id, "assistant", final_text, agent=AGENT_NAMES["scheduling"])

        return success_response({
            "response": agent_response(
                content=final_text,
                agent_name=AGENT_NAMES["scheduling"],
                metadata={"type": "slot_booking" if tool_outputs else "schedule_query"}
            )
        })
        
    except Exception as e:
        logger.error(f"Scheduling Agent error: {e}")
        return error_response(str(e), 500)
