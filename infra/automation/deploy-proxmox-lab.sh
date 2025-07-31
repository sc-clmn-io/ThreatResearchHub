#!/bin/bash
# Proxmox Security Lab Deployment Script
# Automated deployment using Proxmox VE virtualization platform

set -e
trap 'echo "❌ Proxmox deployment failed. Check logs above."' ERR

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🖥️  Proxmox Security Lab Deployment${NC}"
echo -e "${CYAN}Virtualized security testing environment on Proxmox VE${NC}"
echo ""

# Configuration
PROXMOX_CONFIG_FILE="proxmox-config.yml"
TERRAFORM_DIR="../proxmox/terraform"
ANSIBLE_PLAYBOOK="../ansible/playbooks/proxmox-lab.yml"

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}📋 Checking prerequisites...${NC}"
    
    # Check if Terraform is installed
    if ! command -v terraform >/dev/null 2>&1; then
        echo -e "${YELLOW}Installing Terraform...${NC}"
        wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
        echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
        sudo apt update && sudo apt install -y terraform
    fi
    
    # Check if curl/wget available
    if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
        echo -e "${RED}❌ Neither curl nor wget found. Please install one.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites checked${NC}"
}

# Configure Proxmox connection
configure_proxmox() {
    echo -e "${BLUE}🔧 Configuring Proxmox connection...${NC}"
    
    if [ ! -f "$PROXMOX_CONFIG_FILE" ]; then
        echo -e "${YELLOW}Creating Proxmox configuration...${NC}"
        
        echo -n -e "${CYAN}Enter Proxmox server IP/hostname: ${NC}"
        read -r proxmox_host
        
        echo -n -e "${CYAN}Enter Proxmox API port (default 8006): ${NC}"
        read -r proxmox_port
        proxmox_port=${proxmox_port:-8006}
        
        echo -n -e "${CYAN}Enter Proxmox node name (default pve): ${NC}"
        read -r proxmox_node
        proxmox_node=${proxmox_node:-pve}
        
        echo -n -e "${CYAN}Enter API Token ID (format: user@realm!tokenid): ${NC}"
        read -r api_token_id
        
        echo -n -e "${CYAN}Enter API Token Secret: ${NC}"
        read -rs api_token_secret
        echo ""
        
        echo -n -e "${CYAN}Storage pool name (default local-lvm): ${NC}"
        read -r storage_pool
        storage_pool=${storage_pool:-local-lvm}
        
        echo -n -e "${CYAN}Network bridge (default vmbr0): ${NC}"
        read -r network_bridge
        network_bridge=${network_bridge:-vmbr0}
        
        # Create configuration file
        cat > "$PROXMOX_CONFIG_FILE" << EOF
# Proxmox Security Lab Configuration
proxmox:
  api_url: "https://${proxmox_host}:${proxmox_port}/api2/json"
  node: "${proxmox_node}"
  storage: "${storage_pool}"
  network_bridge: "${network_bridge}"
  
# VM Configuration
vms:
  ubuntu_count: 3
  ubuntu_template: "ubuntu-22.04-template"
  windows_template: "windows-server-2022-template"
  
  # Resource allocation
  ubuntu_specs:
    cores: 4
    memory: 8192  # MB
    disk_size: "50G"
    
  xsiam_specs:
    cores: 8
    memory: 16384  # MB
    disk_size: "100G"
    data_disk: "200G"
    
  windows_specs:
    cores: 4
    memory: 8192  # MB
    disk_size: "80G"

# Network Configuration
network:
  base_ip: "192.168.1"
  ubuntu_start: 100
  xsiam_ip: "192.168.100.90"
  windows_ip: "192.168.100.95"
  gateway: "192.168.100.1"
  dns: "8.8.8.8"

# Lab Services
services:
  docker_lab: true
  xsiam_server: true
  windows_endpoint: true
  firewall_vm: false  # Requires pfSense template
EOF

        # Store API credentials securely
        echo "$api_token_id" > .proxmox_token_id
        echo "$api_token_secret" > .proxmox_token_secret
        chmod 600 .proxmox_token_id .proxmox_token_secret
        
        echo -e "${GREEN}✅ Proxmox configuration saved${NC}"
    else
        echo -e "${GREEN}✅ Using existing Proxmox configuration${NC}"
    fi
}

# Test Proxmox connection
test_connection() {
    echo -e "${BLUE}🔗 Testing Proxmox connection...${NC}"
    
    # Read configuration
    local api_url=$(yq eval '.proxmox.api_url' "$PROXMOX_CONFIG_FILE")
    local api_token_id=$(cat .proxmox_token_id)
    local api_token_secret=$(cat .proxmox_token_secret)
    
    # Test API connection
    if curl -k -H "Authorization: PVEAPIToken=${api_token_id}=${api_token_secret}" \
            "${api_url}/version" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Proxmox connection successful${NC}"
    else
        echo -e "${RED}❌ Cannot connect to Proxmox API${NC}"
        echo -e "${YELLOW}Please check your configuration and API token${NC}"
        exit 1
    fi
}

# Check VM templates
check_templates() {
    echo -e "${BLUE}📦 Checking VM templates...${NC}"
    
    local api_url=$(yq eval '.proxmox.api_url' "$PROXMOX_CONFIG_FILE")
    local proxmox_node=$(yq eval '.proxmox.node' "$PROXMOX_CONFIG_FILE")
    local api_token_id=$(cat .proxmox_token_id)
    local api_token_secret=$(cat .proxmox_token_secret)
    
    # Check Ubuntu template
    local ubuntu_template=$(yq eval '.vms.ubuntu_template' "$PROXMOX_CONFIG_FILE")
    if curl -k -H "Authorization: PVEAPIToken=${api_token_id}=${api_token_secret}" \
            "${api_url}/nodes/${proxmox_node}/qemu" 2>/dev/null | grep -q "$ubuntu_template"; then
        echo -e "${GREEN}✅ Ubuntu template found: $ubuntu_template${NC}"
    else
        echo -e "${YELLOW}⚠️  Ubuntu template not found: $ubuntu_template${NC}"
        echo -e "${CYAN}Please create a Ubuntu 22.04 template first${NC}"
        
        echo -n -e "${YELLOW}Continue without Ubuntu template? [y/N]: ${NC}"
        read -r continue_without_ubuntu
        if [[ ! "$continue_without_ubuntu" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            exit 1
        fi
    fi
    
    # Check Windows template
    local windows_template=$(yq eval '.vms.windows_template' "$PROXMOX_CONFIG_FILE")
    if curl -k -H "Authorization: PVEAPIToken=${api_token_id}=${api_token_secret}" \
            "${api_url}/nodes/${proxmox_node}/qemu" 2>/dev/null | grep -q "$windows_template"; then
        echo -e "${GREEN}✅ Windows template found: $windows_template${NC}"
        touch "${TERRAFORM_DIR}/windows_template_exists"
    else
        echo -e "${YELLOW}⚠️  Windows template not found: $windows_template${NC}"
        echo -e "${CYAN}Windows VM will be skipped${NC}"
        rm -f "${TERRAFORM_DIR}/windows_template_exists"
    fi
}

# Deploy infrastructure with Terraform
deploy_infrastructure() {
    echo -e "${BLUE}🚀 Deploying infrastructure with Terraform...${NC}"
    
    cd "$TERRAFORM_DIR"
    
    # Create terraform.tfvars from configuration
    local api_url=$(yq eval '.proxmox.api_url' "../automation/$PROXMOX_CONFIG_FILE")
    local proxmox_node=$(yq eval '.proxmox.node' "../automation/$PROXMOX_CONFIG_FILE")
    local storage=$(yq eval '.proxmox.storage' "../automation/$PROXMOX_CONFIG_FILE")
    local network_bridge=$(yq eval '.proxmox.network_bridge' "../automation/$PROXMOX_CONFIG_FILE")
    local ubuntu_count=$(yq eval '.vms.ubuntu_count' "../automation/$PROXMOX_CONFIG_FILE")
    local ubuntu_template=$(yq eval '.vms.ubuntu_template' "../automation/$PROXMOX_CONFIG_FILE")
    local api_token_id=$(cat "../automation/.proxmox_token_id")
    local api_token_secret=$(cat "../automation/.proxmox_token_secret")
    
    cat > terraform.tfvars << EOF
proxmox_api_url          = "$api_url"
proxmox_api_token_id     = "$api_token_id"
proxmox_api_token_secret = "$api_token_secret"
proxmox_node            = "$proxmox_node"
storage                 = "$storage"
network_bridge          = "$network_bridge"
vm_count               = $ubuntu_count
template_name          = "$ubuntu_template"
EOF
    
    # Initialize Terraform
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init
    
    # Plan deployment
    echo -e "${YELLOW}Planning deployment...${NC}"
    terraform plan
    
    # Apply deployment
    echo -n -e "${YELLOW}Proceed with deployment? [y/N]: ${NC}"
    read -r proceed
    if [[ "$proceed" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        terraform apply -auto-approve
        
        # Save VM information
        terraform output -json > ../automation/vm-info.json
        
        echo -e "${GREEN}✅ Infrastructure deployed successfully${NC}"
    else
        echo -e "${YELLOW}Deployment cancelled${NC}"
        exit 0
    fi
    
    cd - >/dev/null
}

# Configure VMs with Ansible
configure_vms() {
    echo -e "${BLUE}⚙️  Configuring VMs with Ansible...${NC}"
    
    # Extract VM IPs from Terraform output
    if [ -f "vm-info.json" ]; then
        echo -e "${YELLOW}Extracting VM information...${NC}"
        
        # Create dynamic Ansible inventory
        cat > ansible-inventory.yml << 'EOF'
all:
  children:
    security_lab:
      hosts:
EOF
        
        # Add Ubuntu VMs to inventory
        jq -r '.security_lab_vms.value | to_entries[] | .value.ip_address' vm-info.json | while IFS= read -r ip; do
            echo "        ${ip}:" >> ansible-inventory.yml
            echo "          ansible_host: ${ip}" >> ansible-inventory.yml
            echo "          ansible_user: ubuntu" >> ansible-inventory.yml
            echo "          ansible_ssh_private_key_file: ~/.ssh/id_rsa" >> ansible-inventory.yml
        done
        
        # Add XSIAM server
        local xsiam_ip=$(jq -r '.xsiam_vm.value.ip_address' vm-info.json)
        if [ "$xsiam_ip" != "null" ]; then
            cat >> ansible-inventory.yml << EOF
    xsiam_server:
      hosts:
        ${xsiam_ip}:
          ansible_host: ${xsiam_ip}
          ansible_user: ubuntu
          ansible_ssh_private_key_file: ~/.ssh/id_rsa
EOF
        fi
        
        # Wait for VMs to be ready
        echo -e "${YELLOW}Waiting for VMs to be ready...${NC}"
        sleep 60
        
        # Run Ansible playbook
        if [ -f "$ANSIBLE_PLAYBOOK" ]; then
            ansible-playbook -i ansible-inventory.yml "$ANSIBLE_PLAYBOOK"
        else
            echo -e "${YELLOW}Ansible playbook not found, using default configuration...${NC}"
            # Run basic setup
            ansible all -i ansible-inventory.yml -m ping
            ansible all -i ansible-inventory.yml -b -m apt -a "update_cache=yes upgrade=yes"
            ansible all -i ansible-inventory.yml -b -m package -a "name=docker.io,docker-compose,curl,wget,git,vim state=present"
        fi
        
        echo -e "${GREEN}✅ VM configuration completed${NC}"
    else
        echo -e "${RED}❌ VM information not found${NC}"
        exit 1
    fi
}

# Install security lab software
install_lab_software() {
    echo -e "${BLUE}🔧 Installing security lab software...${NC}"
    
    # Install Docker-based security lab on each VM
    if [ -f "ansible-inventory.yml" ]; then
        echo -e "${YELLOW}Installing security lab components...${NC}"
        
        # Copy lab setup script to VMs
        ansible security_lab -i ansible-inventory.yml -m copy -a "src=../docker/docker-compose.yml dest=/opt/security-lab/docker-compose.yml" -b
        ansible security_lab -i ansible-inventory.yml -m copy -a "src=deploy-complete-lab.sh dest=/opt/security-lab/deploy-lab.sh mode=0755" -b
        
        # Run lab setup on each VM
        ansible security_lab -i ansible-inventory.yml -m shell -a "cd /opt/security-lab && ./deploy-lab.sh" -b
        
        echo -e "${GREEN}✅ Security lab software installed${NC}"
    fi
}

# Show deployment summary
show_summary() {
    echo -e "${PURPLE}📊 Proxmox Deployment Summary${NC}"
    echo ""
    
    if [ -f "vm-info.json" ]; then
        echo -e "${CYAN}🖥️  Deployed VMs:${NC}"
        
        # Ubuntu VMs
        echo -e "${YELLOW}Security Lab VMs:${NC}"
        jq -r '.security_lab_vms.value | to_entries[] | "   • \(.key): \(.value.ip_address) (VM ID: \(.value.vm_id))"' vm-info.json
        
        # XSIAM VM
        local xsiam_ip=$(jq -r '.xsiam_vm.value.ip_address' vm-info.json)
        if [ "$xsiam_ip" != "null" ]; then
            echo -e "${YELLOW}XSIAM Server:${NC}"
            echo -e "   • XSIAM: $xsiam_ip (VM ID: $(jq -r '.xsiam_vm.value.vm_id' vm-info.json))"
        fi
        
        # Windows endpoint
        local windows_ip=$(jq -r '.windows_endpoint.value.ip_address // empty' vm-info.json)
        if [ -n "$windows_ip" ] && [ "$windows_ip" != "null" ]; then
            echo -e "${YELLOW}Windows Endpoint:${NC}"
            echo -e "   • Windows: $windows_ip (VM ID: $(jq -r '.windows_endpoint.value.vm_id' vm-info.json))"
        fi
        
        echo ""
        echo -e "${CYAN}🌐 Network Configuration:${NC}"
        jq -r '.lab_network_info.value | "   • Network Range: \(.network_range)\n   • Gateway: \(.gateway)\n   • Ubuntu VMs: \(.ubuntu_vms | join(", "))\n   • XSIAM Server: \(.xsiam_server)\n   • Windows Endpoint: \(.windows_endpoint)"' vm-info.json
    fi
    
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo -e "   • Check VMs:         cd $TERRAFORM_DIR && terraform show"
    echo -e "   • VM Console:        Connect via Proxmox web interface"
    echo -e "   • SSH to VMs:        ssh ubuntu@[vm-ip]"
    echo -e "   • Destroy lab:       cd $TERRAFORM_DIR && terraform destroy"
    echo ""
    echo -e "${GREEN}🎉 Proxmox deployment complete!${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting Proxmox Security Lab deployment...${NC}"
    
    check_prerequisites
    configure_proxmox
    test_connection
    check_templates
    deploy_infrastructure
    configure_vms
    install_lab_software
    show_summary
}

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install yq if not present (for YAML processing)
if ! command -v yq >/dev/null 2>&1; then
    echo -e "${YELLOW}Installing yq for YAML processing...${NC}"
    sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
    sudo chmod +x /usr/local/bin/yq
fi

# Run main function
main "$@"