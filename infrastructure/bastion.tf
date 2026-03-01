# Bastion host for SSH tunnel to Aurora (dev only)
# Set enable_bastion=true, bastion_ssh_public_key, bastion_allowed_cidr in terraform.tfvars

resource "aws_internet_gateway" "main" {
  count  = var.enable_bastion ? 1 : 0
  vpc_id = aws_vpc.main.id
  tags = {
    Name = "${local.name_prefix}-igw"
  }
}

resource "aws_subnet" "public_a" {
  count                   = var.enable_bastion ? 1 : 0
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.10.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags = {
    Name = "${local.name_prefix}-public-a"
  }
}

resource "aws_route_table" "public" {
  count  = var.enable_bastion ? 1 : 0
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main[0].id
  }
  tags = { Name = "${local.name_prefix}-public-rt" }
}

resource "aws_route_table_association" "public_a" {
  count          = var.enable_bastion ? 1 : 0
  subnet_id      = aws_subnet.public_a[0].id
  route_table_id = aws_route_table.public[0].id
}

resource "aws_security_group" "bastion" {
  count       = var.enable_bastion ? 1 : 0
  name        = "${local.name_prefix}-bastion-sg"
  description = "Bastion host - SSH from allowed CIDR"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.bastion_allowed_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-bastion-sg"
  }
}

# Allow bastion to reach Aurora
resource "aws_security_group_rule" "aurora_from_bastion" {
  count                    = var.enable_bastion ? 1 : 0
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.aurora.id
  source_security_group_id = aws_security_group.bastion[0].id
  description              = "PostgreSQL from bastion"
}

resource "aws_key_pair" "bastion" {
  count      = var.enable_bastion ? 1 : 0
  key_name   = "${local.name_prefix}-bastion-key"
  public_key = var.bastion_ssh_public_key
}

# Only look up AMI when bastion is enabled (avoids ec2:DescribeImages when not needed)
data "aws_ami" "amazon_linux" {
  count = var.enable_bastion ? 1 : 0

  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }
}

resource "aws_instance" "bastion" {
  count                  = var.enable_bastion ? 1 : 0
  ami                    = data.aws_ami.amazon_linux[0].id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public_a[0].id
  vpc_security_group_ids = [aws_security_group.bastion[0].id]
  key_name               = aws_key_pair.bastion[0].key_name

  tags = {
    Name    = "${local.name_prefix}-bastion"
    Project = var.project_name
  }
}
