resource "aws_api_gateway_rest_api" "main" {
  name        = "${local.name_prefix}-api"
  description = "CDSS + Emergency Medical Triage API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name        = "${local.name_prefix}-api"
    Project     = var.project_name
    Environment = var.environment
  }
}

# /api -> CDSS router Lambda (proxy)
resource "aws_api_gateway_resource" "api" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "api"
}

resource "aws_api_gateway_resource" "api_proxy" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.api.id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "api_proxy_any" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.api_proxy.id
  http_method   = "ANY"
  authorization = "NONE"
  request_parameters = {
    "method.request.path.proxy" = true
  }
}

resource "aws_api_gateway_integration" "api_proxy" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.api_proxy.id
  http_method             = aws_api_gateway_method.api_proxy_any.http_method
  type                    = "AWS_PROXY"
  integration_http_method  = "POST"
  uri                     = module.cdss_lambda.invoke_arn
}

resource "aws_lambda_permission" "cdss_api_gateway" {
  statement_id  = "AllowAPIGatewayInvokeCDSS"
  action        = "lambda:InvokeFunction"
  function_name = module.cdss_lambda.api_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/api/*"
}

resource "aws_api_gateway_resource" "triage" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "triage"
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {}
}

resource "aws_api_gateway_integration" "health_mock" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.health.id
  http_method             = aws_api_gateway_method.health_get.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = aws_lambda_function.health.invoke_arn
}

# POST /triage
resource "aws_api_gateway_method" "triage_post" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.triage.id
  http_method   = "POST"
  authorization = "NONE"

  request_parameters = {}
}

resource "aws_api_gateway_integration" "triage_post" {
  rest_api_id             = aws_api_gateway_rest_api.main.id
  resource_id             = aws_api_gateway_resource.triage.id
  http_method             = aws_api_gateway_method.triage_post.http_method
  type                    = "AWS_PROXY"
  integration_http_method = "POST"
  uri                     = var.enable_triage ? aws_lambda_function.triage[0].invoke_arn : aws_lambda_function.health.invoke_arn
}

resource "aws_lambda_permission" "triage_api_gateway" {
  count = var.enable_triage ? 1 : 0

  statement_id  = "AllowAPIGatewayInvokeTriage"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.triage[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*/triage"
}

# AWS_PROXY passes response through from Lambda; no method/integration response needed

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.triage.id,
      aws_api_gateway_resource.health.id,
      aws_api_gateway_resource.api.id,
      aws_api_gateway_resource.api_proxy.id,
      aws_api_gateway_method.health_get.id,
      aws_api_gateway_integration.health_mock.id,
      aws_api_gateway_method.triage_post.id,
      aws_api_gateway_integration.triage_post.id,
      aws_api_gateway_method.api_proxy_any.id,
      aws_api_gateway_integration.api_proxy.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment
}
