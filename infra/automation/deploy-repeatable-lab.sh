#!/bin/bash
# Repeatable Security Lab Deployment Script
# Optimized for environments that need frequent rebuilds

set -e
trap 'echo "❌ Repeatable deployment failed. Check logs above."' ERR

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🔄 Repeatable Security Lab Deployment${NC}"
echo -e "${CYAN}Optimized for frequent rebuilds and consistent environments${NC}"
echo ""

# Configuration variables
LAB_CONFIG_FILE="lab-config.yml"
STATE_FILE="lab-state.json"
BACKUP_DIR="lab-backups"
DEPLOY_LOG="deployment-$(date +%Y%m%d_%H%M%S).log"

# Create lab state management
init_state_management() {
    echo -e "${BLUE}📋 Initializing state management...${NC}"
    
    # Create directories
    mkdir -p "$BACKUP_DIR" logs configs
    
    # Create default configuration if it doesn't exist
    if [ ! -f "$LAB_CONFIG_FILE" ]; then
        cat > "$LAB_CONFIG_FILE" << 'EOF'
# Security Lab Configuration
lab:
  name: "security-lab"
  environment: "development"
  rebuild_strategy: "incremental"  # full, incremental, selective
  
deployment:
  method: "docker"  # docker, ansible, chef, terraform, vagrant
  parallel_execution: true
  rollback_enabled: true
  
services:
  nodejs_lab:
    enabled: true
    port: 3000
    rebuild_deps: true
  
  owasp_zap:
    enabled: true
    port: 8080
    persistent_data: true
  
  postgresql:
    enabled: true
    port: 5432
    backup_before_rebuild: true
  
  redis:
    enabled: true
    port: 6379
    flush_on_rebuild: false
  
  monitoring:
    prometheus: true
    grafana: true
    retain_metrics: true

infrastructure:
  cloud_provider: "local"  # local, aws, azure, gcp
  instance_type: "medium"   # small, medium, large
  storage_persistent: true
  networking_isolated: true

automation:
  pre_deployment_hooks:
    - "backup_existing_data"
    - "validate_prerequisites"
  
  post_deployment_hooks:
    - "run_health_checks"
    - "update_monitoring_dashboards"
    - "send_deployment_notification"

rebuild_optimizations:
  cache_docker_images: true
  reuse_volumes: true
  skip_package_updates: false
  parallel_service_startup: true
  fast_failure_detection: true
EOF
        echo -e "${GREEN}✅ Created default lab configuration${NC}"
    fi
    
    # Initialize state file
    if [ ! -f "$STATE_FILE" ]; then
        cat > "$STATE_FILE" << 'EOF'
{
  "last_deployment": null,
  "deployment_count": 0,
  "active_services": [],
  "backup_locations": [],
  "rollback_points": [],
  "environment_hash": null
}
EOF
        echo -e "${GREEN}✅ Initialized state tracking${NC}"
    fi
}

# Backup existing environment
backup_environment() {
    echo -e "${BLUE}💾 Backing up existing environment...${NC}"
    
    local backup_name="backup-$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    mkdir -p "$backup_path"
    
    # Backup Docker volumes if they exist
    if command -v docker >/dev/null 2>&1; then
        echo -e "${YELLOW}Backing up Docker volumes...${NC}"
        docker volume ls -q | while read -r volume; do
            if [[ $volume == *"lab"* ]] || [[ $volume == *"security"* ]]; then
                docker run --rm \
                    -v "$volume:/source:ro" \
                    -v "$backup_path:/backup" \
                    alpine tar czf "/backup/${volume}.tar.gz" -C /source .
                echo "Backed up volume: $volume"
            fi
        done
    fi
    
    # Backup configuration files
    if [ -d "/opt/security-lab" ]; then
        echo -e "${YELLOW}Backing up lab configurations...${NC}"
        tar czf "$backup_path/lab-configs.tar.gz" -C /opt/security-lab . 2>/dev/null || true
    fi
    
    # Update state file
    local current_backups=$(jq -r '.backup_locations[]?' "$STATE_FILE" 2>/dev/null || echo "")
    jq --arg backup "$backup_path" '.backup_locations += [$backup]' "$STATE_FILE" > temp_state.json
    mv temp_state.json "$STATE_FILE"
    
    echo -e "${GREEN}✅ Environment backed up to: $backup_path${NC}"
}

# Detect what's already deployed
detect_current_state() {
    echo -e "${BLUE}🔍 Detecting current deployment state...${NC}"
    
    local active_services=()
    
    # Check Docker containers
    if command -v docker >/dev/null 2>&1; then
        while IFS= read -r container; do
            if [[ $container == *"lab"* ]] || [[ $container == *"security"* ]]; then
                active_services+=("docker:$container")
            fi
        done < <(docker ps --format "{{.Names}}" 2>/dev/null || true)
    fi
    
    # Check systemd services
    while IFS= read -r service; do
        if [[ $service == *"lab"* ]] || [[ $service == *"security"* ]]; then
            active_services+=("systemd:$service")
        fi
    done < <(systemctl list-units --state=active --no-legend 2>/dev/null | awk '{print $1}' || true)
    
    # Update state file
    jq --argjson services "$(printf '%s\n' "${active_services[@]}" | jq -R . | jq -s .)" \
       '.active_services = $services' "$STATE_FILE" > temp_state.json
    mv temp_state.json "$STATE_FILE"
    
    echo -e "${CYAN}Found ${#active_services[@]} active services${NC}"
    for service in "${active_services[@]}"; do
        echo -e "   • $service"
    done
}

# Smart rebuild based on what's changed
smart_rebuild() {
    echo -e "${BLUE}🧠 Performing smart rebuild analysis...${NC}"
    
    local rebuild_strategy=$(yq eval '.lab.rebuild_strategy' "$LAB_CONFIG_FILE" 2>/dev/null || echo "incremental")
    local deployment_method=$(yq eval '.deployment.method' "$LAB_CONFIG_FILE" 2>/dev/null || echo "docker")
    
    case $rebuild_strategy in
        "full")
            echo -e "${YELLOW}Full rebuild requested - cleaning everything...${NC}"
            cleanup_all_services
            deploy_from_scratch "$deployment_method"
            ;;
        "incremental")
            echo -e "${YELLOW}Incremental rebuild - updating changed components...${NC}"
            deploy_incremental "$deployment_method"
            ;;
        "selective")
            echo -e "${YELLOW}Selective rebuild - user chooses components...${NC}"
            deploy_selective "$deployment_method"
            ;;
        *)
            echo -e "${RED}Unknown rebuild strategy: $rebuild_strategy${NC}"
            exit 1
            ;;
    esac
}

# Clean up all services
cleanup_all_services() {
    echo -e "${BLUE}🧹 Cleaning up all services...${NC}"
    
    # Stop Docker containers
    if command -v docker >/dev/null 2>&1; then
        docker ps -a --format "{{.Names}}" | grep -E "(lab|security)" | while read -r container; do
            echo "Stopping container: $container"
            docker stop "$container" >/dev/null 2>&1 || true
            docker rm "$container" >/dev/null 2>&1 || true
        done
        
        # Clean up networks
        docker network ls --format "{{.Name}}" | grep -E "(lab|security)" | while read -r network; do
            echo "Removing network: $network"
            docker network rm "$network" >/dev/null 2>&1 || true
        done
    fi
    
    # Stop systemd services
    systemctl list-units --state=active --no-legend | awk '{print $1}' | grep -E "(lab|security)" | while read -r service; do
        echo "Stopping service: $service"
        systemctl stop "$service" >/dev/null 2>&1 || true
        systemctl disable "$service" >/dev/null 2>&1 || true
    done
}

# Deploy from scratch
deploy_from_scratch() {
    local method=$1
    echo -e "${BLUE}🚀 Deploying from scratch using $method...${NC}"
    
    case $method in
        "docker")
            if [ -f "../automation/deploy-complete-lab.sh" ]; then
                ../automation/deploy-complete-lab.sh
            else
                echo -e "${RED}Docker deployment script not found${NC}"
                exit 1
            fi
            ;;
        "ansible")
            if [ -f "../automation/deploy-ansible-lab.sh" ]; then
                ../automation/deploy-ansible-lab.sh
            else
                echo -e "${RED}Ansible deployment script not found${NC}"
                exit 1
            fi
            ;;
        "chef")
            if [ -f "../automation/deploy-chef-lab.sh" ]; then
                ../automation/deploy-chef-lab.sh
            else
                echo -e "${RED}Chef deployment script not found${NC}"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}Unknown deployment method: $method${NC}"
            exit 1
            ;;
    esac
}

# Incremental deployment
deploy_incremental() {
    local method=$1
    echo -e "${BLUE}⚡ Performing incremental deployment...${NC}"
    
    # Check what services need updates
    local services_to_update=()
    
    # Check if configuration changed
    local current_hash=$(find . -name "*.yml" -o -name "*.yaml" -o -name "docker-compose.yml" | xargs cat | md5sum | cut -d' ' -f1)
    local previous_hash=$(jq -r '.environment_hash // empty' "$STATE_FILE")
    
    if [ "$current_hash" != "$previous_hash" ]; then
        echo -e "${YELLOW}Configuration changed, updating affected services...${NC}"
        
        case $method in
            "docker")
                # Pull latest images
                echo -e "${YELLOW}Pulling latest Docker images...${NC}"
                if [ -f "docker-compose.yml" ]; then
                    docker-compose pull
                    docker-compose up -d --remove-orphans
                elif [ -f "../docker/docker-compose.yml" ]; then
                    cd ../docker
                    docker-compose pull
                    docker-compose up -d --remove-orphans
                    cd -
                fi
                ;;
            "ansible")
                echo -e "${YELLOW}Running Ansible playbook updates...${NC}"
                if [ -f "../ansible/playbooks/security-lab.yml" ]; then
                    ansible-playbook -i ../ansible/inventory/hosts.yml ../ansible/playbooks/security-lab.yml --diff
                fi
                ;;
            "chef")
                echo -e "${YELLOW}Running Chef client convergence...${NC}"
                chef-client -z -o 'security-lab::default' >/dev/null 2>&1 || true
                ;;
        esac
        
        # Update environment hash
        jq --arg hash "$current_hash" '.environment_hash = $hash' "$STATE_FILE" > temp_state.json
        mv temp_state.json "$STATE_FILE"
    else
        echo -e "${GREEN}✅ No configuration changes detected - skipping rebuild${NC}"
    fi
}

# Selective deployment
deploy_selective() {
    local method=$1
    echo -e "${BLUE}🎯 Selective deployment - choose components...${NC}"
    
    echo ""
    echo -e "${CYAN}Select services to rebuild:${NC}"
    echo "1) Node.js Security Lab"
    echo "2) OWASP ZAP Scanner"
    echo "3) PostgreSQL Database"
    echo "4) Redis Cache"
    echo "5) Monitoring Stack"
    echo "6) All Services"
    echo ""
    echo -n -e "${YELLOW}Enter choice (comma-separated for multiple): ${NC}"
    read -r service_choices
    
    IFS=',' read -ra CHOICES <<< "$service_choices"
    for choice in "${CHOICES[@]}"; do
        choice=$(echo "$choice" | xargs)  # trim whitespace
        case $choice in
            1) rebuild_service "nodejs-lab" "$method" ;;
            2) rebuild_service "owasp-zap" "$method" ;;
            3) rebuild_service "postgresql" "$method" ;;
            4) rebuild_service "redis" "$method" ;;
            5) rebuild_service "monitoring" "$method" ;;
            6) deploy_from_scratch "$method"; return ;;
            *) echo -e "${RED}Invalid choice: $choice${NC}" ;;
        esac
    done
}

# Rebuild specific service
rebuild_service() {
    local service=$1
    local method=$2
    
    echo -e "${BLUE}🔧 Rebuilding service: $service${NC}"
    
    case $method in
        "docker")
            case $service in
                "nodejs-lab")
                    docker stop nodejs-security-lab >/dev/null 2>&1 || true
                    docker rm nodejs-security-lab >/dev/null 2>&1 || true
                    docker-compose up -d nodejs-lab
                    ;;
                "owasp-zap")
                    docker stop security-zap >/dev/null 2>&1 || true
                    docker rm security-zap >/dev/null 2>&1 || true
                    docker-compose up -d zap
                    ;;
                *)
                    echo -e "${YELLOW}Rebuilding $service with Docker Compose...${NC}"
                    docker-compose up -d --force-recreate "$service"
                    ;;
            esac
            ;;
        "ansible")
            echo -e "${YELLOW}Running Ansible for $service...${NC}"
            ansible-playbook -i ../ansible/inventory/hosts.yml ../ansible/playbooks/security-lab.yml --tags "$service"
            ;;
        "chef")
            echo -e "${YELLOW}Running Chef for $service...${NC}"
            chef-client -z -o "security-lab::$service" >/dev/null 2>&1 || true
            ;;
    esac
}

# Run health checks
run_health_checks() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    local failed_services=()
    
    # Check Docker services
    if command -v docker >/dev/null 2>&1; then
        while IFS= read -r container; do
            if ! docker exec "$container" echo "Health check" >/dev/null 2>&1; then
                failed_services+=("$container")
            fi
        done < <(docker ps --format "{{.Names}}" | grep -E "(lab|security)" || true)
    fi
    
    # Check HTTP endpoints
    local endpoints=("http://localhost:80" "http://localhost:3000" "http://localhost:8080")
    for endpoint in "${endpoints[@]}"; do
        if ! curl -s --max-time 5 "$endpoint" >/dev/null 2>&1; then
            failed_services+=("$endpoint")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All health checks passed${NC}"
    else
        echo -e "${RED}❌ Health check failures:${NC}"
        for service in "${failed_services[@]}"; do
            echo -e "   • $service"
        done
        
        echo -n -e "${YELLOW}Attempt automatic recovery? [y/N]: ${NC}"
        read -r recovery
        if [[ "$recovery" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            echo -e "${BLUE}🔧 Attempting automatic recovery...${NC}"
            # Restart failed services
            for service in "${failed_services[@]}"; do
                if [[ $service == http* ]]; then
                    continue  # Skip HTTP endpoints
                fi
                echo "Restarting $service"
                docker restart "$service" >/dev/null 2>&1 || true
            done
            sleep 10
            run_health_checks  # Recursive check
        fi
    fi
}

# Update deployment state
update_state() {
    echo -e "${BLUE}📊 Updating deployment state...${NC}"
    
    local deployment_count=$(jq -r '.deployment_count' "$STATE_FILE")
    deployment_count=$((deployment_count + 1))
    
    jq --arg timestamp "$(date -Iseconds)" \
       --arg count "$deployment_count" \
       '.last_deployment = $timestamp | .deployment_count = ($count | tonumber)' \
       "$STATE_FILE" > temp_state.json
    mv temp_state.json "$STATE_FILE"
    
    echo -e "${GREEN}✅ State updated - Deployment #$deployment_count${NC}"
}

# Show deployment summary
show_summary() {
    echo -e "${PURPLE}📊 Repeatable Deployment Summary${NC}"
    echo ""
    
    local deployment_count=$(jq -r '.deployment_count' "$STATE_FILE")
    local last_deployment=$(jq -r '.last_deployment' "$STATE_FILE")
    local active_services=$(jq -r '.active_services | length' "$STATE_FILE")
    
    echo -e "${CYAN}📈 Deployment Statistics:${NC}"
    echo -e "   • Total Deployments: $deployment_count"
    echo -e "   • Last Deployment: $last_deployment"
    echo -e "   • Active Services: $active_services"
    echo ""
    
    echo -e "${CYAN}🌐 Access Points:${NC}"
    echo -e "   • Lab Dashboard:     http://localhost:80"
    echo -e "   • OWASP ZAP:         http://localhost:8080"
    echo -e "   • Node.js Lab:       http://localhost:3000"
    echo -e "   • Grafana:           http://localhost:3001"
    echo ""
    
    echo -e "${CYAN}🔧 Rebuild Commands:${NC}"
    echo -e "   • Full rebuild:      ./deploy-repeatable-lab.sh --full"
    echo -e "   • Incremental:       ./deploy-repeatable-lab.sh --incremental"
    echo -e "   • Selective:         ./deploy-repeatable-lab.sh --selective"
    echo -e "   • Health check:      ./deploy-repeatable-lab.sh --health-check"
    echo ""
    
    echo -e "${GREEN}🎉 Repeatable deployment complete!${NC}"
}

# Handle command line arguments
handle_arguments() {
    case "${1:-}" in
        "--full")
            echo "lab: { rebuild_strategy: \"full\" }" > temp-config.yml
            yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' "$LAB_CONFIG_FILE" temp-config.yml > merged-config.yml
            mv merged-config.yml "$LAB_CONFIG_FILE"
            rm temp-config.yml
            ;;
        "--incremental")
            echo "lab: { rebuild_strategy: \"incremental\" }" > temp-config.yml
            yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' "$LAB_CONFIG_FILE" temp-config.yml > merged-config.yml
            mv merged-config.yml "$LAB_CONFIG_FILE"
            rm temp-config.yml
            ;;
        "--selective")
            echo "lab: { rebuild_strategy: \"selective\" }" > temp-config.yml
            yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' "$LAB_CONFIG_FILE" temp-config.yml > merged-config.yml
            mv merged-config.yml "$LAB_CONFIG_FILE"
            rm temp-config.yml
            ;;
        "--health-check")
            run_health_checks
            exit 0
            ;;
        "--help"|"-h")
            echo "Usage: $0 [--full|--incremental|--selective|--health-check]"
            echo ""
            echo "Options:"
            echo "  --full         Full rebuild of all components"
            echo "  --incremental  Smart incremental rebuild (default)"
            echo "  --selective    Choose specific components to rebuild"
            echo "  --health-check Run health checks only"
            echo "  --help         Show this help message"
            exit 0
            ;;
    esac
}

# Main execution
main() {
    # Start logging
    exec > >(tee -a "$DEPLOY_LOG")
    exec 2>&1
    
    echo -e "${GREEN}🚀 Starting repeatable security lab deployment...${NC}"
    echo -e "${CYAN}Optimized for frequent rebuilds and consistent environments${NC}"
    echo ""
    
    handle_arguments "$@"
    init_state_management
    backup_environment
    detect_current_state
    smart_rebuild
    run_health_checks
    update_state
    show_summary
    
    echo -e "${GREEN}📝 Deployment logged to: $DEPLOY_LOG${NC}"
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