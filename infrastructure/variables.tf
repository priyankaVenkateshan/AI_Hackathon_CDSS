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

# Bastion (optional - for SSH tunnel to Aurora)
variable "enable_bastion" {
  description = "Create bastion host for SSH tunnel to Aurora"
  type        = bool
  default     = false
}

variable "bastion_ssh_public_key" {
  description = "SSH public key for bastion (contents of ~/.ssh/id_rsa.pub)"
  type        = string
  default     = ""
}

variable "bastion_allowed_cidr" {
  description = "CIDR allowed to SSH to bastion (e.g. YOUR_IP/32)"
  type        = string
  default     = ""
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
    api         = "cdss.api.handlers.router.handler"
    supervisor  = "cdss.api.handlers.supervisor.handler"
    patient     = "cdss.api.handlers.patient.handler"
    surgery     = "cdss.api.handlers.surgery.handler"
    resource    = "cdss.api.handlers.resource.handler"
    scheduling  = "cdss.api.handlers.scheduling.handler"
    engagement  = "cdss.api.handlers.engagement.handler"
  }
}

variable "lambda_env" {
  description = "Environment variables for CDSS Lambda functions"
  type        = map(string)
  default     = {}
}

# Set to true only when src/triage and scripts/build_triage_lambda.sh exist
variable "enable_triage" {
  description = "Deploy Emergency Medical Triage Lambda (requires triage source and build script)"
  type        = bool
  default     = false
}
