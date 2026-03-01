#!/bin/bash
# Stub so Terraform filesha256 succeeds when enable_triage=false. Replace with real build when enabling.
mkdir -p "$(dirname "$0")/../infrastructure/triage_lambda_src"
echo 'def handler(event, context): return {"statusCode": 501}' > "$(dirname "$0")/../infrastructure/triage_lambda_src/lambda_handler.py"
