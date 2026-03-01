variable "name" {
  type = string
}

variable "stage" {
  type = string
}

variable "runtime" {
  type    = string
  default = "python3.12"
}

variable "handlers" {
  type = map(string)
}

variable "env" {
  type    = map(string)
  default = {}
}

variable "bedrock_policy_arn" {
  description = "Optional IAM policy ARN for Bedrock invoke (attach to Lambda role)"
  type        = string
  default     = ""
}

# Set to true to attach Bedrock policy; use true when passing bedrock_policy_arn from root
variable "attach_bedrock_policy" {
  description = "Attach Bedrock invoke policy to Lambda role"
  type        = bool
  default     = true
}
