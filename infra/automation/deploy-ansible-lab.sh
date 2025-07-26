#!/bin/bash
# Ansible Security Lab Deployment Script
# Automated deployment using Ansible configuration management

set -e
trap 'echo "❌ Ansible deployment failed. Check logs above."' ERR

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🤖 Ansible Security Lab Deployment${NC}"
echo -e "${CYAN}Configuration management deployment for security testing labs${NC}"
echo ""

# Check if Ansible is installed
check_ansible() {
    echo -e "${BLUE}📋 Checking Ansible installation...${NC}"
    
    if ! command -v ansible >/dev/null 2>&1; then
        echo -e "${YELLOW}Installing Ansible...${NC}"
        
        # Install Ansible based on OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Ubuntu/Debian
            if command -v apt >/dev/null 2>&1; then
                sudo apt update
                sudo apt install -y software-properties-common
                sudo add-apt-repository --yes --update ppa:ansible/ansible
                sudo apt install -y ansible
            # CentOS/RHEL
            elif command -v yum >/dev/null 2>&1; then
                sudo yum install -y epel-release
                sudo yum install -y ansible
            fi
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew >/dev/null 2>&1; then
                brew install ansible
            else
                echo -e "${RED}Please install Homebrew first: https://brew.sh${NC}"
                exit 1
            fi
        else
            echo -e "${RED}Unsupported operating system. Please install Ansible manually.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Ansible already installed$(NC}"
    fi
    
    # Verify installation
    ansible --version
}

# Install required Ansible collections
install_collections() {
    echo -e "${BLUE}📦 Installing Ansible collections...${NC}"
    
    ansible-galaxy collection install community.docker
    ansible-galaxy collection install community.postgresql
    ansible-galaxy collection install community.general
    ansible-galaxy collection install ansible.posix
    
    echo -e "${GREEN}✅ Collections installed${NC}"
}

# Create deployment directory
setup_deployment() {
    echo -e "${BLUE}📁 Setting up deployment directory...${NC}"
    
    DEPLOY_DIR="ansible-security-lab-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
    
    # Copy Ansible configuration
    cp -r ../ansible/* .
    
    echo -e "${GREEN}✅ Deployment directory ready: $(pwd)${NC}"
}

# Configure inventory based on deployment target
configure_inventory() {
    echo -e "${BLUE}🎯 Configuring deployment target...${NC}"
    echo ""
    echo -e "${CYAN}Select deployment target:${NC}"
    echo "1) Local (localhost)"
    echo "2) AWS EC2 instances" 
    echo "3) Azure VMs"
    echo "4) GCP instances"
    echo "5) Custom servers"
    echo ""
    echo -n -e "${YELLOW}Enter choice [1-5]: ${NC}"
    read -r target_choice
    
    case $target_choice in
        1)
            echo -e "${BLUE}Configuring for local deployment...${NC}"
            cat > inventory/production << 'EOF'
[security_lab]
localhost ansible_connection=local

[security_lab:vars]
lab_environment=development
EOF
            ;;
        2)
            echo -e "${BLUE}Configuring for AWS deployment...${NC}"
            echo -n -e "${YELLOW}Enter AWS EC2 instance IP: ${NC}"
            read -r aws_ip
            echo -n -e "${YELLOW}Enter SSH key path (default: ~/.ssh/id_rsa): ${NC}"
            read -r ssh_key
            ssh_key=${ssh_key:-~/.ssh/id_rsa}
            
            cat > inventory/production << EOF
[security_lab]
aws-lab-1 ansible_host=$aws_ip ansible_user=ubuntu ansible_ssh_private_key_file=$ssh_key

[security_lab:vars]
lab_environment=production
cloud_provider=aws
EOF
            ;;
        3)
            echo -e "${BLUE}Configuring for Azure deployment...${NC}"
            echo -n -e "${YELLOW}Enter Azure VM IP: ${NC}"
            read -r azure_ip
            echo -n -e "${YELLOW}Enter SSH key path (default: ~/.ssh/id_rsa): ${NC}"
            read -r ssh_key
            ssh_key=${ssh_key:-~/.ssh/id_rsa}
            
            cat > inventory/production << EOF
[security_lab]
azure-lab-1 ansible_host=$azure_ip ansible_user=azureuser ansible_ssh_private_key_file=$ssh_key

[security_lab:vars]
lab_environment=production
cloud_provider=azure
EOF
            ;;
        4)
            echo -e "${BLUE}Configuring for GCP deployment...${NC}"
            echo -n -e "${YELLOW}Enter GCP instance IP: ${NC}"
            read -r gcp_ip
            echo -n -e "${YELLOW}Enter SSH key path (default: ~/.ssh/id_rsa): ${NC}"
            read -r ssh_key
            ssh_key=${ssh_key:-~/.ssh/id_rsa}
            
            cat > inventory/production << EOF
[security_lab]
gcp-lab-1 ansible_host=$gcp_ip ansible_user=ubuntu ansible_ssh_private_key_file=$ssh_key

[security_lab:vars]
lab_environment=production
cloud_provider=gcp
EOF
            ;;
        5)
            echo -e "${BLUE}Configuring for custom servers...${NC}"
            echo -n -e "${YELLOW}Enter server IP: ${NC}"
            read -r server_ip
            echo -n -e "${YELLOW}Enter SSH user: ${NC}"
            read -r ssh_user
            echo -n -e "${YELLOW}Enter SSH key path (default: ~/.ssh/id_rsa): ${NC}"
            read -r ssh_key
            ssh_key=${ssh_key:-~/.ssh/id_rsa}
            
            cat > inventory/production << EOF
[security_lab]
custom-lab-1 ansible_host=$server_ip ansible_user=$ssh_user ansible_ssh_private_key_file=$ssh_key

[security_lab:vars]
lab_environment=production
EOF
            ;;
        *)
            echo -e "${RED}Invalid choice. Using localhost.${NC}"
            cat > inventory/production << 'EOF'
[security_lab]
localhost ansible_connection=local

[security_lab:vars]
lab_environment=development
EOF
            ;;
    esac
    
    echo -e "${GREEN}✅ Inventory configured${NC}"
}

# Test connectivity
test_connectivity() {
    echo -e "${BLUE}🔗 Testing connectivity to target hosts...${NC}"
    
    if ansible all -i inventory/production -m ping; then
        echo -e "${GREEN}✅ All hosts reachable${NC}"
    else
        echo -e "${RED}❌ Some hosts unreachable. Check inventory and SSH keys.${NC}"
        exit 1
    fi
}

# Run syntax check
syntax_check() {
    echo -e "${BLUE}📝 Running playbook syntax check...${NC}"
    
    if ansible-playbook -i inventory/production playbooks/security-lab.yml --syntax-check; then
        echo -e "${GREEN}✅ Playbook syntax valid${NC}"
    else
        echo -e "${RED}❌ Playbook syntax errors found${NC}"
        exit 1
    fi
}

# Deploy security lab
deploy_lab() {
    echo -e "${BLUE}🚀 Deploying Security Lab with Ansible...${NC}"
    
    # Run playbook with progress
    ansible-playbook -i inventory/production playbooks/security-lab.yml \
        --become \
        --ask-become-pass \
        -v
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Security Lab deployment completed successfully!${NC}"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        exit 1
    fi
}

# Show deployment summary
show_summary() {
    echo -e "${PURPLE}📊 Deployment Summary${NC}"
    echo ""
    echo -e "${CYAN}🎯 Target Configuration:${NC}"
    cat inventory/production
    echo ""
    echo -e "${CYAN}🌐 Access Points:${NC}"
    echo "   • Lab Application:    http://[server-ip]:80"
    echo "   • OWASP ZAP:         http://[server-ip]:8080"
    echo "   • Prometheus:        http://[server-ip]:9090"
    echo "   • Grafana:           http://[server-ip]:3001 (admin/admin123)"
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "   • Check status:      ansible all -i inventory/production -m command -a 'systemctl status security-lab'"
    echo "   • View logs:         ansible all -i inventory/production -m command -a 'docker-compose -f /opt/security-lab/docker-compose.yml logs'"
    echo "   • Update config:     ansible-playbook -i inventory/production playbooks/security-lab.yml --become"
    echo ""
    echo -e "${GREEN}🎉 Ansible deployment complete!${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}Starting Ansible Security Lab deployment...${NC}"
    
    check_ansible
    install_collections
    setup_deployment
    configure_inventory
    test_connectivity
    syntax_check
    
    echo ""
    echo -n -e "${YELLOW}Proceed with deployment? [y/N]: ${NC}"
    read -r proceed
    
    if [[ "$proceed" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        deploy_lab
        show_summary
    else
        echo -e "${YELLOW}Deployment cancelled${NC}"
    fi
}

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run main function
main