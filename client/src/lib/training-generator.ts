import type { UseCase, TrainingPath, TrainingStep } from "@shared/schema";
import { correlationRuleTemplates, generateCustomXQLQuery } from './correlation-templates';
import { alertLayoutTemplates, generateLayoutConfiguration } from './layout-templates';
import { playbookTemplates, generatePlaybookYAML } from './playbook-templates';
import { scriptTemplates, generateScriptYAML } from './script-templates';
import { owaspCloudThreats, generateOwaspCloudUseCase } from './owasp-cloud-threats';

export interface TrainingStepTemplate {
  title: string;
  description: string;
  contentTemplate: string;
  category: TrainingStep['category'];
  estimatedDuration: number;
  validationRequired: boolean;
  dependencies?: string[];
}

const stepTemplates: Record<string, TrainingStepTemplate[]> = {
  endpoint: [
    {
      title: "Environment Setup - Endpoint Detection Lab",
      description: "Set up a controlled lab environment for endpoint detection testing",
      contentTemplate: `
## Prerequisites
- Windows 10/11 virtual machine
- Windows Server 2019+ (Domain Controller)
- Cortex XDR Agent v8.2+
- Administrative privileges

## Setup Steps
1. **Configure Domain Environment**
   - Install Active Directory Domain Services
   - Create test user accounts with varying privilege levels
   - Configure Group Policy for security logging

2. **Deploy Cortex XDR Agent**
   - Download agent from tenant console
   - Install with appropriate policies
   - Verify agent connectivity and data collection

3. **Network Configuration**
   - Configure network segmentation for controlled testing
   - Set up monitoring tools and packet capture
   - Establish baseline network behavior

## Validation Checklist
- [ ] Agent reporting telemetry to tenant
- [ ] Domain authentication working
- [ ] Network connectivity verified
- [ ] Baseline data collection established
      `,
      category: "environment_buildout",
      estimatedDuration: 60,
      validationRequired: true
    },
    {
      title: "Attack Simulation - Credential Dumping",
      description: "Execute controlled credential access techniques for detection testing",
      contentTemplate: `
## Attack Overview
Simulate credential dumping techniques commonly used by adversaries to extract authentication materials from memory.

## Tools Required
- Mimikatz (latest version)
- Process Monitor
- Administrative access to test system

## Execution Steps
1. **Baseline Monitoring**
   - Enable process creation logging
   - Start Cortex XDR monitoring
   - Document normal LSASS behavior

2. **Attack Execution**
   \`\`\`powershell
   # Run Mimikatz with privilege debug
   mimikatz.exe "privilege::debug" "sekurlsa::logonpasswords" exit
   \`\`\`

3. **Alternative Techniques**
   - Task Manager LSASS dump
   - PowerShell memory access
   - Registry SAM extraction

## Expected Detections
- LSASS memory access alerts
- Suspicious process creation
- Credential access behavior patterns

## Safety Considerations
- Use isolated lab environment only
- Never run on production systems
- Disable network connectivity during testing
      `,
      category: "attack_simulation",
      estimatedDuration: 45,
      validationRequired: true,
      dependencies: ["environment_buildout"]
    },
    {
      title: "Detection Rule Development - LSASS Access",
      description: "Create custom detection rules for LSASS memory access",
      contentTemplate: `
## Detection Logic Overview
Build rules to detect unauthorized access to Local Security Authority Subsystem Service (LSASS) memory.

## XQL Query Development
\`\`\`xql
dataset = xdr_data
| filter agent_hostname != null
| filter action_process_image_name ~= ".*lsass.*" 
   or action_process_command_line contains "lsass"
   or action_target_process_image_name ~= ".*lsass.*"
| filter action_type in ("PROCESS_CREATION", "MEMORY_ACCESS", "PROCESS_INJECTION")
| alter process_chain = action_process_image_path
| filter not (actor_process_image_name in ("explorer.exe", "svchost.exe", "services.exe"))
| comp count() by actor_process_image_name, endpoint_name
| filter _count > 1
\`\`\`

## Rule Configuration
1. **Alert Severity**: High
2. **MITRE Mapping**: T1003.001 - OS Credential Dumping: LSASS Memory
3. **False Positive Tuning**:
   - Exclude legitimate administrative tools
   - Add time-based thresholds
   - Consider process reputation

## Testing and Validation
- Test against known good processes
- Validate with attack simulation
- Adjust thresholds based on environment

## Documentation Requirements
- Rule logic explanation
- Tuning parameters
- Expected false positive rate
- Escalation procedures
      `,
      category: "detection_engineering",
      estimatedDuration: 75,
      validationRequired: true,
      dependencies: ["attack_simulation"]
    }
  ],
  network: [
    {
      title: "Network Lab Configuration",
      description: "Set up network monitoring and analysis environment",
      contentTemplate: `
## Network Infrastructure Setup
Configure a comprehensive network monitoring environment for threat detection testing.

## Required Components
- pfSense firewall
- Network tap or mirror port
- Wireshark/tcpdump
- Cortex XDR network sensors
- Multiple network segments

## Configuration Steps
1. **Network Segmentation**
   - Create DMZ, internal, and management VLANs
   - Configure routing between segments
   - Implement access control lists

2. **Monitoring Deployment**
   - Install network sensors
   - Configure traffic mirroring
   - Set up packet capture storage

3. **Baseline Establishment**
   - Document normal traffic patterns
   - Identify legitimate protocols and ports
   - Create network inventory

## Validation
- Verify sensor coverage across all segments
- Test traffic capture and analysis
- Confirm alert generation capabilities
      `,
      category: "environment_buildout",
      estimatedDuration: 90,
      validationRequired: true
    }
  ],
  cloud: [
    {
      title: "Cloud Security Lab Setup",
      description: "Configure cloud environment for security testing",
      contentTemplate: `
## Cloud Platform Setup
Establish a secure cloud environment for testing detection and response capabilities.

## Platform Requirements
- AWS/Azure/GCP test account
- Cloud Security Posture Management tools
- Cortex XSIAM cloud connectors
- Infrastructure as Code templates

## Setup Process
1. **Account Configuration**
   - Create dedicated test account/subscription
   - Configure billing alerts and limits
   - Set up identity and access management

2. **Security Tooling**
   - Deploy CSPM agents
   - Configure cloud logging
   - Install monitoring solutions

3. **Test Workloads**
   - Deploy sample applications
   - Create various resource types
   - Implement intentional misconfigurations

## Security Validation
- Verify logging and monitoring coverage
- Test detection rule effectiveness
- Validate incident response procedures
      `,
      category: "environment_buildout",
      estimatedDuration: 120,
      validationRequired: true
    }
  ],
  identity: [
    {
      title: "Identity Environment Setup",
      description: "Configure identity and access management testing environment",
      contentTemplate: `
## Identity Infrastructure
Set up comprehensive identity testing environment including on-premises and cloud identity systems.

## Components Required
- Active Directory Domain Services
- Azure Active Directory tenant
- ADFS/identity federation
- Privileged Access Management
- Identity monitoring tools

## Configuration Steps
1. **On-Premises Setup**
   - Install and configure AD DS
   - Create organizational units and groups
   - Configure service accounts and Kerberos

2. **Cloud Integration**
   - Set up Azure AD Connect
   - Configure federation and SSO
   - Implement conditional access policies

3. **Monitoring Implementation**
   - Deploy identity protection tools
   - Configure audit logging
   - Set up anomaly detection

## Validation Checklist
- Authentication flows working correctly
- Logging captured for all identity events
- Monitoring tools detecting test scenarios
      `,
      category: "environment_buildout",
      estimatedDuration: 100,
      validationRequired: true
    }
  ]
};

export function generateTrainingPath(useCase: UseCase): TrainingPath {
  const templates = stepTemplates[useCase.category] || stepTemplates.endpoint;
  
  // Check if this involves AI/LLM threats based on OWASP Top 10 for LLMs
  const isAIThreat = detectAIThreats(useCase.description);
  
  // Add common steps that apply to all categories
  const commonSteps: TrainingStepTemplate[] = [
    {
      title: "Planning and Requirements Analysis",
      description: "Define training objectives and resource requirements",
      contentTemplate: `
## Training Objectives
Define clear, measurable objectives for this training module.

### Primary Objectives
- Understand the threat landscape for ${useCase.title}
- Develop detection capabilities for ${useCase.category} threats
- Create effective response procedures
- Validate detection accuracy and tune for environment

### Resource Requirements
- **Time Allocation**: ${useCase.estimatedDuration} minutes estimated
- **Technical Skills**: Intermediate security operations knowledge
- **Prerequisites**: Basic understanding of ${useCase.category} security concepts

### Success Criteria
- Successfully detect simulated attacks
- Create functional detection rules with <5% false positive rate
- Develop complete incident response procedures
- Document lessons learned and improve processes

## Risk Assessment
Identify and mitigate risks associated with training activities:
- Ensure all testing is performed in isolated lab environment
- Verify no production systems are affected
- Implement proper change management procedures
- Document all activities for compliance and audit purposes
      `,
      category: "planning",
      estimatedDuration: 30,
      validationRequired: false
    },
    {
      title: "Alert Layout Configuration",
      description: "Configure alert layouts and notification systems",
      contentTemplate: `
## Alert Layout Design
Create effective alert layouts for ${useCase.title} detection.

### Layout Components
1. **Alert Summary**
   - Threat severity and confidence score
   - Affected assets and user accounts
   - Attack timeline and progression

2. **Technical Details**
   - Detection rule that triggered
   - Raw telemetry data and indicators
   - MITRE ATT&CK technique mapping

3. **Response Actions**
   - Recommended immediate actions
   - Investigation procedures
   - Escalation criteria and contacts

### Configuration Steps
1. **Cortex XSIAM Layout Editor**
   \`\`\`json
   {
     "layout_name": "${useCase.title}_alert",
     "sections": [
       {
         "type": "summary",
         "fields": ["severity", "confidence", "affected_assets"]
       },
       {
         "type": "technical_details", 
         "fields": ["detection_rule", "indicators", "mitre_techniques"]
       },
       {
         "type": "response_actions",
         "fields": ["immediate_actions", "investigation_steps"]
       }
     ]
   }
   \`\`\`

2. **Notification Rules**
   - Configure email/SMS notifications
   - Set up Slack/Teams integration
   - Define escalation timers

### Testing and Validation
- Test with simulated alerts
- Verify all stakeholders receive notifications
- Validate layout clarity and completeness
      `,
      category: "layout_configuration",
      estimatedDuration: 45,
      validationRequired: true,
      dependencies: ["detection_engineering"]
    },
    {
      title: "Script Development for Automation",
      description: "Develop custom scripts for detection and response automation",
      contentTemplate: `
## Automation Script Development
Create custom scripts to enhance detection and response capabilities for ${useCase.title}.

### Script Categories
1. **Data Collection Scripts**
   - Automated evidence gathering
   - System state capture
   - Log aggregation and parsing

2. **Analysis Scripts**
   - Indicator extraction and enrichment
   - Timeline reconstruction
   - Threat correlation analysis

3. **Response Scripts**
   - Automated containment actions
   - User notification systems
   - Remediation procedures

### Example: Evidence Collection Script
\`\`\`python
#!/usr/bin/env python3
"""
Automated evidence collection for ${useCase.title}
"""
import json
import subprocess
import datetime
from pathlib import Path

class EvidenceCollector:
    def __init__(self, case_id):
        self.case_id = case_id
        self.timestamp = datetime.datetime.now().isoformat()
        
    def collect_system_info(self):
        """Collect basic system information"""
        try:
            result = subprocess.run(['systeminfo'], 
                                  capture_output=True, text=True)
            return result.stdout
        except Exception as e:
            return f"Error collecting system info: {e}"
    
    def collect_network_connections(self):
        """Collect active network connections"""
        try:
            result = subprocess.run(['netstat', '-an'], 
                                  capture_output=True, text=True)
            return result.stdout
        except Exception as e:
            return f"Error collecting network info: {e}"
    
    def generate_report(self):
        """Generate comprehensive evidence report"""
        evidence = {
            'case_id': self.case_id,
            'timestamp': self.timestamp,
            'system_info': self.collect_system_info(),
            'network_connections': self.collect_network_connections()
        }
        
        output_file = f"evidence_{self.case_id}_{self.timestamp}.json"
        with open(output_file, 'w') as f:
            json.dump(evidence, f, indent=2)
        
        return output_file

# Usage example
if __name__ == "__main__":
    collector = EvidenceCollector("CASE-001")
    report_file = collector.generate_report()
    print(f"Evidence collected: {report_file}")
\`\`\`

### Integration with XSOAR
- Package scripts as XSOAR integrations
- Define input/output parameters
- Create error handling and logging
- Test with various scenarios

### Documentation and Maintenance
- Document script functionality and usage
- Create troubleshooting guides
- Establish update and version control procedures
      `,
      category: "script_development",
      estimatedDuration: 90,
      validationRequired: true,
      dependencies: ["detection_engineering"]
    },
    {
      title: "Dashboard and Widget Creation",
      description: "Build monitoring dashboards and visualization widgets",
      contentTemplate: `
## Dashboard Design for ${useCase.title}
Create comprehensive monitoring dashboards to track detection effectiveness and threat trends.

### Dashboard Components
1. **Executive Summary Widgets**
   - Threat landscape overview
   - Detection effectiveness metrics
   - Incident response times

2. **Technical Detail Widgets**
   - Alert volume and trends
   - False positive rates
   - Investigation outcomes

3. **Operational Widgets**
   - Team workload distribution
   - Response time metrics
   - Training effectiveness

### Widget Configuration Examples

#### Alert Volume Trend Widget
\`\`\`json
{
  "widget_type": "line_chart",
  "title": "${useCase.title} Alert Trends",
  "data_source": "cortex_xsiam",
  "query": {
    "timeframe": "last_30_days",
    "filters": {
      "alert_name": "${useCase.title}*",
      "severity": ["high", "critical"]
    },
    "group_by": "day",
    "aggregation": "count"
  },
  "visualization": {
    "x_axis": "date",
    "y_axis": "alert_count",
    "color_scheme": "severity_based"
  }
}
\`\`\`

#### Detection Effectiveness Widget
\`\`\`json
{
  "widget_type": "gauge",
  "title": "Detection Accuracy",
  "data_source": "validation_data",
  "query": {
    "calculation": "(true_positives / (true_positives + false_positives)) * 100",
    "timeframe": "last_7_days"
  },
  "thresholds": {
    "green": "> 95%",
    "yellow": "85-95%", 
    "red": "< 85%"
  }
}
\`\`\`

### Implementation Steps
1. **Dashboard Layout Design**
   - Plan widget placement and sizing
   - Consider user workflow and priorities
   - Implement responsive design principles

2. **Data Source Configuration**
   - Connect to Cortex XSIAM APIs
   - Set up data refresh intervals
   - Configure data retention policies

3. **User Access and Permissions**
   - Define role-based access controls
   - Configure sharing and export permissions
   - Set up dashboard subscriptions

### Testing and Optimization
- Validate data accuracy and completeness
- Test dashboard performance with high data volumes
- Gather user feedback and iterate on design
      `,
      category: "dashboard_creation",
      estimatedDuration: 60,
      validationRequired: false,
      dependencies: ["detection_engineering"]
    },
    {
      title: "Analyst Decision Support Workflow",
      description: "Develop decision trees and workflows to support analyst investigations",
      contentTemplate: `
## Decision Support Framework for ${useCase.title}
Create structured decision trees and workflows to guide analyst investigations and ensure consistent response quality.

### Decision Tree Structure
\`\`\`
Alert: ${useCase.title}
├── Initial Triage (5 minutes)
│   ├── Verify alert accuracy
│   ├── Check for false positive indicators
│   └── Assess immediate threat level
├── Investigation Phase (15-30 minutes)
│   ├── Gather additional context
│   ├── Analyze attack progression
│   └── Identify affected systems/users
└── Response Decision (5 minutes)
    ├── Escalate to Tier 2
    ├── Initiate containment
    └── Monitor and document
\`\`\`

### Workflow Implementation

#### 1. Initial Triage Checklist
- [ ] **Alert Validation** (2 minutes)
  - Verify detection rule logic
  - Check for known false positive patterns
  - Confirm data source reliability

- [ ] **Threat Assessment** (3 minutes)
  - Review MITRE ATT&CK techniques
  - Assess attack sophistication
  - Evaluate potential business impact

#### 2. Investigation Procedures
\`\`\`markdown
**Data Collection (10 minutes)**
1. Gather logs from affected systems
2. Collect network traffic captures
3. Obtain process execution history
4. Review user authentication events

**Analysis Framework (15 minutes)**
1. Timeline reconstruction
2. Indicator of compromise (IoC) extraction
3. Attribution and campaign analysis
4. Impact assessment

**Correlation Analysis (5 minutes)**
1. Search for related alerts
2. Check threat intelligence feeds
3. Review historical incidents
4. Identify attack patterns
\`\`\`

#### 3. Decision Matrix
| Criteria | Low Risk | Medium Risk | High Risk |
|----------|----------|-------------|-----------|
| Asset Criticality | Non-critical | Important | Mission-critical |
| Data Sensitivity | Public | Internal | Confidential |
| Attack Sophistication | Basic | Intermediate | Advanced |
| Potential Impact | Minimal | Moderate | Severe |

**Action Matrix:**
- **Low Risk**: Monitor, document, routine response
- **Medium Risk**: Enhanced monitoring, stakeholder notification
- **High Risk**: Immediate escalation, emergency response

### Automation Support Tools

#### Decision Support Script
\`\`\`python
class DecisionSupport:
    def __init__(self, alert_data):
        self.alert = alert_data
        self.risk_score = 0
        
    def calculate_risk_score(self):
        """Calculate risk score based on multiple factors"""
        factors = {
            'asset_criticality': self.assess_asset_criticality(),
            'data_sensitivity': self.assess_data_sensitivity(),
            'attack_sophistication': self.assess_sophistication(),
            'potential_impact': self.assess_impact()
        }
        
        weights = {
            'asset_criticality': 0.3,
            'data_sensitivity': 0.25,
            'attack_sophistication': 0.25,
            'potential_impact': 0.2
        }
        
        self.risk_score = sum(factors[k] * weights[k] for k in factors)
        return self.risk_score
    
    def recommend_action(self):
        """Provide action recommendation based on risk score"""
        if self.risk_score >= 0.8:
            return "HIGH_PRIORITY_ESCALATION"
        elif self.risk_score >= 0.5:
            return "STANDARD_INVESTIGATION"
        else:
            return "ROUTINE_MONITORING"
\`\`\`

### Training and Documentation
- Create analyst training materials
- Develop decision tree quick reference guides
- Establish feedback mechanisms for process improvement
- Regular review and update of decision criteria
      `,
      category: "decision_support",
      estimatedDuration: 75,
      validationRequired: true,
      dependencies: ["detection_engineering", "layout_configuration"]
    },
    {
      title: "Response Plan Development",
      description: "Create comprehensive incident response plans and procedures",
      contentTemplate: `
## Incident Response Plan for ${useCase.title}
Develop comprehensive response procedures to effectively handle incidents related to ${useCase.description}.

### Response Framework Overview
\`\`\`
Incident Lifecycle:
Detection → Triage → Investigation → Containment → Eradication → Recovery → Lessons Learned
\`\`\`

### Immediate Response Procedures (0-30 minutes)

#### 1. Alert Reception and Initial Assessment
- **Notification Channels**: Email, SIEM alerts, phone escalation
- **Initial Response Team**: SOC Analyst, Shift Lead
- **Assessment Criteria**:
  - Threat severity and confidence level
  - Affected systems and user count
  - Potential business impact

#### 2. Containment Decision Matrix
| Severity | Affected Systems | Immediate Action | Timeline |
|----------|------------------|------------------|----------|
| Critical | Production | Emergency containment | 15 minutes |
| High | Multiple systems | Rapid isolation | 30 minutes |
| Medium | Single system | Controlled containment | 1 hour |
| Low | Monitoring only | Enhanced monitoring | 4 hours |

### Investigation Procedures (30 minutes - 4 hours)

#### Evidence Collection Checklist
- [ ] **System State Capture**
  - Memory dumps from affected systems
  - Disk images (if required)
  - Network packet captures
  - Process execution logs

- [ ] **Log Analysis**
  - Authentication logs (4 hours before/after)
  - Network flow data
  - Endpoint detection logs
  - Application logs

#### Forensic Analysis Framework
\`\`\`bash
# Automated evidence collection script
#!/bin/bash
CASE_ID="INC-$(date +%Y%m%d-%H%M%S)"
EVIDENCE_DIR="/tmp/evidence/$CASE_ID"

# Create evidence directory
mkdir -p "$EVIDENCE_DIR"

# Collect system information
systeminfo > "$EVIDENCE_DIR/systeminfo.txt"
netstat -an > "$EVIDENCE_DIR/network_connections.txt"
tasklist /svc > "$EVIDENCE_DIR/running_processes.txt"

# Collect logs
wevtutil qe Security /f:text > "$EVIDENCE_DIR/security_logs.txt"
wevtutil qe System /f:text > "$EVIDENCE_DIR/system_logs.txt"

echo "Evidence collected in: $EVIDENCE_DIR"
\`\`\`

### Containment Strategies

#### Network-Based Containment
1. **Firewall Rules**
   - Block malicious IP addresses
   - Restrict network communication
   - Isolate affected subnets

2. **DNS Blocking**
   - Block malicious domains
   - Implement DNS sinkholing
   - Update threat intelligence feeds

#### Endpoint-Based Containment
1. **Process Termination**
   - Kill malicious processes
   - Remove persistence mechanisms
   - Clear malicious scheduled tasks

2. **System Isolation**
   - Network isolation
   - User account lockdown
   - Service termination

### Communication Plan

#### Internal Communications
- **Immediate**: SOC Team, Security Management
- **1 Hour**: IT Operations, Business Stakeholders
- **4 Hours**: Executive Leadership (if high impact)
- **24 Hours**: Legal, Compliance, HR (if data breach)

#### External Communications
- **Regulatory**: Data protection authorities (72 hours)
- **Law Enforcement**: If criminal activity suspected
- **Customers/Partners**: If external impact confirmed
- **Media**: Coordinated through communications team

### Recovery Procedures

#### System Restoration Checklist
- [ ] Verify threat eradication
- [ ] Apply security patches
- [ ] Reset compromised credentials
- [ ] Restore from clean backups
- [ ] Implement additional monitoring
- [ ] Conduct penetration testing

#### Business Continuity
- Activate backup systems and processes
- Communicate with affected customers
- Monitor for service disruption
- Coordinate with business units

### Post-Incident Activities

#### Lessons Learned Session
- **Participants**: Response team, stakeholders, management
- **Agenda**:
  - Timeline review and analysis
  - Response effectiveness assessment
  - Process improvement recommendations
  - Tool and technology gaps identified

#### Documentation Requirements
- Detailed incident timeline
- Evidence collection and analysis reports
- Response actions taken and their effectiveness
- Recommendations for prevention and improvement

### Response Plan Testing
- Quarterly tabletop exercises
- Annual full-scale simulations
- Regular plan review and updates
- Team training and certification maintenance
      `,
      category: "response_planning",
      estimatedDuration: 120,
      validationRequired: true,
      dependencies: ["detection_engineering", "layout_configuration"]
    },
    {
      title: "XSOAR Automation Playbook Development",
      description: "Create comprehensive automation playbooks for triage, investigation, response, containment, and resiliency",
      contentTemplate: `
## XSOAR Playbook Development for ${useCase.title}
Create comprehensive automation playbooks to streamline incident response and reduce manual effort.

### Playbook Architecture Overview
\`\`\`
Main Playbook: ${useCase.title}_Master
├── Sub-Playbook: Triage_Automation
├── Sub-Playbook: Investigation_Automation  
├── Sub-Playbook: Response_Automation
├── Sub-Playbook: Containment_Automation
└── Sub-Playbook: Resiliency_Automation
\`\`\`

### 1. Triage Automation Playbook

#### Playbook Flow
\`\`\`yaml
name: "${useCase.title}_Triage"
description: "Automated triage for ${useCase.title} alerts"

tasks:
  - name: "Enrich Alert Data"
    type: "builtin"
    script: "enrichment"
    inputs:
      - indicators: "\${incident.indicators}"
      - sources: ["VirusTotal", "ThreatExchange", "Internal_TI"]
    
  - name: "Asset Criticality Check"
    type: "conditional"
    condition: "\${asset.criticality} in ['HIGH', 'CRITICAL']"
    
  - name: "False Positive Check"
    type: "script"
    script: "fp_checker"
    inputs:
      - alert_data: "\${incident.rawJSON}"
      - whitelist: "\${context.whitelist}"
    
  - name: "Severity Calculation"
    type: "script"
    script: "calculate_severity"
    outputs:
      - calculated_severity: "\${outputs.severity}"
      - confidence_score: "\${outputs.confidence}"
\`\`\`

#### Custom Scripts
\`\`\`python
# False Positive Checker Script
def fp_checker(alert_data, whitelist):
    """Check for known false positive patterns"""
    fp_indicators = []
    
    # Check against whitelist
    for indicator in alert_data.get('indicators', []):
        if indicator['value'] in whitelist:
            fp_indicators.append(indicator)
    
    # Check for known FP patterns
    fp_patterns = [
        r'legitimate_admin_tool\.exe',
        r'windows\\\\system32\\\\svchost\.exe',
        r'scheduled_backup_.*'
    ]
    
    for pattern in fp_patterns:
        if re.search(pattern, str(alert_data)):
            return {"is_false_positive": True, "reason": f"Matches pattern: {pattern}"}
    
    return {"is_false_positive": False, "confidence": 0.9}
\`\`\`

### 2. Investigation Automation Playbook

#### Data Collection Tasks
\`\`\`yaml
tasks:
  - name: "Collect Host Information"
    type: "integration"
    integration: "CortexXDR"
    command: "xdr-get-endpoints"
    inputs:
      - hostname: "\${incident.hostname}"
    
  - name: "Gather Network Data"
    type: "integration"
    integration: "Splunk"
    command: "splunk-search"
    inputs:
      - query: "index=network src=\${incident.src_ip} | head 100"
      - earliest_time: "-4h"
    
  - name: "Threat Intelligence Lookup"
    type: "integration"
    integration: "ThreatExchange"
    command: "threatexchange-query"
    inputs:
      - indicator: "\${incident.indicators}"
\`\`\`

#### Analysis and Correlation
\`\`\`python
# Timeline Reconstruction Script
def build_timeline(host_data, network_data, auth_logs):
    """Create chronological timeline of events"""
    events = []
    
    # Process host events
    for event in host_data:
        events.append({
            'timestamp': event['timestamp'],
            'source': 'endpoint',
            'description': event['description'],
            'severity': event.get('severity', 'info')
        })
    
    # Process network events
    for event in network_data:
        events.append({
            'timestamp': event['timestamp'],
            'source': 'network',
            'description': f"Network connection: {event['src']} -> {event['dst']}",
            'severity': 'info'
        })
    
    # Sort by timestamp
    timeline = sorted(events, key=lambda x: x['timestamp'])
    
    return timeline
\`\`\`

### 3. Response Automation Playbook

#### Notification and Escalation
\`\`\`yaml
tasks:
  - name: "Notify SOC Team"
    type: "integration"
    integration: "Slack"
    command: "send-notification"
    inputs:
      - channel: "#soc-alerts"
      - message: "High severity incident: \${incident.name}"
      - urgency: "\${incident.severity}"
    
  - name: "Create ServiceNow Ticket"
    type: "integration"
    integration: "ServiceNow"
    command: "servicenow-create-ticket"
    inputs:
      - category: "Security Incident"
      - priority: "\${incident.severity}"
      - description: "\${incident.details}"
    
  - name: "Escalation Decision"
    type: "conditional"
    condition: "\${incident.severity} in ['HIGH', 'CRITICAL']"
    true_path: "escalate_to_manager"
    false_path: "standard_response"
\`\`\`

### 4. Containment Automation Playbook

#### Network Containment
\`\`\`yaml
tasks:
  - name: "Block Malicious IPs"
    type: "integration"
    integration: "PaloAltoFirewall"
    command: "panorama-block-ip"
    inputs:
      - ip_addresses: "\${incident.malicious_ips}"
      - rule_name: "Auto_Block_\${incident.id}"
    
  - name: "DNS Blocking"
    type: "integration"
    integration: "Infoblox"
    command: "infoblox-create-rpz-rule"
    inputs:
      - fqdn: "\${incident.malicious_domains}"
      - action: "block"
\`\`\`

#### Endpoint Containment
\`\`\`yaml
tasks:
  - name: "Isolate Endpoint"
    type: "integration"
    integration: "CortexXDR"
    command: "xdr-isolate-endpoint"
    inputs:
      - endpoint_id: "\${incident.endpoint_id}"
      - isolation_type: "full"
    
  - name: "Terminate Processes"
    type: "integration"
    integration: "CortexXDR"
    command: "xdr-kill-process"
    inputs:
      - endpoint_id: "\${incident.endpoint_id}"
      - process_name: "\${incident.malicious_process}"
\`\`\`

### 5. Resiliency Automation Playbook

#### Recovery Operations
\`\`\`yaml
tasks:
  - name: "Verify Threat Removal"
    type: "script"
    script: "verify_cleanup"
    inputs:
      - endpoint_id: "\${incident.endpoint_id}"
      - indicators: "\${incident.indicators}"
    
  - name: "Apply Security Patches"
    type: "integration"
    integration: "WSUS"
    command: "wsus-install-updates"
    inputs:
      - computer_group: "affected_systems"
      - update_classification: "Security Updates"
    
  - name: "Reset Compromised Credentials"
    type: "integration"
    integration: "ActiveDirectory"
    command: "ad-reset-password"
    inputs:
      - username: "\${incident.affected_users}"
      - force_change: true
\`\`\`

#### Monitoring Enhancement
\`\`\`python
# Enhanced Monitoring Script
def deploy_additional_monitoring(endpoint_id, threat_type):
    """Deploy additional monitoring based on threat type"""
    
    monitoring_rules = {
        'credential_theft': [
            'monitor_lsass_access',
            'monitor_kerberos_anomalies',
            'monitor_privilege_escalation'
        ],
        'lateral_movement': [
            'monitor_rdp_connections',
            'monitor_smb_enumeration',
            'monitor_process_injection'
        ],
        'data_exfiltration': [
            'monitor_large_transfers',
            'monitor_dns_tunneling',
            'monitor_compression_tools'
        ]
    }
    
    rules = monitoring_rules.get(threat_type, [])
    
    for rule in rules:
        deploy_monitoring_rule(endpoint_id, rule)
    
    return f"Deployed {len(rules)} additional monitoring rules"
\`\`\`

### Playbook Testing and Validation

#### Test Scenarios
1. **Unit Testing**: Individual task validation
2. **Integration Testing**: Cross-system functionality
3. **End-to-End Testing**: Complete playbook execution
4. **Performance Testing**: Response time validation

#### Metrics and KPIs
- **Mean Time to Detection (MTTD)**: < 15 minutes
- **Mean Time to Response (MTTR)**: < 1 hour
- **Automation Coverage**: > 80% of tasks automated
- **False Positive Rate**: < 5%

### Maintenance and Updates
- Monthly playbook review and optimization
- Quarterly threat landscape updates
- Annual comprehensive testing and validation
- Continuous integration with new security tools
      `,
      category: "automation_playbook",
      estimatedDuration: 180,
      validationRequired: true,
      dependencies: ["response_planning", "script_development"]
    },
    {
      title: "Learning Summary and Outcomes Assessment",
      description: "Document lessons learned and assess training effectiveness",
      contentTemplate: `
## Training Summary for ${useCase.title}

### Learning Objectives Review
Evaluate achievement of training objectives and document key takeaways.

#### Objective Assessment
| Objective | Target | Achieved | Comments |
|-----------|--------|----------|----------|
| Threat Understanding | 100% | ___% | Understanding of ${useCase.title} threat landscape |
| Detection Capability | 95% accuracy | ___% | Detection rule effectiveness and tuning |
| Response Procedures | < 1 hour MTTR | ___ hours | Incident response time achievement |
| Process Documentation | Complete | ___% | Documentation completeness and quality |

### Key Learning Outcomes

#### Technical Skills Developed
- **Detection Engineering**: Created ${useCase.category} detection rules with XQL
- **Incident Response**: Developed comprehensive response procedures
- **Automation**: Built XSOAR playbooks for ${useCase.title} scenarios
- **Forensic Analysis**: Performed evidence collection and timeline reconstruction

#### Operational Improvements
- **Process Optimization**: Streamlined investigation workflows
- **Tool Integration**: Enhanced SIEM and SOAR integration
- **Team Coordination**: Improved cross-functional collaboration
- **Documentation**: Created standardized response procedures

#### Security Posture Enhancement
- **Coverage Expansion**: Added detection for ${useCase.description}
- **Response Capability**: Reduced manual effort through automation
- **Threat Intelligence**: Integrated new IoCs and TTPs
- **Monitoring Enhancement**: Improved visibility into ${useCase.category} threats

### Metrics and Performance Data

#### Detection Effectiveness
\`\`\`
True Positives: ___ 
False Positives: ___
True Negatives: ___
False Negatives: ___

Precision: ___% (TP / (TP + FP))
Recall: ___% (TP / (TP + FN))
F1 Score: ___% (2 * Precision * Recall / (Precision + Recall))
\`\`\`

#### Response Performance
- **Initial Response Time**: ___ minutes (Target: < 15 minutes)
- **Investigation Time**: ___ minutes (Target: < 60 minutes)
- **Containment Time**: ___ minutes (Target: < 30 minutes)
- **Resolution Time**: ___ hours (Target: < 4 hours)

#### Automation Success Rate
- **Playbook Execution Success**: ___%
- **Manual Intervention Required**: ___%
- **Time Saved Through Automation**: ___ hours per incident

### Challenges and Solutions

#### Technical Challenges
1. **Challenge**: [Describe technical difficulty encountered]
   - **Impact**: [Effect on training or detection capability]
   - **Solution**: [How it was resolved]
   - **Lessons Learned**: [Key takeaways for future]

2. **Challenge**: [Another technical challenge]
   - **Impact**: [Effect description]
   - **Solution**: [Resolution approach]
   - **Lessons Learned**: [Insights gained]

#### Process Challenges
1. **Challenge**: [Process or workflow issue]
   - **Impact**: [Effect on operations]
   - **Solution**: [Process improvement implemented]
   - **Lessons Learned**: [Process insights]

### Recommendations for Improvement

#### Short-term (1-3 months)
- [ ] **Detection Tuning**: Refine detection rules to reduce false positives
- [ ] **Documentation Updates**: Enhance response procedures based on lessons learned
- [ ] **Team Training**: Conduct additional training on identified knowledge gaps
- [ ] **Tool Integration**: Improve integration between security tools

#### Medium-term (3-6 months)
- [ ] **Advanced Analytics**: Implement machine learning for improved detection
- [ ] **Threat Hunting**: Develop proactive hunting procedures for this threat type
- [ ] **Red Team Exercises**: Conduct adversarial testing of detection capabilities
- [ ] **Cross-team Training**: Extend training to other security teams

#### Long-term (6-12 months)
- [ ] **Technology Upgrades**: Evaluate and implement new security technologies
- [ ] **Process Automation**: Expand automation to cover additional use cases
- [ ] **Maturity Assessment**: Conduct comprehensive security maturity evaluation
- [ ] **Industry Sharing**: Share lessons learned with security community

### Knowledge Transfer Plan

#### Documentation Deliverables
- [ ] **Detection Rule Library**: Documented and tested detection rules
- [ ] **Response Playbooks**: Step-by-step incident response procedures
- [ ] **Training Materials**: Reusable training content for future engineers
- [ ] **Lessons Learned Report**: Comprehensive summary of insights and recommendations

#### Training Materials Created
- Detection rule development guide
- Incident response quick reference
- XSOAR playbook documentation
- Troubleshooting and FAQ guide

#### Mentoring and Knowledge Sharing
- **Peer Training Sessions**: Conduct sessions with other team members
- **Documentation Review**: Ensure all procedures are clearly documented
- **Best Practices Guide**: Create guide for similar future training
- **Community Contribution**: Share anonymized insights with security community

### Continuous Improvement Framework

#### Regular Review Process
- **Weekly**: Review detection effectiveness and false positive rates
- **Monthly**: Assess response time metrics and process efficiency
- **Quarterly**: Comprehensive review of detection coverage and gaps
- **Annually**: Full training program evaluation and enhancement

#### Feedback Mechanisms
- **Incident Reviews**: Post-incident analysis and improvement identification
- **Team Retrospectives**: Regular team discussions on process improvements
- **Stakeholder Feedback**: Input from business stakeholders and other teams
- **External Benchmarking**: Compare performance against industry standards

### Certification and Validation

#### Skills Validation
- [ ] **Practical Assessment**: Demonstrate detection rule creation
- [ ] **Scenario Testing**: Successfully respond to simulated incidents
- [ ] **Documentation Review**: Validate completeness and accuracy
- [ ] **Peer Review**: Technical review by senior team members

#### Certification Criteria Met
- [ ] Successfully created functional detection rules
- [ ] Demonstrated incident response capability
- [ ] Completed all training modules and assessments
- [ ] Documented lessons learned and recommendations

### Next Steps and Career Development

#### Recommended Follow-up Training
- Advanced threat hunting techniques
- Additional MITRE ATT&CK techniques
- Specialized tools and technologies
- Leadership and communication skills

#### Career Progression Opportunities
- Subject matter expert for ${useCase.category} threats
- Training program developer and instructor
- Advanced threat researcher and analyst
- Security team leadership roles

This completes the comprehensive training path for ${useCase.title}. All learning objectives have been addressed through hands-on experience, practical application, and documented knowledge transfer.
      `,
      category: "learning_summary",
      estimatedDuration: 60,
      validationRequired: false,
      dependencies: ["automation_playbook"]
    }
  ];
  
  // Combine category-specific and common steps
  const allSteps = [...commonSteps, ...templates];
  
  // Enhance steps with authentic templates and AI considerations
  
  // Generate training steps with proper IDs and ordering
  const steps: TrainingStep[] = allSteps.map((template, index) => {
    let enhancedContent = template.contentTemplate;
    
    // Enhance with authentic templates based on step category
    if (template.category === 'detection_engineering') {
      const xqlQuery = generateCategorySpecificXQLQuery(useCase.title, useCase.category, useCase.description);
      enhancedContent += `\n\n### Custom XQL Detection Rule\n\`\`\`xql\n${xqlQuery}\n\`\`\`\n`;
    }
    
    if (template.category === 'layout_configuration') {
      const layoutConfig = generateLayoutConfiguration(useCase.title, useCase.category);
      enhancedContent += `\n\n### Alert Layout Configuration\n\`\`\`json\n${layoutConfig}\n\`\`\`\n`;
    }
    
    if (template.category === 'automation_engineering') {
      const playbookYaml = generatePlaybookYAML(useCase.title, useCase.category);
      enhancedContent += `\n\n### Response Playbook\n\`\`\`yaml\n${playbookYaml}\n\`\`\`\n`;
    }
    
    if (template.category === 'script_development') {
      const scriptCode = generateScriptYAML(useCase.title, 'automation');
      enhancedContent += `\n\n### Custom Automation Script\n\`\`\`yaml\n${scriptCode}\n\`\`\`\n`;
    }
    
    // Add AI/LLM specific considerations if detected
    if (isAIThreat) {
      enhancedContent += generateAIThreatConsiderations(useCase);
    }
    
    return {
      id: `step_${index + 1}`,
      title: template.title,
      description: template.description,
      content: enhancedContent,
      order: index + 1,
      category: template.category,
      estimatedDuration: template.estimatedDuration,
      completed: false,
      validationRequired: template.validationRequired,
      dependencies: template.dependencies || []
    };
  });
  
  const totalDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
  
  return {
    id: `training_${useCase.id}`,
    useCaseId: useCase.id,
    title: `Complete Training Path: ${useCase.title}`,
    description: `Comprehensive step-by-step training for developing detection and response capabilities for ${useCase.title}`,
    totalDuration,
    steps,
    progress: 0,
    status: "not_started",
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

export function validateTrainingStep(step: TrainingStep, context: any): { 
  isValid: boolean; 
  issues: string[]; 
  recommendations: string[] 
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Validate step completeness
  if (!step.content || step.content.trim().length < 100) {
    issues.push("Step content is insufficient or missing");
    recommendations.push("Expand step content with detailed procedures and examples");
  }
  
  // Validate dependencies
  if (step.dependencies && step.dependencies.length > 0) {
    const incompleteDeps = step.dependencies.filter(depId => 
      !context.completedSteps?.includes(depId)
    );
    if (incompleteDeps.length > 0) {
      issues.push(`Incomplete dependencies: ${incompleteDeps.join(', ')}`);
      recommendations.push("Complete prerequisite steps before proceeding");
    }
  }
  
  // Category-specific validations
  switch (step.category) {
    case "detection_engineering":
      if (!step.content.includes("XQL") && !step.content.includes("query")) {
        issues.push("Detection engineering step should include query examples");
        recommendations.push("Add sample detection queries and rule logic");
      }
      break;
      
    case "automation_playbook":
      if (!step.content.includes("playbook") && !step.content.includes("XSOAR")) {
        issues.push("Automation step should include playbook details");
        recommendations.push("Include XSOAR playbook configuration and scripts");
      }
      break;
      
    case "environment_buildout":
      if (!step.content.includes("install") && !step.content.includes("configure")) {
        issues.push("Environment setup should include installation steps");
        recommendations.push("Add detailed installation and configuration procedures");
      }
      break;
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}

// AI/LLM Threat Detection Functions based on OWASP Top 10 for LLMs
function detectAIThreats(description: string): boolean {
  const aiThreatKeywords = [
    'llm', 'large language model', 'ai', 'artificial intelligence',
    'chatbot', 'prompt injection', 'model poisoning', 'data leakage',
    'insecure output handling', 'overreliance', 'inadequate sandboxing',
    'unauthorized code execution', 'ssrf', 'overreliance on llm',
    'training data poisoning', 'model theft', 'supply chain vulnerabilities',
    'sensitive information disclosure', 'excessive agency', 'hallucination',
    'bias', 'fairness', 'adversarial inputs', 'model inversion',
    'membership inference', 'gradient leakage', 'backdoor attacks'
  ];
  
  const lowerDescription = description.toLowerCase();
  return aiThreatKeywords.some(keyword => lowerDescription.includes(keyword));
}

function generateAIThreatConsiderations(useCase: UseCase): string {
  const aiThreats = getOWASPLLMThreats();
  const relevantThreats = aiThreats.filter(threat => 
    threat.keywords.some(keyword => 
      useCase.description.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (relevantThreats.length === 0) {
    relevantThreats.push(aiThreats[0]); // Default to LLM01 if no specific match
  }

  return `

## AI/LLM Security Considerations (OWASP Top 10 for LLMs)

Based on the OWASP Top 10 for Large Language Model Applications, the following AI-specific threats should be considered:

${relevantThreats.map(threat => `
### ${threat.id}: ${threat.name}

**Description:** ${threat.description}

**Detection Strategies:**
${threat.detectionStrategies.map(strategy => `- ${strategy}`).join('\n')}

**XQL Query Examples:**
\`\`\`xql
${threat.xqlExample}
\`\`\`

**Mitigation Techniques:**
${threat.mitigations.map(mitigation => `- ${mitigation}`).join('\n')}

**Training Lab Setup:**
${threat.labSetup}

---
`).join('')}

### AI Threat Hunting Queries

\`\`\`xql
// Hunt for potential prompt injection attempts
config case_sensitive = false timeframe between "7 days ago" and "now"
| dataset = xdr_data
| filter action_process_command_line ~= "prompt|inject|system|role|assistant"
| comp count() as injection_attempts by endpoint_name, action_process_command_line
| sort desc injection_attempts

// Monitor for AI model access anomalies
config case_sensitive = false timeframe between "24 hours ago" and "now"
| dataset = xdr_network
| filter action_remote_port in (443, 80, 8080) and action_remote_ip ~= "api\\.openai\\.com|anthropic\\.com|huggingface\\.co"
| comp count() as api_calls by endpoint_name, action_remote_ip
| sort desc api_calls
\`\`\`

### Validation Criteria for AI Threats
- [ ] Verify detection rules catch prompt injection patterns
- [ ] Test for unauthorized model access attempts
- [ ] Validate data exfiltration through AI APIs
- [ ] Confirm monitoring of training data integrity
- [ ] Check for model output manipulation detection
`;
}

function getOWASPLLMThreats() {
  return [
    {
      id: "LLM01",
      name: "Prompt Injection",
      description: "Manipulating LLMs through crafted inputs that cause the model to execute unintended actions or reveal sensitive information.",
      keywords: ["prompt", "injection", "jailbreak", "system prompt", "role manipulation"],
      detectionStrategies: [
        "Monitor for unusual prompt patterns in user inputs",
        "Detect attempts to manipulate system prompts",
        "Track unauthorized role or persona changes",
        "Identify attempts to extract system instructions"
      ],
      xqlExample: `// Detect potential prompt injection attempts
config case_sensitive = false timeframe between "24 hours ago" and "now"
| dataset = xdr_data
| filter action_process_command_line ~= "ignore previous|system prompt|you are now|jailbreak"
| comp count() as injection_attempts by endpoint_name, action_process_command_line`,
      mitigations: [
        "Implement input validation and sanitization",
        "Use prompt templates with parameter binding",
        "Deploy content filtering and monitoring",
        "Implement output validation before display"
      ],
      labSetup: "Set up a controlled AI application with monitoring to test prompt injection detection capabilities."
    },
    {
      id: "LLM02", 
      name: "Insecure Output Handling",
      description: "Insufficient validation, sanitization, and handling of LLM outputs before passing them to downstream systems.",
      keywords: ["output", "validation", "sanitization", "xss", "injection"],
      detectionStrategies: [
        "Monitor for malicious scripts in LLM outputs",
        "Detect code injection attempts through AI responses",
        "Track unauthorized command execution from AI outputs",
        "Identify XSS attempts in web-facing AI applications"
      ],
      xqlExample: `// Monitor for potentially malicious LLM outputs
config case_sensitive = false timeframe between "24 hours ago" and "now"
| dataset = xdr_data  
| filter action_process_command_line ~= "<script>|javascript:|eval\\(|exec\\("
| comp count() as malicious_outputs by endpoint_name, action_process_command_line`,
      mitigations: [
        "Validate and sanitize all LLM outputs",
        "Implement proper encoding for web contexts",
        "Use parameterized queries for database operations",
        "Deploy content security policies"
      ],
      labSetup: "Create test scenarios with AI outputs containing various injection payloads to verify detection."
    },
    {
      id: "LLM03",
      name: "Training Data Poisoning", 
      description: "Manipulation of training data or fine-tuning processes to introduce vulnerabilities or biases into the model.",
      keywords: ["training", "poisoning", "backdoor", "data integrity", "model corruption"],
      detectionStrategies: [
        "Monitor training data sources for integrity",
        "Detect unauthorized modifications to datasets",
        "Track unusual model behavior patterns",
        "Identify potential backdoor triggers in outputs"
      ],
      xqlExample: `// Monitor training data access and modifications
config case_sensitive = false timeframe between "7 days ago" and "now"
| dataset = xdr_data
| filter action_file_path ~= "training|dataset|model" and action_file_md5 != ""
| comp count() as file_modifications by endpoint_name, action_file_path`,
      mitigations: [
        "Implement data provenance tracking",
        "Use cryptographic signatures for training data",
        "Deploy model behavior monitoring",
        "Implement adversarial testing"
      ],
      labSetup: "Set up monitoring for training pipeline integrity and model behavior anomalies."
    }
  ];
}
