#!/bin/bash
# One-Click AWS Security Lab Deployment
# This script deploys a complete AWS security testing environment

set -e  # Exit on any error

echo "☁️  Starting AWS Security Lab Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "📦 Installing AWS CLI..."
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
fi

# Check if Terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "📦 Installing Terraform..."
    wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
    sudo apt update && sudo apt install terraform
fi

# Create lab directory
LAB_DIR="$HOME/aws-security-lab"
mkdir -p "$LAB_DIR"
cd "$LAB_DIR"

echo "📁 Created lab directory: $LAB_DIR"

# Create Terraform configuration
cat > main.tf << 'EOF'
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

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "lab_name" {
  description = "Name prefix for lab resources"
  type        = string
  default     = "security-lab"
}

# VPC and Networking
resource "aws_vpc" "lab_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.lab_name}-vpc"
    Environment = "security-testing"
  }
}

resource "aws_internet_gateway" "lab_igw" {
  vpc_id = aws_vpc.lab_vpc.id

  tags = {
    Name = "${var.lab_name}-igw"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id                  = aws_vpc.lab_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.lab_name}-public-subnet"
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
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Group
resource "aws_security_group" "lab_sg" {
  name_prefix = "${var.lab_name}-sg"
  vpc_id      = aws_vpc.lab_vpc.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
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
    Name = "${var.lab_name}-security-group"
  }
}

# Key Pair
resource "aws_key_pair" "lab_key" {
  key_name   = "${var.lab_name}-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

# Ubuntu Server for testing
resource "aws_instance" "ubuntu_server" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = "t3.medium"
  key_name               = aws_key_pair.lab_key.key_name
  vpc_security_group_ids = [aws_security_group.lab_sg.id]
  subnet_id              = aws_subnet.public_subnet.id

  user_data = base64encode(templatefile("user-data.sh", {
    region = var.aws_region
  }))

  tags = {
    Name = "${var.lab_name}-ubuntu-server"
    Environment = "security-testing"
  }
}

# S3 Bucket for logs
resource "aws_s3_bucket" "lab_logs" {
  bucket = "${var.lab_name}-logs-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${var.lab_name}-logs"
    Environment = "security-testing"
  }
}

resource "aws_s3_bucket_versioning" "lab_logs_versioning" {
  bucket = aws_s3_bucket.lab_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "lab_logs_pab" {
  bucket = aws_s3_bucket.lab_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "lab_trail" {
  name           = "${var.lab_name}-trail"
  s3_bucket_name = aws_s3_bucket.lab_logs.id

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.lab_logs.id}/*"]
    }
  }

  tags = {
    Name = "${var.lab_name}-cloudtrail"
  }
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lab_logs" {
  name              = "/aws/ec2/${var.lab_name}"
  retention_in_days = 7

  tags = {
    Name = "${var.lab_name}-cloudwatch-logs"
  }
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

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Outputs
output "ubuntu_server_ip" {
  description = "Public IP of Ubuntu server"
  value       = aws_instance.ubuntu_server.public_ip
}

output "s3_bucket_name" {
  description = "S3 bucket for logs"
  value       = aws_s3_bucket.lab_logs.id
}

output "ssh_command" {
  description = "SSH command to connect to server"
  value       = "ssh -i ~/.ssh/id_rsa ubuntu@${aws_instance.ubuntu_server.public_ip}"
}

output "lab_info" {
  description = "Lab information"
  value = {
    vpc_id     = aws_vpc.lab_vpc.id
    subnet_id  = aws_subnet.public_subnet.id
    sg_id      = aws_security_group.lab_sg.id
    server_ip  = aws_instance.ubuntu_server.public_ip
    s3_bucket  = aws_s3_bucket.lab_logs.id
  }
}
EOF

# Create user data script
cat > user-data.sh << 'EOF'
#!/bin/bash
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update system
apt-get update && apt-get upgrade -y

# Install essential tools
apt-get install -y \
    curl \
    wget \
    git \
    docker.io \
    awscli \
    htop \
    net-tools \
    tcpdump \
    wireshark-common \
    build-essential

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Configure Docker
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CW_EOF'
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/syslog",
                        "log_group_name": "/aws/ec2/security-lab",
                        "log_stream_name": "{instance_id}/syslog"
                    },
                    {
                        "file_path": "/var/log/auth.log",
                        "log_group_name": "/aws/ec2/security-lab",
                        "log_stream_name": "{instance_id}/auth"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
CW_EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Create lab user
useradd -m -s /bin/bash labuser
usermod -aG sudo labuser
usermod -aG docker labuser

# Set up lab environment
mkdir -p /home/labuser/security-lab
chown labuser:labuser /home/labuser/security-lab

echo "Security lab setup complete!" > /home/labuser/security-lab/README.txt
echo "Server IP: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)" >> /home/labuser/security-lab/README.txt
echo "Region: ${region}" >> /home/labuser/security-lab/README.txt
EOF

# Create variables file
cat > terraform.tfvars << 'EOF'
aws_region = "us-east-1"
lab_name   = "security-lab"
EOF

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials not configured. Please run 'aws configure' first."
    echo "You need:"
    echo "  • AWS Access Key ID"
    echo "  • AWS Secret Access Key" 
    echo "  • Default region (e.g., us-east-1)"
    exit 1
fi

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "🔑 Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
fi

echo "🏗️  Initializing Terraform..."
terraform init

echo "📋 Planning deployment..."
terraform plan

echo "🚀 Deploying AWS Security Lab..."
terraform apply -auto-approve

echo "✅ AWS Security Lab deployed successfully!"
echo ""
echo "📊 Lab Information:"
terraform output

echo ""
echo "🛠️  Next Steps:"
echo "   1. Wait 2-3 minutes for server initialization"
echo "   2. Connect via SSH: terraform output -raw ssh_command"
echo "   3. Check server logs: sudo tail -f /var/log/user-data.log"
echo "   4. Start security testing in /home/labuser/security-lab/"
echo ""
echo "🧹 Cleanup when done:"
echo "   • Run: terraform destroy"
echo "   • Confirm with 'yes' to remove all resources"
echo ""
echo "☁️  AWS Security Lab is ready for cloud threat testing!"