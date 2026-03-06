# AgentCore Gateway tool Lambda – invoked by Bedrock AgentCore Gateway as MCP tool target.
# See docs/agentcore-gateway-manual-steps.md and docs/agentcore-next-steps-implementation.md.

data "archive_file" "gateway_tools" {
  type        = "zip"
  source_dir  = "${path.module}/gateway_tools_src"
  output_path = "${path.module}/gateway_tools.zip"
}

resource "aws_iam_role" "gateway_tools" {
  name = "${local.name_prefix}-gateway-tools-role"

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

resource "aws_iam_role_policy_attachment" "gateway_tools" {
  role       = aws_iam_role.gateway_tools.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "gateway_tools" {
  filename         = data.archive_file.gateway_tools.output_path
  function_name    = "${local.name_prefix}-gateway-get-hospitals"
  role             = aws_iam_role.gateway_tools.arn
  handler          = "lambda_handler.handler"
  source_code_hash = data.archive_file.gateway_tools.output_base64sha256
  runtime          = "python3.12"
  timeout          = 30
  memory_size      = 128
}
