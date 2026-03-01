# Triage Lambda and API Gateway POST /triage (optional: set enable_triage=true when triage source exists)

resource "null_resource" "build_triage_lambda" {
  count = var.enable_triage ? 1 : 0

  triggers = {
    src    = filesha256("${path.module}/../src/triage/models/triage.py")
    script = filesha256("${path.module}/../scripts/build_triage_lambda.sh")
  }
  provisioner "local-exec" {
    command     = "bash ${path.module}/../scripts/build_triage_lambda.sh"
    working_dir = path.module
  }
}

data "archive_file" "triage_lambda" {
  count = var.enable_triage ? 1 : 0

  type        = "zip"
  source_dir  = "${path.module}/triage_lambda_src"
  output_path = "${path.module}/triage_lambda.zip"
  depends_on  = [null_resource.build_triage_lambda]
}

resource "aws_iam_role" "triage_lambda" {
  count = var.enable_triage ? 1 : 0

  name = "${local.name_prefix}-triage-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "triage_lambda_basic" {
  count = var.enable_triage ? 1 : 0

  role       = aws_iam_role.triage_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "triage_lambda_bedrock" {
  count = var.enable_triage ? 1 : 0

  role       = aws_iam_role.triage_lambda[0].name
  policy_arn = aws_iam_policy.bedrock_invoke.arn
}

resource "aws_lambda_function" "triage" {
  count = var.enable_triage ? 1 : 0

  filename         = data.archive_file.triage_lambda[0].output_path
  function_name    = "${local.name_prefix}-triage"
  role             = aws_iam_role.triage_lambda[0].arn
  handler          = "lambda_handler.handler"
  source_code_hash = data.archive_file.triage_lambda[0].output_base64sha256
  runtime          = "python3.12"
  timeout          = 120

  environment {
    variables = {
      BEDROCK_AGENT_ID       = var.bedrock_agent_id
      BEDROCK_AGENT_ALIAS_ID = var.bedrock_agent_alias_id
      BEDROCK_MODEL_ID       = var.bedrock_model_id
    }
  }
}
