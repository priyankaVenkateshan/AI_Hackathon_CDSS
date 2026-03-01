output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "aurora_cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.aurora.endpoint
}

output "aurora_cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "aurora_database_name" {
  description = "Aurora database name"
  value       = aws_rds_cluster.aurora.database_name
}

output "bedrock_policy_arn" {
  description = "IAM policy ARN for Bedrock invocation"
  value       = aws_iam_policy.bedrock_invoke.arn
}

output "api_gateway_url" {
  description = "API Gateway base URL"
  value       = "${aws_api_gateway_stage.main.invoke_url}/"
}

output "bedrock_config_secret_name" {
  description = "Secrets Manager secret name for Bedrock config"
  value       = aws_secretsmanager_secret.bedrock_config.name
}

output "rds_config_secret_name" {
  description = "Secrets Manager secret name for RDS connection config (IAM auth)"
  value       = aws_secretsmanager_secret.rds_config.name
}

output "bastion_public_ip" {
  description = "Bastion public IP for SSH tunnel (when enable_bastion=true)"
  value       = var.enable_bastion ? aws_instance.bastion[0].public_ip : null
}

output "api_gateway_health_url" {
  description = "API Gateway health check URL"
  value       = "${aws_api_gateway_stage.main.invoke_url}/health"
}

# CDSS
output "api_gateway_cdss_url" {
  description = "CDSS API base URL (proxy)"
  value       = "${aws_api_gateway_stage.main.invoke_url}/api/"
}

output "cdss_lambda_function_names" {
  description = "CDSS Lambda function names"
  value       = module.cdss_lambda.function_names
}

output "cdss_dynamodb_tables" {
  description = "CDSS DynamoDB table names"
  value       = module.cdss_dynamodb.table_names
}

output "cdss_event_bus_name" {
  description = "CDSS EventBridge event bus name"
  value       = module.cdss_eventbridge.event_bus_name
}

output "s3_bucket_documents" {
  description = "S3 bucket for medical documents"
  value       = aws_s3_bucket.documents.id
}

output "s3_bucket_corpus" {
  description = "S3 bucket for knowledge corpus"
  value       = aws_s3_bucket.corpus.id
}
