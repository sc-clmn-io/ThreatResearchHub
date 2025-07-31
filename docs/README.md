# ThreatResearchHub Documentation

## Overview
Comprehensive documentation for deploying and operating ThreatResearchHub Docker Runtime Escape lab environments across multiple platforms. All deployment options generate authentic attack patterns for XSIAM correlation rule development.

## Deployment Options

### Self-Hosted Docker Deployment
**Best for:** Maximum control, on-premises environments, cost-effective solutions

| Guide | Description | Cost | Time | Complexity |
|-------|-------------|------|------|------------|
| **[STANDALONE_DEPLOYMENT_GUIDE.md](../STANDALONE_DEPLOYMENT_GUIDE.md)** | Complete self-hosted Docker deployment | Infrastructure only | 30-45 min | Medium |
| **[DOCKER_RUNTIME_ESCAPE_LAB_COMPLETE.md](../DOCKER_RUNTIME_ESCAPE_LAB_COMPLETE.md)** | Technical deployment with lessons learned | Infrastructure only | 15-30 min | Medium |
| **[GUIDED_WALKTHROUGH_COMPLETE.md](../GUIDED_WALKTHROUGH_COMPLETE.md)** | Step-by-step guided deployment process | Infrastructure only | 45 min | Low-Medium |

### Managed Cloud Container Services
**Best for:** Rapid deployment, auto-scaling, enterprise environments

| Platform | Guide | Cost/Month | Time | Complexity |
|----------|-------|------------|------|------------|
| **Google Cloud Run** | **[GCP_CLOUD_RUN_DEPLOYMENT.md](../GCP_CLOUD_RUN_DEPLOYMENT.md)** | $8-20 | 20-30 min | Low |
| **Azure Container Instances** | **[AZURE_CONTAINER_INSTANCES_DEPLOYMENT.md](../AZURE_CONTAINER_INSTANCES_DEPLOYMENT.md)** | $10-25 | 20-30 min | Medium |
| **AWS Fargate** | **[AWS_FARGATE_DEPLOYMENT.md](../AWS_FARGATE_DEPLOYMENT.md)** | $15-30 | 25-35 min | High |

### Advanced Cloud-Native Deployments
**Best for:** Cloud-native vulnerabilities, Kubernetes security, advanced Azure attack simulation

| Platform | Guide | Cost/Month | Time | Complexity |
|----------|-------|------------|------|------------|
| **Azure Kubernetes Service** | **[AZURE_KUBERNETES_INGRESS_NIGHTMARE_DEPLOYMENT.md](../AZURE_KUBERNETES_INGRESS_NIGHTMARE_DEPLOYMENT.md)** | $30-60 | 45-60 min | High |

### Supporting Documentation

| Document | Purpose |
|----------|---------|
| **[CLOUD_CAAS_COMPARISON.md](../CLOUD_CAAS_COMPARISON.md)** | Feature comparison, cost analysis, platform recommendations |
| **[DEPLOYMENT_LESSONS_LEARNED.md](../DEPLOYMENT_LESSONS_LEARNED.md)** | Real-world testing insights and troubleshooting |

## Quick Start Recommendations

### For Rapid Proof-of-Concept
**→ Start with Google Cloud Run**
- Lowest cost ($8-20/month)
- Fastest deployment (20-30 minutes)
- Fully managed with auto-scaling
- Built-in HTTPS and load balancing

### For Enterprise Production
**→ Scale to AWS Fargate**
- Comprehensive enterprise features
- Advanced auto-scaling and monitoring
- Full ECS ecosystem integration
- High availability and compliance

### For Azure-Native Environments
**→ Use Azure Container Instances** (Simple managed containers)
- Native Azure integration
- VNet and Azure Monitor support
- Enterprise security features  
- Consistent with Azure DevOps workflows

**→ Azure Kubernetes Service** (Advanced cloud-native security)
- CVE-YYYY-NNNN Ingress Nightmare vulnerability simulation
- Kubernetes security testing with authentic AKS environment
- Advanced Azure cloud attack patterns and IMDS exploitation
- Comprehensive cloud-native threat detection

### For Maximum Control
**→ Deploy Self-Hosted Docker**
- Complete infrastructure control
- Custom network configuration
- Proxmox/VM deployment flexibility
- Cost-effective for long-term use

## Attack Simulation Coverage

All deployment options provide authentic attack patterns:

### Container Escape Simulation
- **Self-Hosted:** Privileged container breakout, host filesystem access
- **Azure ACI:** Azure Metadata Service (IMDS) enumeration, managed identity extraction
- **Azure AKS:** Kubernetes Ingress path traversal (CVE-YYYY-NNNN), pod privilege escalation, cross-namespace lateral movement
- **AWS:** ECS Task Metadata endpoint access, IAM role credential extraction
- **GCP:** Google Cloud metadata service access, service account token extraction

### TeamTNT Cryptocurrency Mining
- **Self-Hosted:** Resource hijacking, mining pool connections, CPU utilization patterns
- **Azure:** Azure instance metadata harvesting, cross-tenant reconnaissance
- **AWS:** EC2 metadata discovery, cross-account lateral movement simulation
- **GCP:** Instance metadata harvesting, Cloud Storage and BigQuery enumeration

### Lateral Movement
- **Self-Hosted:** Network reconnaissance, container-to-container communication
- **Azure ACI:** Azure network discovery, container group enumeration
- **Azure AKS:** Cross-namespace service discovery, Kubernetes API exploitation, secrets enumeration
- **AWS:** VPC scanning, cross-task communication attempts
- **GCP:** Cloud Run service discovery, internal network reconnaissance

### Web Application
- HTTP-based attack patterns, web server exploitation vectors, application layer indicators (consistent across all platforms)

## XSIAM Integration Architecture

### Self-Hosted Docker
```
Docker Containers (syslog driver)
    ↓ UDP 515-518
XSIAM Broker
    ↓ Correlation Rules
XSIAM Platform
```

### Azure Container Instances
```
Azure Container Instances
    ↓ Container logs
Azure Log Analytics
    ↓ Event Hub
XSIAM Broker
    ↓ Correlation Rules
XSIAM Platform
```

### Azure Kubernetes Service (AKS)
```
Azure AKS Cluster (CVE-YYYY-NNNN)
    ↓ Kubernetes audit logs + Ingress logs
Azure Monitor Container Insights
    ↓ Log Analytics + Event Hub
XSIAM Broker (Fluent Bit forwarder)
    ↓ Correlation Rules
XSIAM Platform
```

### AWS Fargate
```
AWS Fargate (ECS)
    ↓ CloudWatch Logs
Kinesis Data Firehose
    ↓ HTTP endpoint
XSIAM Broker
    ↓ Correlation Rules
XSIAM Platform
```

### Google Cloud Run
```
Google Cloud Run
    ↓ Cloud Logging
Pub/Sub Topic
    ↓ Cloud Function
XSIAM Broker
    ↓ Correlation Rules
XSIAM Platform
```

## Security Considerations

### Network Isolation
- **Self-Hosted:** Dedicated VLANs, firewall rules, network segmentation
- **Cloud Services:** VPC/VNet isolation, security groups, managed network policies

### Access Control
- **Self-Hosted:** SSH key management, sudo access, user permissions
- **Cloud Services:** Cloud IAM, service accounts, role-based access control

### Data Protection
- **All Platforms:** Encrypted log transmission, secure credential storage, audit logging

### Compliance
- **Self-Hosted:** Custom compliance implementation
- **Cloud Services:** Built-in compliance frameworks (SOC, PCI DSS, HIPAA)

## Troubleshooting Resources

### Common Issues
1. **Port Binding Conflicts** - Detailed resolution in deployment guides
2. **TeamTNT Container Issues** - socat-based fix documented in lessons learned
3. **XSIAM Connectivity** - Network troubleshooting procedures
4. **Resource Constraints** - CPU/memory optimization strategies

### Support Documentation
- **Platform-specific troubleshooting** in each deployment guide
- **Real-world testing insights** in DEPLOYMENT_LESSONS_LEARNED.md
- **Cost optimization strategies** in CLOUD_CAAS_COMPARISON.md

## Expected Outcomes

### Successful Deployment Indicators
- ✅ All 4 containers/services running and healthy
- ✅ External services accessible (web app, mining simulation)
- ✅ XSIAM integration established with log forwarding
- ✅ Authentic attack patterns generating for correlation rule development

### Performance Metrics
- **Self-Hosted:** 4 containers, 2-4 GB RAM usage, 60-80% CPU utilization
- **Cloud Services:** Auto-scaling based on demand, managed resource allocation

### Cost Expectations
- **Self-Hosted:** Infrastructure costs only (typically $0-10/month)
- **Google Cloud Run:** $8-20/month (most cost-effective)
- **Azure Container Instances:** $10-25/month (balanced features/cost)
- **Azure Kubernetes Service:** $30-60/month (advanced cloud-native security testing)
- **AWS Fargate:** $15-30/month (premium features, enterprise-ready)

**Choose the deployment option that best fits your infrastructure requirements, security constraints, and budget considerations. All options provide the same authentic attack simulation capabilities for XSIAM correlation rule development.**