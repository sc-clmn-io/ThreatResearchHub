# Terraform Configuration for Docker Escape Detection Lab
# Supports AWS, Azure, and GCP deployments

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

# Variables
variable "cloud_provider" {
  description = "Cloud provider to use (aws, azure, gcp)"
  type        = string
  default     = "aws"
  validation {
    condition     = contains(["aws", "azure", "gcp"], var.cloud_provider)
    error_message = "cloud_provider must be one of: aws, azure, gcp"
  }
}

variable "region" {
  description = "Cloud region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "Instance type for lab servers"
  type        = string
  default     = "t3.large"
}

variable "lab_name" {
  description = "Name prefix for lab resources"
  type        = string
  default     = "docker-escape-lab"
}

variable "key_name" {
  description = "SSH key name for access"
  type        = string
  default     = "docker-lab-key"
}

variable "allowed_cidr" {
  description = "CIDR block allowed to access lab"
  type        = string
  default     = "0.0.0.0/0"
}

variable "xsiam_url" {
  description = "XSIAM tenant URL"
  type        = string
  default     = ""
  sensitive   = true
}

variable "xsiam_api_key" {
  description = "XSIAM API key"
  type        = string
  default     = ""
  sensitive   = true
}

# Local values
locals {
  common_tags = {
    Project     = var.lab_name
    Environment = "lab"
    Purpose     = "container-security-testing"
    CreatedBy   = "terraform"
  }
  
  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    xsiam_url     = var.xsiam_url
    xsiam_api_key = var.xsiam_api_key
  }))
}

# AWS Resources
resource "aws_vpc" "lab_vpc" {
  count                = var.cloud_provider == "aws" ? 1 : 0
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${var.lab_name}-vpc"
  })
}

resource "aws_internet_gateway" "lab_igw" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  vpc_id = aws_vpc.lab_vpc[0].id
  
  tags = merge(local.common_tags, {
    Name = "${var.lab_name}-igw"
  })
}

resource "aws_subnet" "lab_subnet" {
  count                   = var.cloud_provider == "aws" ? 1 : 0
  vpc_id                  = aws_vpc.lab_vpc[0].id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available[0].names[0]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${var.lab_name}-subnet"
  })
}

resource "aws_route_table" "lab_rt" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  vpc_id = aws_vpc.lab_vpc[0].id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.lab_igw[0].id
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.lab_name}-rt"
  })
}

resource "aws_route_table_association" "lab_rta" {
  count          = var.cloud_provider == "aws" ? 1 : 0
  subnet_id      = aws_subnet.lab_subnet[0].id
  route_table_id = aws_route_table.lab_rt[0].id
}

resource "aws_security_group" "lab_sg" {
  count       = var.cloud_provider == "aws" ? 1 : 0
  name        = "${var.lab_name}-sg"
  description = "Security group for Docker escape detection lab"
  vpc_id      = aws_vpc.lab_vpc[0].id
  
  # SSH access
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }
  
  # Kibana
  ingress {
    from_port   = 5601
    to_port     = 5601
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }
  
  # Elasticsearch
  ingress {
    from_port   = 9200
    to_port     = 9200
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }
  
  # Falco gRPC
  ingress {
    from_port   = 5060
    to_port     = 5060
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }
  
  # HTTP/HTTPS
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.allowed_cidr]
  }
  
  # All outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.lab_name}-sg"
  })
}

resource "aws_key_pair" "lab_key" {
  count      = var.cloud_provider == "aws" ? 1 : 0
  key_name   = var.key_name
  public_key = file("~/.ssh/${var.key_name}.pub")
  
  tags = local.common_tags
}

resource "aws_instance" "lab_server" {
  count                  = var.cloud_provider == "aws" ? 1 : 0
  ami                    = data.aws_ami.ubuntu[0].id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.lab_key[0].key_name
  vpc_security_group_ids = [aws_security_group.lab_sg[0].id]
  subnet_id              = aws_subnet.lab_subnet[0].id
  user_data              = local.user_data
  
  root_block_device {
    volume_type = "gp3"
    volume_size = 50
    encrypted   = true
  }
  
  tags = merge(local.common_tags, {
    Name = "${var.lab_name}-server"
  })
}

# Azure Resources
resource "azurerm_resource_group" "lab_rg" {
  count    = var.cloud_provider == "azure" ? 1 : 0
  name     = "${var.lab_name}-rg"
  location = var.region
  
  tags = local.common_tags
}

resource "azurerm_virtual_network" "lab_vnet" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${var.lab_name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.lab_rg[0].location
  resource_group_name = azurerm_resource_group.lab_rg[0].name
  
  tags = local.common_tags
}

resource "azurerm_subnet" "lab_subnet" {
  count                = var.cloud_provider == "azure" ? 1 : 0
  name                 = "${var.lab_name}-subnet"
  resource_group_name  = azurerm_resource_group.lab_rg[0].name
  virtual_network_name = azurerm_virtual_network.lab_vnet[0].name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_network_security_group" "lab_nsg" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${var.lab_name}-nsg"
  location            = azurerm_resource_group.lab_rg[0].location
  resource_group_name = azurerm_resource_group.lab_rg[0].name
  
  security_rule {
    name                       = "SSH"
    priority                   = 1001
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.allowed_cidr
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "Kibana"
    priority                   = 1002
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5601"
    source_address_prefix      = var.allowed_cidr
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "Elasticsearch"
    priority                   = 1003
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "9200"
    source_address_prefix      = var.allowed_cidr
    destination_address_prefix = "*"
  }
  
  security_rule {
    name                       = "Falco"
    priority                   = 1004
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "5060"
    source_address_prefix      = var.allowed_cidr
    destination_address_prefix = "*"
  }
  
  tags = local.common_tags
}

resource "azurerm_public_ip" "lab_pip" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${var.lab_name}-pip"
  resource_group_name = azurerm_resource_group.lab_rg[0].name
  location            = azurerm_resource_group.lab_rg[0].location
  allocation_method   = "Static"
  sku                 = "Standard"
  
  tags = local.common_tags
}

resource "azurerm_network_interface" "lab_nic" {
  count               = var.cloud_provider == "azure" ? 1 : 0
  name                = "${var.lab_name}-nic"
  location            = azurerm_resource_group.lab_rg[0].location
  resource_group_name = azurerm_resource_group.lab_rg[0].name
  
  ip_configuration {
    name                          = "internal"
    subnet_id                     = azurerm_subnet.lab_subnet[0].id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.lab_pip[0].id
  }
  
  tags = local.common_tags
}

resource "azurerm_network_interface_security_group_association" "lab_nic_nsg" {
  count                     = var.cloud_provider == "azure" ? 1 : 0
  network_interface_id      = azurerm_network_interface.lab_nic[0].id
  network_security_group_id = azurerm_network_security_group.lab_nsg[0].id
}

resource "azurerm_linux_virtual_machine" "lab_vm" {
  count                 = var.cloud_provider == "azure" ? 1 : 0
  name                  = "${var.lab_name}-vm"
  resource_group_name   = azurerm_resource_group.lab_rg[0].name
  location              = azurerm_resource_group.lab_rg[0].location
  size                  = "Standard_D2s_v3"
  admin_username        = "labadmin"
  disable_password_authentication = true
  
  network_interface_ids = [
    azurerm_network_interface.lab_nic[0].id,
  ]
  
  admin_ssh_key {
    username   = "labadmin"
    public_key = file("~/.ssh/${var.key_name}.pub")
  }
  
  os_disk {
    name                 = "${var.lab_name}-osdisk"
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
  }
  
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }
  
  custom_data = local.user_data
  
  tags = local.common_tags
}

# GCP Resources
resource "google_compute_network" "lab_network" {
  count                   = var.cloud_provider == "gcp" ? 1 : 0
  name                    = "${var.lab_name}-network"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "lab_subnet" {
  count         = var.cloud_provider == "gcp" ? 1 : 0
  name          = "${var.lab_name}-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.lab_network[0].id
}

resource "google_compute_firewall" "lab_firewall" {
  count   = var.cloud_provider == "gcp" ? 1 : 0
  name    = "${var.lab_name}-firewall"
  network = google_compute_network.lab_network[0].name
  
  allow {
    protocol = "tcp"
    ports    = ["22", "80", "443", "5060", "5601", "9200"]
  }
  
  source_ranges = [var.allowed_cidr]
  target_tags   = ["docker-lab"]
}

resource "google_compute_instance" "lab_instance" {
  count        = var.cloud_provider == "gcp" ? 1 : 0
  name         = "${var.lab_name}-instance"
  machine_type = "e2-standard-4"
  zone         = "${var.region}-a"
  
  tags = ["docker-lab"]
  
  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2004-lts"
      size  = 50
      type  = "pd-ssd"
    }
  }
  
  network_interface {
    subnetwork = google_compute_subnetwork.lab_subnet[0].name
    access_config {
      // Ephemeral public IP
    }
  }
  
  metadata = {
    ssh-keys  = "labadmin:${file("~/.ssh/${var.key_name}.pub")}"
    user-data = base64decode(local.user_data)
  }
  
  metadata_startup_script = base64decode(local.user_data)
  
  labels = {
    project     = var.lab_name
    environment = "lab"
    purpose     = "container-security-testing"
  }
}

# Data sources
data "aws_availability_zones" "available" {
  count = var.cloud_provider == "aws" ? 1 : 0
  state = "available"
}

data "aws_ami" "ubuntu" {
  count       = var.cloud_provider == "aws" ? 1 : 0
  most_recent = true
  owners      = ["099720109477"] # Canonical
  
  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Outputs
output "lab_server_public_ip" {
  description = "Public IP address of the lab server"
  value = var.cloud_provider == "aws" ? (
    length(aws_instance.lab_server) > 0 ? aws_instance.lab_server[0].public_ip : null
  ) : var.cloud_provider == "azure" ? (
    length(azurerm_public_ip.lab_pip) > 0 ? azurerm_public_ip.lab_pip[0].ip_address : null
  ) : var.cloud_provider == "gcp" ? (
    length(google_compute_instance.lab_instance) > 0 ? google_compute_instance.lab_instance[0].network_interface[0].access_config[0].nat_ip : null
  ) : null
}

output "lab_server_private_ip" {
  description = "Private IP address of the lab server"
  value = var.cloud_provider == "aws" ? (
    length(aws_instance.lab_server) > 0 ? aws_instance.lab_server[0].private_ip : null
  ) : var.cloud_provider == "azure" ? (
    length(azurerm_network_interface.lab_nic) > 0 ? azurerm_network_interface.lab_nic[0].private_ip_address : null
  ) : var.cloud_provider == "gcp" ? (
    length(google_compute_instance.lab_instance) > 0 ? google_compute_instance.lab_instance[0].network_interface[0].network_ip : null
  ) : null
}

output "ssh_command" {
  description = "SSH command to connect to the lab server"
  value = var.cloud_provider == "aws" ? (
    length(aws_instance.lab_server) > 0 ? "ssh -i ~/.ssh/${var.key_name} ubuntu@${aws_instance.lab_server[0].public_ip}" : null
  ) : var.cloud_provider == "azure" ? (
    length(azurerm_public_ip.lab_pip) > 0 ? "ssh -i ~/.ssh/${var.key_name} labadmin@${azurerm_public_ip.lab_pip[0].ip_address}" : null
  ) : var.cloud_provider == "gcp" ? (
    length(google_compute_instance.lab_instance) > 0 ? "ssh -i ~/.ssh/${var.key_name} labadmin@${google_compute_instance.lab_instance[0].network_interface[0].access_config[0].nat_ip}" : null
  ) : null
}

output "kibana_url" {
  description = "URL to access Kibana dashboard"
  value = var.cloud_provider == "aws" ? (
    length(aws_instance.lab_server) > 0 ? "http://${aws_instance.lab_server[0].public_ip}:5601" : null
  ) : var.cloud_provider == "azure" ? (
    length(azurerm_public_ip.lab_pip) > 0 ? "http://${azurerm_public_ip.lab_pip[0].ip_address}:5601" : null
  ) : var.cloud_provider == "gcp" ? (
    length(google_compute_instance.lab_instance) > 0 ? "http://${google_compute_instance.lab_instance[0].network_interface[0].access_config[0].nat_ip}:5601" : null
  ) : null
}

output "elasticsearch_url" {
  description = "URL to access Elasticsearch API"
  value = var.cloud_provider == "aws" ? (
    length(aws_instance.lab_server) > 0 ? "http://${aws_instance.lab_server[0].public_ip}:9200" : null
  ) : var.cloud_provider == "azure" ? (
    length(azurerm_public_ip.lab_pip) > 0 ? "http://${azurerm_public_ip.lab_pip[0].ip_address}:9200" : null
  ) : var.cloud_provider == "gcp" ? (
    length(google_compute_instance.lab_instance) > 0 ? "http://${google_compute_instance.lab_instance[0].network_interface[0].access_config[0].nat_ip}:9200" : null
  ) : null
}