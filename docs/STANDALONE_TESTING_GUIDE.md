# Standalone Testing Guide for End Users

## Overview
This guide provides comprehensive testing procedures for end users deploying ThreatResearchHub without Replit access. All tests can be performed using the local web interface and command-line tools.

## Prerequisites
- ThreatResearchHub installed and running (see setup-security-research-platform.sh)
- Access to Proxmox server (192.168.100.188)
- XSIAM broker VM operational (VM XXX at 192.168.100.124:4443)
- Basic command-line knowledge

## Test Sequence

### 1. Platform Access Test
**Objective**: Verify basic platform functionality

**Steps**:
1. Open web browser to http://localhost:5000
2. Verify dashboard loads without errors
3. Check all navigation menu items are accessible
4. Test responsive design on different screen sizes

**Expected Results**:
- Dashboard displays threat metrics
- All navigation links work
- No JavaScript errors in browser console
- Platform responsive on mobile/tablet/desktop

**Troubleshooting**:
- If dashboard doesn't load: Check server logs with `npm run logs`
- If navigation broken: Clear browser cache and reload
- If responsive issues: Check CSS compilation with `npm run build`

### 2. Connection Management Test
**Objective**: Verify infrastructure connectivity

**Steps**:
1. Navigate to "Connection Management"
2. Test Proxmox connection:
   - Host: 192.168.100.188
   - Username: root
   - Port: 22
3. Test Azure connection (if configured):
   - Subscription ID: EXAMPLE_CLUSTER_URI
   - Service Principal: ExampleApp-ServicePrincipal
4. Verify XSIAM broker status

**Expected Results**:
- Proxmox shows "Connected" status
- Azure shows "Connected" status (if configured)
- XSIAM broker shows "Operational" at 192.168.100.124:4443
- Infrastructure status dashboard shows real-time data

**Troubleshooting**:
- If Proxmox connection fails: Check SSH key authentication
- If Azure fails: Verify service principal permissions
- If XSIAM broker unreachable: Check VM XXX status

### 3. Docker Host Management Test
**Objective**: Verify Docker VM creation and management

**Steps**:
1. Navigate to "Docker Host Manager"
2. Create new Docker VM:
   - VM ID: 201
   - Name: docker-host-test
   - Memory: 8192 MB
   - Cores: 4
   - Disk: 50 GB
3. Monitor deployment progress
4. Verify VM appears in list with "running" status
5. Check Docker version is displayed

**Expected Results**:
- VM creation completes in 5-10 minutes
- VM shows in list with correct specifications
- Docker version displayed (24.0.7+)
- Log forwarding configured to XSIAM broker

**Troubleshooting**:
- If VM creation fails: Check Proxmox storage space
- If Docker not installed: Verify internet connectivity
- If logs not forwarding: Test broker connectivity

### 4. Threat Scenario Deployment Test
**Objective**: Verify container-based threat scenarios

**Steps**:
1. Select created Docker VM
2. Navigate to "Threat Scenarios" tab
3. Deploy "Docker Runtime Escape" scenario
4. Monitor container deployment progress
5. Verify all containers are running
6. Test access points as provided

**Expected Results**:
- All scenario containers deploy successfully
- Containers show "running" status with appropriate log forwarding methods
- Access points respond (vulnerable-app on port 8080)
- Individual application logs flowing to XSIAM broker via appropriate methods:
  - XSIAM agents connected for behavioral monitoring
  - Application log forwarders operational
  - Syslog forwarders configured correctly
  - Custom integrations active

**Troubleshooting**:
- If containers fail: Check Docker daemon status
- If ports not accessible: Verify firewall settings
- If XSIAM agent not connecting: Check broker certificate and connectivity
- If application logs missing: Verify log forwarder configuration
- If syslog not working: Check rsyslog/syslog-ng configuration

### 5. XSIAM Integration Test
**Objective**: Verify log forwarding and detection

**Steps**:
1. Generate activity in deployed containers
2. Check XSIAM broker receives logs:
   - SSH to broker VM: ssh root@192.168.100.124
   - Check logs: tail -f /var/log/syslog | grep docker
3. Verify logs appear in XSIAM console
4. Test field mapping accuracy

**Expected Results**:
- Docker logs visible in broker syslog
- Logs forwarded to XSIAM successfully
- Field mapping matches expected schema
- Threat detection rules trigger appropriately

**Troubleshooting**:
- If no logs in broker: Check Docker log driver configuration
- If XSIAM not receiving: Verify broker to XSIAM connectivity
- If field mapping wrong: Check syslog format configuration

### 6. Content Generation Test
**Objective**: Verify XSIAM content creation

**Steps**:
1. Navigate to "Content Generation"
2. Generate content for deployed scenario
3. Download generated XQL rules
4. Download automation playbooks
5. Download alert layouts

**Expected Results**:
- XQL rules generate with valid syntax
- Playbooks contain concrete response actions
- Alert layouts include decision buttons
- All content uses authentic field references

**Troubleshooting**:
- If generation fails: Check AI provider configuration
- If invalid syntax: Verify dataset schemas
- If placeholders present: Update content validation

### 7. End-to-End Workflow Test
**Objective**: Complete threat scenario validation

**Steps**:
1. Deploy Docker runtime escape scenario
2. Generate XSIAM content for container escape
3. Execute privilege escalation in vulnerable container
4. Verify detection in XSIAM
5. Test response playbook execution
6. Document findings

**Expected Results**:
- Complete workflow executes successfully
- Threat detection occurs within 5 minutes
- Response actions execute automatically
- Documentation generated accurately

**Troubleshooting**:
- If detection delayed: Check log ingestion latency
- If response fails: Verify playbook permissions
- If documentation incomplete: Check template configuration

## Performance Benchmarks

### System Requirements Met
- **CPU Usage**: <50% during normal operations
- **Memory Usage**: <4GB for platform + 8GB for Docker VMs
- **Disk Space**: <100GB total including containers
- **Network**: <10Mbps for log forwarding

### Response Time Targets
- **Platform Load**: <3 seconds
- **VM Creation**: <10 minutes
- **Container Deployment**: <5 minutes per scenario
- **Log Detection**: <5 minutes end-to-end

### Scalability Limits
- **Docker VMs**: Up to 10 concurrent VMs
- **Containers**: Up to 50 containers per VM
- **Concurrent Users**: Up to 5 platform users
- **Log Volume**: Up to 1000 events/minute

## Security Validation

### Network Isolation
- Verify VMs operate in isolated network segments
- Confirm no external internet access after setup
- Test firewall rules block unauthorized traffic
- Validate encrypted communication to XSIAM

### Access Control
- Verify SSH key-based authentication only
- Test minimal user privileges enforcement
- Confirm container isolation maintained
- Validate secure log transmission

### Data Protection
- Verify no sensitive data in container logs
- Test automatic log rotation
- Confirm secure XSIAM communication
- Validate data encryption at rest

## Maintenance Procedures

### Daily Checks
```bash
# Check platform status
curl -s http://localhost:5000/health

# Check Docker VMs
ssh root@192.168.100.188 "qm list | grep running"

# Check XSIAM broker
ssh root@192.168.100.124 "systemctl status xsiam-broker"

# Check log flow
ssh root@192.168.100.124 "tail -5 /var/log/syslog | grep docker"
```

### Weekly Maintenance
```bash
# Update platform
cd security-research-platform
git pull origin main
npm install
npm run db:push

# Clean up old containers
ssh root@192.168.100.201 "docker system prune -f"

# Rotate logs
ssh root@192.168.100.124 "logrotate -f /etc/logrotate.conf"
```

### Monthly Reviews
- Review security posture and access controls
- Update threat scenarios and container images
- Validate XSIAM content accuracy
- Performance optimization and tuning

## Success Criteria

### Functional Tests Pass
- ✅ Platform accessible and responsive
- ✅ Infrastructure connections established
- ✅ Docker VMs create and manage successfully
- ✅ Threat scenarios deploy and execute
- ✅ XSIAM integration functional
- ✅ Content generation produces valid output

### Performance Targets Met
- ✅ Response times within benchmarks
- ✅ Resource usage within limits
- ✅ Scalability requirements satisfied
- ✅ Security controls validated

### Documentation Complete
- ✅ Test results documented
- ✅ Issues identified and resolved
- ✅ Maintenance procedures established
- ✅ User training completed

## Support Resources

### Log Locations
- **Platform Logs**: `./logs/application.log`
- **Database Logs**: `./data/database.log`
- **Docker Logs**: `/var/lib/docker/containers/*/`
- **System Logs**: `/var/log/syslog`

### Common Commands
```bash
# Restart platform
npm restart

# Check VM status
ssh root@192.168.100.188 "qm status 201"

# View container logs
ssh root@192.168.100.201 "docker logs container_name"

# Test connectivity
telnet 192.168.100.124 514
```

### Contact Information
- **Technical Support**: Create GitHub issue
- **Documentation**: docs/ directory
- **Community**: Platform discussion forum
- **Emergency**: Contact system administrator

This testing guide ensures end users can validate their standalone ThreatResearchHub deployment comprehensively and independently.