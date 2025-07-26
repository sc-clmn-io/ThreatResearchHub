#!/bin/bash
# Ubuntu Security Lab User Data Script

# Variables from Terraform template
LAB_NAME="${lab_name}"
REGION="${region}"
S3_BUCKET="${s3_bucket}"
LOG_GROUP="${log_group}"

echo "🚀 Starting Ubuntu Security Lab setup for $LAB_NAME in $REGION"

# Update system
apt-get update && apt-get upgrade -y

# Install essential tools
apt-get install -y \
    curl wget git vim \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    unzip \
    htop \
    nmap \
    wireshark-common \
    tcpdump \
    netcat \
    auditd \
    rsyslog \
    fail2ban \
    python3 \
    python3-pip \
    nodejs \
    npm \
    docker.io \
    docker-compose

# Start and enable services
systemctl start docker
systemctl enable docker
systemctl start auditd
systemctl enable auditd

# Create lab user
useradd -m -s /bin/bash -G docker,sudo labuser
echo "labuser:SecurityLab123!" | chpasswd

# Create lab directory structure
LAB_DIR="/opt/security-lab"
mkdir -p $LAB_DIR/{workspace,logs,scripts,configs,tools,scans}
chown -R labuser:labuser $LAB_DIR

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf aws awscliv2.zip

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
dpkg -i amazon-cloudwatch-agent.deb
rm amazon-cloudwatch-agent.deb

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/syslog",
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/syslog"
                    },
                    {
                        "file_path": "/var/log/auth.log",
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/auth"
                    },
                    {
                        "file_path": "/var/log/audit/audit.log",
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/audit"
                    },
                    {
                        "file_path": "$LAB_DIR/logs/*.log",
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/lab"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "SecurityLab",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "diskio": {
                "measurement": ["io_time"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": ["tcp_established", "tcp_time_wait"],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": ["swap_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Install Node.js security tools
npm install -g \
    snyk \
    audit-ci \
    retire \
    nsp \
    eslint \
    semgrep \
    @cyclonedx/cli

# Install Python security tools
pip3 install \
    bandit \
    safety \
    semgrep \
    checkov \
    pip-audit

# Configure audit daemon
cat > /etc/audit/rules.d/security-lab.rules << 'EOF'
# Security Lab Audit Rules
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k identity

-w /bin/su -p x -k privilege-escalation
-w /usr/bin/sudo -p x -k privilege-escalation
-w /etc/sudoers -p rwa -k privilege-escalation

-w /sbin/insmod -p x -k modules
-w /sbin/rmmod -p x -k modules
-w /sbin/modprobe -p x -k modules

-w /var/log/wtmp -p wa -k session
-w /var/log/btmp -p wa -k session
-w /var/run/utmp -p wa -k session

-w /etc/ssh/sshd_config -k sshd
EOF

# Restart auditd
systemctl restart auditd

# Configure fail2ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
ignoreip = 127.0.0.1/8 ::1
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl restart fail2ban

# Create Docker Compose file for lab services
cat > $LAB_DIR/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Node.js Security Testing Environment
  nodejs-lab:
    image: node:18-ubuntu
    container_name: nodejs-security-lab
    ports:
      - "3000:3000"
      - "9229:9229"
    volumes:
      - ./workspace:/workspace
      - ./logs:/var/log/lab
    working_dir: /workspace
    environment:
      - NODE_ENV=development
      - LAB_MODE=security-testing
    command: tail -f /dev/null

  # OWASP ZAP Security Scanner
  zap:
    image: owasp/zap2docker-stable
    container_name: security-zap
    ports:
      - "8080:8080"
    volumes:
      - ./scans:/zap/wrk
    command: zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true

  # Nginx reverse proxy
  nginx:
    image: nginx:alpine
    container_name: lab-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./configs/nginx.conf:/etc/nginx/nginx.conf
      - ./workspace:/var/www/html
    depends_on:
      - nodejs-lab

  # Redis for caching and sessions
  redis:
    image: redis:alpine
    container_name: lab-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  # PostgreSQL database
  postgres:
    image: postgres:15
    container_name: lab-postgres
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: security_lab
      POSTGRES_USER: labuser
      POSTGRES_PASSWORD: SecurityLab123!
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  redis_data:
  postgres_data:
EOF

# Create nginx configuration
mkdir -p $LAB_DIR/configs
cat > $LAB_DIR/configs/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream nodejs_app {
        server nodejs-lab:3000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://nodejs_app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create lab startup script
cat > $LAB_DIR/scripts/start-lab.sh << 'EOF'
#!/bin/bash
# Security Lab Startup Script

echo "🚀 Starting Security Lab Environment..."

cd /opt/security-lab

# Start Docker services
docker-compose up -d

echo "📊 Lab Services Status:"
docker-compose ps

echo ""
echo "🌐 Access Points:"
echo "   • Lab Application:    http://$(curl -s ifconfig.me):80"
echo "   • OWASP ZAP:         http://$(curl -s ifconfig.me):8080"
echo "   • Node.js Debug:     localhost:9229"

echo ""
echo "🔍 Available Commands:"
echo "   • docker-compose logs -f [service]  # View logs"
echo "   • docker exec -it nodejs-security-lab bash  # Connect to Node.js lab"
echo "   • docker exec -it lab-postgres psql -U labuser -d security_lab  # Connect to database"

echo ""
echo "✅ Security Lab Ready!"
EOF

chmod +x $LAB_DIR/scripts/start-lab.sh

# Create vulnerability scanning script
cat > $LAB_DIR/scripts/scan-vulnerabilities.sh << 'EOF'
#!/bin/bash
# Vulnerability Scanning Script

echo "🔍 Running Security Vulnerability Scan..."

RESULTS_DIR="/opt/security-lab/scans/$(date +%Y%m%d_%H%M%S)"
mkdir -p $RESULTS_DIR

echo "📊 System Information Gathering..."
# System info
uname -a > $RESULTS_DIR/system-info.txt
lsb_release -a >> $RESULTS_DIR/system-info.txt
uptime >> $RESULTS_DIR/system-info.txt

# Installed packages
dpkg -l > $RESULTS_DIR/installed-packages.txt

# Running processes
ps aux > $RESULTS_DIR/running-processes.txt

# Network connections
netstat -tuln > $RESULTS_DIR/network-connections.txt
ss -tuln >> $RESULTS_DIR/network-connections.txt

# Open ports
nmap -sT -O localhost > $RESULTS_DIR/port-scan.txt

echo "🐍 Python Security Scan..."
# Python security checks
bandit -r /opt/security-lab/workspace -f json -o $RESULTS_DIR/bandit-results.json 2>/dev/null || echo "No Python files found"

echo "📦 Node.js Security Scan..."
# Node.js security checks
cd /opt/security-lab/workspace
npm audit --json > $RESULTS_DIR/npm-audit.json 2>/dev/null || echo "No package.json found"
retire --js --outputformat json --outputpath $RESULTS_DIR/retire-results.json 2>/dev/null || echo "Retire scan skipped"

echo "🔒 Docker Security Scan..."
# Docker security
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.ID}}\t{{.Size}}" > $RESULTS_DIR/docker-images.txt

# Scan running containers
for container in $(docker ps --format "{{.Names}}"); do
    echo "Scanning container: $container"
    docker exec $container apt list --installed > $RESULTS_DIR/container-$container-packages.txt 2>/dev/null || echo "Package list unavailable for $container"
done

echo "🏁 Security scan completed!"
echo "Results saved to: $RESULTS_DIR"

# Upload results to S3 if configured
if [ -n "$S3_BUCKET" ]; then
    echo "📤 Uploading results to S3..."
    aws s3 cp $RESULTS_DIR s3://$S3_BUCKET/scans/$(basename $RESULTS_DIR)/ --recursive
fi
EOF

chmod +x $LAB_DIR/scripts/scan-vulnerabilities.sh

# Create system monitoring script
cat > $LAB_DIR/scripts/monitor-system.sh << 'EOF'
#!/bin/bash
# System Monitoring Script

echo "📊 Security Lab System Monitor"
echo "============================="

echo ""
echo "🖥️  System Information:"
echo "   • Hostname: $(hostname)"
echo "   • Uptime: $(uptime -p)"
echo "   • Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "   • Disk Usage: $(df -h / | awk 'NR==2{printf "%s/%s (%s)\n", $3,$2,$5}')"
echo "   • Memory Usage: $(free -h | awk 'NR==2{printf "%s/%s (%.2f%%)\n", $3,$2,$3*100/$2 }')"

echo ""
echo "🐳 Docker Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "🔍 Recent Security Events:"
tail -5 /var/log/auth.log | while read line; do
    echo "   $line"
done

echo ""
echo "📈 Network Connections:"
netstat -tuln | grep LISTEN | head -10 | while read line; do
    echo "   $line"
done

# Log to file
echo "$(date): System monitoring completed" >> /opt/security-lab/logs/monitoring.log
EOF

chmod +x $LAB_DIR/scripts/monitor-system.sh

# Create cron job for monitoring
cat > /etc/cron.d/security-lab-monitoring << 'EOF'
# Security Lab Monitoring
*/5 * * * * root /opt/security-lab/scripts/monitor-system.sh >> /opt/security-lab/logs/monitoring.log 2>&1
EOF

# Create systemd service for lab
cat > /etc/systemd/system/security-lab.service << 'EOF'
[Unit]
Description=Security Lab Environment
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/opt/security-lab/scripts/start-lab.sh
ExecStop=/usr/bin/docker-compose -f /opt/security-lab/docker-compose.yml down
WorkingDirectory=/opt/security-lab
User=root

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable security-lab.service

# Create README file
cat > $LAB_DIR/README.md << 'EOF'
# Ubuntu Security Lab Environment

This Ubuntu Security Lab has been configured for comprehensive security testing and analysis.

## 🛠️ Installed Tools

### System Tools
- Docker and Docker Compose
- AWS CLI v2
- CloudWatch Agent
- Audit Daemon (auditd)
- Fail2ban

### Security Tools
- OWASP ZAP (Web Application Security Scanner)
- Nmap (Network Discovery)
- Wireshark/tcpdump (Network Analysis)
- Bandit (Python Security Linter)
- Safety (Python Dependency Scanner)
- Snyk (Multi-language Security Scanner)
- npm audit (Node.js Security Scanner)
- Retire.js (JavaScript Library Scanner)
- Semgrep (Static Analysis)

### Development Tools
- Node.js 18 with npm
- Python 3 with pip
- Git, vim, build tools

## 📊 Services Running

The lab environment includes several containerized services:

- **Node.js Lab**: Development and testing environment (port 3000)
- **OWASP ZAP**: Web application security scanner (port 8080)
- **Nginx**: Reverse proxy and web server (port 80)
- **Redis**: Caching and session storage (port 6379)
- **PostgreSQL**: Database for testing (port 5432)

## 🚀 Getting Started

1. **Start the lab environment:**
   ```bash
   sudo /opt/security-lab/scripts/start-lab.sh
   ```

2. **Check service status:**
   ```bash
   cd /opt/security-lab
   docker-compose ps
   ```

3. **Connect to Node.js lab:**
   ```bash
   docker exec -it nodejs-security-lab bash
   ```

4. **Run vulnerability scan:**
   ```bash
   sudo /opt/security-lab/scripts/scan-vulnerabilities.sh
   ```

5. **Monitor system:**
   ```bash
   sudo /opt/security-lab/scripts/monitor-system.sh
   ```

## 📁 Directory Structure

- `/opt/security-lab/workspace/` - Development workspace
- `/opt/security-lab/logs/` - Application and system logs
- `/opt/security-lab/scripts/` - Automation scripts
- `/opt/security-lab/configs/` - Configuration files
- `/opt/security-lab/scans/` - Vulnerability scan results

## 🔍 Security Features

- **Audit Logging**: Comprehensive system activity monitoring
- **Fail2ban**: Automatic IP blocking for failed attempts
- **CloudWatch Integration**: AWS monitoring and logging
- **Container Isolation**: Services run in isolated Docker containers
- **Network Monitoring**: Real-time network connection tracking

## 🌐 Access Points

After deployment, access the lab services:

- Lab Application: http://[instance-ip]:80
- OWASP ZAP: http://[instance-ip]:8080
- Direct Node.js: http://[instance-ip]:3000

## ⚠️ Important Notes

- This is a TESTING environment - keep isolated from production
- Default credentials are configured for lab use only
- All activities are logged and monitored
- Run scans responsibly and only on designated targets

## 🆘 Troubleshooting

- **Services not starting:** Check Docker daemon with `systemctl status docker`
- **Port conflicts:** Verify no other services using ports 80, 3000, 8080
- **Permission issues:** Ensure scripts have execute permissions
- **Network issues:** Check security groups allow inbound traffic

Happy testing! 🎓
EOF

# Set proper ownership
chown -R labuser:labuser $LAB_DIR

# Create motd
cat > /etc/motd << 'EOF'

██████████████████████████████████████████████████████████████████████████████
█                                                                            █
█  🔒 SECURITY LAB ENVIRONMENT                                                █
█                                                                            █
█  📍 Lab Directory: /opt/security-lab                                        █
█  🚀 Start Lab:     sudo /opt/security-lab/scripts/start-lab.sh             █
█  📊 Monitor:       sudo /opt/security-lab/scripts/monitor-system.sh        █  
█  🔍 Scan:          sudo /opt/security-lab/scripts/scan-vulnerabilities.sh  █
█                                                                            █
█  🌐 Access the lab at: http://$(curl -s ifconfig.me):80                     █
█                                                                            █
██████████████████████████████████████████████████████████████████████████████

EOF

# Final logging
echo "$(date): Ubuntu Security Lab setup completed for $LAB_NAME" >> $LAB_DIR/logs/setup.log

# Start the lab environment
systemctl start security-lab.service

echo "✅ Ubuntu Security Lab Setup Complete!"
echo ""
echo "📍 Lab Location: $LAB_DIR"
echo "🌐 Access URL: http://$(curl -s ifconfig.me):80"
echo "🚀 Start Command: sudo $LAB_DIR/scripts/start-lab.sh"
echo ""
echo "Lab environment is ready for security testing!"