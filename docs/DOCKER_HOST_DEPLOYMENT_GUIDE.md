# Docker Host Deployment Guide for End Users

## Overview
This guide provides step-by-step instructions for deploying Docker host VMs on Proxmox infrastructure without requiring Replit access. All operations are performed through the web interface and SSH commands.

## Prerequisites

### Required Infrastructure
- Proxmox VE server (minimum 6.4)
- XSIAM broker VM (VM XXX) running at 192.168.100.124:4443
- Network connectivity between VMs
- SSH access to Proxmox host

### Required Credentials
- Proxmox root access or privileged user
- SSH keys configured for passwordless access
- Network bridge configuration (typically vmbr0)

## Step 1: Access the Platform

### Option A: Local Docker Deployment (Recommended)
```bash
# Clone the repository
git clone https://github.com/your-org/security-research-platform.git
cd security-research-platform

# Ensure Docker Desktop is running
docker --version

# Start the platform
./start-docker.sh

# Access at http://localhost:3000
```

### Option B: Direct Node.js Deployment
```bash
# Install Node.js 18+ and npm
# Clone repository and install dependencies
npm install

# Set environment variables
export NODE_ENV=production
export PORT=5000
export DATABASE_URL="sqlite:./data/app.db"

# Start the application
npm run dev

# Access at http://localhost:5000
```

## Step 2: Configure Proxmox Connection

### 2.1 Navigate to Connection Setup
1. Open web browser to http://localhost:3000
2. Click **"Connection Setup"** in main navigation
3. Select **"Proxmox"** tab

### 2.2 Enter Connection Details
```
Host: 192.168.100.188
Username: root
SSH Port: 22
Realm: pam
```

### 2.3 Test Connection
1. Click **"Test Proxmox Connection"**
2. Verify connection success message
3. Confirm VM list loads correctly

## Step 3: Create Docker Host VM

### 3.1 Access Docker Host Manager
1. Navigate to **"Infrastructure Setup"** → **"Docker Host Management"**
2. Click **"Create VM"** tab

### 3.2 Configure VM Specifications
```
VM ID: 201
VM Name: docker-host-01
Memory: 8192 MB (8 GB)
CPU Cores: 4
Disk Size: 50 GB
Template: ubuntu-22.04-docker
Network: vmbr0
```

### 3.3 Deploy VM
1. Click **"Create Docker VM"**
2. Monitor deployment progress:
   - VM creation (25%)
   - Docker installation (50%)
   - Log forwarding configuration (75%)
   - Validation (100%)

### 3.4 Verify Deployment
Expected completion time: 5-10 minutes
- VM appears in Docker VMs list
- Status shows "running"
- Docker version displayed
- IP address assigned

## Step 4: Deploy Threat Scenarios

### 4.1 Select Deployment Target
1. In Docker Host Manager, click on created VM
2. Navigate to **"Threat Scenarios"** tab
3. Confirm VM is selected

### 4.2 Available Scenarios

#### Docker Runtime Escape
- **Difficulty**: Advanced
- **Duration**: 45 minutes
- **Containers**: vulnerable-app, privileged-container, host-monitor
- **Use Case**: Container escape vulnerabilities

#### Container Lateral Movement
- **Difficulty**: Intermediate  
- **Duration**: 30 minutes
- **Containers**: web-frontend, api-backend, database, network-scanner
- **Use Case**: Network-based lateral movement

#### Privilege Escalation
- **Difficulty**: Basic
- **Duration**: 20 minutes
- **Containers**: vulnerable-service, escalation-toolkit
- **Use Case**: Container misconfigurations

#### Malware Analysis
- **Difficulty**: Intermediate
- **Duration**: 60 minutes
- **Containers**: analysis-sandbox, malware-samples, monitoring-tools
- **Use Case**: Isolated malware analysis

### 4.3 Deploy Selected Scenario
1. Click **"Deploy Scenario"** on chosen threat
2. Monitor deployment progress
3. Verify containers are running

## Step 5: XSIAM Integration Validation

### 5.1 Verify Log Forwarding
All Docker containers automatically forward logs to XSIAM broker:
- **Source**: Docker host VM (192.168.1.x)
- **Destination**: XSIAM broker (192.168.100.124:514)
- **Protocol**: Syslog over TCP

### 5.2 Test Log Collection
1. Generate test logs in containers
2. Verify logs appear in XSIAM
3. Validate field mapping is correct

## Step 6: Manual VM Creation (Alternative)

If web interface is unavailable, use direct Proxmox CLI:

### 6.1 SSH to Proxmox Host
```bash
ssh root@192.168.100.188
```

### 6.2 Create VM Manually
```bash
# Create VM
qm create 201 --name docker-host-01 --memory 8192 --cores 4 --net0 virtio,bridge=vmbr0

# Add disk
qm set 201 --scsi0 local-lvm:50,format=qcow2

# Set boot disk
qm set 201 --boot c --bootdisk scsi0

# Start VM
qm start 201

# Get VM status
qm status 201
```

### 6.3 Install Docker
```bash
# Connect to VM console
qm monitor 201

# Or SSH to VM IP
ssh ubuntu@VM_IP

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Configure log forwarding
sudo tee /etc/rsyslog.d/49-docker.conf << EOF
$ModLoad imudp
$UDPServerRun 514
$UDPServerAddress 127.0.0.1
*.* @@192.168.100.124:514
EOF

sudo systemctl restart rsyslog
```

## Step 7: Troubleshooting

### Common Issues

#### VM Creation Fails
- Check available storage space on Proxmox
- Verify network bridge configuration
- Ensure VM ID is not already in use

#### Docker Installation Fails
- Check internet connectivity from VM
- Verify apt repositories are accessible
- Try manual Docker installation

#### Log Forwarding Not Working
- Test network connectivity: `telnet 192.168.100.124 514`
- Check rsyslog configuration: `sudo systemctl status rsyslog`
- Verify XSIAM broker is receiving logs

#### Container Deployment Fails
- Check Docker daemon status: `sudo systemctl status docker`
- Verify container images are accessible
- Check disk space: `df -h`

### Log Locations
- Docker logs: `/var/lib/docker/containers/*/`
- System logs: `/var/log/syslog`
- Application logs: `/var/log/threatlab/`

### Support Commands
```bash
# Check VM status
qm list

# View VM console
qm monitor 201

# Container status
docker ps -a

# Log verification
tail -f /var/log/syslog | grep docker
```

## Step 8: Security Considerations

### Network Isolation
- VMs operate in isolated network segments
- Traffic flows only to XSIAM broker
- No external internet access required after setup

### Access Control
- SSH key-based authentication only
- Minimal user privileges
- Container isolation enforced

### Data Protection
- No sensitive data stored in containers
- Automatic log rotation configured
- Secure communication to XSIAM broker

## Next Steps

1. **Deploy Additional Scenarios**: Repeat Step 4 with different threat scenarios
2. **Scale Infrastructure**: Create additional Docker host VMs (VM XXX, 203, etc.)
3. **Custom Scenarios**: Modify container configurations for specific use cases
4. **XSIAM Content**: Generate detection rules based on deployed scenarios

## Support

For technical support:
1. Check troubleshooting section above
2. Review log files for error messages
3. Verify network connectivity between components
4. Contact system administrator for Proxmox access issues