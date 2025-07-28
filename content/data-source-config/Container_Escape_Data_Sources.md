# Container Escape Detection - Required Data Source Integrations

## Critical Data Sources for Container Escape Detection

### 1. ✅ **REQUIRED: XDR Agent on Container Hosts**
- **Integration**: Cortex XDR Agent 
- **Target Systems**: All Linux hosts running Docker/containers
- **Configuration Steps**:
  1. Deploy XDR agent on all container hosts
  2. Enable process monitoring: `ProcessMonitoring=true`
  3. Enable command line capture: `CmdLineCapture=true`
  4. Configure agent policies to monitor container runtimes

**Validation Query**:
```xql
dataset = xdr_data 
| filter agent_os_type = ENUM.AGENT_OS_LINUX 
| filter action_process_image_name in ("docker", "containerd", "runc")
| comp count() as container_processes
| filter container_processes > 0
```

### 2. ✅ **REQUIRED: Docker Daemon Logging**
- **Integration**: Syslog forwarding from Docker hosts
- **Configuration Steps**:
  1. Configure Docker daemon logging:
     ```json
     {
       "log-driver": "syslog",
       "log-opts": {
         "syslog-address": "tcp://xsiam-broker:514",
         "tag": "docker/{{.Name}}"
       }
     }
     ```
  2. Configure XSIAM Broker to receive syslog on port 514
  3. Create syslog parsing rule for Docker events

**Validation Query**:
```xql
dataset = syslog_raw
| filter message contains "docker" or message contains "container"
| comp count() as docker_logs
| filter docker_logs > 0
```

### 3. 🔄 **OPTIONAL: Linux Audit Logs**
- **Integration**: Linux auditd forwarding
- **Configuration Steps**:
  1. Install auditd on container hosts: `yum install audit`
  2. Add container escape rules to `/etc/audit/rules.d/container.rules`:
     ```
     -a always,exit -F arch=b64 -S mount,chroot,unshare,setns -k container_escape
     -a always,exit -F arch=b64 -S execve -F exe=/usr/bin/docker -k docker_exec
     ```
  3. Configure auditd to forward to XSIAM via rsyslog

### 4. 🔄 **OPTIONAL: Kubernetes Audit (if applicable)**
- **Integration**: K8s API server audit logs
- **Configuration Steps**:
  1. Enable audit logging in kube-apiserver
  2. Configure audit policy for privileged pods
  3. Forward audit logs to XSIAM

## Data Source Validation Checklist

Before deploying container escape detection:

- [ ] **XDR agents deployed on all container hosts**
- [ ] **Process events visible in xdr_data dataset** 
- [ ] **Docker daemon configured for syslog forwarding**
- [ ] **Container start/stop events visible in syslog**
- [ ] **Network connectivity from hosts to XSIAM Broker**
- [ ] **Parsing rules configured for Docker syslog format**

## Required XSIAM Dataset Fields

The detection rule requires these fields to be present:

| Field | Dataset | Critical | Purpose |
|-------|---------|----------|---------|
| `event_type` | xdr_data | ✅ | Filter for PROCESS events |
| `agent_os_type` | xdr_data | ✅ | Filter for Linux hosts |
| `action_process_image_name` | xdr_data | ✅ | Identify container runtimes |
| `action_process_command_line` | xdr_data | ✅ | Detect escape techniques |
| `actor_effective_username` | xdr_data | ✅ | Track user context |
| `agent_hostname` | xdr_data | ✅ | Identify affected hosts |

## Common Integration Issues

### Issue: No container processes in xdr_data
**Solution**: Verify XDR agent is installed and process monitoring enabled on container hosts

### Issue: Missing command line arguments  
**Solution**: Enable command line capture in XDR agent configuration

### Issue: No Docker daemon logs
**Solution**: Configure Docker daemon to use syslog driver and verify network connectivity to XSIAM Broker

## Testing Your Integration

Run this validation query to confirm data sources are working:

```xql
dataset = xdr_data 
| filter agent_os_type = ENUM.AGENT_OS_LINUX 
| filter action_process_image_name contains "docker"
| fields _time, agent_hostname, action_process_image_name, action_process_command_line
| head 10
```

Expected result: Should show Docker process executions with full command lines from your container hosts.