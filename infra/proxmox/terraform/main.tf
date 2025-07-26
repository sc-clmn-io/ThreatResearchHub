# Proxmox Security Lab Infrastructure
# Terraform configuration for Proxmox VE deployment

terraform {
  required_providers {
    proxmox = {
      source  = "telmate/proxmox"
      version = "2.9.14"
    }
  }
}

# Proxmox provider configuration
provider "proxmox" {
  pm_api_url          = var.proxmox_api_url
  pm_api_token_id     = var.proxmox_api_token_id
  pm_api_token_secret = var.proxmox_api_token_secret
  pm_tls_insecure     = var.proxmox_tls_insecure
  pm_parallel         = 4
}

# Variables
variable "proxmox_api_url" {
  description = "Proxmox API URL"
  type        = string
  default     = "https://your-proxmox-server:8006/api2/json"
}

variable "proxmox_api_token_id" {
  description = "Proxmox API Token ID"
  type        = string
}

variable "proxmox_api_token_secret" {
  description = "Proxmox API Token Secret"
  type        = string
  sensitive   = true
}

variable "proxmox_tls_insecure" {
  description = "Skip TLS verification"
  type        = bool
  default     = true
}

variable "proxmox_node" {
  description = "Proxmox node name"
  type        = string
  default     = "pve"
}

variable "vm_count" {
  description = "Number of VMs to create"
  type        = number
  default     = 3
}

variable "template_name" {
  description = "VM template name"
  type        = string
  default     = "ubuntu-22.04-template"
}

variable "storage" {
  description = "Storage pool name"
  type        = string
  default     = "local-lvm"
}

variable "network_bridge" {
  description = "Network bridge name"
  type        = string
  default     = "vmbr0"
}

# Security Lab Ubuntu VMs
resource "proxmox_vm_qemu" "security_lab_vm" {
  count = var.vm_count
  
  name        = "security-lab-${count.index + 1}"
  target_node = var.proxmox_node
  clone       = var.template_name
  
  # VM Configuration
  agent       = 1
  os_type     = "cloud-init"
  cores       = 4
  sockets     = 1
  cpu         = "host"
  memory      = 8192
  scsihw      = "virtio-scsi-pci"
  bootdisk    = "scsi0"
  
  # Disk configuration
  disk {
    slot     = 0
    size     = "50G"
    type     = "scsi"
    storage  = var.storage
    iothread = 1
  }
  
  # Network configuration
  network {
    model  = "virtio"
    bridge = var.network_bridge
    firewall = false
  }
  
  # Cloud-init configuration
  ciuser  = "ubuntu"
  cipassword = "SecurityLab123!"
  sshkeys = file("~/.ssh/id_rsa.pub")
  
  # IP configuration (adjust network as needed)
  ipconfig0 = "ip=192.168.1.${100 + count.index}/24,gw=192.168.1.1"
  nameserver = "8.8.8.8"
  
  # VM lifecycle
  lifecycle {
    ignore_changes = [
      network,
    ]
  }
  
  tags = "security-lab,terraform,ubuntu"
}

# Dedicated XSIAM VM (Higher specs)
resource "proxmox_vm_qemu" "xsiam_vm" {
  name        = "xsiam-server"
  target_node = var.proxmox_node
  clone       = var.template_name
  
  # XSIAM requires more resources
  agent       = 1
  os_type     = "cloud-init"
  cores       = 8
  sockets     = 1
  cpu         = "host"
  memory      = 16384
  scsihw      = "virtio-scsi-pci"
  bootdisk    = "scsi0"
  
  # Larger disk for XSIAM data
  disk {
    slot     = 0
    size     = "100G"
    type     = "scsi"
    storage  = var.storage
    iothread = 1
  }
  
  # Additional data disk
  disk {
    slot     = 1
    size     = "200G"
    type     = "scsi"
    storage  = var.storage
    iothread = 1
  }
  
  network {
    model  = "virtio"
    bridge = var.network_bridge
    firewall = false
  }
  
  ciuser  = "ubuntu"
  cipassword = "SecurityLab123!"
  sshkeys = file("~/.ssh/id_rsa.pub")
  
  # Dedicated IP for XSIAM
  ipconfig0 = "ip=192.168.1.90/24,gw=192.168.1.1"
  nameserver = "8.8.8.8"
  
  tags = "xsiam,security-lab,terraform"
}

# Windows VM for endpoint testing
resource "proxmox_vm_qemu" "windows_endpoint" {
  name        = "windows-endpoint"
  target_node = var.proxmox_node
  clone       = "windows-server-2022-template"  # Adjust template name
  
  agent       = 1
  os_type     = "win10"
  cores       = 4
  sockets     = 1
  cpu         = "host"
  memory      = 8192
  scsihw      = "virtio-scsi-pci"
  bootdisk    = "scsi0"
  
  disk {
    slot     = 0
    size     = "80G"
    type     = "scsi"
    storage  = var.storage
    iothread = 1
  }
  
  network {
    model  = "virtio"
    bridge = var.network_bridge
    firewall = false
  }
  
  # Windows-specific cloud-init
  ciuser     = "Administrator"
  cipassword = "SecurityLab123!"
  ipconfig0  = "ip=192.168.1.95/24,gw=192.168.1.1"
  nameserver = "8.8.8.8"
  
  tags = "windows,endpoint,security-lab"
  
  # Only create if Windows template exists
  count = fileexists("${path.module}/windows_template_exists") ? 1 : 0
}

# Security group using Proxmox firewall
resource "proxmox_vm_qemu" "firewall_vm" {
  name        = "security-firewall"
  target_node = var.proxmox_node
  clone       = "pfsense-template"  # pfSense or OPNsense template
  
  cores       = 2
  sockets     = 1
  cpu         = "host"
  memory      = 4096
  scsihw      = "virtio-scsi-pci"
  bootdisk    = "scsi0"
  
  disk {
    slot     = 0
    size     = "20G"
    type     = "scsi"
    storage  = var.storage
  }
  
  # WAN interface
  network {
    model  = "virtio"
    bridge = var.network_bridge
  }
  
  # LAN interface for lab network
  network {
    model  = "virtio"
    bridge = "vmbr1"  # Internal lab network
  }
  
  tags = "firewall,security-lab,pfsense"
  
  # Only create if firewall template exists
  count = fileexists("${path.module}/firewall_template_exists") ? 1 : 0
}

# Outputs
output "security_lab_vms" {
  description = "Security lab VM details"
  value = {
    for vm in proxmox_vm_qemu.security_lab_vm : vm.name => {
      ip_address = vm.default_ipv4_address
      vm_id      = vm.vmid
      status     = vm.vm_state
    }
  }
}

output "xsiam_vm" {
  description = "XSIAM server details"
  value = {
    name       = proxmox_vm_qemu.xsiam_vm.name
    ip_address = proxmox_vm_qemu.xsiam_vm.default_ipv4_address
    vm_id      = proxmox_vm_qemu.xsiam_vm.vmid
    status     = proxmox_vm_qemu.xsiam_vm.vm_state
  }
}

output "windows_endpoint" {
  description = "Windows endpoint details"
  value = var.vm_count > 0 && length(proxmox_vm_qemu.windows_endpoint) > 0 ? {
    name       = proxmox_vm_qemu.windows_endpoint[0].name
    ip_address = proxmox_vm_qemu.windows_endpoint[0].default_ipv4_address
    vm_id      = proxmox_vm_qemu.windows_endpoint[0].vmid
    status     = proxmox_vm_qemu.windows_endpoint[0].vm_state
  } : null
}

output "lab_network_info" {
  description = "Lab network configuration"
  value = {
    ubuntu_vms = [for i in range(var.vm_count) : "192.168.1.${100 + i}"]
    xsiam_server = "192.168.1.90"
    windows_endpoint = "192.168.1.95"
    network_range = "192.168.1.0/24"
    gateway = "192.168.1.1"
  }
}