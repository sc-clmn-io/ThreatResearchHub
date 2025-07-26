#!/bin/bash
# Chef Security Lab Deployment Script
# Automated deployment using Chef configuration management

set -e
trap 'echo "❌ Chef deployment failed. Check logs above."' ERR

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}👨‍🍳 Chef Security Lab Deployment${NC}"
echo -e "${CYAN}Infrastructure as Code deployment using Chef${NC}"
echo ""

# Check and install Chef
install_chef() {
    echo -e "${BLUE}🔍 Checking Chef installation...${NC}"
    
    if ! command -v chef-client >/dev/null 2>&1; then
        echo -e "${YELLOW}Installing Chef...${NC}"
        
        # Install Chef Infra Client
        curl -L https://omnitruck.chef.io/install.sh | sudo bash -s -- -P chef
        
        echo -e "${GREEN}✅ Chef installed successfully${NC}"
    else
        echo -e "${GREEN}✅ Chef already installed${NC}"
    fi
    
    # Verify installation
    chef-client --version
}

# Setup Chef repository
setup_chef_repo() {
    echo -e "${BLUE}📁 Setting up Chef repository...${NC}"
    
    CHEF_REPO="chef-security-lab-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$CHEF_REPO"
    cd "$CHEF_REPO"
    
    # Generate Chef repository structure
    chef generate repo .
    
    # Copy our security-lab cookbook
    cp -r ../chef/cookbooks/* cookbooks/
    
    echo -e "${GREEN}✅ Chef repository ready: $(pwd)${NC}"
}

# Install cookbook dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing cookbook dependencies...${NC}"
    
    # Create Policyfile
    cat > Policyfile.rb << 'EOF'
# Policyfile.rb - Describe how you want Chef Infra Client to build your system.

name 'security-lab'

# Where to find external cookbooks:
default_source :supermarket

# run_list: chef-client will run these recipes in the order specified.
run_list 'security-lab::default'

# Specify a custom source for a single cookbook:
cookbook 'security-lab', path: './cookbooks/security-lab'
cookbook 'docker', '~> 4.0'
cookbook 'nodejs', '~> 6.0'
cookbook 'python', '~> 3.0'
EOF

    # Install policy dependencies
    chef install Policyfile.rb
    
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Configure deployment target
configure_target() {
    echo -e "${BLUE}🎯 Configuring deployment target...${NC}"
    echo ""
    echo -e "${CYAN}Select deployment method:${NC}"
    echo "1) Local (chef-zero)"
    echo "2) Remote servers via SSH"
    echo "3) Chef Server"
    echo ""
    echo -n -e "${YELLOW}Enter choice [1-3]: ${NC}"
    read -r deploy_method
    
    case $deploy_method in
        1)
            echo -e "${BLUE}Configuring for local deployment...${NC}"
            DEPLOY_METHOD="local"
            ;;
        2)
            echo -e "${BLUE}Configuring for remote deployment...${NC}"
            echo -n -e "${YELLOW}Enter server IP: ${NC}"
            read -r server_ip
            echo -n -e "${YELLOW}Enter SSH user: ${NC}"
            read -r ssh_user
            echo -n -e "${YELLOW}Enter SSH key path (default: ~/.ssh/id_rsa): ${NC}"
            read -r ssh_key
            ssh_key=${ssh_key:-~/.ssh/id_rsa}
            
            DEPLOY_METHOD="remote"
            SERVER_IP="$server_ip"
            SSH_USER="$ssh_user"
            SSH_KEY="$ssh_key"
            ;;
        3)
            echo -e "${BLUE}Configuring for Chef Server deployment...${NC}"
            echo -n -e "${YELLOW}Enter Chef Server URL: ${NC}"
            read -r chef_server_url
            echo -n -e "${YELLOW}Enter node name: ${NC}"
            read -r node_name
            echo -n -e "${YELLOW}Enter client key path: ${NC}"
            read -r client_key
            
            DEPLOY_METHOD="server"
            CHEF_SERVER_URL="$chef_server_url"
            NODE_NAME="$node_name"
            CLIENT_KEY="$client_key"
            ;;
        *)
            echo -e "${RED}Invalid choice. Using local deployment.${NC}"
            DEPLOY_METHOD="local"
            ;;
    esac
}

# Deploy with Chef Zero (local)
deploy_local() {
    echo -e "${BLUE}🚀 Deploying locally with Chef Zero...${NC}"
    
    # Create client.rb configuration
    cat > client.rb << 'EOF'
# Chef Client Configuration
chef_zero.enabled true
local_mode true
cookbook_path ['./cookbooks']
log_level :info
log_location STDOUT
node_name 'security-lab-local'
EOF

    # Run Chef client
    sudo chef-client -z -c client.rb -o 'security-lab::default'
}

# Deploy to remote server
deploy_remote() {
    echo -e "${BLUE}🚀 Deploying to remote server...${NC}"
    
    # Test SSH connectivity
    if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 "$SSH_USER@$SERVER_IP" 'echo "SSH OK"'; then
        echo -e "${RED}❌ Cannot connect to remote server${NC}"
        exit 1
    fi
    
    # Copy cookbook to remote server
    echo -e "${YELLOW}📤 Copying cookbooks to remote server...${NC}"
    scp -i "$SSH_KEY" -r cookbooks "$SSH_USER@$SERVER_IP:~/chef-cookbooks"
    
    # Install Chef on remote server if needed
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
if ! command -v chef-client >/dev/null 2>&1; then
    echo "Installing Chef on remote server..."
    curl -L https://omnitruck.chef.io/install.sh | sudo bash -s -- -P chef
fi
EOF

    # Create remote client configuration
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
sudo mkdir -p /etc/chef
sudo tee /etc/chef/client.rb > /dev/null << 'CLIENTRB'
chef_zero.enabled true
local_mode true
cookbook_path ['/home/$USER/chef-cookbooks']
log_level :info
log_location STDOUT
node_name 'security-lab-remote'
CLIENTRB
EOF

    # Run Chef client on remote server
    ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" 'sudo chef-client -z -c /etc/chef/client.rb -o "security-lab::default"'
}

# Deploy via Chef Server
deploy_server() {
    echo -e "${BLUE}🚀 Deploying via Chef Server...${NC}"
    
    # Upload cookbook to Chef Server
    echo -e "${YELLOW}📤 Uploading cookbook to Chef Server...${NC}"
    knife cookbook upload security-lab --server-url "$CHEF_SERVER_URL" --key "$CLIENT_KEY"
    
    # Bootstrap node if needed
    echo -n -e "${YELLOW}Bootstrap new node? [y/N]: ${NC}"
    read -r bootstrap
    
    if [[ "$bootstrap" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        echo -n -e "${YELLOW}Enter server IP for bootstrap: ${NC}"
        read -r bootstrap_ip
        echo -n -e "${YELLOW}Enter SSH user: ${NC}"
        read -r bootstrap_user
        
        knife bootstrap "$bootstrap_ip" \
            --ssh-user "$bootstrap_user" \
            --sudo \
            --node-name "$NODE_NAME" \
            --run-list 'recipe[security-lab::default]' \
            --server-url "$CHEF_SERVER_URL" \
            --key "$CLIENT_KEY"
    else
        echo "Skipping bootstrap. Make sure to add 'recipe[security-lab::default]' to node run list."
    fi
}

# Verify deployment
verify_deployment() {
    echo -e "${BLUE}✅ Verifying deployment...${NC}"
    
    case $DEPLOY_METHOD in
        "local")
            # Check local services
            if systemctl is-active --quiet security-lab; then
                echo -e "${GREEN}✅ Security Lab service is running${NC}"
            else
                echo -e "${YELLOW}⚠️  Service not running yet, starting...${NC}"
                sudo systemctl start security-lab
            fi
            
            # Check Docker containers
            cd /opt/security-lab
            if sudo -u labuser docker-compose ps | grep -q "Up"; then
                echo -e "${GREEN}✅ Docker containers are running${NC}"
            else
                echo -e "${YELLOW}⚠️  Starting Docker containers...${NC}"
                sudo -u labuser docker-compose up -d
            fi
            ;;
        "remote")
            # Check remote services
            ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'
if systemctl is-active --quiet security-lab; then
    echo "✅ Security Lab service is running"
else
    echo "⚠️  Starting Security Lab service..."
    sudo systemctl start security-lab
fi

cd /opt/security-lab
if sudo -u labuser docker-compose ps | grep -q "Up"; then
    echo "✅ Docker containers are running"
else
    echo "⚠️  Starting Docker containers..."
    sudo -u labuser docker-compose up -d
fi
EOF
            ;;
    esac
}

# Show deployment summary
show_summary() {
    echo -e "${PURPLE}📊 Chef Deployment Summary${NC}"
    echo ""
    echo -e "${CYAN}🎯 Deployment Method: ${DEPLOY_METHOD}${NC}"
    
    case $DEPLOY_METHOD in
        "local")
            echo -e "${CYAN}🌐 Access Points:${NC}"
            echo "   • Lab Application:    http://localhost:80"
            echo "   • OWASP ZAP:         http://localhost:8080"
            echo "   • Prometheus:        http://localhost:9090"
            echo "   • Grafana:           http://localhost:3001 (admin/admin123)"
            ;;
        "remote")
            echo -e "${CYAN}🌐 Access Points:${NC}"
            echo "   • Lab Application:    http://$SERVER_IP:80"
            echo "   • OWASP ZAP:         http://$SERVER_IP:8080"
            echo "   • Prometheus:        http://$SERVER_IP:9090"
            echo "   • Grafana:           http://$SERVER_IP:3001 (admin/admin123)"
            ;;
    esac
    
    echo ""
    echo -e "${CYAN}🔧 Management Commands:${NC}"
    echo "   • Converge again:    chef-client -z -c client.rb -o 'security-lab::default'"
    echo "   • Check services:    systemctl status security-lab"
    echo "   • View logs:         cd /opt/security-lab && docker-compose logs"
    echo ""
    echo -e "${GREEN}🎉 Chef deployment complete!${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}Starting Chef Security Lab deployment...${NC}"
    
    install_chef
    setup_chef_repo
    install_dependencies
    configure_target
    
    echo ""
    echo -n -e "${YELLOW}Proceed with deployment? [y/N]: ${NC}"
    read -r proceed
    
    if [[ "$proceed" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        case $DEPLOY_METHOD in
            "local")
                deploy_local
                ;;
            "remote")
                deploy_remote
                ;;
            "server")
                deploy_server
                ;;
        esac
        
        verify_deployment
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