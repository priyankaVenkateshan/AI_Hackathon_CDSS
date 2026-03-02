"""
CDSS WebSocket Handler — Lambda
Manages real-time clinical data streams for the doctor dashboard.
"""

import json
import logging
import time
from typing import Optional

import boto3
from botocore.exceptions import ClientError

# Configuration
AWS_REGION = "ap-south-1"
CONNECTIONS_TABLE = "cdss-websocket-connections"

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(CONNECTIONS_TABLE)

def handle_connect(connection_id, doctor_id):
    """Register a new connection."""
    try:
        table.put_item(
            Item={
                "connection_id": connection_id,
                "doctor_id": doctor_id or "DR-DEFAULT",
                "connected_at": int(time.time()),
                "ttl": int(time.time()) + 7200 # 2-hour session
            }
        )
        return {"statusCode": 200, "body": "Connected"}
    except ClientError as e:
        logger.error(f"Connect failed: {e}")
        return {"statusCode": 500, "body": "Failed to connect"}

def handle_disconnect(connection_id):
    """Remove a connection."""
    try:
        table.delete_item(Key={"connection_id": connection_id})
        return {"statusCode": 200, "body": "Disconnected"}
    except ClientError as e:
        logger.error(f"Disconnect failed: {e}")
        return {"statusCode": 500, "body": "Failed to disconnect"}

def lambda_handler(event, context):
    """Main entry point for WebSocket events."""
    route_key = event.get("requestContext", {}).get("routeKey")
    connection_id = event.get("requestContext", {}).get("connectionId")
    
    logger.info(f"WebSocket request: {route_key} ({connection_id})")
    
    if route_key == "$connect":
        # In a real app, doctor_id would be extracted from a JWT token in the query params
        doctor_id = event.get("queryStringParameters", {}).get("doctor_id")
        return handle_connect(connection_id, doctor_id)
        
    elif route_key == "$disconnect":
        return handle_disconnect(connection_id)
        
    elif route_key == "subscribe_patient":
        # Custom action to subscribe to a specific patient's real-time vitals
        body = json.loads(event.get("body", "{}"))
        patient_id = body.get("patient_id")
        
        table.update_item(
            Key={"connection_id": connection_id},
            UpdateExpression="SET active_patient_id = :p",
            ExpressionAttributeValues={":p": patient_id}
        )
        return {"statusCode": 200, "body": f"Subscribed to patient {patient_id}"}
        
    return {"statusCode": 404, "body": "Route not found"}
