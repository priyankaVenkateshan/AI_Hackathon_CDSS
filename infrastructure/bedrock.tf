# Bedrock is a regional managed service - no resource creation needed.
# Enable model access in AWS Console: Bedrock > Model access in the left menu.
# This IAM policy grants permissions for applications (e.g. Lambda) to invoke Bedrock models.

resource "aws_iam_policy" "bedrock_invoke" {
  name        = "${local.name_prefix}-bedrock-invoke"
  description = "Allow invoking Amazon Bedrock foundation models"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
        Resource = [
          "arn:aws:bedrock:ap-south-1::foundation-model/*",
          "arn:aws:bedrock:ap-south-1:*:inference-profile/*",
          "arn:aws:bedrock:us-east-1::foundation-model/*",
          "arn:aws:bedrock:us-east-2::foundation-model/*",
          "arn:aws:bedrock:us-west-2::foundation-model/*",
          "arn:aws:bedrock:us-east-1:*:inference-profile/*",
          "arn:aws:bedrock:us-east-2:*:inference-profile/*",
          "arn:aws:bedrock:us-west-2:*:inference-profile/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["bedrock:InvokeAgent"]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob",
          "transcribe:ListTranscriptionJobs"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "translate:TranslateText",
          "translate:GetTerminology",
          "translate:ListTerminologies"
        ]
        Resource = "*"
      }
    ]
  })
}
