# Infrastructure Reference Guide
## Complete IP Addresses, Access Methods & Connection Details

### 🌐 Network Infrastructure Overview

```
ThreatResearchHub Infrastructure Map
├── Replit Environment (Public Cloud)
│   ├── Platform: localhost:5000 (Development)
│   ├── Frontend: Vite dev server (React/TypeScript)
│   └── Backend: Express.js API server
│
├── Proxmox Virtualization Host
│   ├── Management IP: 192.168.100.188:8006 (HTTPS Web UI)
│   ├── SSH Access: root@192.168.100.188:22
│   ├── API Endpoint: https://192.168.100.188:8006/api2/json
│   └── Network Bridge: vmbr0 (VM network interface)
│
├── XSIAM Broker VM (VM ID: 200) ✅ OPERATIONAL
│   ├── Management IP: 192.168.100.124:4443 (HTTPS)
│   ├── Syslog Port: 192.168.100.124:514 (TCP/UDP)
│   ├── Beats Port: 192.168.100.124:5044 (Filebeat/Metricbeat)
│   ├── API Port: 192.168.100.124:443 (XSIAM REST API)
│   └── Status: Ready for log aggregation
│
└── Docker Host VM (VM ID: 201) ⏳ READY TO DEPLOY
    ├── Planned IP: 192.168.100.201 (Dynamic DHCP)
    ├── SSH Access: root@192.168.100.201:22
    ├── Docker API: 192.168.100.201:2376 (Docker daemon)
    └── Application Ports: 8080, 9090, 3000, 3306 (Container services)
```

### 🔑 Access Credentials & Authentication

#### Proxmox Server Access
```bash
# Primary Management Interface
URL: https://192.168.100.188:8006
Username: root@pam
Password: [User's Proxmox root password]

# SSH Access (Required for VM Management)
ssh root@192.168.100.188
Key: ~/.ssh/id_rsa (User's SSH key)
Port: 22 (Standard SSH)
```

#### XSIAM Broker Access
```bash
# Web Management Interface
URL: https://192.168.100.124:4443
Username: admin
Password: [XSIAM broker password]

# Log Collection Endpoints
Syslog: 192.168.100.124:514 (TCP/UDP)
Beats: 192.168.100.124:5044 (Elasticsearch protocol)
API: https://192.168.100.124:443/api/v1/logs
```

#### Docker Host VM Access (After Deployment)
```bash
# SSH Access to Docker Host
ssh root@192.168.100.201
Key: ~/.ssh/id_rsa (Same as Proxmox)
Port: 22

# Docker Daemon Access
DOCKER_HOST: tcp://192.168.100.201:2376
TLS: Disabled (Internal network)
```

### 🛠️ Service Port Reference

#### XSIAM Broker (192.168.100.124)
| Port | Protocol | Service | Purpose |
|------|----------|---------|---------|
| 443 | HTTPS | XSIAM API | REST API endpoints |
| 4443 | HTTPS | Management | Web management interface |
| 514 | TCP/UDP | Syslog | Standard syslog collection |
| 5044 | TCP | Beats | Filebeat/Metricbeat ingestion |
| 9200 | TCP | Elasticsearch | Internal data storage |
| 5601 | TCP | Kibana | Log visualization (if enabled) |

#### Docker Host VM (192.168.100.201)
| Port | Protocol | Service | Container |
|------|----------|---------|-----------|
| 8080 | HTTP | Web App | vulnerable-app (nginx) |
| 9090 | HTTP | Monitoring | host-monitor (alpine/socat) |
| 3000 | HTTP | API Backend | api-backend (Node.js) |
| 3306 | TCP | Database | mysql-db (MySQL 8.0) |
| 2376 | TCP | Docker API | Docker daemon |
| 22 | SSH | System Access | SSH daemon |

#### Proxmox Host (192.168.100.188)
| Port | Protocol | Service | Purpose |
|------|----------|---------|---------|
| 8006 | HTTPS | Web UI | Proxmox management interface |
| 22 | SSH | CLI Access | Command line management |
| 111 | TCP | RPC | Network File System |
| 3128 | TCP | Proxy | Subscription proxy (if configured) |

### 🔗 Network Connectivity Requirements

#### From Replit to Infrastructure
```bash
# Required Connectivity Tests
ping 192.168.100.188         # Proxmox host reachability
telnet 192.168.100.188 22    # SSH access verification
telnet 192.168.100.124 514   # XSIAM broker syslog
telnet 192.168.100.124 4443  # XSIAM broker management

# VPN/Tunneling (if required)
# If infrastructure is behind NAT/firewall:
# - Tailscale VPN connection
# - WireGuard tunnel
# - SSH tunnel: ssh -L 8006:192.168.100.188:8006 user@jumphost
```

#### Between Infrastructure Components
```bash
# VM to XSIAM Broker Communication
192.168.100.201 → 192.168.100.124:514   # Syslog forwarding
192.168.100.201 → 192.168.100.124:5044  # Beats forwarding
192.168.100.201 → 192.168.100.124:443   # API calls

# Proxmox to VMs
192.168.100.188 → 192.168.100.201:22    # VM management
192.168.100.188 → 192.168.100.124:22    # Broker management
```

### 📋 Pre-Deployment Checklist

#### Network Connectivity
- [ ] Can ping Proxmox host (192.168.100.188)
- [ ] Can SSH to Proxmox host (root@192.168.100.188)
- [ ] Can access XSIAM broker web UI (https://192.168.100.124:4443)
- [ ] Can reach XSIAM broker syslog port (192.168.100.124:514)

#### SSH Key Setup
- [ ] SSH key pair generated (`ssh-keygen -t rsa -b 4096`)
- [ ] Public key copied to Proxmox (`ssh-copy-id root@192.168.100.188`)
- [ ] SSH connection tested (`ssh root@192.168.100.188 "hostname"`)
- [ ] Proxmox API accessible via SSH (`ssh root@192.168.100.188 "pvesh get /nodes"`)

#### System Resources
- [ ] Proxmox has sufficient storage (50GB+ for Docker VM)
- [ ] Proxmox has available memory (8GB+ for Docker VM)
- [ ] Network bridge (vmbr0) configured and operational
- [ ] Internet connectivity for Docker image downloads

### 🚀 Deployment Command Reference

#### 1. Create Docker VM
```bash
curl -X POST http://localhost:5000/api/proxmox/create-docker-vm \
  -H "Content-Type: application/json" \
  -d '{
    "vmid": "201",
    "name": "docker-host-01", 
    "memory": "8192",
    "cores": "4",
    "disk": "50"
  }'
```

#### 2. Verify VM Creation
```bash
curl -s http://localhost:5000/api/proxmox/docker-vms
```

#### 3. Deploy Container Scenario
```bash
curl -X POST http://localhost:5000/api/docker/deploy-scenario \
  -H "Content-Type: application/json" \
  -d '{
    "vmid": "201",
    "scenario": "Docker Runtime Escape",
    "containers": [
      {
        "name": "vulnerable-app",
        "image": "nginx:alpine",
        "ports": ["8080:80"],
        "logForwarding": {"type": "Application Log"}
      }
    ]
  }'
```

### 🔍 Troubleshooting Guide

#### Connection Issues
```bash
# Test basic connectivity
ping -c 3 192.168.100.188
nmap -p 22,8006 192.168.100.188

# Check SSH configuration
ssh -v root@192.168.100.188
ssh-keygen -R 192.168.100.188  # Remove old key if needed

# Verify network routes
traceroute 192.168.100.188
ip route get 192.168.100.188
```

#### VM Creation Issues
```bash
# Check Proxmox storage
ssh root@192.168.100.188 "pvesh get /nodes/$(hostname)/storage"

# Verify VM doesn't exist
ssh root@192.168.100.188 "qm list | grep 201"

# Check network configuration
ssh root@192.168.100.188 "ip link show vmbr0"
```

#### Container Deployment Issues
```bash
# SSH to Docker VM
ssh root@192.168.100.201

# Check Docker service
systemctl status docker
docker info

# Test internet connectivity
ping -c 3 8.8.8.8
curl -I https://registry-1.docker.io

# Verify log forwarding
tail -f /var/log/syslog | grep XSIAM
```

### 📊 Monitoring & Validation

#### Real-Time Status Checks
```bash
# VM Status
curl -s http://localhost:5000/api/proxmox/docker-vms | grep -E "(status|ip)"

# Container Status  
ssh root@192.168.100.201 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

# Log Forwarding Status
ssh root@192.168.100.201 "systemctl status rsyslog"
ssh root@192.168.100.201 "netstat -an | grep 514"
```

#### XSIAM Integration Verification
```bash
# Test syslog connectivity
telnet 192.168.100.124 514

# Send test log
ssh root@192.168.100.201 "logger -t docker-test 'Infrastructure validation complete'"

# Check XSIAM web interface
# Navigate to: https://192.168.100.124:4443
# Check Data Sources → System Logs for new entries
```

### 🎯 Success Indicators

#### Infrastructure Ready
✅ SSH access to Proxmox (192.168.100.188) established  
✅ XSIAM broker (192.168.100.124) accessible and operational  
✅ Docker VM (192.168.100.201) created and running  
✅ Container services accessible on expected ports  
✅ Log forwarding to XSIAM broker confirmed  

#### Application Validation
✅ Web application: `curl http://192.168.100.201:8080`  
✅ Monitoring service: `curl http://192.168.100.201:9090`  
✅ Database connectivity: `telnet 192.168.100.201 3306`  
✅ Docker API: `curl http://192.168.100.201:2376/version`  

This infrastructure creates an authentic threat testing environment with real VMs, actual Docker containers, and proper XSIAM log aggregation for comprehensive security analysis.