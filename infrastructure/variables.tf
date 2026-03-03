# Project and region (CDSS: ap-south-1 for Mumbai, DISHA)
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "cdss"
}

variable "aws_region" {
  description = "AWS region for deployment (ap-south-1 for DISHA/data residency)"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# RDS / Aurora
variable "db_username" {
  description = "Master username for Aurora"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Master password for Aurora"
  type        = string
  sensitive   = true
}


# Bedrock (triage and CDSS agents)
variable "bedrock_agent_id" {
  description = "Bedrock Agent ID for triage (empty = use Converse API)"
  type        = string
  default     = ""
}

variable "bedrock_agent_alias_id" {
  description = "Bedrock Agent Alias ID"
  type        = string
  default     = "TSTALIASID"
}

variable "bedrock_model_id" {
  description = "Bedrock model for Converse fallback (when agent not configured)"
  type        = string
  default     = "us.anthropic.claude-3-5-sonnet-v2:0"
}

# CDSS Lambda (multi-agent) - handlers and env
variable "lambda_handlers" {
  description = "Map of Lambda function name -> handler path (api = router for API Gateway)"
  type        = map(string)
  default = {
    api        = "cdss.api.handlers.router.handler"
    supervisor = "cdss.api.handlers.supervisor.handler"
    patient    = "cdss.api.handlers.patient.handler"
    surgery    = "cdss.api.handlers.surgery.handler"
    resource   = "cdss.api.handlers.resource.handler"
    scheduling = "cdss.api.handlers.scheduling.handler"
    engagement = "cdss.api.handlers.engagement.handler"
  }
}

variable "lambda_env" {
  description = "Environment variables for CDSS Lambda functions"
  type        = map(string)
  default     = {}
}

# Cognito
variable "cognito_user_pool_name" {
  description = "Name of the Cognito User Pool"
  type        = string
  default     = "cdss-user-pool"
}

# Require Cognito on /api routes. Set false for local dev without Cognito (e.g. Postman).
variable "api_require_cognito" {
  description = "Require Cognito User Pools authorizer on /api routes"
  type        = bool
  default     = true
}

# WebSocket API
variable "enable_websocket_api" {
  description = "Deploy WebSocket API for real-time updates"
  type        = bool
  default     = true
}

# Lambda VPC (for RDS access). When true, Lambdas run in private subnets; add Bedrock VPC endpoint if needed.
variable "enable_lambda_vpc" {
  description = "Attach Lambdas to VPC so they can reach RDS (private subnets)"
  type        = bool
  default     = false
}

# Frontend / CloudFront
variable "staff_app_domain" {
  description = "Domain name for the Staff Web App (if any)"
  type        = string
  default     = ""
}

variable "patient_portal_domain" {
  description = "Domain name for the Patient Portal (if any)"
  type        = string
  default     = ""
}

# AI Layer
variable "enable_transcribe" {
  description = "Enable Amazon Transcribe permissions for agents"
  type        = bool
  default     = true
}

variable "enable_translate" {
  description = "Enable Amazon Translate permissions for agents"
  type        = bool
  default     = true
}
