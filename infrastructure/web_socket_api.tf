# WebSocket API for real-time surgical updates
resource "aws_apigatewayv2_api" "websocket" {
  count = var.enable_websocket_api ? 1 : 0

  name                       = "${local.name_prefix}-websocket-api"
  protocol_type               = "WEBSOCKET"
  route_selection_expression = "$request.body.action"

  tags = {
    Name    = "${local.name_prefix}-websocket-api"
    Project = var.project_name
  }
}

resource "aws_apigatewayv2_stage" "websocket" {
  count = var.enable_websocket_api ? 1 : 0

  api_id      = aws_apigatewayv2_api.websocket[0].id
  name        = var.environment
  auto_deploy = true
}

# Simple handler for WebSocket connections (placeholder)
resource "aws_iam_role" "websocket_lambda" {
  count = var.enable_websocket_api ? 1 : 0
  name  = "${local.name_prefix}-websocket-role"

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

resource "aws_iam_role_policy_attachment" "websocket_lambda" {
  count      = var.enable_websocket_api ? 1 : 0
  role       = aws_iam_role.websocket_lambda[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "websocket_handler" {
  count = var.enable_websocket_api ? 1 : 0

  function_name = "${local.name_prefix}-websocket-handler"
  role          = aws_iam_role.websocket_lambda[0].arn
  handler       = "websocket_handler.handler" # Placeholder, assume same backend structure
  runtime       = "python3.12"

  # Using health_lambda.zip or similar for now as a placeholder
  filename         = data.archive_file.health_lambda.output_path
  source_code_hash = data.archive_file.health_lambda.output_base64sha256
}

# Routes
resource "aws_apigatewayv2_route" "connect" {
  count = var.enable_websocket_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.websocket[0].id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket[0].id}"
}

resource "aws_apigatewayv2_route" "disconnect" {
  count = var.enable_websocket_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.websocket[0].id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.websocket[0].id}"
}

resource "aws_apigatewayv2_route" "default" {
  count = var.enable_websocket_api ? 1 : 0

  api_id    = aws_apigatewayv2_api.websocket[0].id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.websocket[0].id}"
}

resource "aws_apigatewayv2_integration" "websocket" {
  count = var.enable_websocket_api ? 1 : 0

  api_id           = aws_apigatewayv2_api.websocket[0].id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.websocket_handler[0].invoke_arn
}

resource "aws_lambda_permission" "websocket_api_gateway" {
  count = var.enable_websocket_api ? 1 : 0

  statement_id  = "AllowExecutionFromApiGateway-${aws_apigatewayv2_api.websocket[0].id}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.websocket_handler[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.websocket[0].execution_arn}/*/*"
}
