# Beginner's Complete Infrastructure Setup Guide

## Overview
This guide provides step-by-step instructions for setting up threat detection lab infrastructure. Each step includes detailed commands, expected outputs, and troubleshooting tips.

## Prerequisites Check
Before beginning, verify you have:
- [ ] Administrative access to your computer/server
- [ ] Internet connection
- [ ] At least 8GB RAM available
- [ ] 50GB free disk space
- [ ] Access to cloud account (if using cloud deployment)

## Option 1: Local Docker Setup (Recommended for Beginners)

### Step 1: Install Docker Desktop
**Windows:**
1. Download Docker Desktop from https://docker.com/products/docker-desktop
2. Run the installer as Administrator
3. Follow installation wizard (accept defaults)
4. Restart computer when prompted
5. Open Docker Desktop and complete setup

**macOS:**
1. Download Docker Desktop for Mac
2. Drag Docker.app to Applications folder
3. Launch Docker from Applications
4. Allow system permissions when prompted
5. Wait for Docker to start (whale icon in menu bar)

**Linux (Ubuntu/Debian):**
```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in for group changes to take effect
```

### Step 2: Verify Docker Installation
```bash
# Check Docker version
docker --version
# Expected output: Docker version 24.x.x, build xxxxx

# Test Docker with hello-world
docker run hello-world
# Expected output: "Hello from Docker!" message
```

### Step 3: Deploy Security Lab Environment
```bash
# Create project directory
mkdir threat-detection-lab
cd threat-detection-lab

# Create docker-compose.yml file
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  # Elastic Stack for Log Management
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: threat-lab-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - threat-lab

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: threat-lab-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - threat-lab

  # Security Tools
  suricata:
    image: jasonish/suricata:latest
    container_name: threat-lab-suricata
    network_mode: host
    cap_add:
      - NET_ADMIN
    volumes:
      - ./suricata-config:/etc/suricata
      - suricata_logs:/var/log/suricata
    command: suricata -c /etc/suricata/suricata.yaml -i any

  # Vulnerable Web Application for Testing
  dvwa:
    image: vulnerables/web-dvwa
    container_name: threat-lab-dvwa
    ports:
      - "8080:80"
    networks:
      - threat-lab

  # Attack Simulation Tools
  metasploitable:
    image: tleemcjr/metasploitable2
    container_name: threat-lab-target
    ports:
      - "2222:22"
      - "8081:80"
    networks:
      - threat-lab

volumes:
  elasticsearch_data:
  suricata_logs:

networks:
  threat-lab:
    driver: bridge
EOF

# Start the lab environment
docker-compose up -d

# Check all containers are running
docker-compose ps
```

### Step 4: Verify Lab Deployment
```bash
# Check container status
docker-compose ps
# All containers should show "Up" status

# Test Elasticsearch
curl http://localhost:9200
# Expected: JSON response with cluster information

# Test Kibana (wait 2-3 minutes for startup)
curl http://localhost:5601
# Expected: HTML response or redirect

# Check logs if any container fails
docker-compose logs [container-name]
```

### Step 5: Configure Basic Monitoring
```bash
# Create basic Suricata configuration
mkdir -p suricata-config
cat > suricata-config/suricata.yaml << 'EOF'
%YAML 1.1
---
vars:
  address-groups:
    HOME_NET: "[192.168.0.0/16,10.0.0.0/8,172.16.0.0/12]"
    EXTERNAL_NET: "!$HOME_NET"

default-log-dir: /var/log/suricata/

outputs:
  - eve-log:
      enabled: yes
      filetype: regular
      filename: eve.json
      types:
        - alert
        - http
        - dns
        - tls

rule-files:
  - suricata.rules

default-rule-path: /var/lib/suricata/rules
rule-files:
  - "*.rules"
EOF

# Restart Suricata with new config
docker-compose restart suricata
```

## Option 2: Cloud Deployment (AWS)

### Step 1: Setup AWS CLI
```bash
# Install AWS CLI (Linux/macOS)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Configure AWS credentials
aws configure
# Enter your Access Key ID, Secret Access Key, Region (us-east-1), and format (json)

# Verify configuration
aws sts get-caller-identity
```

### Step 2: Deploy EC2 Infrastructure
```bash
# Create key pair for SSH access
aws ec2 create-key-pair --key-name threat-lab-key --query 'KeyMaterial' --output text > threat-lab-key.pem
chmod 400 threat-lab-key.pem

# Create security group
aws ec2 create-security-group \
    --group-name threat-lab-sg \
    --description "Security group for threat detection lab"

# Get security group ID
SG_ID=$(aws ec2 describe-security-groups --group-names threat-lab-sg --query 'SecurityGroups[0].GroupId' --output text)

# Add inbound rules
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 5601 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id $SG_ID --protocol tcp --port 9200 --cidr 0.0.0.0/0
```

### Step 3: Launch EC2 Instance
```bash
# Launch Ubuntu instance
aws ec2 run-instances \
    --image-id ami-0c02fb55956c7d316 \
    --count 1 \
    --instance-type t3.large \
    --key-name threat-lab-key \
    --security-group-ids $SG_ID \
    --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=threat-lab-main}]'

# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances --filters "Name=tag:Name,Values=threat-lab-main" --query 'Reservations[0].Instances[0].InstanceId' --output text)

# Wait for instance to be running
aws ec2 wait instance-running --instance-ids $INSTANCE_ID

# Get public IP
PUBLIC_IP=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

echo "Instance is ready! Connect with: ssh -i threat-lab-key.pem ubuntu@$PUBLIC_IP"
```

### Step 4: Setup Lab Environment on EC2
```bash
# Connect to the instance
ssh -i threat-lab-key.pem ubuntu@$PUBLIC_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for docker group changes
exit
ssh -i threat-lab-key.pem ubuntu@$PUBLIC_IP

# Deploy lab environment (use same docker-compose.yml from local setup)
# ... copy the docker-compose.yml content and run docker-compose up -d
```

## Option 3: On-Premises VM Setup

### Step 1: Install VirtualBox/VMware
**VirtualBox (Free):**
1. Download from https://www.virtualbox.org/wiki/Downloads
2. Install with default settings
3. Download Ubuntu Server 22.04 LTS ISO

**VMware Workstation/Fusion:**
1. Install VMware software
2. Download Ubuntu Server 22.04 LTS ISO

### Step 2: Create Virtual Machines
```bash
# VM Specifications for Lab:
# - Main Lab Server: 4 CPU, 8GB RAM, 100GB disk
# - Target System: 2 CPU, 4GB RAM, 50GB disk
# - Attacker System: 2 CPU, 4GB RAM, 50GB disk
```

**Create Main Lab Server VM:**
1. Click "New" in VirtualBox/VMware
2. Name: "Threat-Lab-Main"
3. Type: Linux, Version: Ubuntu (64-bit)
4. Memory: 8192 MB
5. Create virtual hard disk: 100 GB
6. Mount Ubuntu ISO and start installation
7. Follow Ubuntu installation wizard
8. Create user account: labadmin
9. Install OpenSSH server when prompted

### Step 3: Network Configuration
```bash
# After VM installation, configure static IP
sudo nano /etc/netplan/00-installer-config.yaml

# Add configuration:
network:
  ethernets:
    enp0s3:
      dhcp4: false
      addresses:
        - 192.168.100.100/24
      gateway4: 192.168.100.1
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
  version: 2

# Apply network configuration
sudo netplan apply

# Verify connectivity
ping -c 4 8.8.8.8
```

### Step 4: Install Lab Software
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (same commands as cloud setup)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker labadmin

# Install additional tools
sudo apt install -y htop iftop tcpdump wireshark-common

# Deploy lab environment using docker-compose
# (same as previous sections)
```

## XSIAM Integration Setup

### Step 1: Prepare XSIAM Connection
```bash
# Install required tools for XSIAM integration
sudo apt install -y python3-pip
pip3 install requests pyyaml

# Create XSIAM configuration directory
mkdir -p ~/.xsiam-config

# Create broker configuration
cat > ~/.xsiam-config/broker.yaml << 'EOF'
xsiam:
  url: "https://your-tenant.xdr.us.paloaltonetworks.com"
  api_key: "YOUR_API_KEY_HERE"
  
data_sources:
  - name: "suricata-alerts"
    type: "json"
    path: "/var/log/suricata/eve.json"
    parsing_rules:
      timestamp_field: "timestamp"
      severity_field: "alert.severity"
      message_field: "alert.signature"
      
  - name: "system-logs"
    type: "syslog"
    path: "/var/log/syslog"
    facility: "local0"
EOF
```

### Step 2: Configure Log Forwarding
```bash
# Install Filebeat for log forwarding
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-amd64.deb
sudo dpkg -i filebeat-8.11.0-amd64.deb

# Configure Filebeat for XSIAM
sudo nano /etc/filebeat/filebeat.yml

# Add XSIAM output configuration:
output.http:
  hosts: ["https://your-tenant.xdr.us.paloaltonetworks.com/logs/v1/"]
  headers:
    Authorization: "Bearer YOUR_API_KEY"
    Content-Type: "application/json"

# Start Filebeat
sudo systemctl enable filebeat
sudo systemctl start filebeat

# Verify log forwarding
sudo systemctl status filebeat
sudo tail -f /var/log/filebeat/filebeat
```

### Step 3: Validate Data Ingestion
```bash
# Test XSIAM API connectivity
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "https://your-tenant.xdr.us.paloaltonetworks.com/public_api/v1/healthcheck"

# Send test event
curl -X POST \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"timestamp": "2025-01-27T20:00:00Z", "event_type": "test", "message": "Lab setup validation"}' \
     "https://your-tenant.xdr.us.paloaltonetworks.com/logs/v1/"
```

## Testing & Validation

### Step 1: Generate Test Events
```bash
# Test network scanning detection
nmap -sS -p 1-1000 localhost

# Test web application attacks
curl "http://localhost:8080/vulnerabilities/sqli/?id=1' OR '1'='1-- -&Submit=Submit"

# Test file system monitoring
echo "test malware signature" > /tmp/malware-test.txt
```

### Step 2: Verify Log Generation
```bash
# Check Suricata alerts
tail -f /var/log/suricata/eve.json | grep alert

# Check system logs
tail -f /var/log/syslog | grep -i security

# Check container logs
docker-compose logs -f suricata
```

### Step 3: Validate XSIAM Data
1. Log into your XSIAM console
2. Navigate to Data Sources → Brokers
3. Verify broker connectivity status
4. Check recent log ingestion volume
5. Run test query to validate data parsing

## Troubleshooting Guide

### Common Issues and Solutions

**Docker containers not starting:**
```bash
# Check system resources
free -h
df -h

# Check Docker daemon
sudo systemctl status docker
sudo systemctl restart docker

# Check container logs
docker-compose logs [container-name]
```

**Network connectivity issues:**
```bash
# Check network configuration
ip addr show
ip route show

# Test DNS resolution
nslookup google.com

# Check firewall rules
sudo ufw status
sudo iptables -L
```

**XSIAM integration problems:**
```bash
# Verify API key
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://your-tenant.xdr.us.paloaltonetworks.com/public_api/v1/healthcheck"

# Check broker logs
tail -f /var/log/xsiam-broker/broker.log

# Validate log format
head -n 5 /var/log/suricata/eve.json | python3 -m json.tool
```

**Performance issues:**
```bash
# Monitor system resources
htop
iotop -ao

# Check container resource usage
docker stats

# Optimize memory settings
# Edit docker-compose.yml and adjust memory limits
```

## Next Steps

After completing this setup:
1. Proceed to Data Source Integration guide
2. Configure specific detection rules
3. Test attack simulations
4. Validate XSIAM content generation
5. Deploy production monitoring

## Support Resources

- Docker Documentation: https://docs.docker.com/
- XSIAM Admin Guide: https://docs.paloaltonetworks.com/cortex/cortex-xdr
- Ubuntu Server Guide: https://ubuntu.com/server/docs
- Security Tools Documentation: Links in respective tool sections

Remember to document your specific configuration for future reference and team collaboration.