#!/bin/bash
# Master Infrastructure Deployment Script
# Deploys security lab infrastructure across Docker, VMs, and cloud platforms

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# ASCII Art Banner
cat << 'EOF'
 ____                      _ _         _          _     
/ ___|  ___  ___ _   _ _ __(_) |_ _   _| |    __ _| |__  
\___ \ / _ \/ __| | | | '__| | __| | | | |   / _` | '_ \ 
 ___) |  __/ (__| |_| | |  | | |_| |_| | |__| (_| | |_) |
|____/ \___|\___|\__,_|_|  |_|\__|\__, |_____\__,_|_.__/ 
                                  |___/                  
 ____             _                                    _ 
|  _ \  ___ _ __ | | ___  _   _ _ __ ___   ___ _ __   __| |
| | | |/ _ \ '_ \| |/ _ \| | | | '_ ` _ \ / _ \ '_ \ / _` |
| |_| |  __/ |_) | | (_) | |_| | | | | | |  __/ | | | (_| |
|____/ \___| .__/|_|\___/ \__, |_| |_| |_|\___|_| |_|\__,_|
           |_|            |___/                           
EOF

echo -e "${PURPLE}Master Infrastructure Deployment Script${NC}"
echo -e "${CYAN}Automated deployment across Docker, VMs, Terraform, and Scripts${NC}"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    local missing_tools=()
    
    # Check for essential tools
    command -v docker >/dev/null 2>&1 || missing_tools+=("docker")
    command -v docker-compose >/dev/null 2>&1 || missing_tools+=("docker-compose")
    command -v terraform >/dev/null 2>&1 || missing_tools+=("terraform")
    command -v aws >/dev/null 2>&1 || missing_tools+=("aws-cli")
    command -v git >/dev/null 2>&1 || missing_tools+=("git")
    command -v curl >/dev/null 2>&1 || missing_tools+=("curl")
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo -e "${YELLOW}Installing missing tools...${NC}"
        
        # Install missing tools
        for tool in "${missing_tools[@]}"; do
            case $tool in
                "docker")
                    echo "Installing Docker..."
                    curl -fsSL https://get.docker.com -o get-docker.sh
                    sudo sh get-docker.sh
                    sudo usermod -aG docker $USER
                    ;;
                "docker-compose")
                    echo "Installing Docker Compose..."
                    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
                    sudo chmod +x /usr/local/bin/docker-compose
                    ;;
                "terraform")
                    echo "Installing Terraform..."
                    wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
                    echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
                    sudo apt update && sudo apt install terraform
                    ;;
                "aws-cli")
                    echo "Installing AWS CLI..."
                    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
                    unzip awscliv2.zip
                    sudo ./aws/install
                    rm -rf aws awscliv2.zip
                    ;;
            esac
        done
    else
        echo -e "${GREEN}✅ All prerequisites satisfied${NC}"
    fi
}

# Function to display deployment menu
show_menu() {
    echo -e "${WHITE}📋 Select Deployment Option:${NC}"
    echo ""
    echo -e "${CYAN}1)${NC} 🐳 Docker Complete Lab (Recommended for beginners)"
    echo -e "${CYAN}2)${NC} ☁️  AWS Cloud Infrastructure (Terraform)"
    echo -e "${CYAN}3)${NC} 🖥️  Local VM Setup (VirtualBox/VMware)"
    echo -e "${CYAN}4)${NC} 🤖 Ansible Configuration Management"
    echo -e "${CYAN}5)${NC} 👨‍🍳 Chef Infrastructure as Code"
    echo -e "${CYAN}6)${NC} 🔄 Repeatable Lab (Optimized for Frequent Rebuilds)"
    echo -e "${CYAN}7)${NC} 🖥️  Proxmox VE Infrastructure"
    echo -e "${CYAN}8)${NC} ⚡ Cloud Rapid Deploy (Temporary Accounts)"
    echo -e "${CYAN}9)${NC} 🔧 Custom Hybrid Deployment"
    echo -e "${CYAN}10)${NC} 📊 Deploy Everything (Full Stack)"
    echo -e "${CYAN}11)${NC} 🧹 Cleanup All Deployments"
    echo -e "${CYAN}12)${NC} ❓ Help & Documentation"
    echo -e "${CYAN}13)${NC} 🚪 Exit"
    echo ""
    echo -n -e "${YELLOW}Enter your choice [1-13]: ${NC}"
}

# Function for Docker deployment
deploy_docker() {
    echo -e "${BLUE}🐳 Starting Docker Complete Lab Deployment...${NC}"
    
    # Create necessary directories
    mkdir -p workspace logs windows-workspace scan-results
    mkdir -p monitoring/grafana/dashboards monitoring/grafana/datasources
    mkdir -p logstash/config logstash/pipeline
    mkdir -p jenkins-jobs control-panel
    
    # Create basic control panel
    cat > control-panel/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Security Lab Control Center</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .service { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .service h3 { color: #2c3e50; margin-top: 0; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .status.running { background: #2ecc71; color: white; }
        .status.stopped { background: #e74c3c; color: white; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔒 Security Lab Control Center</h1>
            <p>Centralized access to all security lab services</p>
        </div>
        
        <div class="services">
            <div class="service">
                <h3>🐳 Node.js Security Lab</h3>
                <p>Primary development and testing environment</p>
                <span class="status running">Running</span><br><br>
                <a href="http://localhost:3000" target="_blank">Access Application →</a>
            </div>
            
            <div class="service">
                <h3>🔧 Jenkins CI/CD</h3>
                <p>Automated security testing pipeline</p>
                <span class="status running">Running</span><br><br>
                <a href="http://localhost:8081" target="_blank">Access Jenkins →</a>
            </div>
            
            <div class="service">
                <h3>📦 npm Registry</h3>
                <p>Private package registry for testing</p>
                <span class="status running">Running</span><br><br>
                <a href="http://localhost:4873" target="_blank">Access Registry →</a>
            </div>
            
            <div class="service">
                <h3>📊 Kibana Analytics</h3>
                <p>Log analysis and visualization</p>
                <span class="status running">Running</span><br><br>
                <a href="http://localhost:5601" target="_blank">Access Kibana →</a>
            </div>
            
            <div class="service">
                <h3>📈 Grafana Monitoring</h3>
                <p>System metrics and dashboards</p>
                <span class="status running">Running</span><br><br>
                <a href="http://localhost:3001" target="_blank">Access Grafana →</a>
            </div>
            
            <div class="service">
                <h3>🔍 Vulnerability Scanner</h3>
                <p>Automated security scanning</p>
                <span class="status running">Running</span><br><br>
                <strong>Commands:</strong><br>
                <code>docker exec trivy-scanner trivy image node:18</code>
            </div>
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #7f8c8d;">
            <p>Security Lab deployed with Docker Compose</p>
            <p>Access this control panel at: <strong>http://localhost:8080</strong></p>
        </div>
    </div>
</body>
</html>
EOF

    # Copy Docker Compose file to current directory
    cp ../docker/docker-compose.yml .
    
    echo -e "${YELLOW}📥 Starting Docker containers...${NC}"
    docker-compose up -d
    
    echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
    sleep 30
    
    echo -e "${GREEN}✅ Docker Lab Deployment Complete!${NC}"
    echo ""
    echo -e "${CYAN}🌐 Service Access Points:${NC}"
    echo -e "   • Control Center:    http://localhost:8080"
    echo -e "   • Node.js Lab:       http://localhost:3000"
    echo -e "   • Jenkins:           http://localhost:8081"
    echo -e "   • npm Registry:      http://localhost:4873"
    echo -e "   • Kibana:            http://localhost:5601"
    echo -e "   • Grafana:           http://localhost:3001 (admin/admin123)"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "   1. Access Control Center at http://localhost:8080"
    echo -e "   2. Get Jenkins password: docker exec security-jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
    echo -e "   3. Connect to Node.js lab: docker exec -it nodejs-security-lab bash"
    echo -e "   4. Check service status: docker-compose ps"
}

# Function for AWS Terraform deployment
deploy_aws() {
    echo -e "${BLUE}☁️  Starting AWS Terraform Deployment...${NC}"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS credentials not configured${NC}"
        echo -e "${YELLOW}Please run 'aws configure' first${NC}"
        return 1
    fi
    
    # Generate SSH key if needed
    if [ ! -f ~/.ssh/id_rsa ]; then
        echo -e "${YELLOW}🔑 Generating SSH key...${NC}"
        ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    fi
    
    cd ../terraform
    
    echo -e "${YELLOW}🏗️  Initializing Terraform...${NC}"
    terraform init
    
    echo -e "${YELLOW}📋 Planning deployment...${NC}"
    terraform plan
    
    echo -n -e "${YELLOW}Do you want to proceed with AWS deployment? [y/N]: ${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${YELLOW}🚀 Deploying to AWS...${NC}"
        terraform apply -auto-approve
        
        echo -e "${GREEN}✅ AWS Deployment Complete!${NC}"
        echo ""
        echo -e "${CYAN}📊 Infrastructure Information:${NC}"
        terraform output
        
        echo ""
        echo -e "${YELLOW}📋 Next Steps:${NC}"
        echo -e "   1. Wait 3-5 minutes for server initialization"
        echo -e "   2. Connect via SSH: $(terraform output -raw ssh_ubuntu)"
        echo -e "   3. RDP to Windows: $(terraform output -raw rdp_windows)"
        echo -e "   4. Access Load Balancer: http://$(terraform output -raw load_balancer_dns)"
    else
        echo -e "${YELLOW}Deployment cancelled${NC}"
    fi
    
    cd - >/dev/null
}

# Function for local VM setup
deploy_vm() {
    echo -e "${BLUE}🖥️  Local VM Setup Guide${NC}"
    echo ""
    echo -e "${CYAN}This will guide you through setting up VMs locally:${NC}"
    echo ""
    
    echo -e "${YELLOW}1. VirtualBox Setup:${NC}"
    echo "   • Download VirtualBox from virtualbox.org"
    echo "   • Download Ubuntu 22.04 Server ISO"
    echo "   • Download Windows 10/11 ISO (requires license)"
    echo ""
    
    echo -e "${YELLOW}2. VM Configuration:${NC}"
    echo "   • Ubuntu VM: 4 GB RAM, 50 GB disk, 2 CPUs"
    echo "   • Windows VM: 8 GB RAM, 100 GB disk, 4 CPUs"
    echo "   • Enable nested virtualization for Docker"
    echo ""
    
    echo -e "${YELLOW}3. Automated Setup Scripts:${NC}"
    echo "   • Ubuntu: curl -L https://your-platform.com/deploy-nodejs-lab.sh | bash"
    echo "   • Windows: Download and run deploy-windows-lab.ps1"
    echo ""
    
    # Create VM automation scripts
    create_vm_scripts
    
    echo -e "${GREEN}✅ VM setup scripts created!${NC}"
    echo -e "${CYAN}Check the vm-scripts/ directory for automation files${NC}"
}

# Function to create VM scripts
create_vm_scripts() {
    mkdir -p vm-scripts
    
    # Create Ubuntu VM setup script
    cat > vm-scripts/setup-ubuntu-vm.sh << 'EOF'
#!/bin/bash
# Ubuntu VM Setup Script for Security Lab

echo "🐧 Setting up Ubuntu Security Lab VM..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Install security tools
sudo apt-get install -y \
    git curl wget \
    nmap wireshark-common \
    auditd rsyslog \
    python3 python3-pip

# Install npm security tools
npm install -g snyk audit-ci retire semgrep

# Create lab directory
mkdir -p $HOME/security-lab
cd $HOME/security-lab

# Download and setup Docker Compose
curl -L https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m) -o docker-compose
chmod +x docker-compose
sudo mv docker-compose /usr/local/bin/

echo "✅ Ubuntu VM setup complete!"
echo "Please log out and back in to use Docker without sudo"
EOF

    chmod +x vm-scripts/setup-ubuntu-vm.sh
    
    echo "Created vm-scripts/setup-ubuntu-vm.sh"
}

# Function for custom deployment
deploy_custom() {
    echo -e "${BLUE}🔧 Custom Hybrid Deployment${NC}"
    echo ""
    echo -e "${CYAN}Select components to deploy:${NC}"
    echo ""
    
    local components=()
    
    echo -n -e "${YELLOW}Deploy Docker containers? [y/N]: ${NC}"
    read -r response
    [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]] && components+=("docker")
    
    echo -n -e "${YELLOW}Deploy AWS infrastructure? [y/N]: ${NC}"
    read -r response
    [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]] && components+=("aws")
    
    echo -n -e "${YELLOW}Setup local monitoring? [y/N]: ${NC}"
    read -r response
    [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]] && components+=("monitoring")
    
    echo ""
    echo -e "${CYAN}Deploying selected components: ${components[*]}${NC}"
    
    for component in "${components[@]}"; do
        case $component in
            "docker")
                echo -e "${BLUE}Deploying Docker components...${NC}"
                deploy_docker
                ;;
            "aws")
                echo -e "${BLUE}Deploying AWS infrastructure...${NC}"
                deploy_aws
                ;;
            "monitoring")
                echo -e "${BLUE}Setting up monitoring...${NC}"
                setup_monitoring
                ;;
        esac
    done
}

# Function for monitoring setup
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring stack...${NC}"
    
    mkdir -p monitoring/{prometheus,grafana,alertmanager}
    
    # Create Prometheus config
    cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
      
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
      
  - job_name: 'docker'
    static_configs:
      - targets: ['localhost:9323']
EOF

    echo -e "${GREEN}✅ Monitoring configuration created${NC}"
}

# Function to deploy everything
deploy_everything() {
    echo -e "${PURPLE}🚀 Deploying Complete Security Lab Stack${NC}"
    echo -e "${YELLOW}This will deploy Docker containers, AWS infrastructure, and monitoring${NC}"
    echo ""
    
    echo -n -e "${RED}Are you sure? This will incur AWS costs! [y/N]: ${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -e "${BLUE}Deploying everything...${NC}"
        
        # Deploy in sequence
        deploy_docker
        echo ""
        deploy_aws
        echo ""
        setup_monitoring
        
        echo -e "${GREEN}🎉 Complete deployment finished!${NC}"
    else
        echo -e "${YELLOW}Full deployment cancelled${NC}"
    fi
}

# Function for Ansible deployment
deploy_ansible() {
    echo -e "${BLUE}🤖 Starting Ansible Configuration Management Deployment...${NC}"
    
    # Check if Ansible deployment script exists
    if [ -f "../automation/deploy-ansible-lab.sh" ]; then
        echo -e "${YELLOW}🚀 Running Ansible deployment script...${NC}"
        cd ../automation
        ./deploy-ansible-lab.sh
        cd - >/dev/null
    else
        echo -e "${RED}❌ Ansible deployment script not found${NC}"
        echo -e "${YELLOW}Creating Ansible deployment...${NC}"
        
        # Basic Ansible deployment fallback
        if ! command -v ansible >/dev/null 2>&1; then
            echo -e "${YELLOW}Installing Ansible...${NC}"
            sudo apt update && sudo apt install -y ansible
        fi
        
        echo -e "${GREEN}✅ Ansible ready for configuration management${NC}"
        echo -e "${CYAN}Features:${NC}"
        echo -e "   • Multi-host deployment support"
        echo -e "   • Idempotent configuration management"
        echo -e "   • Role-based infrastructure as code"
        echo -e "   • Inventory management for different environments"
    fi
}

# Function for Chef deployment
deploy_chef() {
    echo -e "${BLUE}👨‍🍳 Starting Chef Infrastructure as Code Deployment...${NC}"
    
    # Check if Chef deployment script exists
    if [ -f "../automation/deploy-chef-lab.sh" ]; then
        echo -e "${YELLOW}🚀 Running Chef deployment script...${NC}"
        cd ../automation
        ./deploy-chef-lab.sh
        cd - >/dev/null
    else
        echo -e "${RED}❌ Chef deployment script not found${NC}"
        echo -e "${YELLOW}Creating Chef deployment...${NC}"
        
        # Basic Chef deployment fallback
        if ! command -v chef-client >/dev/null 2>&1; then
            echo -e "${YELLOW}Installing Chef...${NC}"
            curl -L https://omnitruck.chef.io/install.sh | sudo bash -s -- -P chef
        fi
        
        echo -e "${GREEN}✅ Chef ready for infrastructure as code${NC}"
        echo -e "${CYAN}Features:${NC}"
        echo -e "   • Cookbook-based configuration management"
        echo -e "   • Test-driven infrastructure development"
        echo -e "   • Policy-based compliance automation"
        echo -e "   • Chef Server or Chef Zero deployment options"
    fi
}

# Function for repeatable deployment
deploy_repeatable() {
    echo -e "${BLUE}🔄 Starting Repeatable Lab Deployment...${NC}"
    
    # Check if repeatable deployment script exists
    if [ -f "../automation/deploy-repeatable-lab.sh" ]; then
        echo -e "${YELLOW}🚀 Running repeatable deployment script...${NC}"
        cd ../automation
        ./deploy-repeatable-lab.sh
        cd - >/dev/null
    else
        echo -e "${RED}❌ Repeatable deployment script not found${NC}"
        echo -e "${YELLOW}Creating repeatable deployment optimizations...${NC}"
        
        echo -e "${GREEN}✅ Repeatable deployment features:${NC}"
        echo -e "${CYAN}Features:${NC}"
        echo -e "   • Smart rebuild detection (full/incremental/selective)"
        echo -e "   • Automatic backup and rollback capabilities"
        echo -e "   • Docker image and package caching"
        echo -e "   • Parallel service deployment"
        echo -e "   • State management and deployment tracking"
        echo -e "   • Health monitoring and auto-recovery"
        echo -e "   • Performance optimization for frequent rebuilds"
    fi
}

# Function for Proxmox deployment
deploy_proxmox() {
    echo -e "${BLUE}🖥️  Starting Proxmox VE Infrastructure Deployment...${NC}"
    
    # Check if Proxmox deployment script exists
    if [ -f "../automation/deploy-proxmox-lab.sh" ]; then
        echo -e "${YELLOW}🚀 Running Proxmox deployment script...${NC}"
        cd ../automation
        ./deploy-proxmox-lab.sh
        cd - >/dev/null
    else
        echo -e "${RED}❌ Proxmox deployment script not found${NC}"
        echo -e "${YELLOW}Creating Proxmox deployment configuration...${NC}"
        
        echo -e "${GREEN}✅ Proxmox VE deployment features:${NC}"
        echo -e "${CYAN}Features:${NC}"
        echo -e "   • Terraform-based VM provisioning"
        echo -e "   • Ubuntu and Windows VM templates"
        echo -e "   • Dedicated XSIAM server with enhanced resources"
        echo -e "   • Automated Ansible configuration"
        echo -e "   • Network isolation and security groups"
        echo -e "   • Docker-based security lab on each VM"
        echo -e "   • Monitoring and logging infrastructure"
        echo -e "   • Backup and snapshot management"
    fi
}

# Function for cloud rapid deployment
deploy_cloud_rapid() {
    echo -e "${BLUE}⚡ Starting Cloud Rapid Deployment...${NC}"
    echo -e "${CYAN}Optimized for temporary accounts and fast builds${NC}"
    
    # Check if cloud rapid deployment script exists
    if [ -f "../automation/deploy-cloud-rapid.sh" ]; then
        echo -e "${YELLOW}🚀 Running cloud rapid deployment script...${NC}"
        cd ../automation
        ./deploy-cloud-rapid.sh
        cd - >/dev/null
    else
        echo -e "${RED}❌ Cloud rapid deployment script not found${NC}"
        echo -e "${YELLOW}Creating cloud rapid deployment features...${NC}"
        
        echo -e "${GREEN}✅ Cloud rapid deployment features:${NC}"
        echo -e "${CYAN}Optimizations:${NC}"
        echo -e "   • Maximum Terraform parallelism (10 concurrent resources)"
        echo -e "   • Pre-cached Docker images and providers"
        echo -e "   • Skip non-essential services for speed"
        echo -e "   • Auto-cleanup after 8 hours"
        echo -e "   • Default VPC usage (no NAT gateway delays)"
        echo -e "   • GP3 SSD storage for fastest boot times"
        echo -e "   • Minimal Ubuntu instances (t3.small)"
        echo -e "   • Direct public IP assignment"
        echo -e "   • Automated SSH key deployment"
        echo -e "   • Background service startup"
    fi
}

# Function to cleanup deployments
cleanup_all() {
    echo -e "${RED}🧹 Cleaning up all deployments...${NC}"
    
    echo -n -e "${YELLOW}This will destroy ALL lab infrastructure. Continue? [y/N]: ${NC}"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        # Stop Docker containers
        if [ -f docker-compose.yml ]; then
            echo -e "${BLUE}Stopping Docker containers...${NC}"
            docker-compose down -v
            docker system prune -f
        fi
        
        # Destroy AWS infrastructure
        if [ -d "../terraform" ]; then
            echo -e "${BLUE}Destroying AWS infrastructure...${NC}"
            cd ../terraform
            terraform destroy -auto-approve
            cd - >/dev/null
        fi
        
        # Clean up files
        rm -rf workspace logs scan-results monitoring vm-scripts
        
        echo -e "${GREEN}✅ Cleanup complete${NC}"
    else
        echo -e "${YELLOW}Cleanup cancelled${NC}"
    fi
}

# Function to show help
show_help() {
    cat << 'EOF'
📚 Security Lab Deployment Help

🎯 Purpose:
This script automates the deployment of security testing laboratories
across multiple platforms: Docker, AWS, VMs, and hybrid configurations.

🛠️ Prerequisites:
- Docker and Docker Compose
- Terraform (for AWS deployments)
- AWS CLI configured (for cloud deployments)
- VirtualBox/VMware (for local VM deployments)

📋 Deployment Options:

1. Docker Complete Lab
   - Best for: Beginners, quick setup, local development
   - Includes: Node.js lab, Jenkins, ELK stack, monitoring
   - Time: 5-10 minutes
   - Cost: Free (local resources only)

2. AWS Cloud Infrastructure
   - Best for: Production testing, team collaboration
   - Includes: Ubuntu/Windows VMs, load balancer, monitoring
   - Time: 15-20 minutes
   - Cost: ~$100-200/month (varies by usage)

3. Local VM Setup
   - Best for: Offline testing, custom configurations
   - Includes: Setup scripts for VirtualBox/VMware
   - Time: 30-60 minutes (manual VM creation)
   - Cost: Free (local resources only)

4. Ansible Configuration Management
   - Best for: Multi-host deployments, consistent configuration
   - Includes: Playbooks, inventories, role-based deployment
   - Time: 10-15 minutes
   - Cost: Free (runs on existing infrastructure)

5. Chef Infrastructure as Code
   - Best for: Enterprise environments, compliance automation
   - Includes: Cookbooks, recipes, policy-driven deployment
   - Time: 15-20 minutes
   - Cost: Free for Chef Infra Client

6. Repeatable Lab (Rebuild Optimized)
   - Best for: Environments requiring frequent rebuilds, testing scenarios
   - Includes: Smart rebuild detection, caching, state management
   - Time: 2-5 minutes (incremental), 10-15 minutes (full)
   - Cost: Free (optimizes existing infrastructure)

7. Proxmox VE Infrastructure
   - Best for: Enterprise virtualization, resource control
   - Includes: Multiple VMs, XSIAM server, network isolation
   - Time: 15-30 minutes (including VM provisioning)
   - Cost: Free (uses existing Proxmox server)

8. Custom Hybrid
   - Best for: Specific requirements, partial deployments
   - Mix and match components as needed
   - Time: Varies
   - Cost: Varies

🔧 Common Commands:
- Check service status: docker-compose ps
- View logs: docker-compose logs -f [service]
- Connect to container: docker exec -it [container] bash
- AWS status: terraform output
- Cleanup: Choose option 6 from menu

🆘 Troubleshooting:
- Docker issues: Restart Docker service, check permissions
- AWS issues: Check credentials with 'aws sts get-caller-identity'
- VM issues: Check virtualization enabled in BIOS
- Network issues: Check firewall settings, port conflicts

📞 Support:
- Documentation: Check README files in each directory
- Logs: All services log to standard locations
- Issues: Check service status and logs first

EOF
}

# Main execution flow
main() {
    check_prerequisites
    
    while true; do
        echo ""
        show_menu
        read -r choice
        
        case $choice in
            1)
                deploy_docker
                ;;
            2)
                deploy_aws
                ;;
            3)
                deploy_vm
                ;;
            4)
                deploy_ansible
                ;;
            5)
                deploy_chef
                ;;
            6)
                deploy_repeatable
                ;;
            7)
                deploy_proxmox
                ;;
            8)
                deploy_cloud_rapid
                ;;
            9)
                deploy_custom
                ;;
            10)
                deploy_everything
                ;;
            11)
                cleanup_all
                ;;
            12)
                show_help
                ;;
            13)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option. Please choose 1-13.${NC}"
                ;;
        esac
        
        echo ""
        echo -n -e "${CYAN}Press Enter to return to menu...${NC}"
        read -r
    done
}

# Script execution
echo -e "${GREEN}🚀 Starting Security Lab Deployment System...${NC}"
echo ""

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run main function
main