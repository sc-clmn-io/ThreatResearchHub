# Log Forwarding Architecture for Docker Threat Scenarios

## Overview
ThreatResearchHub implements a sophisticated log forwarding architecture where individual applications and containers handle their own log forwarding to XSIAM, rather than sending bulk Docker syslog. This approach ensures data quality, reduces noise, and provides more targeted threat detection.

## Log Forwarding Methods

### 1. XSIAM EDR Agent (Endpoint Detection)
**Use Case:** Containers requiring behavioral analysis and real-time endpoint detection
**Protocol:** HTTPS (port 443)
**Destination:** 192.168.100.124:443

**Applications:**
- Privileged containers with escape potential
- Malware analysis sandboxes
- Critical services requiring behavioral monitoring

**Benefits:**
- Real-time endpoint detection and response
- Process behavior analysis
- File system monitoring
- Network activity tracking

**Example Containers:**
- `privileged-container` (Docker escape scenario)
- `analysis-sandbox` (Malware analysis)
- `vulnerable-service` (Privilege escalation)

### 2. Application Log Forwarders (Structured Logs)
**Use Case:** Applications with structured logging requirements
**Protocol:** Syslog (port 514)
**Destination:** 192.168.100.124:514

**Technologies:**
- Fluent Bit
- Filebeat
- Vector
- Custom JSON logging

**Applications:**
- Web applications (NGINX, Apache)
- API services with structured logs
- Custom applications with JSON output

**Benefits:**
- Application-specific log enrichment
- Custom field mapping
- Structured data formats
- Log filtering and transformation

**Example Containers:**
- `vulnerable-app` (Web application logs via Fluent Bit)
- `web-frontend` (NGINX access logs via Filebeat)
- `api-backend` (Structured JSON application logs)

### 3. Syslog Forwarders (System Logs)
**Use Case:** Traditional system and audit logs
**Protocol:** Syslog (port 514)
**Destination:** 192.168.100.124:514

**Technologies:**
- rsyslog
- syslog-ng
- systemd-journald

**Applications:**
- System audit logs
- Database audit trails
- Security event logs
- Traditional Unix services

**Benefits:**
- Standard syslog format compatibility
- High reliability and performance
- Minimal configuration overhead
- Wide vendor support

**Example Containers:**
- `host-monitor` (System logs via rsyslog)
- `database` (PostgreSQL audit logs via syslog-ng)
- `malware-samples` (File access logs via audit daemon)

### 4. Custom XSIAM Integration (API-based)
**Use Case:** Custom data formats and analysis results
**Protocol:** HTTPS REST API (port 443)
**Destination:** 192.168.100.124:443

**Applications:**
- Security scanning tools
- Analysis result collectors
- Custom threat intelligence feeds
- Specialized monitoring tools

**Benefits:**
- Direct XSIAM API integration
- Custom data formats and schemas
- Real-time data push
- Advanced metadata enrichment

**Example Containers:**
- `network-scanner` (Network scan results via XSIAM API)
- `monitoring-tools` (Analysis results via REST API)

## Threat Scenario Configurations

### Docker Runtime Escape
```yaml
containers:
  vulnerable-app:
    log_forwarding: APPLICATION_LOG
    method: Fluent Bit
    destination: 192.168.100.124:514
    description: Web application logs with custom enrichment
    
  privileged-container:
    log_forwarding: XSIAM_AGENT
    method: EDR Agent
    destination: 192.168.100.124:443
    description: Real-time behavioral analysis for escape detection
    
  host-monitor:
    log_forwarding: SYSLOG_FORWARDER
    method: rsyslog
    destination: 192.168.100.124:514
    description: System logs and forensic data
```

### Container Lateral Movement
```yaml
containers:
  web-frontend:
    log_forwarding: APPLICATION_LOG
    method: Filebeat
    destination: 192.168.100.124:514
    description: NGINX access logs with geo-enrichment
    
  api-backend:
    log_forwarding: APPLICATION_LOG
    method: JSON logging
    destination: 192.168.100.124:514
    description: Structured API request/response logs
    
  database:
    log_forwarding: SYSLOG_FORWARDER
    method: syslog-ng
    destination: 192.168.100.124:514
    description: Database audit logs with query analysis
    
  network-scanner:
    log_forwarding: CUSTOM_INTEGRATION
    method: XSIAM REST API
    destination: 192.168.100.124:443
    description: Network reconnaissance results with IOC mapping
```

### Container Privilege Escalation
```yaml
containers:
  vulnerable-service:
    log_forwarding: XSIAM_AGENT
    method: EDR Agent
    destination: 192.168.100.124:443
    description: Process behavior analysis for privilege escalation
    
  escalation-toolkit:
    log_forwarding: APPLICATION_LOG
    method: Centralized logging
    destination: 192.168.100.124:514
    description: Tool execution logs with command tracking
```

### Containerized Malware Analysis
```yaml
containers:
  analysis-sandbox:
    log_forwarding: XSIAM_AGENT
    method: EDR Agent
    destination: 192.168.100.124:443
    description: Real-time malware behavior monitoring
    
  malware-samples:
    log_forwarding: SYSLOG_FORWARDER
    method: Audit daemon
    destination: 192.168.100.124:514
    description: File access and modification logs
    
  monitoring-tools:
    log_forwarding: CUSTOM_INTEGRATION
    method: XSIAM REST API
    destination: 192.168.100.124:443
    description: Analysis results with threat classification
```

## Implementation Guidelines

### Container Configuration
Each container should be configured with:

1. **Log Driver Configuration**
   ```docker
   # For syslog forwarding
   --log-driver=syslog
   --log-opt syslog-address=tcp://192.168.100.124:514
   --log-opt tag="{{.ImageName}}/{{.Name}}"
   ```

2. **Application-Specific Forwarders**
   ```bash
   # Fluent Bit configuration
   [OUTPUT]
       Name forward
       Match *
       Host 192.168.100.124
       Port 514
       Shared_Key secret
   ```

3. **XSIAM Agent Installation**
   ```bash
   # Install XSIAM agent in container
   curl -O https://192.168.100.124/agent/xsiam-agent.sh
   chmod +x xsiam-agent.sh
   ./xsiam-agent.sh --broker 192.168.100.124:443
   ```

### XSIAM Broker Configuration
The XSIAM broker (VM XXX) should be configured to receive and process different log types:

```yaml
# /etc/xsiam-broker/config.yaml
log_sources:
  - name: syslog
    port: 514
    protocol: tcp
    format: rfc3164
    
  - name: xsiam_agents
    port: 443
    protocol: https
    auth: certificate
    
processing_rules:
  - source: application_logs
    enrichment: container_metadata
    destination: xsiam_cloud
    
  - source: edr_agents
    enrichment: endpoint_context
    destination: xsiam_cloud
```

## Benefits of This Architecture

### Data Quality
- **Reduced Noise**: Only relevant logs forwarded
- **Structured Data**: Application-specific formatting
- **Contextual Enrichment**: Metadata added at source

### Security
- **Targeted Detection**: Logs match threat scenarios
- **Behavioral Analysis**: EDR agents for critical containers
- **Audit Trails**: Comprehensive tracking for compliance

### Scalability
- **Distributed Processing**: Load balanced across forwarders
- **Selective Forwarding**: Only necessary data transmitted
- **Efficient Resource Usage**: Minimal overhead per container

### Operational
- **Simplified Troubleshooting**: Application-specific log handling
- **Flexible Configuration**: Different methods per use case
- **Vendor Independence**: Multiple forwarding technologies

## Monitoring and Validation

### Log Flow Validation
```bash
# Check syslog reception
tail -f /var/log/syslog | grep docker

# Verify XSIAM agent connectivity
xsiam-agent status --broker 192.168.100.124

# Test custom API integration
curl -X POST https://192.168.100.124/api/logs \
  -H "Content-Type: application/json" \
  -d '{"test": "log_forwarding"}'
```

### Performance Monitoring
- Log ingestion rates per container
- XSIAM broker processing capacity
- Network bandwidth utilization
- Storage requirements per scenario

### Quality Assurance
- Field mapping validation
- Data completeness checks
- Timestamp accuracy verification
- Threat detection rule compatibility

This architecture ensures that ThreatResearchHub provides realistic, high-quality threat detection scenarios while maintaining operational efficiency and data integrity.