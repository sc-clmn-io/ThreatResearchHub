# Complete Implementation Guide: Container Escape Detection in XSIAM

**Target Audience**: Security analysts implementing container escape detection from zero infrastructure

**Time Required**: 4-6 hours across 6 stages

**Prerequisites**: 
- Access to XSIAM V3.1 instance 
- Linux systems running Docker containers
- Administrative access to container hosts

---

## Stage 1: Define Security Outcome (30 minutes)

### What We're Building
We're creating detection for **Docker container runtime escape** - when attackers break out of containers to compromise the host system.

### Why This Matters
- Container escapes can lead to full host compromise
- Attackers use privileged containers, namespace manipulation, and filesystem breakouts
- Without detection, escapes go unnoticed for weeks

### Success Criteria
- Detect privileged container abuse
- Identify namespace manipulation (nsenter attacks)
- Catch filesystem path traversal attempts
- Alert within 15 minutes of escape attempt

---

## Stage 2: Infrastructure Planning (45 minutes)

### Required Infrastructure

#### Container Host Requirements
- **Minimum**: 1 Linux server running Docker
- **Recommended**: 2-3 Linux hosts with containers
- **Specifications**: 4GB RAM, 2 CPU cores minimum

#### Network Requirements
- Container hosts can reach XSIAM Broker (port 443/514)
- Outbound internet access for XDR agent installation
- Internal connectivity between containers and hosts

#### Access Requirements
- Root/sudo access on container hosts
- XSIAM administrator privileges
- Ability to install software on Linux systems

### Cost Estimation
- **Cloud Option**: $50-100/month (2 AWS EC2 instances)
- **On-Premises**: $0 (use existing Linux servers)
- **Hybrid**: $25-50/month (1 cloud + 1 on-prem)

---

## Stage 3: Infrastructure Deployment (90 minutes)

### Step 3.1: Prepare Container Hosts (30 minutes)

**Option A: Using Existing Linux Servers**
```bash
# Install Docker on existing Linux servers
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Create test containers
sudo docker run -d --name test-container nginx
sudo docker run -d --name app-container httpd
```

**Option B: Deploy New AWS EC2 Instances**
```bash
# Launch 2 EC2 instances (t3.medium, Amazon Linux 2)
# Security group: Allow SSH (22), HTTP (80), HTTPS (443)
# Install Docker on each instance
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -a -G docker ec2-user
```

### Step 3.2: Configure Container Environment (30 minutes)

Create realistic container workloads:
```bash
# Web application containers
docker run -d --name web-app -p 80:80 nginx
docker run -d --name api-server -p 8080:8080 httpd

# Database container (this will be our "target")
docker run -d --name database --privileged -v /:/host postgres:13

# Monitoring container
docker run -d --name monitor alpine sleep 3600
```

### Step 3.3: Validate Infrastructure (30 minutes)

Test container operations:
```bash
# Verify containers are running
docker ps

# Test container connectivity
docker exec web-app curl localhost
docker exec api-server ps aux

# Confirm host filesystem access (privileged container)
docker exec database ls /host/etc
```

---

## Stage 4: Data Source Integration (120 minutes)

### Step 4.1: Deploy XDR Agents (60 minutes)

#### Download XDR Agent
1. Log into XSIAM: `https://your-tenant.xdr.us.paloaltonetworks.com`
2. Navigate: **Settings** → **Data Sources** → **XDR Agents**
3. Click **Download Agent** → Select **Linux**
4. Copy download URL

#### Install on Container Hosts
```bash
# On each container host
wget [XDR_AGENT_URL]
chmod +x cortex-xdr-installer
sudo ./cortex-xdr-installer

# Verify agent installation
sudo systemctl status cortex-xdr
sudo /opt/traps/bin/agent_info
```

#### Configure Agent for Container Monitoring
```bash
# Edit agent configuration
sudo nano /opt/traps/etc/agent_settings.xml

# Add these settings:
<ProcessMonitoring>true</ProcessMonitoring>
<CmdLineCapture>true</CmdLineCapture>
<ContainerRuntime>true</ContainerRuntime>

# Restart agent
sudo systemctl restart cortex-xdr
```

### Step 4.2: Configure Docker Logging (45 minutes)

#### Configure Docker Daemon
```bash
# Create Docker daemon config
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json << EOF
{
  "log-driver": "syslog",
  "log-opts": {
    "syslog-address": "tcp://[XSIAM_BROKER_IP]:514",
    "syslog-facility": "daemon",
    "tag": "docker/{{.Name}}"
  }
}
EOF

# Restart Docker
sudo systemctl restart docker
```

#### Configure XSIAM Broker
1. In XSIAM: **Settings** → **Data Sources** → **Broker**
2. Configure syslog listener on port 514
3. Create parsing rule for Docker logs:
   - **Log Format**: Syslog
   - **Source Type**: Docker
   - **Parsing Pattern**: `docker/(?P<container_name>\w+)`

### Step 4.3: Validate Data Sources (15 minutes)

#### Test XDR Agent Data
```xql
dataset = xdr_data 
| filter agent_os_type = ENUM.AGENT_OS_LINUX
| filter action_process_image_name contains "docker"
| fields _time, agent_hostname, action_process_command_line
| head 10
```

#### Test Docker Syslog Data
```xql
dataset = syslog_raw
| filter message contains "docker"
| fields _time, host, message
| head 10
```

**Expected Result**: Should see Docker process executions and container logs

---

## Stage 5: Content Generation & Deployment (60 minutes)

### Step 5.1: Deploy Detection Rule (20 minutes)

1. In XSIAM: **Analytics** → **Correlation Rules** → **Create Rule**
2. **Name**: `Docker Runtime Escape - Container Breakout Attempt`
3. **XQL Query**:
```xql
//MITRE ATT&CK TTP ID: T1611 - Escape to Host
config case_sensitive = false 
| dataset = xdr_data 
| filter event_type = ENUM.PROCESS and agent_os_type = ENUM.AGENT_OS_LINUX 
| filter (action_process_image_name in ("docker", "containerd", "runc", "ctr") 
    and action_process_command_line contains "--privileged") 
  or (action_process_command_line contains "/proc/self/exe" 
    and action_process_command_line contains "nsenter") 
  or (action_process_command_line contains "mount" 
    and action_process_command_line contains "/host") 
| fields _time, agent_hostname, action_process_image_name, 
    action_process_command_line, actor_effective_username
```

4. **Schedule**: Every 15 minutes
5. **Severity**: Critical
6. **Save & Enable**

### Step 5.2: Create Response Playbook (25 minutes)

1. **Automation** → **Playbooks** → **Create Playbook**
2. **Name**: `Docker Runtime Escape Response`
3. **Trigger**: Alert from correlation rule above
4. **Tasks**:
   - **Task 1**: Isolate container host (XDR isolate endpoint)
   - **Task 2**: Stop suspicious containers
   - **Task 3**: Collect container logs
   - **Task 4**: Create security ticket
   - **Task 5**: Notify security team

### Step 5.3: Configure Alert Layout (15 minutes)

1. **Analytics** → **Alert Layouts** → **Create Layout**
2. **Name**: `Container Escape Alert`
3. **Fields to Display**:
   - Host system
   - User account
   - Process command line
   - Container details
4. **Action Buttons**:
   - Isolate Host
   - Stop Containers
   - Collect Forensics
   - Mark False Positive

---

## Stage 6: Testing & Validation (75 minutes)

### Step 6.1: Simulate Container Escape (30 minutes)

#### Test 1: Privileged Container Abuse
```bash
# Create privileged container
docker run --privileged -it --rm alpine sh

# Inside container - attempt host access
mount /dev/sda1 /mnt
ls /mnt/etc/passwd
```

#### Test 2: Namespace Manipulation
```bash
# On container host
docker run -it --rm --pid=host alpine sh

# Inside container - escape via nsenter
nsenter -t 1 -m -u -i -n -p sh
```

#### Test 3: Filesystem Breakout
```bash
# Create container with host mount
docker run -v /:/host -it alpine sh

# Inside container - traverse to host
cd /host/../../../etc
cat passwd
```

### Step 6.2: Validate Detection (30 minutes)

#### Check for Alerts
1. **Incidents** → **Active Incidents**
2. Look for "Docker Runtime Escape" alerts
3. Verify alert details include:
   - Affected host
   - Escape technique used
   - Process command line

#### Verify Playbook Execution
1. Check incident timeline for automated actions
2. Confirm host isolation occurred
3. Verify security ticket creation

### Step 6.3: Fine-tune Detection (15 minutes)

#### Adjust for False Positives
```xql
# Add legitimate process exclusions
| filter not (action_process_command_line contains "legitimate-tool")
| filter not (actor_effective_username = "monitoring-user")
```

#### Update Alert Thresholds
- Reduce detection frequency if too noisy
- Increase sensitivity if escapes are missed

---

## Success Validation Checklist

- [ ] **Infrastructure**: Container hosts deployed and accessible
- [ ] **XDR Agents**: Installed and reporting process events
- [ ] **Docker Logging**: Container events flowing to XSIAM
- [ ] **Detection Rule**: Created and enabled in XSIAM
- [ ] **Response Playbook**: Configured with automated actions
- [ ] **Testing**: Successfully detected simulated escapes
- [ ] **Alerts**: Clear, actionable alerts generated
- [ ] **Documentation**: Procedures documented for team

---

## Common Implementation Issues to Avoid

1. **Skipping Agent Validation**: Always verify XDR agents are collecting container process data
2. **Missing Docker Logging**: Container activity won't be visible without proper Docker daemon configuration
3. **Overly Broad Detection**: Start with specific escape techniques, expand gradually
4. **No Testing Plan**: Always test detection with controlled escape simulations
5. **Ignoring False Positives**: Legitimate container operations can trigger alerts

---

## Next Steps for Advanced Detection

Once basic detection is working:
1. Add Kubernetes escape detection
2. Implement container anomaly detection
3. Create container compliance monitoring
4. Build container threat hunting queries
5. Integrate with container security tools

This completes your container escape detection implementation. The entire process should take 4-6 hours, resulting in production-ready detection capabilities.