terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.1"
    }
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "SecurityLab"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "security-lab"
}

variable "lab_name" {
  description = "Name prefix for lab resources"
  type        = string
  default     = "security-lab"
}

variable "key_name" {
  description = "AWS key pair name"
  type        = string
  default     = "security-lab-key"
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_ami" "windows" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["Windows_Server-2022-English-Full-Base-*"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Random string for unique naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# VPC and Networking
resource "aws_vpc" "lab_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.lab_name}-vpc"
  }
}

resource "aws_internet_gateway" "lab_igw" {
  vpc_id = aws_vpc.lab_vpc.id

  tags = {
    Name = "${var.lab_name}-igw"
  }
}

resource "aws_subnet" "public_subnet" {
  count                   = 2
  vpc_id                  = aws_vpc.lab_vpc.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.lab_name}-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private_subnet" {
  count             = 2
  vpc_id            = aws_vpc.lab_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.lab_name}-private-subnet-${count.index + 1}"
  }
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.lab_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lab_igw.id
  }

  tags = {
    Name = "${var.lab_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_rta" {
  count          = length(aws_subnet.public_subnet)
  subnet_id      = aws_subnet.public_subnet[count.index].id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "lab_sg" {
  name_prefix = "${var.lab_name}-sg"
  vpc_id      = aws_vpc.lab_vpc.id

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # RDP for Windows
  ingress {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "RDP access"
  }

  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP access"
  }

  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  # Custom ports for lab services
  ingress {
    from_port   = 8000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Lab services"
  }

  # Internal communication
  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
    description = "Internal communication"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name = "${var.lab_name}-security-group"
  }
}

# Key Pair (assumes you have a public key)
resource "aws_key_pair" "lab_key" {
  key_name   = var.key_name
  public_key = file("~/.ssh/id_rsa.pub")

  tags = {
    Name = "${var.lab_name}-key"
  }
}

# Ubuntu Lab Server
resource "aws_instance" "ubuntu_lab" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.large"
  key_name               = aws_key_pair.lab_key.key_name
  vpc_security_group_ids = [aws_security_group.lab_sg.id]
  subnet_id              = aws_subnet.public_subnet[0].id
  iam_instance_profile   = aws_iam_instance_profile.lab_profile.name

  user_data = base64encode(templatefile("${path.module}/user-data-ubuntu.sh", {
    region        = var.aws_region
    lab_name      = var.lab_name
    s3_bucket     = aws_s3_bucket.lab_logs.id
    log_group     = aws_cloudwatch_log_group.lab_logs.name
  }))

  root_block_device {
    volume_type = "gp3"
    volume_size = 50
    encrypted   = true
  }

  tags = {
    Name = "${var.lab_name}-ubuntu-server"
    Type = "SecurityLab"
  }
}

# Windows Lab Server
resource "aws_instance" "windows_lab" {
  ami                    = data.aws_ami.windows.id
  instance_type          = "t3.large"
  key_name               = aws_key_pair.lab_key.key_name
  vpc_security_group_ids = [aws_security_group.lab_sg.id]
  subnet_id              = aws_subnet.public_subnet[1].id
  iam_instance_profile   = aws_iam_instance_profile.lab_profile.name

  user_data = base64encode(templatefile("${path.module}/user-data-windows.ps1", {
    region        = var.aws_region
    lab_name      = var.lab_name
    s3_bucket     = aws_s3_bucket.lab_logs.id
    log_group     = aws_cloudwatch_log_group.lab_logs.name
  }))

  root_block_device {
    volume_type = "gp3"
    volume_size = 100
    encrypted   = true
  }

  tags = {
    Name = "${var.lab_name}-windows-server"
    Type = "SecurityLab"
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "lab_role" {
  name = "${var.lab_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.lab_name}-ec2-role"
  }
}

resource "aws_iam_role_policy" "lab_policy" {
  name = "${var.lab_name}-policy"
  role = aws_iam_role.lab_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.lab_logs.arn,
          "${aws_s3_bucket.lab_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "lab_profile" {
  name = "${var.lab_name}-profile"
  role = aws_iam_role.lab_role.name

  tags = {
    Name = "${var.lab_name}-instance-profile"
  }
}

# S3 Bucket for logs and artifacts
resource "aws_s3_bucket" "lab_logs" {
  bucket = "${var.lab_name}-logs-${random_string.suffix.result}"

  tags = {
    Name = "${var.lab_name}-logs"
  }
}

resource "aws_s3_bucket_versioning" "lab_logs_versioning" {
  bucket = aws_s3_bucket.lab_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lab_logs_encryption" {
  bucket = aws_s3_bucket.lab_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "lab_logs_pab" {
  bucket = aws_s3_bucket.lab_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lab_logs" {
  name              = "/aws/ec2/${var.lab_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.lab_name}-cloudwatch-logs"
  }
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "lab_trail" {
  name           = "${var.lab_name}-trail"
  s3_bucket_name = aws_s3_bucket.lab_logs.id

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.lab_logs.id}/*"]
    }
  }

  tags = {
    Name = "${var.lab_name}-cloudtrail"
  }
}

# Application Load Balancer for lab services
resource "aws_lb" "lab_alb" {
  name               = "${var.lab_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lab_sg.id]
  subnets            = aws_subnet.public_subnet[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.lab_name}-alb"
  }
}

resource "aws_lb_target_group" "lab_tg" {
  name     = "${var.lab_name}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.lab_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.lab_name}-target-group"
  }
}

resource "aws_lb_listener" "lab_listener" {
  load_balancer_arn = aws_lb.lab_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.lab_tg.arn
  }
}

# Outputs
output "ubuntu_server_ip" {
  description = "Public IP of Ubuntu server"
  value       = aws_instance.ubuntu_lab.public_ip
}

output "windows_server_ip" {
  description = "Public IP of Windows server"
  value       = aws_instance.windows_lab.public_ip
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.lab_alb.dns_name
}

output "s3_bucket_name" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.lab_logs.id
}

output "ssh_ubuntu" {
  description = "SSH command for Ubuntu server"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.ubuntu_lab.public_ip}"
}

output "rdp_windows" {
  description = "RDP connection for Windows server"
  value       = "mstsc /v:${aws_instance.windows_lab.public_ip}"
}

output "lab_info" {
  description = "Lab environment information"
  value = {
    vpc_id          = aws_vpc.lab_vpc.id
    ubuntu_ip       = aws_instance.ubuntu_lab.public_ip
    windows_ip      = aws_instance.windows_lab.public_ip
    s3_bucket       = aws_s3_bucket.lab_logs.id
    load_balancer   = aws_lb.lab_alb.dns_name
  }
}