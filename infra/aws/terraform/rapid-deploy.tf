# Rapid AWS Deployment Configuration
# Optimized for temporary accounts and fast builds

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables for rapid deployment
variable "rapid_deployment" {
  description = "Enable rapid deployment optimizations"
  type        = bool
  default     = true
}

variable "auto_cleanup_hours" {
  description = "Hours before auto-cleanup"
  type        = number
  default     = 8
}

variable "vm_count" {
  description = "Number of VMs for rapid deployment"
  type        = number
  default     = 2
}

variable "instance_type" {
  description = "EC2 instance type for rapid deployment"
  type        = string
  default     = "t3.small"  # Balance of speed and cost
}

# Use default VPC for fastest provisioning
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_availability_zones" "available" {
  state = "available"
}

# Latest Ubuntu AMI (pre-configured for speed)
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security group for rapid deployment
resource "aws_security_group" "rapid_lab" {
  name_description_prefix = "rapid-security-lab"
  vpc_id                  = data.aws_vpc.default.id

  # Essential ports only for speed
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Node.js Lab"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "OWASP ZAP"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "rapid-security-lab"
    Environment = "rapid-testing"
    AutoCleanup = "true"
    TTL         = "${var.auto_cleanup_hours}h"
  }
}

# Key pair for SSH access
resource "aws_key_pair" "rapid_lab" {
  key_name   = "rapid-lab-key-${random_id.deployment.hex}"
  public_key = file("~/.ssh/id_rsa.pub")

  tags = {
    Name        = "rapid-lab-keypair"
    Environment = "rapid-testing"
    AutoCleanup = "true"
  }
}

# Random ID for unique resource naming
resource "random_id" "deployment" {
  byte_length = 4
}

# User data script for rapid setup
locals {
  user_data = base64encode(templatefile("${path.module}/rapid-userdata.sh", {
    deployment_id = random_id.deployment.hex
  }))
}

# Rapid security lab instances
resource "aws_instance" "rapid_lab" {
  count                  = var.vm_count
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.rapid_lab.key_name
  vpc_security_group_ids = [aws_security_group.rapid_lab.id]
  subnet_id              = data.aws_subnets.default.ids[count.index % length(data.aws_subnets.default.ids)]

  # Optimized storage for speed
  root_block_device {
    volume_type = "gp3"  # Fastest general purpose SSD
    volume_size = 20     # Minimal size for speed
    throughput  = 125    # Default throughput
    iops        = 3000   # High IOPS for fast boot
    
    delete_on_termination = true
    encrypted             = false  # Skip encryption for speed
  }

  user_data                   = local.user_data
  associate_public_ip_address = true

  # Instance metadata options (security best practice)
  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = {
    Name        = "rapid-lab-${count.index + 1}-${random_id.deployment.hex}"
    Environment = "rapid-testing"
    AutoCleanup = "true"
    TTL         = "${var.auto_cleanup_hours}h"
    DeployedBy  = "rapid-deployment"
  }

  # Create instances in parallel
  lifecycle {
    create_before_destroy = true
  }
}

# Dedicated XSIAM instance (enhanced resources)
resource "aws_instance" "xsiam_rapid" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.medium"  # Enhanced for XSIAM
  key_name               = aws_key_pair.rapid_lab.key_name
  vpc_security_group_ids = [aws_security_group.rapid_lab.id]
  subnet_id              = data.aws_subnets.default.ids[0]

  root_block_device {
    volume_type = "gp3"
    volume_size = 40     # Larger for XSIAM
    throughput  = 125
    iops        = 3000
    
    delete_on_termination = true
    encrypted             = false
  }

  user_data                   = local.user_data
  associate_public_ip_address = true

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
  }

  tags = {
    Name        = "xsiam-rapid-${random_id.deployment.hex}"
    Environment = "rapid-testing"
    AutoCleanup = "true"
    TTL         = "${var.auto_cleanup_hours}h"
    Role        = "xsiam-server"
  }
}

# Auto-cleanup Lambda function (optional)
resource "aws_lambda_function" "auto_cleanup" {
  count = var.rapid_deployment ? 1 : 0

  filename         = "auto-cleanup.zip"
  function_name    = "rapid-lab-cleanup-${random_id.deployment.hex}"
  role            = aws_iam_role.lambda_cleanup[0].arn
  handler         = "index.handler"
  runtime         = "python3.9"
  timeout         = 300

  environment {
    variables = {
      DEPLOYMENT_ID = random_id.deployment.hex
      TTL_HOURS     = var.auto_cleanup_hours
    }
  }

  tags = {
    Environment = "rapid-testing"
    AutoCleanup = "true"
  }

  depends_on = [data.archive_file.lambda_cleanup]
}

# Lambda cleanup script
data "archive_file" "lambda_cleanup" {
  count = var.rapid_deployment ? 1 : 0
  
  type        = "zip"
  output_path = "auto-cleanup.zip"
  
  source {
    content = templatefile("${path.module}/cleanup-lambda.py", {
      deployment_id = random_id.deployment.hex
    })
    filename = "index.py"
  }
}

# IAM role for Lambda cleanup
resource "aws_iam_role" "lambda_cleanup" {
  count = var.rapid_deployment ? 1 : 0
  
  name = "rapid-lab-cleanup-role-${random_id.deployment.hex}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Lambda cleanup
resource "aws_iam_role_policy" "lambda_cleanup" {
  count = var.rapid_deployment ? 1 : 0
  
  name = "rapid-lab-cleanup-policy"
  role = aws_iam_role.lambda_cleanup[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ec2:DescribeInstances",
          "ec2:TerminateInstances",
          "ec2:DeleteSecurityGroup",
          "ec2:DeleteKeyPair"
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch event for scheduled cleanup
resource "aws_cloudwatch_event_rule" "cleanup_schedule" {
  count = var.rapid_deployment ? 1 : 0
  
  name                = "rapid-lab-cleanup-${random_id.deployment.hex}"
  description         = "Trigger cleanup after ${var.auto_cleanup_hours} hours"
  schedule_expression = "rate(${var.auto_cleanup_hours} hours)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  count = var.rapid_deployment ? 1 : 0
  
  rule      = aws_cloudwatch_event_rule.cleanup_schedule[0].name
  target_id = "TriggerLambda"
  arn       = aws_lambda_function.auto_cleanup[0].arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  count = var.rapid_deployment ? 1 : 0
  
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.auto_cleanup[0].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cleanup_schedule[0].arn
}

# Outputs for rapid access
output "public_ips" {
  description = "Public IP addresses of rapid lab instances"
  value       = concat(aws_instance.rapid_lab[*].public_ip, [aws_instance.xsiam_rapid.public_ip])
}

output "ssh_commands" {
  description = "SSH commands for rapid access"
  value = [
    for ip in concat(aws_instance.rapid_lab[*].public_ip, [aws_instance.xsiam_rapid.public_ip]) :
    "ssh -o StrictHostKeyChecking=no ubuntu@${ip}"
  ]
}

output "web_urls" {
  description = "Web URLs for rapid access"
  value = {
    for i, ip in concat(aws_instance.rapid_lab[*].public_ip, [aws_instance.xsiam_rapid.public_ip]) :
    "instance-${i + 1}" => {
      dashboard = "http://${ip}"
      nodejs    = "http://${ip}:3000"
      zap       = "http://${ip}:8080"
    }
  }
}

output "cleanup_info" {
  description = "Auto-cleanup information"
  value = {
    deployment_id   = random_id.deployment.hex
    cleanup_hours   = var.auto_cleanup_hours
    cleanup_enabled = var.rapid_deployment
  }
}