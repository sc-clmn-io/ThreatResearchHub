#!/bin/bash
# Rapid Cloud Deployment Script
# Optimized for temporary accounts with fast setup/teardown

set -e
trap 'echo "❌ Rapid cloud deployment failed. Check logs above."' ERR

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}⚡ Rapid Cloud Deployment${NC}"
echo -e "${CYAN}Optimized for temporary accounts and fast builds${NC}"
echo ""

# Configuration
RAPID_CONFIG_FILE="rapid-cloud-config.yml"
TERRAFORM_STATE_DIR="terraform-states"
DEPLOYMENT_LOG="rapid-deployment-$(date +%Y%m%d_%H%M%S).log"

# Start logging
exec > >(tee -a "$DEPLOYMENT_LOG")
exec 2>&1

# Initialize rapid deployment configuration
init_rapid_config() {
    echo -e "${BLUE}⚡ Initializing rapid deployment configuration...${NC}"
    
    if [ ! -f "$RAPID_CONFIG_FILE" ]; then
        cat > "$RAPID_CONFIG_FILE" << 'EOF'
# Rapid Cloud Deployment Configuration
# Optimized for temporary accounts and fast builds

deployment:
  mode: "rapid"           # rapid, standard, enterprise
  auto_cleanup: true      # Auto-cleanup resources after time limit
  cleanup_hours: 8        # Hours before auto-cleanup (work day)
  parallel_deployment: true
  skip_confirmations: false

providers:
  aws:
    enabled: true
    region: "us-east-1"   # Fastest provisioning region
    instance_types:
      small: "t3.micro"   # Free tier eligible
      medium: "t3.small"
      large: "t3.medium"
    
  azure:
    enabled: false
    region: "East US"
    vm_sizes:
      small: "Standard_B1s"
      medium: "Standard_B2s"
      large: "Standard_B4ms"
  
  gcp:
    enabled: false
    region: "us-central1"
    machine_types:
      small: "e2-micro"   # Free tier eligible
      medium: "e2-small"
      large: "e2-medium"

lab_config:
  vm_count: 2             # Minimal for rapid deployment
  enable_xsiam: true      # Dedicated XSIAM instance
  enable_windows: false   # Skip Windows for speed
  enable_monitoring: true # Essential monitoring only
  
optimization:
  use_prebuilt_images: true     # Use pre-configured AMIs/images
  skip_package_updates: true    # Use cached packages
  parallel_provisioning: true   # Deploy VMs in parallel
  minimal_services: false       # Deploy only essential services
  fast_storage: true           # Use SSD storage for speed

automation:
  terraform_parallelism: 10    # Increase Terraform parallelism
  ansible_forks: 20           # Increase Ansible concurrency
  docker_build_cache: true    # Use Docker layer caching
  predownload_images: true    # Pre-download Docker images

cleanup:
  auto_destroy: true          # Auto-destroy at end of day
  backup_before_destroy: true # Backup important data
  send_cleanup_notification: true
EOF
        echo -e "${GREEN}✅ Rapid deployment configuration created${NC}"
    fi
}

# Select cloud provider for rapid deployment
select_provider() {
    echo -e "${BLUE}☁️ Selecting cloud provider...${NC}"
    
    echo -e "${CYAN}Choose cloud provider for rapid deployment:${NC}"
    echo "1) AWS (Recommended - fastest provisioning)"
    echo "2) Azure"
    echo "3) Google Cloud Platform"
    echo "4) Multi-cloud (AWS + backup)"
    echo ""
    
    echo -n -e "${YELLOW}Enter choice [1-4]: ${NC}"
    read -r provider_choice
    
    case $provider_choice in
        1)
            export CLOUD_PROVIDER="aws"
            export TERRAFORM_DIR="../aws/terraform"
            echo -e "${GREEN}✅ AWS selected for rapid deployment${NC}"
            ;;
        2)
            export CLOUD_PROVIDER="azure"
            export TERRAFORM_DIR="../azure/terraform"
            echo -e "${GREEN}✅ Azure selected for rapid deployment${NC}"
            ;;
        3)
            export CLOUD_PROVIDER="gcp"
            export TERRAFORM_DIR="../gcp/terraform"
            echo -e "${GREEN}✅ GCP selected for rapid deployment${NC}"
            ;;
        4)
            export CLOUD_PROVIDER="multi"
            export TERRAFORM_DIR="../aws/terraform"
            echo -e "${GREEN}✅ Multi-cloud deployment selected${NC}"
            ;;
        *)
            echo -e "${RED}❌ Invalid choice. Defaulting to AWS.${NC}"
            export CLOUD_PROVIDER="aws"
            export TERRAFORM_DIR="../aws/terraform"
            ;;
    esac
}

# Pre-flight optimization checks
preflight_optimization() {
    echo -e "${BLUE}🚀 Running pre-flight optimization...${NC}"
    
    # Check if we have cached Terraform providers
    echo -e "${YELLOW}Checking Terraform provider cache...${NC}"
    mkdir -p ~/.terraform.d/plugin-cache
    export TF_PLUGIN_CACHE_DIR="$HOME/.terraform.d/plugin-cache"
    
    # Parallel provider downloads
    if [ ! -d "$TF_PLUGIN_CACHE_DIR/registry.terraform.io" ]; then
        echo -e "${YELLOW}Pre-downloading Terraform providers...${NC}"
        cd "$TERRAFORM_DIR"
        terraform providers mirror "$TF_PLUGIN_CACHE_DIR" &
        PROVIDER_PID=$!
        cd - >/dev/null
    fi
    
    # Pre-download Docker images in parallel
    echo -e "${YELLOW}Pre-downloading Docker images...${NC}"
    {
        docker image pull node:18-ubuntu &
        docker image pull owasp/zap2docker-stable &
        docker image pull postgres:15 &
        docker image pull redis:alpine &
        docker image pull nginx:alpine &
        wait
        echo -e "${GREEN}✅ Docker images cached${NC}"
    } &
    DOCKER_PID=$!
    
    # Wait for provider download if it was started
    if [ -n "$PROVIDER_PID" ]; then
        wait $PROVIDER_PID
        echo -e "${GREEN}✅ Terraform providers cached${NC}"
    fi
    
    # Wait for Docker images
    wait $DOCKER_PID
    
    echo -e "${GREEN}✅ Pre-flight optimization complete${NC}"
}

# Rapid Terraform deployment
rapid_terraform_deploy() {
    echo -e "${BLUE}⚡ Rapid Terraform deployment...${NC}"
    
    cd "$TERRAFORM_DIR"
    
    # Create optimized terraform.tfvars for rapid deployment
    cat > terraform.tfvars << EOF
# Rapid deployment configuration
instance_type = "t3.small"           # Fast provisioning, low cost
vm_count = 2                         # Minimal for speed
enable_detailed_monitoring = false   # Skip detailed monitoring for speed
associate_public_ip = true           # Direct public access
skip_nat_gateway = true             # Skip NAT for cost/speed
use_default_vpc = true              # Use default VPC for speed
enable_backup = false               # Skip backups for rapid testing

# Auto-cleanup configuration
auto_shutdown_hours = 8             # Auto-shutdown after 8 hours
enable_auto_cleanup = true

# Storage optimization
root_volume_type = "gp3"            # Fastest general purpose SSD
root_volume_size = 20               # Minimal size for speed

# Tags for tracking temporary resources
tags = {
  Environment = "rapid-testing"
  AutoCleanup = "true"
  CreatedBy   = "rapid-deployment"
  TTL         = "8h"
}
EOF
    
    # Initialize with cached providers
    echo -e "${YELLOW}Initializing Terraform (cached)...${NC}"
    terraform init -input=false
    
    # Plan with high parallelism
    echo -e "${YELLOW}Planning deployment (parallel)...${NC}"
    terraform plan -parallelism=10 -out=rapid.tfplan
    
    # Apply with maximum parallelism
    echo -e "${YELLOW}Applying deployment (maximum speed)...${NC}"
    terraform apply -parallelism=10 -auto-approve rapid.tfplan
    
    # Save outputs for rapid access
    terraform output -json > ../automation/rapid-outputs.json
    
    cd - >/dev/null
    echo -e "${GREEN}✅ Rapid Terraform deployment complete${NC}"
}

# Rapid Ansible configuration
rapid_ansible_config() {
    echo -e "${BLUE}⚡ Rapid Ansible configuration...${NC}"
    
    # Extract IPs from Terraform output
    if [ -f "rapid-outputs.json" ]; then
        # Create rapid inventory
        cat > rapid-inventory.yml << 'EOF'
all:
  vars:
    ansible_ssh_common_args: '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
    ansible_python_interpreter: auto_silent
  children:
    rapid_lab:
      hosts:
EOF
        
        # Add hosts from Terraform output
        jq -r '.public_ips.value[]' rapid-outputs.json | head -2 | while IFS= read -r ip; do
            echo "        ${ip}:" >> rapid-inventory.yml
            echo "          ansible_host: ${ip}" >> rapid-inventory.yml
            echo "          ansible_user: ubuntu" >> rapid-inventory.yml
            echo "          ansible_ssh_private_key_file: ~/.ssh/id_rsa" >> rapid-inventory.yml
        done
        
        # Rapid Ansible playbook (essential services only)
        cat > rapid-playbook.yml << 'EOF'
---
- name: Rapid Security Lab Configuration
  hosts: rapid_lab
  become: yes
  gather_facts: no
  strategy: free  # Maximum parallelism
  
  tasks:
    - name: Wait for system to be ready
      wait_for_connection:
        timeout: 300
    
    - name: Gather minimal facts
      setup:
        gather_subset: "!all,network"
    
    - name: Update package cache (background)
      apt:
        update_cache: yes
      async: 300
      poll: 0
      register: apt_update
    
    - name: Install Docker (parallel)
      shell: |
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        usermod -aG docker ubuntu
      async: 600
      poll: 0
      register: docker_install
    
    - name: Install essential packages
      package:
        name:
          - curl
          - wget
          - git
          - jq
          - unzip
        state: present
      async: 300
      poll: 0
      register: packages_install
    
    - name: Wait for Docker installation
      async_status:
        jid: "{{ docker_install.ansible_job_id }}"
      register: docker_result
      until: docker_result.finished
      retries: 30
      delay: 10
    
    - name: Start Docker service
      systemd:
        name: docker
        state: started
        enabled: yes
    
    - name: Deploy rapid lab services
      copy:
        dest: /opt/rapid-lab-compose.yml
        content: |
          version: '3.8'
          services:
            nodejs-lab:
              image: node:18-ubuntu
              ports: ["3000:3000"]
              restart: unless-stopped
            
            zap:
              image: owasp/zap2docker-stable
              ports: ["8080:8080"]
              restart: unless-stopped
            
            nginx:
              image: nginx:alpine
              ports: ["80:80"]
              restart: unless-stopped
          
          networks:
            default:
              driver: bridge
    
    - name: Start rapid lab services
      shell: |
        cd /opt
        docker-compose -f rapid-lab-compose.yml up -d
      environment:
        COMPOSE_PARALLEL_LIMIT: 10
EOF
        
        # Run rapid Ansible deployment
        echo -e "${YELLOW}Running rapid Ansible configuration...${NC}"
        ansible-playbook -i rapid-inventory.yml rapid-playbook.yml -f 20
        
        echo -e "${GREEN}✅ Rapid Ansible configuration complete${NC}"
    else
        echo -e "${RED}❌ No Terraform outputs found${NC}"
        exit 1
    fi
}

# Setup auto-cleanup
setup_auto_cleanup() {
    echo -e "${BLUE}🕒 Setting up auto-cleanup...${NC}"
    
    # Create cleanup script
    cat > auto-cleanup.sh << 'EOF'
#!/bin/bash
# Auto-cleanup script for rapid deployment

echo "🧹 Starting auto-cleanup of rapid deployment..."

# Cleanup Terraform resources
if [ -d "../aws/terraform" ]; then
    cd ../aws/terraform
    terraform destroy -auto-approve -parallelism=10
    cd -
fi

# Cleanup local files
rm -f rapid-*.yml rapid-*.json auto-cleanup.sh

echo "✅ Auto-cleanup complete"
EOF
    
    chmod +x auto-cleanup.sh
    
    # Schedule cleanup (8 hours from now)
    cleanup_hours=$(yq eval '.deployment.cleanup_hours' "$RAPID_CONFIG_FILE" 2>/dev/null || echo "8")
    at_time="now + ${cleanup_hours} hours"
    
    if command -v at >/dev/null 2>&1; then
        echo "./auto-cleanup.sh" | at "$at_time" 2>/dev/null || {
            echo -e "${YELLOW}⚠️ Could not schedule auto-cleanup with 'at'. Manual cleanup required.${NC}"
        }
        echo -e "${GREEN}✅ Auto-cleanup scheduled for ${cleanup_hours} hours${NC}"
    else
        echo -e "${YELLOW}⚠️ 'at' command not available. Install with: sudo apt install at${NC}"
        echo -e "${CYAN}Manual cleanup: ./auto-cleanup.sh${NC}"
    fi
}

# Show rapid deployment summary
show_rapid_summary() {
    echo -e "${PURPLE}⚡ Rapid Deployment Summary${NC}"
    echo ""
    
    if [ -f "rapid-outputs.json" ]; then
        echo -e "${CYAN}🌐 Deployed Infrastructure:${NC}"
        echo -e "${YELLOW}Public IPs:${NC}"
        jq -r '.public_ips.value[]' rapid-outputs.json | while IFS= read -r ip; do
            echo -e "   • http://$ip (Lab Dashboard)"
            echo -e "   • http://$ip:3000 (Node.js Lab)"
            echo -e "   • http://$ip:8080 (OWASP ZAP)"
        done
        
        echo ""
        echo -e "${CYAN}🔧 Quick Actions:${NC}"
        echo -e "   • SSH Access:        ssh ubuntu@[ip-address]"
        echo -e "   • View Services:     docker ps"
        echo -e "   • Service Logs:      docker-compose logs -f"
        echo -e "   • Manual Cleanup:    ./auto-cleanup.sh"
        
        echo ""
        echo -e "${CYAN}⏰ Auto-Cleanup:${NC}"
        cleanup_hours=$(yq eval '.deployment.cleanup_hours' "$RAPID_CONFIG_FILE" 2>/dev/null || echo "8")
        echo -e "   • Scheduled in:      ${cleanup_hours} hours"
        echo -e "   • Resources will be automatically destroyed"
    fi
    
    # Calculate deployment time
    if [ -f "$DEPLOYMENT_LOG" ]; then
        local start_time=$(head -1 "$DEPLOYMENT_LOG" | grep -o '[0-9]:[0-9][0-9]:[0-9][0-9]' | head -1)
        local current_time=$(date +%H:%M:%S)
        echo ""
        echo -e "${CYAN}📊 Deployment Stats:${NC}"
        echo -e "   • Started:           $start_time"
        echo -e "   • Completed:         $current_time"
        echo -e "   • Log File:          $DEPLOYMENT_LOG"
    fi
    
    echo ""
    echo -e "${GREEN}⚡ Rapid deployment complete! Ready for immediate testing.${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting rapid cloud deployment...${NC}"
    echo -e "${CYAN}Optimized for temporary accounts and fast builds${NC}"
    echo ""
    
    init_rapid_config
    select_provider
    preflight_optimization
    rapid_terraform_deploy
    rapid_ansible_config
    setup_auto_cleanup
    show_rapid_summary
    
    echo -e "${GREEN}📝 Deployment logged to: $DEPLOYMENT_LOG${NC}"
    echo -e "${YELLOW}💡 Tip: Save your work frequently - auto-cleanup is enabled!${NC}"
}

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install required tools if missing
if ! command -v yq >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing yq...${NC}"
    sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
    sudo chmod +x /usr/local/bin/yq
fi

# Run main function
main "$@"