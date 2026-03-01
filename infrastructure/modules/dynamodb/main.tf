resource "aws_dynamodb_table" "sessions" {
  name         = "${var.name}-sessions-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "sessionId"
  range_key    = "sk"

  attribute {
    name = "sessionId"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
}

resource "aws_dynamodb_table" "medication_schedules" {
  name         = "${var.name}-medication-schedules-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "patientId"
  range_key    = "scheduleId"

  attribute {
    name = "patientId"
    type = "S"
  }
  attribute {
    name = "scheduleId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "patients" {
  name         = "${var.name}-patients-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "patientId"

  attribute {
    name = "patientId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "consultations" {
  name         = "${var.name}-consultations-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "patientId"
  range_key    = "consultationId"

  attribute {
    name = "patientId"
    type = "S"
  }
  attribute {
    name = "consultationId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "ot_slots" {
  name         = "${var.name}-ot-slots-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "otId"
  range_key    = "slotTime"

  attribute {
    name = "otId"
    type = "S"
  }
  attribute {
    name = "slotTime"
    type = "S"
  }
}

resource "aws_dynamodb_table" "equipment" {
  name         = "${var.name}-equipment-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "equipmentId"

  attribute {
    name = "equipmentId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "protocols" {
  name         = "${var.name}-protocols-${var.stage}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "protocolId"

  attribute {
    name = "protocolId"
    type = "S"
  }
}

output "table_names" {
  value = {
    sessions             = aws_dynamodb_table.sessions.name
    medication_schedules = aws_dynamodb_table.medication_schedules.name
    patients             = aws_dynamodb_table.patients.name
    consultations        = aws_dynamodb_table.consultations.name
    ot_slots             = aws_dynamodb_table.ot_slots.name
    equipment            = aws_dynamodb_table.equipment.name
    protocols            = aws_dynamodb_table.protocols.name
  }
}
