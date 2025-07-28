# Complete Beginner Guide: Docker Runtime Escape Detection Lab

## What You're Building
You're creating a lab to detect when malicious Docker containers try to "escape" and access your host computer. This is a serious security threat where attackers break out of containers to compromise your entire system.

## Before You Start - What You Need

### 1. Administrative Credentials (What This Actually Means)
**On Windows:**
- You need to be logged in as an Administrator OR
- Your account needs to be in the "Administrators" group
- **How to check:** Press Windows + X, click "Computer Management", expand "Local Users and Groups", click "Users", double-click your username, click "Member Of" tab - you should see "Administrators"
- **If you don't have admin:** Ask your IT department or system owner for admin rights

**On macOS:**
- Your account needs admin privileges (can use `sudo` command)
- **How to check:** Open Terminal, type `sudo whoami` - if it asks for password and then shows "root", you have admin access
- **If you don't have admin:** Go to System Preferences > Users & Groups, your account should say "Admin" next to it

**On Linux:**
- Your account needs to be in the `sudo` group
- **How to check:** Open terminal, type `groups` - you should see "sudo" in the list
- **If you don't have admin:** Run `sudo usermod -aG sudo yourusername` (replace with your actual username)

### 2. Just-In-Time (JIT) Access (What This Actually Means)
This means you can get temporary elevated privileges when needed. In most cases, this is just your admin/sudo access working properly.

**Test your JIT access:**
- **Windows:** Try to run Command Prompt as Administrator
- **macOS/Linux:** Try running `sudo ls /root` - if it works after entering your password, you have JIT access

### 3. Multi-Factor Authentication Setup
**What this means:** You need MFA set up for your cloud accounts (AWS, Azure, etc.) if you're using cloud deployment.

**How to set this up:**
- **AWS:** Go to AWS Console > IAM > Users > Your User > Security Credentials > Multi-factor authentication (MFA)
- **Azure:** Go to Azure Portal > Azure Active Directory > Users > Your User > Authentication methods
- **Use Google Authenticator or Microsoft Authenticator app on your phone**

## Step-by-Step Lab Setup

### Phase 1: Prepare Your Computer (15 minutes)

#### Step 1.1: Install Docker Desktop
**Why:** Docker Desktop provides the container platform we'll monitor for escape attempts.

**Windows (Detailed Steps):**
1. Open your web browser
2. Go to https://docs.docker.com/desktop/install/windows/
3. Click "Docker Desktop for Windows" download button
4. Wait for `Docker Desktop Installer.exe` to download
5. Right-click the downloaded file, select "Run as administrator"
6. In the installer:
   - Check "Use WSL 2 instead of Hyper-V" (recommended)
   - Check "Add shortcut to desktop"
   - Click "Ok"
7. Wait for installation (5-10 minutes)
8. Restart your computer when prompted
9. After restart, Docker Desktop should auto-start
10. You'll see a whale icon in your system tray when it's ready

**macOS (Detailed Steps):**
1. Go to https://docs.docker.com/desktop/install/mac/
2. Download "Docker Desktop for Mac" (choose Intel or Apple Silicon based on your Mac)
3. Open the downloaded `.dmg` file
4. Drag the Docker.app to your Applications folder
5. Open Applications folder, double-click Docker.app
6. Click "Open" when macOS asks about opening downloaded app
7. Enter your password when prompted for system access
8. Wait for Docker to start (you'll see whale icon in menu bar)

**Linux Ubuntu (Detailed Steps):**
```bash
# Step 1: Open terminal (Ctrl+Alt+T)

# Step 2: Update your system
sudo apt update
sudo apt upgrade -y

# Step 3: Install prerequisites
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Step 4: Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Step 5: Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Step 6: Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Step 7: Add yourself to docker group (replace 'yourusername' with your actual username)
sudo usermod -aG docker yourusername

# Step 8: Log out and log back in for group changes to take effect
# Or run: su - yourusername
```

#### Step 1.2: Verify Docker Installation
**Test that Docker is working properly:**

**All Platforms:**
1. Open terminal/command prompt
2. Type: `docker --version`
3. **Expected output:** `Docker version 24.0.7, build afdd53b` (version numbers may vary)
4. Type: `docker run hello-world`
5. **Expected output:** Should download and run a test container, showing "Hello from Docker!"

**If you get errors:**
- **Windows:** Make sure Docker Desktop is running (whale icon in system tray)
- **macOS:** Make sure Docker Desktop is running (whale icon in menu bar)
- **Linux:** Run `sudo systemctl status docker` to check if Docker service is running

### Phase 2: Create the Monitoring Infrastructure (20 minutes)

#### Step 2.1: Create Project Directory
**Why:** We need a dedicated folder to organize all our lab files.

**All Platforms:**
```bash
# Create main project folder
mkdir docker-escape-lab
cd docker-escape-lab

# Create subfolders for organization
mkdir configs logs scripts data
```

#### Step 2.2: Set Up Container Monitoring
**Why:** We need monitoring tools to detect when containers try to escape.

**Create monitoring configuration:**
```bash
# Create docker-compose file for our lab
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
      - ./configs/falco_rules.yaml:/etc/falco/falco_rules_local.yaml
      - ./logs:/var/log/falco
    environment:
      - FALCO_GRPC_ENABLED=true
      - FALCO_GRPC_BIND_ADDRESS=0.0.0.0:5060
    ports:
      - "5060:5060"
    networks:
      - monitoring

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

  # Kibana for log visualization
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: docker-escape-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - monitoring

  # Vulnerable container for testing (intentionally vulnerable)
  vulnerable-container:
    image: alpine:latest
    container_name: escape-test-target
    command: sh -c "while true; do sleep 30; done"
    volumes:
      - /:/host-root:ro
    networks:
      - monitoring

volumes:
  elastic_data:

networks:
  monitoring:
    driver: bridge
EOF
```

#### Step 2.3: Create Falco Detection Rules
**Why:** Falco needs specific rules to detect container escape attempts.

```bash
# Create Falco rules for container escape detection
cat > configs/falco_rules.yaml << 'EOF'
# Container Escape Detection Rules

- rule: Container Escape via Privileged Mount
  desc: Detect container attempting to access host filesystem
  condition: >
    spawned_process and
    container and
    (proc.name in (sh, bash, dash, ash) or
     proc.name in (cat, ls, find, mount)) and
    (fd.name startswith /host-root or
     fd.name startswith /host or
     fd.name contains /proc/1/root or
     fd.name contains /etc/shadow or
     fd.name contains /etc/passwd)
  output: >
    Container escape attempt detected (proc=%proc.name pid=%proc.pid 
    container=%container.name image=%container.image.repository 
    file=%fd.name command=%proc.cmdline)
  priority: CRITICAL
  tags: [container, escape, privilege_escalation]

- rule: Docker Socket Access from Container
  desc: Detect container accessing Docker socket
  condition: >
    spawned_process and
    container and
    (fd.name=/var/run/docker.sock or
     fd.name=/host/var/run/docker.sock)
  output: >
    Container accessing Docker socket (proc=%proc.name pid=%proc.pid 
    container=%container.name image=%container.image.repository 
    command=%proc.cmdline)
  priority: CRITICAL
  tags: [container, escape, docker]

- rule: Container Privilege Escalation
  desc: Detect privilege escalation inside container
  condition: >
    spawned_process and
    container and
    proc.name in (sudo, su, newgrp) or
    (proc.args contains "--privileged" or
     proc.args contains "CAP_SYS_ADMIN")
  output: >
    Container privilege escalation attempt (proc=%proc.name pid=%proc.pid 
    container=%container.name command=%proc.cmdline)
  priority: HIGH
  tags: [container, privilege_escalation]

- rule: Sensitive File Access from Container
  desc: Detect container accessing sensitive host files
  condition: >
    open_read and
    container and
    (fd.name in (/etc/shadow, /etc/passwd, /etc/sudoers) or
     fd.name startswith /root/ or
     fd.name startswith /home/ or
     fd.name contains ssh_host)
  output: >
    Container accessing sensitive file (file=%fd.name proc=%proc.name 
    pid=%proc.pid container=%container.name)
  priority: HIGH
  tags: [container, file_access, sensitive]
EOF
```

#### Step 2.4: Start the Monitoring Environment
**Why:** We need to start all monitoring components before testing.

```bash
# Start all containers
docker-compose up -d

# Wait 30 seconds for everything to start
sleep 30

# Check that all containers are running
docker-compose ps

# Expected output: All containers should show "Up" status
```

**Verify each component:**
```bash
# Test Elasticsearch
curl http://localhost:9200
# Expected: JSON response with cluster information

# Test Falco (check logs)
docker logs docker-escape-falco

# Access Kibana (wait 2-3 minutes after starting)
# Open browser to: http://localhost:5601
```

### Phase 3: Set Up XSIAM Integration (25 minutes)

#### Step 3.1: Prepare XSIAM Connection
**Why:** XSIAM needs to receive our security alerts for centralized monitoring.

**Get your XSIAM details:**
1. Log into your XSIAM console
2. Go to Settings → API Keys
3. Create new API key with name "Docker-Escape-Lab"
4. Copy the API key (save it securely)
5. Note your XSIAM URL (e.g., https://your-tenant.xdr.us.paloaltonetworks.com)

**Create XSIAM configuration file:**
```bash
# Create XSIAM broker configuration
cat > configs/xsiam-broker.yaml << 'EOF'
# XSIAM Broker Configuration
broker:
  tenant_url: "https://your-tenant.xdr.us.paloaltonetworks.com"  # Replace with your XSIAM URL
  api_key: "YOUR_API_KEY_HERE"  # Replace with your actual API key
  
data_sources:
  - name: "falco-alerts"
    type: "json"
    source_path: "/var/log/falco/falco.log"
    parsing_rules:
      timestamp_field: "time"
      severity_field: "priority"
      message_field: "output"
      source_field: "rule"
    
  - name: "container-events"
    type: "docker-events"
    source_path: "/var/run/docker.sock"
    parsing_rules:
      timestamp_field: "timeNano"
      action_field: "Action"
      container_field: "Actor.Attributes.name"

forwarding:
  batch_size: 100
  flush_interval: 30s
  retry_attempts: 3
EOF

# IMPORTANT: Edit this file with your actual XSIAM details
echo "EDIT configs/xsiam-broker.yaml and replace YOUR_API_KEY_HERE and the tenant URL with your actual values"
```

#### Step 3.2: Install and Configure Log Forwarder
**Why:** We need to send our security alerts to XSIAM automatically.

```bash
# Download and install Filebeat for log forwarding
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-linux-x86_64.tar.gz
tar xzf filebeat-8.11.0-linux-x86_64.tar.gz
mv filebeat-8.11.0-linux-x86_64 filebeat

# Create Filebeat configuration for XSIAM
cat > filebeat/filebeat.yml << 'EOF'
# Filebeat configuration for XSIAM integration
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/docker-escape-lab/falco/*.log
  fields:
    log_type: falco_security
    environment: lab
  fields_under_root: true
  multiline.pattern: '^\{'
  multiline.negate: true
  multiline.match: after

- type: docker
  enabled: true
  containers.ids:
    - "*"
  containers.stream: "all"

processors:
- add_host_metadata:
    when.not.contains.tags: forwarded
- add_docker_metadata: ~

output.http:
  hosts: ["https://your-tenant.xdr.us.paloaltonetworks.com/logs/v1/"]  # Replace with your XSIAM URL
  headers:
    Authorization: "Bearer YOUR_API_KEY_HERE"  # Replace with your actual API key
    Content-Type: "application/json"
  compression_level: 1
  bulk_max_size: 50

logging.level: info
logging.to_files: true
logging.files:
  path: /var/log/docker-escape-lab/filebeat
  name: filebeat.log
  keepfiles: 7
  permissions: 0644
EOF

# IMPORTANT: Edit this file with your actual XSIAM details
echo "EDIT filebeat/filebeat.yml and replace YOUR_API_KEY_HERE and the tenant URL with your actual values"
```

#### Step 3.3: Start Log Forwarding
**Why:** Begin sending security data to XSIAM for analysis.

```bash
# Create log directories
mkdir -p logs/filebeat logs/falco

# Start Filebeat in background
cd filebeat
sudo ./filebeat -e -c filebeat.yml &
cd ..

# Check that Filebeat is running
ps aux | grep filebeat

# Check Filebeat logs
tail -f logs/filebeat/filebeat.log
```

### Phase 4: Test Container Escape Detection (30 minutes)

#### Step 4.1: Basic Escape Simulation
**Why:** We need to verify our detection system works by simulating real attack scenarios.

**Test 1: Host Filesystem Access**
```bash
# This simulates a container trying to access host files
docker exec -it escape-test-target sh -c "ls /host-root/"

# Expected: Falco should generate an alert about container escape attempt
# Check Falco logs:
docker logs docker-escape-falco | grep -i "escape"
```

**Test 2: Docker Socket Access**
```bash
# Create a container that tries to access Docker socket
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock alpine:latest sh -c "ls -la /var/run/docker.sock"

# Expected: Falco should alert about Docker socket access
docker logs docker-escape-falco | grep -i "docker.sock"
```

**Test 3: Privileged Operations**
```bash
# Test privilege escalation detection
docker exec -it escape-test-target sh -c "echo 'attempting privilege escalation' && whoami"

# Try to access sensitive files
docker exec -it escape-test-target sh -c "cat /host-root/etc/passwd 2>/dev/null || echo 'Access denied'"

# Check alerts
docker logs docker-escape-falco | tail -10
```

#### Step 4.2: Verify Alert Generation
**Why:** Confirm that our security events are being detected and logged properly.

```bash
# Check all Falco alerts
docker logs docker-escape-falco | grep -E "(CRITICAL|HIGH)" | tail -20

# Check Elasticsearch for stored alerts
curl "http://localhost:9200/_search?q=priority:CRITICAL&pretty"

# View in Kibana
echo "Open http://localhost:5601 in your browser"
echo "Go to Discover tab and search for: priority:CRITICAL"
```

#### Step 4.3: Validate XSIAM Integration
**Why:** Ensure our alerts are reaching XSIAM for centralized security monitoring.

**Check XSIAM console:**
1. Log into your XSIAM tenant
2. Go to Investigation → Query Builder
3. Run this query to find your lab alerts:
```sql
dataset = "logs" 
| where log_type = "falco_security"
| where priority in ("CRITICAL", "HIGH")
| sort by _time desc
```

**Verify data ingestion:**
```bash
# Test XSIAM API connectivity
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     "https://your-tenant.xdr.us.paloaltonetworks.com/public_api/v1/healthcheck"

# Expected: {"status": "ok"}
```

### Phase 5: Create Monitoring Dashboard (20 minutes)

#### Step 5.1: Set Up Kibana Dashboard
**Why:** Visual dashboards help analysts quickly identify threats.

1. **Open Kibana:** http://localhost:5601
2. **Create Index Pattern:**
   - Go to Stack Management → Index Patterns
   - Click "Create index pattern"
   - Enter pattern: `logstash-*` or `filebeat-*`
   - Select timestamp field: `@timestamp`
   - Click "Create"

3. **Create Visualizations:**
   - Go to Visualize Library → Create visualization
   - Choose "Lens" for easy drag-and-drop
   - Create these charts:
     - **Alert Count by Priority:** Bar chart showing CRITICAL vs HIGH alerts
     - **Container Activity Timeline:** Line chart showing events over time
     - **Top Containers by Alerts:** Data table showing which containers trigger most alerts

4. **Build Dashboard:**
   - Go to Dashboard → Create new dashboard
   - Add your visualizations
   - Save as "Docker Escape Detection Dashboard"

#### Step 5.2: Configure XSIAM Dashboards
**Why:** Centralized monitoring in XSIAM provides enterprise-wide visibility.

**In XSIAM Console:**
1. Go to Dashboards → Create New Dashboard
2. Name: "Docker Runtime Escape Monitoring"
3. Add widgets:
   - **Alert Volume Widget:** Shows alert trends over time
   - **Top Threats Widget:** Lists most critical container events
   - **Container Inventory Widget:** Shows all monitored containers
   - **Response Actions Widget:** Tracks investigation and response activities

### Phase 6: Automated Response Setup (25 minutes)

#### Step 6.1: Create Response Scripts
**Why:** Automated responses help contain threats immediately when detected.

```bash
# Create response script directory
mkdir -p scripts/response

# Container isolation script
cat > scripts/response/isolate_container.sh << 'EOF'
#!/bin/bash
# Automatically isolate suspicious container

CONTAINER_ID=$1
ALERT_PRIORITY=$2

if [ -z "$CONTAINER_ID" ]; then
    echo "Usage: $0 <container_id> <priority>"
    exit 1
fi

echo "$(date): Isolating container $CONTAINER_ID due to $ALERT_PRIORITY priority alert"

# Stop container networking
docker network disconnect bridge $CONTAINER_ID 2>/dev/null

# Stop the container
docker stop $CONTAINER_ID

# Create forensic snapshot
docker commit $CONTAINER_ID forensic-snapshot-$(date +%Y%m%d-%H%M%S)

# Log the action
echo "$(date): Container $CONTAINER_ID isolated and snapshot created" >> logs/response_actions.log

# Send notification to XSIAM
curl -X POST \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"timestamp\": \"$(date -Iseconds)\", \"action\": \"container_isolated\", \"container_id\": \"$CONTAINER_ID\", \"priority\": \"$ALERT_PRIORITY\"}" \
     "https://your-tenant.xdr.us.paloaltonetworks.com/logs/v1/"
EOF

chmod +x scripts/response/isolate_container.sh
```

#### Step 6.2: Configure Automated Alerts
**Why:** Immediate notification helps security teams respond quickly to threats.

```bash
# Email notification script
cat > scripts/response/send_alert.sh << 'EOF'
#!/bin/bash
# Send email alerts for critical container events

ALERT_MESSAGE=$1
PRIORITY=$2

# Configure your email settings here
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
EMAIL_TO="security-team@yourcompany.com"
EMAIL_FROM="docker-lab@yourcompany.com"

# Send email (requires mail utility)
echo "CRITICAL: Docker Container Escape Detected
Priority: $PRIORITY
Details: $ALERT_MESSAGE
Time: $(date)
Lab: Docker Runtime Escape Detection
Action Required: Investigate immediately" | mail -s "SECURITY ALERT: Container Escape" $EMAIL_TO

# Log the notification
echo "$(date): Alert sent - Priority: $PRIORITY" >> logs/notifications.log
EOF

chmod +x scripts/response/send_alert.sh
```

### Phase 7: Testing and Validation (30 minutes)

#### Step 7.1: Comprehensive Escape Testing
**Why:** Thorough testing ensures our detection system catches all escape methods.

```bash
# Test Suite 1: Volume Mount Escapes
docker run --rm -v /:/host alpine:latest sh -c "echo 'Testing volume mount escape' && ls /host/etc/"

# Test Suite 2: Privileged Container Escapes
docker run --rm --privileged alpine:latest sh -c "echo 'Testing privileged escape' && fdisk -l"

# Test Suite 3: Docker Socket Manipulation
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock alpine:latest sh -c "echo 'Testing socket access'"

# Test Suite 4: Process Namespace Escape
docker run --rm --pid=host alpine:latest sh -c "echo 'Testing PID namespace escape' && ps aux"

# Check all generated alerts
docker logs docker-escape-falco | grep -E "(CRITICAL|HIGH)" | tail -50
```

#### Step 7.2: Response System Testing
**Why:** Verify that automated responses work when threats are detected.

```bash
# Test container isolation
./scripts/response/isolate_container.sh escape-test-target CRITICAL

# Verify container is stopped
docker ps | grep escape-test-target

# Check response logs
cat logs/response_actions.log

# Test notification system
./scripts/response/send_alert.sh "Test alert from Docker escape lab" HIGH
```

#### Step 7.3: XSIAM Validation
**Why:** Confirm all security data is properly integrated with XSIAM.

**Final XSIAM Verification:**
1. Login to XSIAM console
2. Run query to see all lab events:
```sql
dataset = "logs"
| where source contains "docker-escape-lab"
| stats count by priority, rule
| sort by count desc
```

3. Verify alert counts match your test activities
4. Check that automated response logs appear in XSIAM

## Troubleshooting Common Issues

### Docker Issues
**Problem:** "Cannot connect to Docker daemon"
**Solution:**
```bash
# Check if Docker is running
sudo systemctl status docker

# Start Docker if stopped
sudo systemctl start docker

# Add yourself to docker group (Linux)
sudo usermod -aG docker $USER
# Then log out and back in
```

### Falco Issues
**Problem:** Falco not detecting events
**Solution:**
```bash
# Check Falco logs for errors
docker logs docker-escape-falco

# Verify Falco rules are loaded
docker exec docker-escape-falco falco --list

# Test with manual trigger
docker exec escape-test-target cat /etc/passwd
```

### XSIAM Integration Issues
**Problem:** Logs not appearing in XSIAM
**Solution:**
```bash
# Test API connectivity
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://your-tenant.xdr.us.paloaltonetworks.com/public_api/v1/healthcheck"

# Check Filebeat logs
tail -f logs/filebeat/filebeat.log

# Verify log format
head -5 logs/falco/falco.log | python3 -m json.tool
```

## Success Criteria Checklist

- [ ] Docker Desktop installed and running
- [ ] All monitoring containers (Falco, Elasticsearch, Kibana) started successfully
- [ ] Falco generating alerts for container escape attempts
- [ ] Kibana dashboard showing security events
- [ ] XSIAM receiving and parsing lab security data
- [ ] Automated response scripts working
- [ ] Test escape scenarios triggering appropriate alerts
- [ ] Email notifications functioning
- [ ] All components properly integrated

## Next Steps

After completing this lab:
1. Deploy similar monitoring to production container environments
2. Customize Falco rules for your specific threats
3. Integrate with existing SIEM/SOAR workflows
4. Train security team on container escape detection
5. Develop incident response playbooks for container threats

## Support and Documentation

- **Falco Documentation:** https://falco.org/docs/
- **Docker Security:** https://docs.docker.com/engine/security/
- **XSIAM Integration Guide:** https://docs.paloaltonetworks.com/cortex/cortex-xdr
- **Lab Support:** Contact your security team or system administrator

Remember to save your configuration files and document any customizations for future reference.