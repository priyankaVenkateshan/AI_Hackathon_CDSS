# CDSS - Clinical Decision Support System
# Integrates: triage-style infra (VPC, RDS, S3, Bedrock, /health, /triage) + CDSS modules (Lambda, DynamoDB, EventBridge)
# Single REST API: /health, /triage, /api/{proxy+} -> CDSS router Lambda

# CDSS Multi-Agent Lambda (api = router, supervisor, patient, surgery, resource, scheduling, engagement)
module "cdss_lambda" {
  source   = "./modules/lambda"
  name     = "cdss"
  stage    = local.stage
  runtime  = "python3.12"
  handlers = var.lambda_handlers
  env      = var.lambda_env
  attach_bedrock_policy = true
  bedrock_policy_arn    = aws_iam_policy.bedrock_invoke.arn
}

# DynamoDB: sessions, medication schedules, patients, consultations, OT slots, equipment, protocols
module "cdss_dynamodb" {
  source = "./modules/dynamodb"
  name   = "cdss"
  stage  = local.stage
}

# EventBridge: async inter-agent messaging
module "cdss_eventbridge" {
  source = "./modules/eventbridge"
  name   = "cdss"
  stage  = local.stage
}
