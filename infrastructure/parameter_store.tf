# SSM Parameter Store for Feature Flags and Configuration
resource "aws_ssm_parameter" "transcriptions_enabled" {
  name  = "/cdss/feature-flags/transcriptions-enabled"
  type  = "String"
  value = "true"

  tags = {
    Project = var.project_name
  }
}

resource "aws_ssm_parameter" "translation_enabled" {
  name  = "/cdss/feature-flags/translation-enabled"
  type  = "String"
  value = "true"

  tags = {
    Project = var.project_name
  }
}

resource "aws_ssm_parameter" "abdm_integration_enabled" {
  name  = "/cdss/feature-flags/abdm-integration-enabled"
  type  = "String"
  value = "false"

  tags = {
    Project = var.project_name
  }
}

output "ssm_parameters" {
  value = {
    transcriptions_enabled   = aws_ssm_parameter.transcriptions_enabled.name
    translation_enabled      = aws_ssm_parameter.translation_enabled.name
    abdm_integration_enabled = aws_ssm_parameter.abdm_integration_enabled.name
  }
}
