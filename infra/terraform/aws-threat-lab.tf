# AWS Threat Testing Lab Infrastructure
# Terraform template for Identity threat scenarios (Okta bypass, AD attacks, etc.)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment_name" {
  description = "Name for the threat lab environment"
  type        = string
  default     = "threat-lab"
}

variable "threat_category" {
  description = "Threat category being tested"
  type        = string
  default     = "identity"
}

# VPC for isolated testing
resource "aws_vpc" "threat_lab_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment_name}-vpc"
    Category    = var.threat_category
    Purpose     = "ThreatTesting"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "threat_lab_igw" {
  vpc_id = aws_vpc.threat_lab_vpc.id

  tags = {
    Name = "${var.environment_name}-igw"
  }
}

# Public subnet for jump box
resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.threat_lab_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment_name}-public-subnet"
  }
}

# Private subnet for target systems
resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.threat_lab_vpc.id
  cidr_block        = "10.0.2.0/24"  
  availability_zone = "${var.aws_region}a"

  tags = {
    Name = "${var.environment_name}-private-subnet"
  }
}

# Route table for public subnet
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.threat_lab_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.threat_lab_igw.id
  }

  tags = {
    Name = "${var.environment_name}-public-rt"
  }
}

resource "aws_route_table_association" "public_rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "jump_box_sg" {
  name_prefix = "${var.environment_name}-jump-"
  vpc_id      = aws_vpc.threat_lab_vpc.id

  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # RDP access  
  ingress {
    from_port   = 3389
    to_port     = 3389
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment_name}-jump-sg"
  }
}

resource "aws_security_group" "target_systems_sg" {
  name_prefix = "${var.environment_name}-targets-"
  vpc_id      = aws_vpc.threat_lab_vpc.id

  # Allow traffic from jump box
  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.jump_box_sg.id]
  }

  # LDAP ports for AD testing
  ingress {
    from_port   = 389
    to_port     = 389
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  ingress {
    from_port   = 636
    to_port     = 636
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  # Kerberos
  ingress {
    from_port   = 88
    to_port     = 88
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment_name}-targets-sg"
  }
}

# Jump Box (Windows Server for administration)
resource "aws_instance" "jump_box" {
  ami             = "ami-0c02fb55956c7d316" # Windows Server 2022 Base
  instance_type   = "t3.medium"
  subnet_id       = aws_subnet.public_subnet.id
  security_groups = [aws_security_group.jump_box_sg.id]

  user_data = base64encode(templatefile("${path.module}/scripts/jump_box_setup.ps1", {
    environment_name = var.environment_name
  }))

  tags = {
    Name     = "${var.environment_name}-jump-box"
    Role     = "JumpBox"
    Category = var.threat_category
  }
}

# Domain Controller (for identity threats)
resource "aws_instance" "domain_controller" {
  count           = var.threat_category == "identity" ? 1 : 0
  ami             = "ami-0c02fb55956c7d316" # Windows Server 2022 Base
  instance_type   = "t3.medium"
  subnet_id       = aws_subnet.private_subnet.id
  security_groups = [aws_security_group.target_systems_sg.id]

  user_data = base64encode(templatefile("${path.module}/scripts/domain_controller_setup.ps1", {
    environment_name = var.environment_name
    domain_name     = "${replace(var.environment_name, "-", "")}.local"
  }))

  tags = {
    Name     = "${var.environment_name}-dc"
    Role     = "DomainController"
    Category = var.threat_category
  }
}

# CloudTrail for AWS API logging
resource "aws_cloudtrail" "threat_lab_trail" {
  name           = "${var.environment_name}-cloudtrail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_bucket.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }

  tags = {
    Name     = "${var.environment_name}-trail"
    Category = var.threat_category
  }
}

# S3 bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_bucket" {
  bucket        = "${var.environment_name}-cloudtrail-${random_string.bucket_suffix.result}"
  force_destroy = true

  tags = {
    Name     = "${var.environment_name}-cloudtrail-bucket"
    Category = var.threat_category
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.cloudtrail_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Outputs
output "jump_box_public_ip" {
  description = "Public IP of the jump box"
  value       = aws_instance.jump_box.public_ip
}

output "domain_controller_private_ip" {
  description = "Private IP of the domain controller"
  value       = var.threat_category == "identity" ? aws_instance.domain_controller[0].private_ip : "N/A"
}

output "cloudtrail_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_bucket.bucket
}

output "vpc_id" {
  description = "VPC ID for the threat lab"
  value       = aws_vpc.threat_lab_vpc.id
}

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    environment_name = var.environment_name
    threat_category  = var.threat_category
    vpc_cidr        = aws_vpc.threat_lab_vpc.cidr_block
    jump_box_ip     = aws_instance.jump_box.public_ip
    dc_ip          = var.threat_category == "identity" ? aws_instance.domain_controller[0].private_ip : "N/A"
    cloudtrail_logs = aws_s3_bucket.cloudtrail_bucket.bucket
  }
}