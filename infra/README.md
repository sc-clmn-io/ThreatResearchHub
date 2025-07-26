# Security Lab Infrastructure Automation

Complete infrastructure automation suite for deploying security testing laboratories across multiple platforms: Docker, VMs, Terraform, and cloud services.

## 🚀 Quick Start Options

### 1. One-Click Docker Deployment (Recommended)
```bash
cd infra/automation
./deploy-complete-lab.sh
```

### 2. Master Deployment Script (All Platforms)
```bash
cd infra/scripts
./deploy-all.sh
```

### 3. AWS Cloud Infrastructure
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

### 4. Local VM Development
```bash
cd infra/vmware
vagrant up
```

### 5. Ansible Configuration Management
```bash
cd infra/automation
./deploy-ansible-lab.sh
```

### 6. Chef Infrastructure as Code
```bash
cd infra/automation
./deploy-chef-lab.sh
```

### 7. Repeatable Lab (Optimized for Frequent Rebuilds)
```bash
cd infra/automation
./deploy-repeatable-lab.sh

# Command line options for different rebuild strategies
./deploy-repeatable-lab.sh --full         # Complete rebuild
./deploy-repeatable-lab.sh --incremental  # Smart incremental updates
./deploy-repeatable-lab.sh --selective    # Choose specific components
./deploy-repeatable-lab.sh --health-check # Health check only
```

### 8. Proxmox VE Infrastructure
```bash
cd infra/automation
./deploy-proxmox-lab.sh

# Terraform management
cd infra/proxmox/terraform
terraform plan    # Preview changes
terraform apply   # Deploy infrastructure
terraform destroy # Cleanup resources
```

### 9. Cloud Rapid Deploy (Temporary Accounts)
```bash
cd infra/automation
./deploy-cloud-rapid.sh

# Features for temporary cloud accounts:
# • Maximum automation and parallelism
# • Auto-cleanup after 8 hours
# • Pre-cached images and providers
# • Minimal resource usage for cost control
```

## 📁 Directory Structure

```
infra/
├── automation/          # One-click automation scripts
│   ├── deploy-complete-lab.sh    # Complete Docker-based lab
│   ├── deploy-repeatable-lab.sh  # Optimized for frequent rebuilds
│   ├── deploy-proxmox-lab.sh     # Proxmox VE virtualization
│   ├── deploy-ansible-lab.sh     # Ansible configuration management
│   ├── deploy-chef-lab.sh        # Chef infrastructure as code
│   ├── deploy-aws-lab.sh         # AWS-specific deployment
│   ├── deploy-nodejs-lab.sh      # Node.js security lab
│   └── deploy-windows-lab.ps1    # Windows lab setup
├── ansible/             # Ansible playbooks and configuration
│   ├── playbooks/       # Ansible playbooks
│   ├── inventory/       # Host inventories
│   └── group_vars/      # Group variables
├── chef/                # Chef cookbooks and recipes
│   └── cookbooks/       # Chef cookbooks
│       └── security-lab/ # Security lab cookbook
├── proxmox/             # Proxmox VE infrastructure
│   └── terraform/       # Terraform configurations for Proxmox
├── docker/              # Docker Compose configurations
│   └── docker-compose.yml        # Complete containerized lab
├── scripts/             # Master automation scripts
│   └── deploy-all.sh             # Interactive deployment menu
├── terraform/           # Infrastructure as Code
│   ├── main.tf                   # AWS infrastructure
│   ├── user-data-ubuntu.sh       # Ubuntu VM setup
│   └── user-data-windows.ps1     # Windows VM setup
├── vmware/              # VM configurations
│   └── Vagrantfile              # Multi-VM lab setup
└── README.md           # This file
```

## 🛠️ Deployment Options

### Docker Complete Lab
- **Best for**: Beginners, quick setup, local development
- **Time**: 5-10 minutes
- **Requirements**: Docker, Docker Compose
- **Cost**: Free (local resources only)
- **Services**: Node.js lab, OWASP ZAP, ELK stack, Grafana, PostgreSQL

### AWS Terraform Infrastructure
- **Best for**: Production testing, team collaboration
- **Time**: 15-20 minutes
- **Requirements**: AWS CLI, Terraform, SSH key
- **Cost**: ~$100-200/month
- **Services**: Ubuntu/Windows VMs, Load Balancer, CloudWatch, S3

### Vagrant VM Labs
- **Best for**: Offline testing, custom configurations
- **Time**: 30-60 minutes
- **Requirements**: VirtualBox/VMware, Vagrant
- **Cost**: Free (local resources only)
- **VMs**: Ubuntu, Windows, Kali Linux, Network Simulator

### Ansible Configuration Management
- **Best for**: Multi-host deployments, consistent configuration
- **Time**: 10-15 minutes
- **Requirements**: Ansible installed
- **Cost**: Free (runs on existing infrastructure)
- **Features**: Playbooks, inventories, idempotent configuration

### Chef Infrastructure as Code
- **Best for**: Enterprise environments, compliance automation
- **Time**: 15-20 minutes
- **Requirements**: Chef Infra Client
- **Cost**: Free for Chef Infra Client
- **Features**: Cookbooks, recipes, policy-driven deployment

### Repeatable Lab (Rebuild Optimized)
- **Best for**: Environments requiring frequent rebuilds, testing scenarios
- **Time**: 2-5 minutes (incremental), 10-15 minutes (full)
- **Requirements**: Docker or Ansible/Chef
- **Cost**: Free (optimizes existing infrastructure)
- **Features**: Smart rebuild detection, automatic backups, rollback capability, performance monitoring

### Proxmox VE Infrastructure
- **Best for**: Enterprise virtualization, resource control, isolated environments
- **Time**: 15-30 minutes (including VM provisioning)
- **Requirements**: Proxmox VE server, API tokens, VM templates
- **Cost**: Free (uses existing Proxmox server)
- **Features**: Multiple VMs, XSIAM server, network isolation, Terraform automation

### Hybrid Deployment
- **Best for**: Specific requirements, partial deployments
- **Components**: Mix Docker + Cloud + VMs as needed

## 🎯 What Gets Deployed

### For Environments Requiring Frequent Rebuilds

The Repeatable Lab deployment is specifically optimized for scenarios where environments need to be rebuilt frequently:

- **Smart Rebuild Detection**: Automatically detects what has changed and rebuilds only necessary components
- **Docker Image Caching**: Pre-caches common images for faster subsequent deployments  
- **Package Caching**: Offline package installation for faster rebuilds without internet dependency
- **Parallel Operations**: Concurrent service deployment and backup operations
- **State Management**: Tracks deployment history and provides rollback capabilities
- **Health Monitoring**: Automatic service health checks with failure recovery
- **Performance Analytics**: Tracks rebuild times and generates optimization reports

### For Enterprise Virtualization with Proxmox

The Proxmox VE deployment leverages your existing Proxmox server for professional virtualization:

- **Multi-VM Architecture**: Deploys 3+ Ubuntu VMs plus dedicated XSIAM server
- **Resource Optimization**: Configurable CPU, memory, and storage allocation per VM
- **Network Isolation**: Secure network bridging and firewall configuration
- **Template-Based**: Uses Ubuntu and Windows VM templates for consistent deployment
- **Terraform Automation**: Infrastructure as Code with state management
- **Enhanced XSIAM Server**: Dedicated VM with 8 cores, 16GB RAM, and additional storage
- **Ansible Configuration**: Automated software installation and security hardening

### Security Testing Tools
- OWASP ZAP (Web Application Scanner)
- Bandit (Python Security Scanner)
- npm audit (Node.js Security Scanner)
- Snyk (Multi-language Scanner)
- Nmap (Network Scanner)
- Wireshark (Network Analysis)

### Monitoring & Logging
- Prometheus (Metrics Collection)
- Grafana (Visualization)
- Elasticsearch (Log Aggregation)
- Kibana (Log Analysis)
- CloudWatch (AWS Monitoring)

### Development Environments
- Node.js with security tooling
- Python with security libraries
- Docker containers for isolation
- PostgreSQL database
- Redis caching

### Infrastructure Services
- Nginx (Load Balancing)
- Jenkins (CI/CD Pipeline)
- Private npm Registry
- Audit logging and monitoring

## 🌐 Access Points

After deployment, services are accessible at:

| Service | Docker Port | VM IP | Description |
|---------|-------------|-------|-------------|
| Lab Dashboard | :80 | 192.168.56.10:80 | Main application |
| OWASP ZAP | :8081 | 192.168.56.10:8080 | Security scanner |
| Jenkins | :8080 | 192.168.56.10:8080 | CI/CD pipeline |
| Grafana | :3001 | 192.168.56.10:3000 | Monitoring |
| Kibana | :5601 | 192.168.56.10:5601 | Log analysis |
| PostgreSQL | :5432 | 192.168.56.10:5432 | Database |

## 🔧 Management Commands

### Docker Commands
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service]

# Enter container
docker exec -it [container] bash

# Stop services
docker-compose down

# Complete cleanup
docker-compose down -v && docker system prune -f
```

### Terraform Commands
```bash
# Check infrastructure status
terraform output

# Update infrastructure
terraform plan && terraform apply

# Destroy infrastructure
terraform destroy
```

### Vagrant Commands
```bash
# Start all VMs
vagrant up

# Connect to specific VM
vagrant ssh ubuntu-lab

# Stop all VMs
vagrant halt

# Destroy VMs
vagrant destroy
```

### Repeatable Lab Commands
```bash
# Different rebuild strategies
./deploy-repeatable-lab.sh --full         # Complete rebuild
./deploy-repeatable-lab.sh --incremental  # Smart update (default)
./deploy-repeatable-lab.sh --selective    # Choose components

# Management commands
./deploy-repeatable-lab.sh --health-check # Check service health
cd /opt/security-lab/scripts
./fast-rebuild.sh                         # Emergency fast restart
./rollback.sh                             # Rollback to previous state
./monitor-rebuilds.sh status              # View rebuild statistics
```

### Proxmox Commands
```bash
# Deploy Proxmox infrastructure
./deploy-proxmox-lab.sh

# Terraform management
cd infra/proxmox/terraform
terraform plan                            # Preview changes
terraform apply                           # Deploy VMs
terraform destroy                         # Remove all VMs

# VM management via Proxmox web interface
# https://your-proxmox-server:8006

# SSH to deployed VMs
ssh ubuntu@[vm-ip]                        # Ubuntu VMs
ssh Administrator@[vm-ip]                 # Windows VMs

# Lab management on VMs
lab-start                                 # Start security lab
lab-stop                                  # Stop all services
lab-status                                # Check service status
```

## 📋 Prerequisites

### For Docker Deployment
- Docker and Docker Compose installed
- 8GB+ RAM available
- 50GB+ disk space

### For AWS Deployment
- AWS CLI configured (`aws configure`)
- Terraform installed
- SSH key pair (~/.ssh/id_rsa)
- AWS credentials with EC2 permissions

### For VM Deployment
- VirtualBox or VMware installed
- Vagrant installed
- 16GB+ RAM for multiple VMs
- Virtualization enabled in BIOS

## 🎓 Learning Scenarios

### Web Application Security
1. Deploy Docker lab with vulnerable Node.js app
2. Use OWASP ZAP to scan for XSS, SQLi, RCE
3. Analyze results in Kibana dashboards
4. Fix vulnerabilities and rescan

### Infrastructure Security
1. Deploy AWS infrastructure with Terraform
2. Monitor with CloudWatch and Grafana
3. Test network security with Nmap
4. Analyze audit logs

### Container Security
1. Deploy containerized services
2. Scan images with Trivy
3. Monitor container metrics
4. Test container escape scenarios

### DevSecOps Pipeline
1. Set up Jenkins with security scanning
2. Integrate Snyk, Bandit, npm audit
3. Automated security testing in CI/CD
4. Generate security reports

## ⚠️ Security Considerations

- **Isolation**: Keep lab environments isolated from production
- **Credentials**: Use strong, unique passwords for all services
- **Network**: Deploy behind firewalls, limit external access
- **Cleanup**: Remove lab environments when not in use
- **Monitoring**: All activities are logged and monitored

## 🆘 Troubleshooting

### Common Issues

**Docker Issues**
- Restart Docker daemon: `sudo systemctl restart docker`
- Check permissions: `sudo usermod -aG docker $USER`
- Memory issues: Increase Docker memory limits

**AWS Issues**
- Check credentials: `aws sts get-caller-identity`
- Verify regions: Ensure consistent region usage
- Quota limits: Check AWS service quotas

**VM Issues**
- Enable virtualization in BIOS
- Increase VM resources (RAM, CPU)
- Check VirtualBox/VMware version compatibility

**Network Issues**
- Check port conflicts: `netstat -tulpn | grep [port]`
- Firewall rules: Configure iptables/Windows Firewall
- DNS resolution: Check /etc/hosts or DNS settings

### Getting Help

1. **Check service logs** first for specific error messages
2. **Verify prerequisites** are installed and configured
3. **Test network connectivity** between services
4. **Review configuration files** for syntax errors
5. **Check system resources** (RAM, disk, CPU usage)

## 📞 Support Resources

- **Documentation**: Each deployment option includes detailed README
- **Logs**: All services log to standard locations
- **Monitoring**: Built-in dashboards show system health
- **Examples**: Sample configurations and test scripts included

## 🚀 Getting Started

1. **Choose your deployment option** based on requirements
2. **Install prerequisites** for your chosen platform
3. **Run the deployment script** for your option
4. **Access the lab dashboard** to begin testing
5. **Follow learning scenarios** to practice security testing

Happy security testing! 🔒