# SNS Topics for Notifications
resource "aws_sns_topic" "patient_reminders" {
  name = "${local.name_prefix}-patient-reminders"
}

resource "aws_sns_topic" "doctor_escalations" {
  name = "${local.name_prefix}-doctor-escalations"
}

# SQS Queues for Async inter-agent events
resource "aws_sqs_queue" "agent_events" {
  name                      = "${local.name_prefix}-agent-events"
  message_retention_seconds = 86400 # 1 day
}

resource "aws_sqs_queue" "agent_events_dlq" {
  name = "${local.name_prefix}-agent-events-dlq"
}

# Redrive policy for agent_events queue
resource "aws_sqs_queue_redrive_policy" "agent_events" {
  queue_url = aws_sqs_queue.agent_events.id
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.agent_events_dlq.arn
    maxReceiveCount     = 5
  })
}

# EventBridge rule to route to SQS (Inter-agent messaging)
resource "aws_cloudwatch_event_rule" "inter_agent_messaging" {
  name           = "${local.name_prefix}-inter-agent-messaging"
  event_bus_name = module.cdss_eventbridge.event_bus_name
  event_pattern = jsonencode({
    source = ["cdss.agents"]
  })
}

resource "aws_cloudwatch_event_target" "sqs" {
  rule           = aws_cloudwatch_event_rule.inter_agent_messaging.name
  event_bus_name = module.cdss_eventbridge.event_bus_name
  arn            = aws_sqs_queue.agent_events.arn
}

# Allow EventBridge to write to SQS
resource "aws_sqs_queue_policy" "agent_events" {
  queue_url = aws_sqs_queue.agent_events.id

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "AllowEventBridgeWrite"
    Statement = [{
      Sid    = "AllowEventBridge"
      Effect = "Allow"
      Principal = {
        Service = "events.amazonaws.com"
      }
      Action   = "sqs:SendMessage"
      Resource = aws_sqs_queue.agent_events.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_cloudwatch_event_rule.inter_agent_messaging.arn
        }
      }
    }]
  })
}

output "sqs_queue_url" {
  value = aws_sqs_queue.agent_events.id
}

output "sns_patient_reminders_arn" {
  value = aws_sns_topic.patient_reminders.arn
}

output "sns_doctor_escalations_arn" {
  value = aws_sns_topic.doctor_escalations.arn
}
