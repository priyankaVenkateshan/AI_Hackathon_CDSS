resource "aws_cloudwatch_event_bus" "cdss" {
  name = "${var.name}-events-${var.stage}"
}

output "event_bus_name" {
  value = aws_cloudwatch_event_bus.cdss.name
}
