#!/bin/bash
# Cloud-init user data script for Docker Escape Detection Lab
# Automatically deploys the lab environment on first boot

set -e

# Logging
exec 1> >(tee -a /var/log/lab-deployment.log)
exec 2> >(tee -a /var/log/lab-deployment.log >&2)

echo "Starting Docker Escape Detection Lab deployment at $(date)"

# Variables from Terraform
XSIAM_URL="${xsiam_url}"
YOUR_XSIAM_API_KEY="${xsiam_api_key}"
LAB_USER="ubuntu"
if [[ -f /etc/os-release ]]; then
    source /etc/os-release
    if [[ "$ID" == "ubuntu" ]]; then
        LAB_USER="ubuntu"
    elif [[ "$ID" == "centos" || "$ID" == "rhel" ]]; then
        LAB_USER="centos"
    fi
fi

# Update system
apt-get update -y
apt-get upgrade -y

# Install required packages
apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    unzip \
    htop \
    jq \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker service
systemctl start docker
systemctl enable docker

# Add user to docker group
usermod -aG docker $LAB_USER

# Create lab directory structure
LAB_DIR="/home/$LAB_USER/docker-escape-lab"
mkdir -p $LAB_DIR/{configs/{falco,filebeat,xsiam},logs/{falco,filebeat,response},scripts/{response,automation},data}

# Set ownership
chown -R $LAB_USER:$LAB_USER $LAB_DIR

# Download lab deployment script
curl -fsSL https://raw.githubusercontent.com/your-repo/ThreatResearchHub/main/infra/automation/simple-lab-deploy.sh -o $LAB_DIR/simple-lab-deploy.sh
chmod +x $LAB_DIR/simple-lab-deploy.sh

# Create systemd service for lab
cat > /etc/systemd/system/docker-escape-lab.service << EOF
[Unit]
Description=Docker Escape Detection Lab
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$LAB_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=300
User=$LAB_USER
Group=$LAB_USER

[Install]
WantedBy=multi-user.target
EOF

# Create Docker Compose configuration
cat > $LAB_DIR/docker-compose.yml << 'EOF'
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
      - "ES_JAVA_OPTS=-Xms2g -Xmx4g"
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
    command: sh -c "apk add --no-cache curl nmap && while true; do sleep 60; done"
    networks:
      - monitoring
    restart: unless-stopped

volumes:
  elastic_data:

networks:
  monitoring:
    driver: bridge
EOF

# Create Falco detection rules
cat > $LAB_DIR/configs/falco/falco_rules.yaml << 'EOF'
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
EOF

# Create Filebeat configuration
cat > $LAB_DIR/configs/filebeat/filebeat.yml << 'EOF'
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

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "docker-escape-lab-%{+yyyy.MM.dd}"

setup.template.name: "docker-escape-lab"
setup.template.pattern: "docker-escape-lab-*"

setup.kibana:
  host: "kibana:5601"

logging.level: info
EOF

# Create automation scripts
cat > $LAB_DIR/scripts/automation/simulate_attacks.sh << 'EOF'
#!/bin/bash
# Simulate various container escape attacks for testing

echo "Starting attack simulation suite..."

# Test 1: Host filesystem access
echo "Test 1: Simulating host filesystem access..."
docker exec escape-test-target sh -c "ls /host-root/etc/ 2>/dev/null || echo 'Host access blocked'"
sleep 2

# Test 2: Docker socket access
echo "Test 2: Simulating Docker socket access..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock alpine:latest sh -c "ls -la /var/run/docker.sock 2>/dev/null || echo 'Socket access blocked'"
sleep 2

# Test 3: Privileged operations
echo "Test 3: Simulating privileged operations..."
docker exec escape-test-target sh -c "mount 2>/dev/null || echo 'Mount operation blocked'"
sleep 2

echo "Attack simulation completed. Check Falco logs for detection results."
EOF

chmod +x $LAB_DIR/scripts/automation/simulate_attacks.sh

# Set ownership again
chown -R $LAB_USER:$LAB_USER $LAB_DIR

# Pull Docker images
cd $LAB_DIR
sudo -u $LAB_USER docker compose pull

# Start the lab
sudo -u $LAB_USER docker compose up -d

# Enable systemd service
systemctl daemon-reload
systemctl enable docker-escape-lab

# Wait for services to be ready
echo "Waiting for services to initialize..."
sleep 60

# Run initial tests
sudo -u $LAB_USER $LAB_DIR/scripts/automation/simulate_attacks.sh

# Create completion marker
echo "Lab deployment completed at $(date)" > /var/log/lab-deployment-complete.log

echo "Docker Escape Detection Lab deployment completed successfully!"
echo "Access Kibana at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):5601"
echo "Access Elasticsearch at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):9200"