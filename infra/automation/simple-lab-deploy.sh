#!/bin/bash
# Simple 10-Minute Lab Deployment Script
# Automates Docker Runtime Escape Detection Lab Setup

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LAB_DIR="docker-escape-lab"
XSIAM_URL=""
XSIAM_API_KEY=""

# Logging
LOG_FILE="lab-deployment.log"
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if running as root on Linux
    if [[ "$OSTYPE" == "linux-gnu"* ]] && [[ $EUID -eq 0 ]]; then
        print_error "Do not run this script as root. Run as regular user with sudo access."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Installing Docker..."
        install_docker
    else
        print_success "Docker is installed"
    fi
    
    # Check Docker Compose
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose not found. Installing..."
        install_docker_compose
    else
        print_success "Docker Compose is available"
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker Desktop or Docker service."
        exit 1
    else
        print_success "Docker daemon is running"
    fi
    
    # Check available disk space (need at least 10GB)
    available_space=$(df . | tail -1 | awk '{print $4}')
    if [[ $available_space -lt 10485760 ]]; then  # 10GB in KB
        print_warning "Less than 10GB available disk space. Lab may not function properly."
    else
        print_success "Sufficient disk space available"
    fi
    
    # Check available memory (need at least 4GB)
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
        if [[ $available_memory -lt 4096 ]]; then
            print_warning "Less than 4GB available memory. Performance may be affected."
        else
            print_success "Sufficient memory available"
        fi
    fi
}

install_docker() {
    print_header "Installing Docker"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux installation
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        print_warning "Please log out and log back in for Docker group changes to take effect"
        print_warning "Then re-run this script"
        exit 0
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_error "Please install Docker Desktop for Mac from https://docker.com/products/docker-desktop"
        exit 1
    else
        # Windows or other
        print_error "Please install Docker Desktop from https://docker.com/products/docker-desktop"
        exit 1
    fi
}

install_docker_compose() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
}

setup_project_structure() {
    print_header "Setting Up Project Structure"
    
    # Create main directory
    if [[ -d "$LAB_DIR" ]]; then
        print_warning "Lab directory already exists. Backing up..."
        mv "$LAB_DIR" "${LAB_DIR}.backup.$(date +%Y%m%d-%H%M%S)"
    fi
    
    mkdir -p "$LAB_DIR"
    cd "$LAB_DIR"
    
    # Create subdirectories
    mkdir -p {configs,logs,scripts,data,automation}
    mkdir -p logs/{falco,filebeat,response}
    mkdir -p scripts/{response,automation}
    mkdir -p configs/{falco,filebeat,xsiam}
    
    print_success "Project structure created"
}

create_docker_compose() {
    print_header "Creating Docker Compose Configuration"
    
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Falco - Runtime Security Monitoring
  falco:
    image: falcosecurity/falco-no-driver:latest
    container_name: docker-escape-falco
    privileged: true
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - /dev:/host/dev
      - /proc:/host/proc:ro
      - /boot:/host/boot:ro
      - /lib/modules:/host/lib/modules:ro
      - /usr:/host/usr:ro
      - /etc:/host/etc:ro
      - ./configs/falco/falco_rules.yaml:/etc/falco/falco_rules_local.yaml
      - ./logs/falco:/var/log/falco
    environment:
      - FALCO_GRPC_ENABLED=true
      - FALCO_GRPC_BIND_ADDRESS=0.0.0.0:5060
    ports:
      - "5060:5060"
    networks:
      - monitoring
    restart: unless-stopped

  # Elasticsearch for log storage
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: docker-escape-elastic
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx2g"
    ports:
      - "9200:9200"
    volumes:
      - elastic_data:/usr/share/elasticsearch/data
    networks:
      - monitoring
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Kibana for log visualization
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: docker-escape-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - monitoring
    restart: unless-stopped

  # Filebeat for log forwarding
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: docker-escape-filebeat
    user: root
    volumes:
      - ./configs/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - ./logs:/var/log/lab:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - monitoring
    restart: unless-stopped

  # Vulnerable container for testing
  vulnerable-container:
    image: alpine:latest
    container_name: escape-test-target
    command: sh -c "while true; do sleep 30; done"
    volumes:
      - /:/host-root:ro
    networks:
      - monitoring
    restart: unless-stopped

  # Attack simulation container
  attack-simulator:
    image: alpine:latest
    container_name: attack-simulator
    command: sh -c "apk add --no-cache curl && while true; do sleep 60; done"
    networks:
      - monitoring
    restart: unless-stopped

volumes:
  elastic_data:

networks:
  monitoring:
    driver: bridge
EOF
    
    print_success "Docker Compose configuration created"
}

create_falco_rules() {
    print_header "Creating Falco Detection Rules"
    
    cat > configs/falco/falco_rules.yaml << 'EOF'
# Container Escape Detection Rules

- rule: Container Escape via Privileged Mount
  desc: Detect container attempting to access host filesystem
  condition: >
    spawned_process and
    container and
    (proc.name in (sh, bash, dash, ash, zsh) or
     proc.name in (cat, ls, find, mount, umount)) and
    (fd.name startswith /host-root or
     fd.name startswith /host or
     fd.name contains /proc/1/root or
     fd.name contains /etc/shadow or
     fd.name contains /etc/passwd or
     fd.name contains /root/)
  output: >
    Container escape attempt detected (proc=%proc.name pid=%proc.pid 
    container=%container.name image=%container.image.repository 
    file=%fd.name command=%proc.cmdline user=%user.name)
  priority: CRITICAL
  tags: [container, escape, privilege_escalation, T1611]

- rule: Docker Socket Access from Container
  desc: Detect container accessing Docker socket
  condition: >
    spawned_process and
    container and
    (fd.name=/var/run/docker.sock or
     fd.name=/host/var/run/docker.sock or
     proc.args contains "docker.sock")
  output: >
    Container accessing Docker socket (proc=%proc.name pid=%proc.pid 
    container=%container.name image=%container.image.repository 
    command=%proc.cmdline)
  priority: CRITICAL
  tags: [container, escape, docker, T1609]

- rule: Container Privilege Escalation
  desc: Detect privilege escalation inside container
  condition: >
    spawned_process and
    container and
    (proc.name in (sudo, su, newgrp) or
     (proc.args contains "--privileged" or
      proc.args contains "CAP_SYS_ADMIN" or
      proc.args contains "CAP_DAC_OVERRIDE"))
  output: >
    Container privilege escalation attempt (proc=%proc.name pid=%proc.pid 
    container=%container.name command=%proc.cmdline)
  priority: HIGH
  tags: [container, privilege_escalation, T1548]

- rule: Sensitive File Access from Container
  desc: Detect container accessing sensitive host files
  condition: >
    open_read and
    container and
    (fd.name in (/etc/shadow, /etc/passwd, /etc/sudoers, /etc/hosts) or
     fd.name startswith /root/ or
     fd.name startswith /home/ or
     fd.name contains ssh_host or
     fd.name contains ".ssh/" or
     fd.name contains "id_rsa")
  output: >
    Container accessing sensitive file (file=%fd.name proc=%proc.name 
    pid=%proc.pid container=%container.name)
  priority: HIGH
  tags: [container, file_access, sensitive, T1005]

- rule: Container Process Namespace Escape
  desc: Detect container trying to escape process namespace
  condition: >
    spawned_process and
    container and
    (proc.args contains "--pid=host" or
     proc.args contains "nsenter" or
     proc.name = "nsenter")
  output: >
    Container process namespace escape attempt (proc=%proc.name 
    container=%container.name command=%proc.cmdline)
  priority: CRITICAL
  tags: [container, namespace, escape, T1611]

- rule: Container Network Escape
  desc: Detect container network manipulation
  condition: >
    spawned_process and
    container and
    (proc.name in (iptables, ip, ifconfig, netstat, ss) or
     proc.args contains "--net=host" or
     proc.args contains "--network=host")
  output: >
    Container network escape attempt (proc=%proc.name container=%container.name 
    command=%proc.cmdline)
  priority: HIGH
  tags: [container, network, escape, T1599]
EOF
    
    print_success "Falco detection rules created"
}

create_filebeat_config() {
    print_header "Creating Filebeat Configuration"
    
    cat > configs/filebeat/filebeat.yml << 'EOF'
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/lab/falco/*.log
  fields:
    log_type: falco_security
    environment: lab
    deployment: docker-escape-detection
  fields_under_root: true
  multiline.pattern: '^\{'
  multiline.negate: true
  multiline.match: after
  json.keys_under_root: true
  json.add_error_key: true

- type: docker
  enabled: true
  containers.ids:
    - "*"
  containers.stream: "all"
  containers.path: "/var/lib/docker/containers"

processors:
- add_host_metadata:
    when.not.contains.tags: forwarded
- add_docker_metadata: ~
- timestamp:
    field: time
    layouts:
      - '2006-01-02T15:04:05.000000000Z'
      - '2006-01-02T15:04:05Z'
    test:
      - '2025-01-27T20:30:45.123456789Z'

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "docker-escape-lab-%{+yyyy.MM.dd}"

setup.template.name: "docker-escape-lab"
setup.template.pattern: "docker-escape-lab-*"
setup.template.settings:
  index.number_of_shards: 1
  index.number_of_replicas: 0

setup.kibana:
  host: "kibana:5601"

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/lab/filebeat
  name: filebeat.log
  keepfiles: 7
  permissions: 0644
EOF
    
    print_success "Filebeat configuration created"
}

create_automation_scripts() {
    print_header "Creating Automation Scripts"
    
    # Container isolation script
    cat > scripts/response/isolate_container.sh << 'EOF'
#!/bin/bash
# Automatically isolate suspicious container

CONTAINER_ID=$1
ALERT_PRIORITY=$2
TIMESTAMP=$(date -Iseconds)

if [ -z "$CONTAINER_ID" ]; then
    echo "Usage: $0 <container_id> <priority>"
    exit 1
fi

echo "$TIMESTAMP: Isolating container $CONTAINER_ID due to $ALERT_PRIORITY priority alert"

# Pause container (keeps it for forensics)
docker pause $CONTAINER_ID 2>/dev/null

# Disconnect from networks
for network in $(docker inspect $CONTAINER_ID --format='{{range $net, $conf := .NetworkSettings.Networks}}{{$net}} {{end}}'); do
    docker network disconnect $network $CONTAINER_ID 2>/dev/null
done

# Create forensic snapshot
SNAPSHOT_NAME="forensic-snapshot-$(date +%Y%m%d-%H%M%S)-${CONTAINER_ID:0:12}"
docker commit $CONTAINER_ID $SNAPSHOT_NAME

# Log the action
echo "$TIMESTAMP: Container $CONTAINER_ID isolated, snapshot: $SNAPSHOT_NAME" >> logs/response/response_actions.log

# Create incident report
cat > logs/response/incident-$CONTAINER_ID-$(date +%Y%m%d-%H%M%S).json << EOL
{
  "timestamp": "$TIMESTAMP",
  "incident_id": "INC-$(date +%Y%m%d%H%M%S)",
  "container_id": "$CONTAINER_ID",
  "alert_priority": "$ALERT_PRIORITY",
  "action_taken": "container_isolated",
  "forensic_snapshot": "$SNAPSHOT_NAME",
  "status": "contained"
}
EOL

echo "Container $CONTAINER_ID has been isolated and forensic snapshot created: $SNAPSHOT_NAME"
EOF
    
    chmod +x scripts/response/isolate_container.sh
    
    # Attack simulation script
    cat > scripts/automation/simulate_attacks.sh << 'EOF'
#!/bin/bash
# Simulate various container escape attacks for testing

echo "Starting attack simulation suite..."

# Test 1: Host filesystem access
echo "Test 1: Simulating host filesystem access..."
docker exec vulnerable-container sh -c "ls /host-root/etc/ 2>/dev/null || echo 'Host access blocked'"
sleep 2

# Test 2: Docker socket access
echo "Test 2: Simulating Docker socket access..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock alpine:latest sh -c "ls -la /var/run/docker.sock 2>/dev/null || echo 'Socket access blocked'"
sleep 2

# Test 3: Privileged operations
echo "Test 3: Simulating privileged operations..."
docker exec vulnerable-container sh -c "mount 2>/dev/null || echo 'Mount operation blocked'"
sleep 2

# Test 4: Sensitive file access
echo "Test 4: Simulating sensitive file access..."
docker exec vulnerable-container sh -c "cat /host-root/etc/passwd 2>/dev/null || echo 'Sensitive file access blocked'"
sleep 2

# Test 5: Process namespace escape
echo "Test 5: Simulating process namespace escape..."
docker run --rm --pid=host alpine:latest sh -c "ps aux | head -5 || echo 'PID namespace escape blocked'"
sleep 2

echo "Attack simulation completed. Check Falco logs for detection results."
EOF
    
    chmod +x scripts/automation/simulate_attacks.sh
    
    # Health check script
    cat > scripts/automation/health_check.sh << 'EOF'
#!/bin/bash
# Check health of all lab components

echo "=== Docker Escape Detection Lab Health Check ==="
echo "Timestamp: $(date)"
echo

# Check container status
echo "1. Container Status:"
docker-compose ps
echo

# Check Elasticsearch
echo "2. Elasticsearch Health:"
curl -s http://localhost:9200/_cluster/health | python3 -m json.tool 2>/dev/null || echo "Elasticsearch unavailable"
echo

# Check Kibana
echo "3. Kibana Status:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5601 | grep -q "200" && echo "Kibana: OK" || echo "Kibana: NOT READY"
echo

# Check Falco logs
echo "4. Recent Falco Alerts:"
docker logs docker-escape-falco --tail 5 2>/dev/null | grep -E "(CRITICAL|HIGH)" || echo "No recent critical alerts"
echo

# Check disk usage
echo "5. Disk Usage:"
df -h . | tail -1
echo

# Check memory usage
echo "6. Memory Usage:"
free -h 2>/dev/null || echo "Memory info unavailable"
echo

echo "Health check completed."
EOF
    
    chmod +x scripts/automation/health_check.sh
    
    print_success "Automation scripts created"
}

configure_xsiam_integration() {
    print_header "Configuring XSIAM Integration"
    
    if [[ -z "$XSIAM_URL" || -z "$XSIAM_API_KEY" ]]; then
        print_warning "XSIAM credentials not provided. Skipping XSIAM integration."
        print_warning "To enable XSIAM integration later, run: ./scripts/automation/configure_xsiam.sh"
        
        # Create configuration script for later use
        cat > scripts/automation/configure_xsiam.sh << 'EOF'
#!/bin/bash
# Configure XSIAM integration

echo "XSIAM Integration Configuration"
echo "============================="

read -p "Enter your XSIAM tenant URL (e.g., https://your-tenant.xdr.us.paloaltonetworks.com): " XSIAM_URL
read -s -p "Enter your XSIAM API key: " XSIAM_API_KEY
echo

# Test connectivity
echo "Testing XSIAM connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $XSIAM_API_KEY" "$XSIAM_URL/public_api/v1/healthcheck")

if [[ "$HTTP_CODE" == "200" ]]; then
    echo "✓ XSIAM connectivity successful"
    
    # Update Filebeat configuration
    sed -i.bak "s|output.elasticsearch:|# output.elasticsearch:|g" configs/filebeat/filebeat.yml
    sed -i "s|hosts: \[\"elasticsearch:9200\"\]|# hosts: [\"elasticsearch:9200\"]|g" configs/filebeat/filebeat.yml
    
    cat >> configs/filebeat/filebeat.yml << EOL

# XSIAM Output Configuration
output.http:
  hosts: ["${XSIAM_URL}/logs/v1/"]
  headers:
    Authorization: "Bearer ${XSIAM_API_KEY}"
    Content-Type: "application/json"
  compression_level: 1
  bulk_max_size: 50
EOL
    
    # Restart Filebeat
    docker-compose restart filebeat
    echo "✓ XSIAM integration configured and Filebeat restarted"
else
    echo "✗ XSIAM connectivity failed (HTTP $HTTP_CODE)"
    echo "Please check your credentials and try again"
fi
EOF
        chmod +x scripts/automation/configure_xsiam.sh
        return
    fi
    
    # Test XSIAM connectivity
    print_header "Testing XSIAM Connectivity"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $XSIAM_API_KEY" "$XSIAM_URL/public_api/v1/healthcheck")
    
    if [[ "$HTTP_CODE" == "200" ]]; then
        print_success "XSIAM connectivity successful"
        
        # Update Filebeat configuration for XSIAM
        cat >> configs/filebeat/filebeat.yml << EOF

# XSIAM Output Configuration (uncomment to enable)
# output.http:
#   hosts: ["${XSIAM_URL}/logs/v1/"]
#   headers:
#     Authorization: "Bearer ${XSIAM_API_KEY}"
#     Content-Type: "application/json"
#   compression_level: 1
#   bulk_max_size: 50
EOF
    else
        print_error "XSIAM connectivity failed (HTTP $HTTP_CODE)"
        print_warning "XSIAM integration disabled. Check credentials and run configure_xsiam.sh"
    fi
}

deploy_lab() {
    print_header "Deploying Lab Environment"
    
    # Pull images first to show progress
    print_header "Pulling Docker Images"
    docker-compose pull
    
    # Start services
    print_header "Starting Services"
    docker-compose up -d
    
    # Wait for services to be ready
    print_header "Waiting for Services to Initialize"
    
    echo "Waiting for Elasticsearch..."
    for i in {1..30}; do
        if curl -s http://localhost:9200/_cluster/health >/dev/null 2>&1; then
            print_success "Elasticsearch is ready"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    echo "Waiting for Kibana..."
    for i in {1..30}; do
        if curl -s http://localhost:5601 >/dev/null 2>&1; then
            print_success "Kibana is ready"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    echo "Waiting for Falco..."
    sleep 10
    if docker logs docker-escape-falco 2>&1 | grep -q "Falco initialized"; then
        print_success "Falco is ready"
    else
        print_warning "Falco may still be initializing"
    fi
}

run_initial_tests() {
    print_header "Running Initial Tests"
    
    # Wait a bit for everything to settle
    sleep 5
    
    # Run attack simulation
    ./scripts/automation/simulate_attacks.sh
    
    # Wait for alerts to be generated
    sleep 10
    
    # Check for generated alerts
    echo "Checking for generated alerts..."
    ALERT_COUNT=$(docker logs docker-escape-falco 2>&1 | grep -c "CRITICAL\|HIGH" || echo "0")
    
    if [[ $ALERT_COUNT -gt 0 ]]; then
        print_success "Generated $ALERT_COUNT security alerts"
        echo "Recent alerts:"
        docker logs docker-escape-falco --tail 5 2>&1 | grep -E "CRITICAL|HIGH" || echo "No critical alerts in last 5 lines"
    else
        print_warning "No alerts generated yet. This may be normal if services are still initializing."
    fi
}

generate_summary_report() {
    print_header "Deployment Summary"
    
    cat > lab-deployment-summary.md << EOF
# Docker Escape Detection Lab - Deployment Summary

**Deployment Date:** $(date)
**Lab Directory:** $(pwd)

## Services Deployed

- **Falco**: Runtime security monitoring (Port 5060)
- **Elasticsearch**: Log storage and search (Port 9200)  
- **Kibana**: Log visualization dashboard (Port 5601)
- **Filebeat**: Log forwarding agent
- **Test Containers**: Vulnerable targets for testing

## Access URLs

- **Kibana Dashboard**: http://localhost:5601
- **Elasticsearch API**: http://localhost:9200
- **Falco gRPC API**: http://localhost:5060

## Quick Commands

\`\`\`bash
# Check service status
docker-compose ps

# View Falco alerts
docker logs docker-escape-falco | grep -E "CRITICAL|HIGH"

# Run attack simulation
./scripts/automation/simulate_attacks.sh

# Health check
./scripts/automation/health_check.sh

# Stop lab
docker-compose down

# Start lab
docker-compose up -d
\`\`\`

## Next Steps

1. Open Kibana at http://localhost:5601
2. Configure index pattern: docker-escape-lab-*  
3. Run attack simulations to generate test data
4. Configure XSIAM integration if needed: \`./scripts/automation/configure_xsiam.sh\`
5. Review detection rules in \`configs/falco/falco_rules.yaml\`

## Troubleshooting

- **Check logs**: \`docker-compose logs [service-name]\`
- **Restart services**: \`docker-compose restart\`
- **Full reset**: \`docker-compose down -v && docker-compose up -d\`

## Files Created

- \`docker-compose.yml\`: Main service configuration
- \`configs/falco/falco_rules.yaml\`: Detection rules
- \`configs/filebeat/filebeat.yml\`: Log forwarding configuration
- \`scripts/\`: Automation and response scripts
- \`logs/\`: Log directories for all services

**Lab deployment completed successfully!**
EOF
    
    print_success "Deployment summary saved to lab-deployment-summary.md"
}

main() {
    print_header "Docker Escape Detection Lab - Automated Deployment"
    echo "This script will deploy a complete container escape detection lab in ~10 minutes"
    echo
    
    # Check if XSIAM credentials are provided as arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --xsiam-url)
                XSIAM_URL="$2"
                shift 2
                ;;
            --xsiam-key)
                XSIAM_API_KEY="$2"
                shift 2
                ;;
            --help)
                echo "Usage: $0 [--xsiam-url URL] [--xsiam-key KEY]"
                echo "  --xsiam-url: Your XSIAM tenant URL"
                echo "  --xsiam-key: Your XSIAM API key"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Prompt for XSIAM credentials if not provided
    if [[ -z "$XSIAM_URL" ]]; then
        read -p "Enter XSIAM tenant URL (optional, press Enter to skip): " XSIAM_URL
    fi
    if [[ -n "$XSIAM_URL" && -z "$XSIAM_API_KEY" ]]; then
        read -s -p "Enter XSIAM API key: " XSIAM_API_KEY
        echo
    fi
    
    # Execute deployment steps
    check_prerequisites
    setup_project_structure
    create_docker_compose
    create_falco_rules
    create_filebeat_config
    create_automation_scripts
    configure_xsiam_integration
    deploy_lab
    run_initial_tests
    generate_summary_report
    
    print_header "Deployment Complete!"
    echo
    print_success "Lab is ready for use!"
    echo
    echo "🔗 Kibana Dashboard: http://localhost:5601"
    echo "🔗 Elasticsearch API: http://localhost:9200"
    echo
    echo "📖 Full deployment summary: lab-deployment-summary.md"
    echo "🔧 Run health check: ./scripts/automation/health_check.sh"
    echo "⚔️  Run attack simulation: ./scripts/automation/simulate_attacks.sh"
    echo
    print_success "Happy threat hunting! 🛡️"
}

# Run main function with all arguments
main "$@"