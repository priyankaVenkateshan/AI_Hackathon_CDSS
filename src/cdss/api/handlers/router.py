"""CDSS API router - proxy for API Gateway."""

def handler(event, context):
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": '{"service":"cdss","status":"ok"}',
    }
