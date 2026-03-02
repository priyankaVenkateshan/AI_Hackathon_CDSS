"""
CDSS Dashboard Handler — REST Lambda
Aggregates clinical data for the doctor's primary view.
"""

import json
import logging
import os
import sys

# Standardized response builder (simulated import for this file)
def success_response(body):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body)
    }

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """Aggregates stats, patient queue, and alerts for the dashboard."""
    doctor_id = event.get("queryStringParameters", {}).get("doctor_id", "DR-DEFAULT")
    
    logger.info(f"Dashboard request for doctor: {doctor_id}")
    
    # In a real app, these would come from RDS and DynamoDB
    dashboard_data = {
        "stats": [
            {"label": "Patients Waiting", "value": 3, "trend": "+2 from yesterday", "type": "warning"},
            {"label": "Critical Alerts", "value": 1, "trend": "Needs attention", "type": "critical"},
            {"label": "Today's Appointments", "value": 8, "trend": "1 completed", "type": "info"},
            {"label": "AI Insights Ready", "value": 4, "trend": "2 actionable", "type": "ai"}
        ],
        "patient_queue": [
            {
                "id": "PT-1001",
                "name": "Rajesh Kumar",
                "vitals": {"hr": 78, "bp": "130/85", "spo2": 97},
                "severity": "MODERATE",
                "status": "Stable"
            },
            {
                "id": "PT-1002",
                "name": "Ananya Singh",
                "vitals": {"hr": 72, "bp": "120/80", "spo2": 99},
                "severity": "LOW",
                "status": "Ready for Discharge"
            },
            {
                "id": "PT-1003",
                "name": "Mohammed Farhan",
                "vitals": {"hr": 110, "bp": "90/60", "spo2": 89},
                "severity": "CRITICAL",
                "status": "Urgent Review"
            }
        ],
        "ai_alerts": [
            {
                "id": 1,
                "type": "drug_interaction",
                "message": "Warfarin + Aspirin combination detected for Lakshmi Devi. High bleeding risk.",
                "severity": "high",
                "time": "2 min ago"
            },
            {
                "id": 2,
                "type": "vital_abnormality",
                "message": "Mohammed Farhan SpO2 dropped to 89%. Consider oxygen supplementation.",
                "severity": "critical",
                "time": "5 min ago"
            }
        ]
    }
    
    return success_response(dashboard_data)
