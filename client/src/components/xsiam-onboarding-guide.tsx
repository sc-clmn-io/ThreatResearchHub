import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Circle, 
  Database, 
  Server, 
  Shield, 
  Info,
  ExternalLink,
  Download,
  Clock,
  Users,
  Target
} from "lucide-react";

interface XSIAMOnboardingGuideProps {
  useCase: any;
  onComplete: (config: any) => void;
}

export default function XSIAMOnboardingGuide({ useCase, onComplete }: XSIAMOnboardingGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  // Generate threat-specific data source requirements
  const generateDataSourceRequirements = (useCase: any) => {
    const requirements: Record<string, string[]> = {
      endpoint: ['Windows Event Logs', 'Sysmon', 'EDR Logs'],
      network: ['Firewall Logs', 'DNS Logs', 'Proxy Logs', 'NetFlow'],
      cloud: ['AWS CloudTrail', 'Azure Activity Logs', 'Office 365 Logs'],
      identity: ['Active Directory Logs', 'LDAP Logs', 'Authentication Logs']
    };

    const categoryRequirements = requirements[useCase.category as string] || requirements.endpoint;
    
    // Add specific requirements based on technologies
    if (useCase.technologies?.includes('Kubernetes')) {
      categoryRequirements.push('Kubernetes Audit Logs', 'Container Runtime Logs');
    }
    if (useCase.technologies?.includes('AWS')) {
      categoryRequirements.push('AWS CloudTrail', 'AWS VPC Flow Logs', 'AWS GuardDuty');
    }
    if (useCase.technologies?.includes('Azure')) {
      categoryRequirements.push('Azure Activity Logs', 'Azure Security Center', 'Azure AD Logs');
    }

    return Array.from(new Set(categoryRequirements));
  };

  const dataSourceRequirements = generateDataSourceRequirements(useCase);

  // Generate comprehensive XSIAM fields based on category
  const generateXSIAMFields = (category: string) => {
    const fields: Record<string, string> = {
      endpoint: `□ event_type - Type of endpoint event (logon, process, file, registry)
□ user_name - Username associated with the event
□ host_name - Source hostname
□ process_name - Process name for execution events
□ command_line - Full command line for process events
□ file_path - File path for file system events
□ registry_key - Registry key for registry events
□ pid - Process ID
□ parent_pid - Parent process ID
□ timestamp - Event timestamp in XSIAM format`,
      network: `□ src_ip - Source IP address
□ dest_ip - Destination IP address  
□ src_port - Source port number
□ dest_port - Destination port number
□ protocol - Network protocol (TCP/UDP/ICMP)
□ action - Firewall action (allow/deny/drop)
□ bytes_sent - Bytes transmitted
□ bytes_received - Bytes received
□ connection_state - Connection state
□ timestamp - Event timestamp`,
      cloud: `□ user_identity - AWS/Azure user identity
□ event_name - API call or action name
□ event_source - Service that generated the event
□ source_ip - Source IP of the request
□ user_agent - User agent string
□ error_code - Error code if applicable
□ request_id - Unique request identifier
□ region - Cloud region
□ resource_name - Target resource
□ timestamp - Event timestamp`,
      identity: `□ user_name - authenticated user
□ logon_type - type of authentication
□ src_ip - authentication source
□ computer_name - target system
□ auth_result - success/failure`
    };
    
    return fields[category] || fields['endpoint'];
  };

  const onboardingPhases = [
    {
      id: 'prerequisites',
      name: 'Prerequisites & Access',
      description: 'Verify XSIAM tenant access and gather required information',
      estimatedTime: '15-20 minutes',
      steps: [
        {
          id: 'tenant_access',
          title: 'Verify XSIAM Tenant Access',
          description: 'Confirm you have proper access to your XSIAM tenant',
          required: true,
          instructions: `1. Navigate to your XSIAM tenant URL: https://[your-tenant].xdr.us.paloaltonetworks.com
2. Log in with your credentials
3. Verify you can access the main dashboard
4. Note your tenant ID for later reference
5. Ensure you have sufficient permissions for data source configuration

IMPORTANT: If you cannot access the tenant, contact your XSIAM administrator before proceeding.`,
          validation: 'Successfully logged into XSIAM tenant and can navigate the interface'
        },
        {
          id: 'api_keys',
          title: 'Generate API Keys',
          description: 'Create API keys for programmatic access to XSIAM',
          required: true,
          instructions: `1. Navigate to Settings → API Keys
2. Click "New API Key"
3. Provide a descriptive name: "Data Source Integration - [Your Name]"
4. Select appropriate permissions:
   - Data Sources: Read/Write
   - Incidents: Read
   - Investigation: Read
5. Copy and securely store the API key
6. Test API connectivity using curl or Postman

API Test Command:
curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     "https://[tenant].xdr.us.paloaltonetworks.com/api/v1/health"`,
          validation: 'API key generated and connectivity test successful'
        },
        {
          id: 'requirements_review',
          title: 'Review Data Source Requirements',
          description: `Understand the specific data sources needed for ${useCase.title}`,
          required: true,
          instructions: `Based on the threat use case analysis, the following data sources are required:

${dataSourceRequirements.map(source => `• ${source}`).join('\n')}

For each data source, you will need:
1. Administrative access to the source system
2. Network connectivity between source and XSIAM Broker
3. Appropriate credentials for data collection
4. Understanding of log format and volume

XSIAM Field Mapping for ${useCase.category} category:
${generateXSIAMFields(useCase.category)}

Document any missing prerequisites now to avoid delays during setup.`,
          validation: 'All data source requirements reviewed and prerequisites documented'
        }
      ]
    },
    {
      id: 'data_source_planning',
      name: 'Data Source Planning',
      description: 'Plan and configure required data sources',
      estimatedTime: '30-45 minutes',
      steps: [
        {
          id: 'source_identification',
          title: 'Identify Required Data Sources',
          description: `Map threat requirements to data sources for ${useCase.title}`,
          required: true,
          instructions: `Review threat analysis: ${useCase.description?.substring(0, 100)}...

Required data sources: ${dataSourceRequirements.join(', ')}

1. Verify data sources are available in your environment
2. Document any missing data sources for infrastructure planning
3. Identify data source owners and contact information
4. Review data sensitivity and compliance requirements
5. Estimate data volume and retention needs

For each data source, document:
- Current logging configuration
- Log retention period
- Network path to XSIAM Broker
- Authentication method required
- Any filtering or parsing requirements`,
          validation: 'All required data sources identified and availability confirmed'
        },
        {
          id: 'broker_setup',
          title: 'Configure XSIAM Broker',
          description: 'Set up data collection infrastructure',
          required: true,
          instructions: `1. Navigate to Settings → Data Sources → Broker
2. Download XSIAM Broker installer for your environment:
   - Windows: Download .msi installer
   - Linux: Download .deb or .rpm package
   - Docker: Use provided container image

3. Install broker on designated collection server:
   
   For Windows:
   - Run installer as Administrator
   - Follow installation wizard
   - Ensure Windows Firewall allows XSIAM Broker
   
   For Linux:
   sudo dpkg -i xsiam-broker.deb
   # or
   sudo rpm -i xsiam-broker.rpm
   
   For Docker:
   docker run -d --name xsiam-broker \\
     -e XSIAM_TENANT_ID=your-tenant-id \\
     -e XSIAM_API_KEY=your-api-key \\
     paloaltonetworks/xsiam-broker:latest

4. Configure network connectivity to XSIAM tenant:
   - Ensure outbound HTTPS (443) access to XSIAM
   - Configure proxy settings if required
   - Test connectivity to tenant

5. Register broker in XSIAM console:
   - Broker should appear automatically in Settings → Brokers
   - Verify "Connected" status
   - Note broker ID for data source configuration`,
          validation: 'Broker shows "Connected" status in XSIAM Data Sources page'
        }
      ]
    },
    {
      id: 'data_ingestion',
      name: 'Data Source Integration (Critical Step)',
      description: 'Step-by-step data source setup - your first XSIAM interaction',
      estimatedTime: '60-90 minutes',
      steps: [
        {
          id: 'xsiam_navigation',
          title: 'Navigate to XSIAM Data Sources',
          description: 'Learn the exact XSIAM interface navigation for data source setup',
          required: true,
          instructions: `STEP-BY-STEP NAVIGATION:

1. Log into your XSIAM tenant: https://[your-tenant].xdr.us.paloaltonetworks.com
2. Click the "Settings" gear icon in the top-right corner
3. In the left sidebar, click "Data Sources"
4. You should see the main Data Sources page with:
   - "Add Data Source" button (blue, top-right)
   - List of existing integrations (if any)
   - Broker status indicators

IMPORTANT: If you don't see "Data Sources" in Settings, verify:
- Your user has "Data Sources Administrator" role
- Contact your XSIAM admin to grant permissions

SCREENSHOT GUIDE: The Data Sources page shows:
- Left panel: Integration categories (Endpoint, Network, Cloud, etc.)
- Center: Available integrations with vendor logos
- Right panel: Integration details and "Add" buttons`,
          validation: 'Successfully navigated to XSIAM Settings → Data Sources page'
        },
        {
          id: 'broker_verification',
          title: 'Verify XSIAM Broker Connection',
          description: 'Ensure your broker is connected before configuring data sources',
          required: true,
          instructions: `CRITICAL: Data sources require a connected XSIAM Broker

BROKER VERIFICATION STEPS:
1. In XSIAM, go to Settings → Brokers
2. Look for your broker in the list:
   - Status should show "Connected" (green)
   - Last seen should be recent (within 5 minutes)
   - Version should match current XSIAM version

TROUBLESHOOTING DISCONNECTED BROKER:
If broker shows "Disconnected":
1. SSH/RDP to your broker server
2. Check broker service status:
   
   Windows: services.msc → "Cortex XSIAM Broker"
   Linux: sudo systemctl status xsiam-broker
   
3. Restart if needed:
   
   Windows: Restart service in services.msc
   Linux: sudo systemctl restart xsiam-broker
   
4. Check broker logs:
   
   Windows: C:\\Program Files\\Palo Alto Networks\\Broker\\logs\\
   Linux: /var/log/xsiam-broker/
   
5. Verify network connectivity:
   - Broker server can reach your XSIAM tenant (port 443)
   - No firewall blocking outbound HTTPS
   - Corporate proxy configured if required`,
          validation: 'Broker shows "Connected" status in XSIAM Settings → Brokers'
        },
        ...dataSourceRequirements.map((source, index) => ({
          id: `datasource_${index}`,
          title: `Configure ${source} Integration`,
          description: `Complete ${source} setup with exact XSIAM navigation steps`,
          required: true,
          instructions: generateDetailedDataSourceInstructions(source, useCase),
          validation: `${source} logs flowing into XSIAM with proper field parsing and no errors`
        })),
        {
          id: 'field_mapping_verification',
          title: 'Verify Field Mapping and Parsing',
          description: 'Ensure all required fields are properly extracted from your logs',
          required: true,
          instructions: `FIELD MAPPING VERIFICATION:

1. Navigate to Investigation → Query Builder in XSIAM
2. Test each configured data source with these queries:

${dataSourceRequirements.map(source => {
  const dataset = source.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '') + '_raw';
  return `${source}:
dataset = ${dataset} 
| limit 10
| fields _time, ${generateExpectedFields(source, useCase.category)}`;
}).join('\n\n')}

3. For each query result, verify:
   - Data appears (not empty results)
   - Timestamps are recent (within last hour)
   - Required fields contain actual data (not null/empty)
   - Field types are correct (IPs, timestamps, etc.)

TROUBLESHOOTING PARSING ISSUES:
If fields are missing or incorrect:
1. Go to Settings → Parsing Rules
2. Find your data source integration
3. Click "Edit Parsing Rules"
4. Verify field extraction patterns match your log format
5. Test parsing with sample logs
6. Save and wait 5-10 minutes for changes to apply

XSIAM FIELD REQUIREMENTS for ${useCase.category} category:
${generateXSIAMFields(useCase.category)}`,
          validation: 'All required fields extracting properly with correct data types and recent timestamps'
        }
      ]
    },
    {
      id: 'validation',
      name: 'Validation & Testing',
      description: 'Verify data flow and quality',
      estimatedTime: '20-30 minutes',
      steps: [
        {
          id: 'data_flow_test',
          title: 'Test Data Flow',
          description: 'Verify logs are flowing correctly into XSIAM',
          required: true,
          instructions: `1. Navigate to Investigation → Query Builder
2. Run test queries for each configured data source:

Example queries:
dataset = windows_raw | limit 10
dataset = firewall_raw | limit 10  
dataset = cloudtrail_raw | limit 10

3. Verify field parsing and normalization:
   - Check that fields are properly extracted
   - Validate timestamp formats
   - Confirm data types are correct

4. Check data freshness and volume:
   - Verify recent data (within last hour)
   - Confirm expected log volume
   - Check for any parsing errors

5. Review XSIAM Data Sources status page:
   - All sources should show "Connected"
   - No error messages or warnings
   - Data ingestion rates within expected ranges`,
          validation: 'All data sources showing recent data with proper field mapping'
        },
        {
          id: 'detection_test',
          title: 'Test Detection Rules',
          description: 'Validate detection rules can access required data',
          required: true,
          instructions: `1. Navigate to Analytics → Correlation Rules
2. Import or create test detection rule for ${useCase.title}:

Sample XQL Query:
dataset = ${useCase.category}_raw
| where event_type = "threat_indicator"
| fields timestamp, src_ip, dest_ip, threat_name
| limit 100

3. Verify XQL queries execute successfully:
   - No syntax errors
   - Returns expected data
   - Field references resolve correctly

4. Test alert generation with sample data:
   - Create test detection rule
   - Verify it triggers on known data
   - Check alert format and fields

5. Validate correlation logic:
   - Ensure all required fields are available
   - Test cross-dataset correlations if needed
   - Verify alert enrichment works properly`,
          validation: 'Detection rules execute without errors and generate test alerts'
        }
      ]
    }
  ];

  // Generate expected fields for data source validation
  function generateExpectedFields(source: string, category: string): string {
    const fieldMap: Record<string, Record<string, string>> = {
      'Windows Event Logs': {
        endpoint: 'event_id, computer_name, user_name, logon_type, source_ip',
        network: 'src_ip, dest_ip, event_id, computer_name, user_name',
        cloud: 'user_name, computer_name, event_id, source_ip, logon_type',
        identity: 'user_name, computer_name, logon_type, source_ip, auth_result'
      },
      'Sysmon': {
        endpoint: 'process_name, command_line, user_name, computer_name, process_id',
        network: 'src_ip, dest_ip, process_name, computer_name, dest_port',
        cloud: 'process_name, user_name, computer_name, command_line, process_id',
        identity: 'user_name, computer_name, process_name, logon_id, auth_result'
      },
      'AWS CloudTrail': {
        endpoint: 'event_name, user_identity, source_ip, user_agent, event_time',
        network: 'source_ip, event_name, user_identity, aws_region, event_time',
        cloud: 'event_name, user_identity, source_ip, resource_name, event_time',
        identity: 'user_identity, source_ip, event_name, error_code, event_time'
      },
      'Kubernetes Audit Logs': {
        endpoint: 'verb, object_name, user_name, source_ip, namespace',
        network: 'source_ip, verb, object_name, namespace, user_name',
        cloud: 'verb, object_name, user_name, namespace, resource_type',
        identity: 'user_name, verb, object_name, source_ip, auth_result'
      },
      'Firewall Logs': {
        endpoint: 'src_ip, dest_ip, dest_port, action, protocol',
        network: 'src_ip, dest_ip, src_port, dest_port, action, protocol',
        cloud: 'src_ip, dest_ip, action, protocol, bytes_sent',
        identity: 'src_ip, dest_ip, action, user_name, protocol'
      }
    };
    
    return fieldMap[source]?.[category] || 'timestamp, src_ip, dest_ip, event_type, user_name';
  }

  function generateDetailedDataSourceInstructions(source: string, useCase: any): string {
    const instructionMap: Record<string, string> = {
      'Windows Event Logs': `COMPLETE WINDOWS EVENT LOG INTEGRATION:

STEP 1: Navigate to Windows Event Logs Integration
1. In XSIAM, go to Settings → Data Sources
2. Click "Add Data Source" (blue button, top-right)
3. In the search box, type "Windows Event" 
4. Click on "Windows Event Logs" integration (Microsoft logo)
5. Click "Add" in the integration details panel

STEP 2: Configure Integration Settings
1. Integration Name: "Windows-EventLogs-${useCase.title?.replace(/\s+/g, '-')}"
2. Description: "Windows Event Logs for ${useCase.title} threat detection"
3. Select your XSIAM Broker from dropdown
4. Click "Next"

STEP 3: Configure Event Channels (CRITICAL)
Select these specific Windows Event Log channels:
✓ Security (essential for authentication events)
✓ System (for service and system events)  
✓ Application (for application security events)
✓ Microsoft-Windows-Sysmon/Operational (if Sysmon installed)

Event ID Priority for ${useCase.category} threats:
${useCase.category === 'endpoint' ? `
- 4624: Successful logon
- 4625: Failed logon  
- 4648: Logon using explicit credentials
- 4672: Admin rights assignment
- 4720: User account created` : useCase.category === 'identity' ? `
- 4624: Successful logon
- 4625: Failed logon
- 4648: Explicit credential logon
- 4740: User account locked
- 4767: User account unlocked` : `
- 4624: Successful logon
- 4625: Failed logon
- 4648: Explicit credential logon
- 5156: Network connection allowed
- 5157: Network connection blocked`}

STEP 4: Configure Field Mapping
1. In "Field Mapping" section, verify these mappings:
   - EventID → event_id
   - Computer → computer_name  
   - TargetUserName → user_name
   - IpAddress → source_ip
   - LogonType → logon_type

2. Test field extraction with sample log:
   Click "Test Parsing" and paste a sample Windows Event Log entry

STEP 5: Deploy and Validate
1. Click "Save and Deploy"
2. Wait 2-3 minutes for deployment
3. Verify integration appears in Data Sources list
4. Status should show "Connected" with green indicator

TROUBLESHOOTING:
- If "Disconnected": Check Windows Event Forwarding is configured
- If "No Data": Verify selected event channels are generating logs
- If "Parsing Errors": Review field mapping configuration`,

      'Sysmon': `COMPLETE SYSMON INTEGRATION SETUP:

STEP 1: Verify Sysmon Installation (PREREQUISITE)
Before XSIAM integration, ensure Sysmon is installed:
1. On target Windows systems, download Sysmon from Microsoft Sysinternals
2. Download high-quality Sysmon config: https://github.com/SwiftOnSecurity/sysmon-config
3. Install with config: sysmon64.exe -accepteula -i sysmonconfig-export.xml
4. Verify installation: Get-WinEvent -LogName Microsoft-Windows-Sysmon/Operational

STEP 2: XSIAM Sysmon Integration
1. In XSIAM, go to Settings → Data Sources  
2. Click "Add Data Source"
3. Search "Sysmon" or browse Endpoint → Microsoft → Sysmon
4. Click "Add" on Sysmon integration

STEP 3: Configure Sysmon Integration
1. Integration Name: "Sysmon-${useCase.title?.replace(/\s+/g, '-')}"
2. Select your XSIAM Broker
3. Log Source: "Microsoft-Windows-Sysmon/Operational"
4. Click "Next"

STEP 4: Event ID Configuration for ${useCase.category} Threats
Enable these critical Sysmon Event IDs:
✓ Event ID 1: Process Creation (essential for ${useCase.category})
✓ Event ID 3: Network Connections
✓ Event ID 7: Image/DLL Load
✓ Event ID 11: File Creation
✓ Event ID 13: Registry Value Set
${useCase.category === 'endpoint' ? '✓ Event ID 8: CreateRemoteThread\n✓ Event ID 10: Process Access' : ''}
${useCase.category === 'network' ? '✓ Event ID 3: Network Connections (priority)\n✓ Event ID 22: DNS Queries' : ''}

STEP 5: Field Mapping Verification
Critical field mappings for detection:
- ProcessId → process_id
- Image → process_name  
- CommandLine → command_line
- User → user_name
- Computer → computer_name
- SourceIp → src_ip (Event ID 3)
- DestinationIp → dest_ip (Event ID 3)

STEP 6: Test and Deploy
1. Click "Test Configuration" 
2. Verify sample Sysmon events parse correctly
3. Click "Save and Deploy"
4. Monitor Data Sources page for "Connected" status

VALIDATION QUERY:
dataset = sysmon_raw 
| where event_id in (1, 3, 7, 11)
| fields _time, event_id, process_name, command_line, user_name
| limit 20`,

      'AWS CloudTrail': `COMPLETE AWS CLOUDTRAIL INTEGRATION:

STEP 1: AWS Prerequisites (Complete in AWS Console First)
1. Ensure CloudTrail is enabled in target AWS account
2. Create IAM role for XSIAM with these permissions:
   {
     "Version": "2012-10-17", 
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudtrail:LookupEvents",
           "s3:GetObject", 
           "s3:ListBucket"
         ],
         "Resource": "*"
       }
     ]
   }
3. Note CloudTrail S3 bucket name and region

STEP 2: XSIAM CloudTrail Integration Setup
1. In XSIAM: Settings → Data Sources → Add Data Source
2. Search "CloudTrail" or browse Cloud → AWS → CloudTrail
3. Click "Add" on AWS CloudTrail integration

STEP 3: Configure AWS Connection
1. Integration Name: "CloudTrail-${useCase.title?.replace(/\s+/g, '-')}"
2. AWS Access Configuration:
   - AWS Access Key ID: [from IAM user]
   - AWS Secret Access Key: [from IAM user]  
   - S3 Bucket Name: [your CloudTrail bucket]
   - S3 Region: [bucket region]
   - S3 Path Prefix: "AWSLogs/[account-id]/CloudTrail/"

STEP 4: Event Filtering for ${useCase.category} Threats
Configure these CloudTrail event patterns:
${useCase.category === 'cloud' ? `
- IAM events: CreateUser, DeleteUser, AttachUserPolicy
- S3 events: PutBucketPolicy, DeleteBucket, GetObject  
- EC2 events: RunInstances, TerminateInstances, AuthorizeSecurityGroupIngress
- Lambda events: CreateFunction, InvokeFunction, UpdateFunctionCode` : useCase.category === 'identity' ? `
- IAM Authentication: AssumeRole, GetSessionToken, CreateLoginProfile
- Console Access: ConsoleLogin, AssumeRoleWithWebIdentity
- Policy Changes: PutUserPolicy, AttachRolePolicy, CreateRole
- MFA Events: EnableMFADevice, DeactivateMFADevice` : `
- All management events
- Data events for S3 buckets (if relevant)
- Insight events for unusual activity`}

STEP 5: Field Mapping Configuration
Verify these field mappings:
- eventName → action_name
- sourceIPAddress → src_ip
- userIdentity.type → user_type
- userIdentity.userName → user_name  
- eventTime → timestamp
- errorCode → error_code
- awsRegion → region

STEP 6: Deploy and Test
1. Click "Test Connection" to verify AWS access
2. Click "Save and Deploy"
3. Wait 5-10 minutes for initial log ingestion
4. Verify "Connected" status in Data Sources

VALIDATION QUERY:
dataset = cloudtrail_raw
| where event_name contains "IAM" or event_name contains "S3"
| fields _time, event_name, user_identity, src_ip, region
| limit 20`,

      'Kubernetes Audit Logs': `COMPLETE KUBERNETES AUDIT LOG INTEGRATION:

STEP 1: Configure Kubernetes Audit Logging (Prerequisite)
1. Edit kube-apiserver configuration (usually /etc/kubernetes/manifests/kube-apiserver.yaml):
   Add these flags:
   --audit-log-path=/var/log/audit.log
   --audit-log-maxage=30  
   --audit-log-maxbackup=3
   --audit-log-maxsize=100
   --audit-policy-file=/etc/kubernetes/audit-policy.yaml

2. Create audit policy file (/etc/kubernetes/audit-policy.yaml):
   apiVersion: audit.k8s.io/v1
   kind: Policy
   rules:
   - level: RequestResponse
     namespaces: ["default", "kube-system", "kube-public"]
   - level: Request
     verbs: ["create", "update", "patch", "delete"]
     resources:
     - group: ""
       resources: ["pods", "services", "secrets"]
   - level: Metadata
     verbs: ["get", "list", "watch"]

3. Restart kube-apiserver and verify audit logs: tail -f /var/log/audit.log

STEP 2: XSIAM Kubernetes Integration  
1. In XSIAM: Settings → Data Sources → Add Data Source
2. Search "Kubernetes" or browse Cloud → Kubernetes → Audit Logs
3. Click "Add" on Kubernetes Audit Logs integration

STEP 3: Configure Log Collection Method
Choose collection method:

Option A: File-based Collection (Recommended)
1. Install XSIAM agent on Kubernetes master nodes
2. Configure file monitoring for /var/log/audit.log
3. Set log format to "JSON"

Option B: Syslog Forwarding  
1. Configure audit log forwarding to syslog
2. Point syslog to XSIAM Broker IP:514
3. Set facility to local0

STEP 4: Integration Configuration
1. Integration Name: "K8s-Audit-${useCase.title?.replace(/\s+/g, '-')}"
2. Log Format: "JSON" 
3. Select XSIAM Broker
4. Configure parsing rules for Kubernetes audit format

STEP 5: Critical Field Mapping for ${useCase.category}
Verify these mappings:
- verb → action_name (create, delete, update, get)
- objectRef.name → resource_name
- objectRef.namespace → namespace  
- user.username → user_name
- sourceIPs[0] → src_ip
- requestReceivedTimestamp → timestamp
- objectRef.resource → resource_type

STEP 6: Deploy and Validate
1. Click "Test Parsing" with sample audit log entry
2. Click "Save and Deploy"  
3. Verify "Connected" status
4. Check for recent audit events in XSIAM

VALIDATION QUERY:
dataset = k8s_audit_raw
| where verb in ("create", "delete", "update") 
| fields _time, verb, resource_name, namespace, user_name, src_ip
| limit 20

TROUBLESHOOTING:
- No logs: Verify audit-policy.yaml is valid and kube-apiserver restarted
- Parsing errors: Check JSON format of audit logs matches parser expectations
- Permission issues: Ensure XSIAM agent has read access to /var/log/audit.log`,

      'Firewall Logs': `COMPLETE FIREWALL LOG INTEGRATION:

STEP 1: Configure Firewall Syslog (Vendor-Specific)

PALO ALTO NETWORKS:
1. In PAN-OS: Device → Log Settings → Syslog
2. Add Server Profile:
   - Name: "XSIAM-Syslog"  
   - Server: [XSIAM Broker IP]
   - Port: 514 (UDP) or 6514 (TCP/TLS)
   - Facility: LOG_USER
   - Format: Default

CISCO ASA:
1. Configure syslog server:
   logging host [XSIAM_BROKER_IP]
   logging trap informational
   logging facility 20
   logging timestamp

FORTINET FORTIGATE:
1. CLI configuration:
   config log syslogd setting
   set status enable  
   set server [XSIAM_BROKER_IP]
   set port 514
   set facility user
   end

STEP 2: XSIAM Firewall Integration
1. In XSIAM: Settings → Data Sources → Add Data Source
2. Search for your firewall vendor (Palo Alto, Cisco, Fortinet, etc.)
3. Select appropriate firewall integration
4. Click "Add"

STEP 3: Configure Integration Settings  
1. Integration Name: "Firewall-${useCase.title?.replace(/\s+/g, '-')}"
2. Select XSIAM Broker that will receive syslog
3. Syslog Configuration:
   - Port: 514 (UDP) or 6514 (TCP)
   - Protocol: Syslog
   - Facility: Match firewall configuration

STEP 4: Critical Field Mapping for ${useCase.category}
Verify these essential fields are mapped:
- Source IP → src_ip  
- Destination IP → dest_ip
- Source Port → src_port
- Destination Port → dest_port  
- Action (allow/deny) → action
- Protocol → protocol
- Application → application
- User → user_name (if available)
- Bytes → bytes_sent, bytes_received

STEP 5: Log Filtering for Threat Detection
Configure filtering for relevant traffic:
${useCase.category === 'network' ? `
- Blocked/Denied traffic (action = deny)
- High-risk ports: 22, 23, 135, 139, 445, 1433, 3389
- Suspicious protocols and applications
- High-volume connections (potential DDoS)` : useCase.category === 'endpoint' ? `
- Outbound connections from internal hosts
- Connections to suspicious IPs/domains  
- Non-standard port usage
- Protocol violations` : `
- All allow/deny actions
- Application-specific traffic
- Geographic anomalies`}

STEP 6: Deploy and Test
1. Generate test traffic through firewall
2. Verify logs appear in XSIAM within 1-2 minutes
3. Check Data Sources status shows "Connected"
4. Validate field parsing is correct

VALIDATION QUERY:
dataset = firewall_raw
| where action in ("allow", "deny", "drop")
| fields _time, src_ip, dest_ip, dest_port, action, protocol
| limit 20

TROUBLESHOOTING:
- No logs: Check firewall syslog configuration and network connectivity
- Parsing issues: Verify firewall log format matches XSIAM parser expectations  
- Missing fields: Review field mapping configuration in integration settings`
    };

    return instructionMap[source] || generateDataSourceInstructions(source, useCase);
  }

  function generateXSIAMFields(category: string): string {
    const fieldRequirements: Record<string, string> = {
      endpoint: `Essential XSIAM fields for endpoint threats:
- _time (timestamp): Event timestamp in XSIAM format
- event_id: Windows Event ID or equivalent
- computer_name: Host/endpoint identifier  
- user_name: User account associated with event
- process_name: Executable name (for process events)
- command_line: Full command line arguments
- src_ip: Source IP address (for network events)
- dest_ip: Destination IP address
- file_name: File path for file system events
- registry_key: Registry modifications
- parent_process: Parent process information`,

      network: `Essential XSIAM fields for network threats:
- _time (timestamp): Event timestamp
- src_ip: Source IP address (REQUIRED)
- dest_ip: Destination IP address (REQUIRED)  
- src_port: Source port number
- dest_port: Destination port number
- protocol: Network protocol (TCP, UDP, ICMP)
- action: Allow/deny/drop decision
- bytes_sent: Data volume metrics
- bytes_received: Ingress data volume
- application: Layer 7 application identified
- user_name: User context if available
- device_name: Network device identifier`,

      cloud: `Essential XSIAM fields for cloud threats:
- _time (timestamp): Event timestamp
- event_name: Cloud service action name
- user_identity: Cloud user/service account
- src_ip: Source IP address
- resource_name: Cloud resource identifier
- region: Cloud region/availability zone
- account_id: Cloud account identifier
- service_name: Cloud service (S3, EC2, IAM, etc.)
- error_code: Error status if failed
- user_agent: Client/tool identification
- request_id: Cloud provider request ID
- resource_type: Type of cloud resource`,

      identity: `Essential XSIAM fields for identity threats:
- _time (timestamp): Event timestamp  
- user_name: Username/account (REQUIRED)
- src_ip: Source IP of authentication
- logon_type: Authentication method
- auth_result: Success/failure status
- domain: Authentication domain
- computer_name: Target system
- service_name: Authentication service
- session_id: Login session identifier
- privilege_level: User privilege changes
- group_membership: Group assignments
- mfa_status: Multi-factor authentication`
    };

    return fieldRequirements[category] || 'Standard XSIAM fields: _time, src_ip, dest_ip, event_type, user_name';
  }

  function generateDataSourceInstructions(source: string, useCase: any): string {
    const instructionMap: Record<string, string> = {
      'Windows Event Logs': `1. Navigate to Settings → Data Sources → Add Data Source
2. Select "Windows Event Logs" integration
3. Configure Windows Event Forwarding (WEF) or agent deployment:
   
   Option A: WEF Configuration
   - Configure source computers to forward events
   - Set up WEF subscription on collector
   - Point WEF collector to XSIAM Broker
   
   Option B: XSIAM Agent
   - Download XSIAM Windows agent
   - Install on target endpoints
   - Configure agent to collect Security, System, Application logs

4. Select relevant event channels:
   - Security: Logon events, privilege escalation, policy changes
   - System: Service events, system startup/shutdown
   - Application: Application-specific security events

5. Configure parsing rules for Windows Event Log format:
   - Map EventID to XSIAM event types
   - Extract user names, computer names, IP addresses
   - Parse event descriptions for threat indicators

6. Test connectivity and verify log ingestion:
   - Check that events appear in dataset = windows_raw
   - Verify field extraction works properly
   - Confirm no parsing errors in logs`,
      
      'Sysmon': `1. Install Sysmon on Windows endpoints with recommended configuration:
   
   Download Sysmon from Microsoft Sysinternals
   Use high-quality Sysmon config (e.g., SwiftOnSecurity config):
   
   sysmon64.exe -accepteula -i sysmonconfig-export.xml

2. Configure Sysmon to forward logs to XSIAM Broker:
   - Sysmon logs to Windows Event Log under Applications and Services
   - Use Windows Event Forwarding or XSIAM agent to collect
   - Ensure Microsoft-Windows-Sysmon/Operational channel is monitored

3. Set up Sysmon parsing rules in XSIAM:
   - Navigate to Settings → Parsing Rules
   - Import or create Sysmon parsing rules
   - Map Sysmon Event IDs to XSIAM schema

4. Map Sysmon event IDs to XSIAM fields:
   - Event ID 1: Process Creation (process_name, command_line, parent_pid)
   - Event ID 3: Network Connections (src_ip, dest_ip, dest_port)
   - Event ID 7: Image/DLL Loading (image_loaded, process_name)
   - Event ID 11: File Creation (file_path, process_name)

5. Verify process, network, and file activity logging:
   - Check dataset = sysmon_raw for recent events
   - Validate field extraction for key events
   - Test detection rules using Sysmon data`,
      
      'AWS CloudTrail': `1. Navigate to Settings → Data Sources → Cloud → AWS
2. Configure AWS IAM role with CloudTrail read permissions:
   
   Create IAM policy with permissions:
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudtrail:LookupEvents",
           "cloudtrail:GetTrail",
           "cloudtrail:DescribeTrails",
           "s3:GetObject",
           "s3:ListBucket"
         ],
         "Resource": "*"
       }
     ]
   }

3. Set up CloudTrail S3 bucket access:
   - Provide S3 bucket name containing CloudTrail logs
   - Configure appropriate S3 permissions for XSIAM
   - Set up S3 bucket notifications if using real-time ingestion

4. Configure API call logging and data events:
   - Ensure CloudTrail is logging API calls
   - Enable data events for S3, Lambda if relevant
   - Configure insight events for unusual activity

5. Map CloudTrail fields to XSIAM schema:
   - eventName → action_name
   - sourceIPAddress → src_ip
   - userIdentity → user_name
   - eventTime → timestamp
   - errorCode → error_code

6. Test API activity detection:
   - Verify CloudTrail events appear in dataset = cloudtrail_raw
   - Check field parsing for API calls
   - Test detection rules for suspicious API activity`,
      
      'Kubernetes Audit Logs': `1. Configure Kubernetes API server audit logging:
   
   Add to kube-apiserver configuration:
   --audit-log-path=/var/log/audit.log
   --audit-log-maxage=30
   --audit-log-maxbackup=3
   --audit-log-maxsize=100
   --audit-policy-file=/etc/kubernetes/audit-policy.yaml

2. Create audit policy file (audit-policy.yaml):
   apiVersion: audit.k8s.io/v1
   kind: Policy
   rules:
   - level: RequestResponse
     namespaces: ["default", "kube-system"]
   - level: Request
     verbs: ["create", "update", "patch", "delete"]

3. Set up log forwarding to XSIAM Broker:
   - Use Fluentd, Filebeat, or similar to forward audit logs
   - Configure log shipper to send to XSIAM Broker
   - Ensure proper log format preservation

4. Configure Kubernetes audit log parsing rules:
   - Parse JSON format audit logs
   - Extract verb, objectRef, user, timestamp
   - Map Kubernetes resources to XSIAM fields

5. Map pod, namespace, and resource fields:
   - verb → action_name
   - objectRef.name → resource_name
   - objectRef.namespace → namespace
   - user.username → user_name
   - requestReceivedTimestamp → timestamp

6. Verify container and orchestration activity logging:
   - Check dataset = k8s_audit_raw for events
   - Validate parsing of pod create/delete events
   - Test detection rules for suspicious K8s activity`,
      
      'Firewall Logs': `1. Configure firewall to send logs to XSIAM Broker:
   
   Palo Alto Networks Firewall:
   - Navigate to Device → Log Settings → Syslog
   - Add XSIAM Broker IP as syslog server
   - Configure port 514 (UDP) or 6514 (TCP/TLS)
   
   Cisco ASA:
   logging host [XSIAM_BROKER_IP]
   logging trap informational
   
   Fortinet FortiGate:
   config log syslogd setting
   set status enable
   set server [XSIAM_BROKER_IP]

2. Set up syslog forwarding with appropriate facility/severity:
   - Use facility local0-local7 for firewall logs
   - Set appropriate severity levels (info, warning, error)
   - Ensure timestamp format is consistent

3. Configure firewall log parsing rules:
   - Navigate to Settings → Parsing Rules → Firewall
   - Create or import vendor-specific parsing rules
   - Map vendor log format to XSIAM common schema

4. Map source/destination IPs, ports, and actions:
   - Source IP → src_ip
   - Destination IP → dest_ip
   - Source Port → src_port
   - Destination Port → dest_port
   - Action (allow/deny) → action
   - Protocol → protocol

5. Verify network traffic and policy enforcement logging:
   - Check dataset = firewall_raw for recent traffic
   - Validate field extraction for allow/deny actions
   - Test geographic and threat intelligence enrichment`
    };

    return instructionMap[source] || `1. Navigate to Settings → Data Sources and search for "${source}"
2. Follow the integration-specific setup wizard
3. Configure authentication and connectivity
4. Set up log parsing and field mapping
5. Test data ingestion and verify field extraction`;
  }

  // Generate infrastructure guidance based on use case
  const generateInfrastructureGuidance = () => {
    return {
      infrastructure: {
        compute: useCase.category === 'cloud' ? 'Cloud-native (AWS/Azure/GCP)' : 'Virtual Machines',
        networking: useCase.category === 'network' ? 'Advanced network simulation' : 'Basic network connectivity',
        storage: useCase.severity === 'critical' ? 'High-performance storage' : 'Standard storage',
        monitoring: 'XSIAM Broker with dedicated collection infrastructure'
      },
      estimatedCost: {
        setup: useCase.severity === 'critical' ? '$500-1000' : '$200-500',
        monthly: useCase.category === 'cloud' ? '$100-300' : '$50-150'
      },
      deploymentSteps: [
        'Deploy base infrastructure using Terraform templates',
        'Install and configure XSIAM Brokers',
        'Set up data source integrations',
        'Configure network connectivity and security groups',
        'Deploy monitoring and logging infrastructure',
        'Validate data flow to XSIAM tenant'
      ]
    };
  };

  const infrastructureGuidance = generateInfrastructureGuidance();
  
  const quickStartGuide = {
    estimatedTime: '15-20 minutes',
    steps: [
        {
          id: 'tenant-access',
          title: 'Verify XSIAM Tenant Access',
          description: 'Confirm you can log into your Cortex XSIAM tenant',
          instructions: `
1. Open your web browser and navigate to your XSIAM tenant URL
   - Format: https://[your-tenant-name].xsiam.paloaltonetworks.com
   - If you don't know your tenant URL, check with your administrator

2. Log in using your credentials:
   - Username: Your organizational email or assigned username
   - Password: Your XSIAM password
   - MFA: Complete multi-factor authentication if prompted

3. Verify you reach the main XSIAM dashboard
   - You should see navigation options like: Incidents, Hunting, Settings
   - If you get permission errors, contact your XSIAM administrator

4. Check your user permissions:
   - Go to Settings → Users & Roles → Users
   - Find your username and verify you have "Analyst" or "Administrator" role
   - You need at least "Data Administrator" privileges for data source setup
          `,
          required: true
        },
        {
          id: 'gather-info',
          title: 'Gather Required Information',
          description: 'Collect necessary details for data source integration',
          instructions: `
Before proceeding, gather this information from your organization:

📋 NETWORK INFORMATION:
• IP ranges for your organization's network segments
• DNS server addresses
• Proxy server details (if applicable)
• Firewall management IP addresses

📋 SYSTEM CREDENTIALS:
• Domain administrator credentials (for Windows integration)
• Service account credentials for log collection
• API keys for cloud services (AWS, Azure, Office 365)
• SIEM/log server access credentials

📋 DATA SOURCE LOCATIONS:
• Windows Domain Controller IPs
• Syslog server addresses  
• Cloud tenant IDs (AWS Account ID, Azure Tenant ID)
• Network device management IPs

📋 ORGANIZATIONAL DETAILS:
• AD domain names
• Organization name for certificate generation
• Time zone for log correlation
• Retention requirements for compliance

💡 TIP: Create a secure document with this information - you'll reference it throughout setup.
          `,
          required: true
        }
      ]
  };

  const onboardingPhases = [
    {
      id: 'datasource_planning',
      name: '2. Data Source Planning',
      description: 'Plan and configure required data sources for threat detection',
      estimatedTime: '30-45 minutes',
      steps: [
        {
          id: 'identify-sources',
          title: 'Identify Required Data Sources',
          description: `Map ${useCase.title} threat requirements to specific data sources`,
          instructions: `
🎯 THREAT-SPECIFIC DATA SOURCES FOR: ${useCase.title}

Based on your threat category (${useCase.category}), you'll need these data sources:
${dataSourceRequirements.map(source => `• ${source}`).join('\n')}

${useCase.technologies && useCase.technologies.length > 0 ? `
🔧 ADDITIONAL SOURCES FOR TECHNOLOGIES:
${useCase.technologies.map(tech => `• ${tech}-specific logs and events`).join('\n')}
` : ''}

📋 STEP-BY-STEP PLANNING:
1. For each data source above, identify WHERE it exists in your environment:
   - What servers/systems generate these logs?
   - Are they already centralized or scattered?
   - What format are they in (syslog, Windows Event Log, JSON, etc.)?

2. Check your current log infrastructure:
   - Do you have a SIEM already collecting some of these?
   - Are logs stored locally on each system?
   - What's the retention period for existing logs?

3. Verify network connectivity:
   - Can XSIAM broker reach these log sources?
   - Are there firewalls blocking communication?
   - Do you need to request firewall rules?

💡 BEGINNER TIP: Start with the most critical data source first. For ${useCase.category} threats, prioritize ${dataSourceRequirements[0] || 'endpoint logs'}.
          `,
          required: true
        },
        {
          id: 'broker-planning',
          title: 'Plan XSIAM Broker Deployment',
          description: 'Determine where and how to deploy data collection infrastructure',
          instructions: `
🏗️ BROKER DEPLOYMENT STRATEGY:

📍 CHOOSE BROKER LOCATION:
• Deploy broker close to data sources (same network segment preferred)
• Ensure broker can reach both data sources AND XSIAM cloud
• Consider redundancy - deploy multiple brokers for high availability

💻 BROKER SERVER REQUIREMENTS:
• Operating System: Windows Server 2016+ or RHEL/CentOS 7+
• CPU: 4+ cores
• RAM: 8GB minimum (16GB recommended for high volume)
• Disk: 100GB+ for log buffering
• Network: Outbound HTTPS (443) to *.paloaltonetworks.com

🔐 REQUIRED PERMISSIONS:
• Local administrator rights on broker server
• Service account with log access permissions
• Network access to all planned data sources
• Outbound internet access for XSIAM communication

📋 PRE-DEPLOYMENT CHECKLIST:
□ Broker server provisioned and accessible
□ Service account created with appropriate permissions  
□ Firewall rules documented and requested
□ DNS resolution verified for XSIAM tenant
□ Time synchronization configured (NTP)

💡 BEGINNER TIP: Test network connectivity first! Use telnet or curl to verify the broker server can reach your XSIAM tenant on port 443.
          `,
          required: true
        }
      ]
    },
    {
      id: 'log_ingestion',
      name: '3. Log Ingestion Setup',
      description: 'Configure log collection and parsing for threat detection',
      estimatedTime: '45-90 minutes',
      steps: [
        {
          id: 'broker-installation',
          title: 'Install and Configure XSIAM Broker',
          description: 'Deploy the XSIAM broker for log collection',
          instructions: `
🚀 BROKER INSTALLATION PROCESS:

STEP 1: Download Broker Installer
1. In XSIAM, navigate to Settings → Data Sources → Broker
2. Click "Add Broker" 
3. Choose your operating system (Windows/Linux)
4. Download the installer package
5. Transfer installer to your designated broker server

STEP 2: Install Broker
FOR WINDOWS:
• Run installer as Administrator
• Accept license agreement
• Choose installation directory (default: C:\\Program Files\\Palo Alto Networks\\)
• Enter XSIAM tenant URL when prompted
• Provide service account credentials
• Complete installation and verify service starts

FOR LINUX:
• Extract installation package: tar -xzf xsiam-broker-linux.tar.gz
• Run installation script: sudo ./install.sh
• Follow interactive prompts for configuration
• Start service: sudo systemctl start xsiam-broker
• Enable auto-start: sudo systemctl enable xsiam-broker

STEP 3: Verify Broker Registration
1. Return to XSIAM → Settings → Data Sources → Broker
2. Your broker should appear with "Connected" status
3. Note the Broker ID for future reference
4. Test connectivity with "Test Connection" button

⚠️ TROUBLESHOOTING:
• If broker shows "Disconnected": Check firewall rules and DNS
• If installation fails: Verify administrator privileges
• If connection timeout: Confirm outbound HTTPS access

💡 BEGINNER TIP: Keep the XSIAM browser tab open during installation to quickly verify the broker registration.
          `,
          required: true
        },
        {
          id: 'data-source-configuration',
          title: 'Configure Primary Data Source Integration',
          description: `Set up ${dataSourceRequirements[0] || 'Windows Event Logs'} collection`,
          instructions: `
📊 CONFIGURING: ${dataSourceRequirements[0] || 'Windows Event Logs'}

STEP 1: Navigate to Data Source Setup
1. In XSIAM, go to Settings → Data Sources → Data Sources
2. Click "Add Data Source"
3. Search for "${dataSourceRequirements[0] || 'Windows Event Logs'}" in the marketplace
4. Click "Configure" on the appropriate integration

STEP 2: Basic Configuration
• Data Source Name: ${useCase.title}_${dataSourceRequirements[0]?.replace(/\s+/g, '_') || 'WindowsEvents'}
• Description: "Threat detection for ${useCase.title}"
• Broker: Select your installed broker from dropdown
• Collection Mode: Choose based on your environment

STEP 3: Connection Configuration
${generateDataSourceSpecificConfig(dataSourceRequirements[0] || 'Windows Event Logs')}

STEP 4: Field Mapping & Parsing
• Review default field mappings
• Ensure critical fields are mapped correctly:
  - Timestamp → _time
  - Source IP → src_ip  
  - Destination IP → dest_ip
  - User → user_name
  - Event ID → event_id

STEP 5: Test Configuration
1. Click "Test Configuration" 
2. Verify "Configuration Valid" message
3. Check "Sample Data" shows recent logs
4. Save configuration when tests pass

💡 BEGINNER TIP: Start with minimal configuration first, then add advanced settings once basic log flow is working.
          `,
          required: true
        }
      ]
    },
    {
      id: 'validation',
      name: '4. Validation & Testing',
      description: 'Verify complete data flow and threat detection capability',
      estimatedTime: '20-30 minutes',
      steps: [
        {
          id: 'data-flow-validation',
          title: 'Validate Data Flow to XSIAM',
          description: 'Confirm logs are flowing correctly and being parsed',
          instructions: `
✅ DATA FLOW VALIDATION CHECKLIST:

STEP 1: Check Data Ingestion
1. Navigate to Investigation → Query Builder
2. Run this basic query to verify data:
   \`\`\`
   dataset = ${dataSourceRequirements[0]?.toLowerCase().replace(/\s+/g, '_') || 'windows_event_logs'}
   | limit 10
   \`\`\`
3. Verify you see recent log entries (within last hour)
4. Check timestamp accuracy and field population

STEP 2: Verify Field Parsing
1. Expand a sample log entry
2. Confirm these critical fields are populated:
   □ _time (proper timestamp format)
   □ event_id or event_name
   □ source_ip (if network-related)  
   □ user_name (if user activity)
   □ host_name (source system)

STEP 3: Test Threat-Specific Queries
Run these queries relevant to ${useCase.title}:
\`\`\`
// Query 1: Recent activity volume
dataset = ${dataSourceRequirements[0]?.toLowerCase().replace(/\s+/g, '_') || 'windows_event_logs'}
| bin _time span=1h
| stats count() by _time
| sort _time desc

// Query 2: Check for relevant events
dataset = ${dataSourceRequirements[0]?.toLowerCase().replace(/\s+/g, '_') || 'windows_event_logs'}
| filter event_id in (${generateRelevantEventIds(useCase.category)})
| limit 20
\`\`\`

STEP 4: Volume and Performance Check
• Verify data volume matches expectations
• Check query performance (should complete in <30 seconds)
• Confirm no parsing errors in XSIAM logs

⚠️ IF VALIDATION FAILS:
• No data: Check broker connectivity and data source configuration
• Parsing errors: Review field mapping configuration
• Performance issues: Consider data volume and retention settings

💡 BEGINNER TIP: Keep this validation query handy - you'll use it throughout threat hunting and detection rule development.
          `,
          required: true
        },
        {
          id: 'detection-readiness',
          title: 'Confirm Detection Rule Readiness',
          description: 'Verify the environment is ready for threat detection rules',
          instructions: `
🎯 DETECTION READINESS VERIFICATION:

STEP 1: Test Sample Detection Rule
1. Navigate to Analytics → Correlation Rules
2. Click "Create New Rule"
3. Use this test rule template:

\`\`\`yaml
name: "${useCase.title} - Test Detection"
description: "Test rule to verify data availability"
severity: "Medium"
xql_query: |
  dataset = ${dataSourceRequirements[0]?.toLowerCase().replace(/\s+/g, '_') || 'windows_event_logs'}
  | filter _time > current_time() - interval 1 hour
  | stats count() by host_name
  | where count > 0
search_window: "1 hour"
\`\`\`

STEP 2: Validate Rule Execution
• Click "Test Query" to execute XQL
• Verify query returns results without errors
• Confirm execution time is reasonable (<60 seconds)
• Save as draft (don't enable alerts yet)

STEP 3: Field Availability Check
Verify these fields are available for ${useCase.category} detection:
${generateFieldAvailabilityCheck(useCase.category)}

STEP 4: Create Detection Template
1. Document successful query patterns
2. Note field names and data types
3. Record any parsing issues or missing fields
4. Create detection rule template for future use

🎉 SUCCESS CRITERIA:
□ Data flowing consistently (>100 events/hour)
□ Critical fields properly parsed and available
□ Test detection rule executes successfully
□ No broker or parsing errors in XSIAM logs
□ Query performance acceptable for real-time detection

💡 BEGINNER TIP: This validation process should be repeated whenever you add new data sources or modify configurations.
          `,
          required: true
        }
      ]
    }
  ];

  // Helper functions for generating specific configurations
  const generateDataSourceSpecificConfig = (dataSource: string): string => {
    const configs: Record<string, string> = {
      'Windows Event Logs': `
FOR WINDOWS EVENT LOGS:
• Target Servers: Enter IP addresses of domain controllers and key servers
• Authentication: Use service account with "Log on as a service" rights
• Event Log Channels: Security, System, Application (minimum)
• Collection Method: Windows Event Forwarding (WEF) recommended
• Filters: Focus on security-relevant event IDs`,
      
      'Sysmon': `
FOR SYSMON LOGS:
• Sysmon Configuration: Ensure Sysmon is installed with comprehensive config
• Log Location: Usually Windows Event Log → Applications and Services → Microsoft → Windows → Sysmon
• Required Events: Process creation (1), Network connections (3), File creation (11)
• Parser: Use built-in Sysmon parser for field extraction`,
      
      'Firewall Logs': `
FOR FIREWALL LOGS:
• Log Format: Configure firewall to send logs in syslog format
• Destination: Point firewall syslog to broker server IP
• Required Fields: Source IP, Destination IP, Port, Action (Allow/Deny)
• Sample Test: Ensure allow/deny traffic generates log entries`,
      
      'AWS CloudTrail': `
FOR AWS CLOUDTRAIL:
• AWS Credentials: IAM role or user with CloudTrail read permissions
• S3 Bucket: CloudTrail bucket name and region
• API Access: Ensure XSIAM can access AWS APIs
• Log Format: JSON format preferred for field extraction`
    };
    
    return configs[dataSource] || `
GENERIC CONFIGURATION:
• Connection String: Enter appropriate connection details
• Authentication: Provide service account credentials
• Log Format: Specify expected log format (syslog, JSON, etc.)
• Test Connection: Verify connectivity before proceeding`;
  };

  const generateRelevantEventIds = (category: string): string => {
    const eventIds: Record<string, string> = {
      'endpoint': '4624, 4625, 4648, 4688, 4698, 4702, 1102',
      'network': '5156, 5157, 5158, 5159',
      'cloud': 'ConsoleLogin, AssumeRole, CreateUser, DeleteUser',
      'identity': '4624, 4625, 4648, 4740, 4767, 4768'
    };
    
    return eventIds[category] || '4624, 4625, 4688';
  };

  const generateFieldAvailabilityCheck = (category: string): string => {
    const fields: Record<string, string> = {
      'endpoint': `
□ process_name - for process monitoring
□ command_line - for malicious command detection  
□ parent_process - for process tree analysis
□ user_name - for user activity tracking
□ host_name - for lateral movement detection`,
      
      'network': `
□ src_ip - source IP address
□ dest_ip - destination IP address  
□ dest_port - destination port
□ protocol - network protocol
□ action - allow/deny/drop`,
      
      'cloud': `
□ user_name - cloud user identity
□ source_ip - origin IP address
□ action - API action performed
□ resource - target cloud resource
□ region - cloud region`,
      
      'identity': `
□ user_name - authenticated user
□ logon_type - type of authentication
□ src_ip - authentication source
□ computer_name - target system
□ auth_result - success/failure`
    };
    
    return fields[category] || fields['endpoint'];
  };

  // Rest of the component remains the same
  
  const [currentPhase, setCurrentPhase] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const renderInstructions = (instructions: string): JSX.Element => {
    return (
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm font-mono">
          {instructions}
        </pre>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-600 rounded-lg p-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              XSIAM Onboarding Guide: {useCase.title}
            </h2>
            <p className="text-gray-700 mb-4">
              Step-by-step guide for first-time XSIAM setup and data source integration. 
              This comprehensive onboarding ensures smooth analyst success with threat detection.
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Total Time: 2-3 hours
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Difficulty: Beginner-friendly
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Category: {useCase.category}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Step-by-Step Guide</TabsTrigger>
          <TabsTrigger value="infrastructure">Lab Infrastructure</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Process Overview</CardTitle>
              <CardDescription>
                Complete 4-phase process to get your XSIAM environment ready for threat detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {onboardingPhases.map((phase, index) => (
                  <div key={phase.id} className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-semibold">{index + 1}</span>
                    </div>
                    <h3 className="font-medium mb-2">{phase.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{phase.description}</p>
                    {phase.estimatedTime && (
                      <div className="flex items-center justify-center gap-1 text-xs text-blue-600">
                        <Clock className="h-3 w-3" />
                        {phase.estimatedTime}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Required Data Sources for {useCase.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataSourceRequirements.map((source, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Database className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{source}</h4>
                      <p className="text-sm text-muted-foreground">
                        Essential for detecting {useCase.category} threats
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Beginner-Friendly Approach</AlertTitle>
            <AlertDescription>
              This guide is designed for analysts new to XSIAM. Each step includes detailed instructions, 
              validation criteria, and troubleshooting tips. Take your time and validate each phase before proceeding.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          {onboardingPhases.map((phase, phaseIndex) => (
            <Card key={phase.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    phase.steps.every(step => completedSteps.has(step.id))
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {phase.steps.every(step => completedSteps.has(step.id))
                      ? <CheckCircle className="h-4 w-4" />
                      : <span className="text-sm font-semibold">{phaseIndex + 1}</span>
                    }
                  </div>
                  {phase.name}
                </CardTitle>
                {phase.estimatedTime && (
                  <CardDescription>
                    Estimated time: {phase.estimatedTime}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phase.steps.map((step) => (
                    <Card key={step.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {completedSteps.has(step.id) ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-2">{step.title}</h4>
                            <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                            
                            <div className="space-y-2 mb-4">
                              <h5 className="text-sm font-medium">Instructions:</h5>
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap text-sm font-mono">
                                  {step.instructions}
                                </pre>
                              </div>
                            </div>

                            <Alert className="mb-3">
                              <CheckCircle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Validation:</strong> {step.validation}
                              </AlertDescription>
                            </Alert>

                            <Button 
                              size="sm" 
                              onClick={() => handleStepComplete(step.id)}
                              disabled={completedSteps.has(step.id)}
                            >
                              {completedSteps.has(step.id) ? 'Completed' : 'Mark Complete'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Lab Environment Planning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-3">Infrastructure Requirements</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Compute:</span>
                      <span className="text-sm font-medium">{infrastructureGuidance.infrastructure.compute}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Networking:</span>
                      <span className="text-sm font-medium">{infrastructureGuidance.infrastructure.networking}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Storage:</span>
                      <span className="text-sm font-medium">{infrastructureGuidance.infrastructure.storage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Monitoring:</span>
                      <span className="text-sm font-medium">{infrastructureGuidance.infrastructure.monitoring}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Cost Estimation</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Setup Cost:</span>
                      <span className="text-sm font-medium">{infrastructureGuidance.estimatedCost.setup}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Monthly Cost:</span>
                      <span className="text-sm font-medium">{infrastructureGuidance.estimatedCost.monthly}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Deployment Steps</h4>
                <ol className="list-decimal list-inside space-y-2">
                  {infrastructureGuidance.deploymentSteps.map((step, index) => (
                    <li key={index} className="text-sm">{step}</li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-3 mt-6">
                <Button className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Terraform Templates
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Lab Build Planner
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Final Validation Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  'XSIAM tenant access verified and API keys configured',
                  'All required data sources identified and documented',
                  'XSIAM Broker installed and connected successfully',
                  'Data source integrations configured and tested',
                  'Log ingestion confirmed for all required sources',
                  'Field parsing and normalization verified',
                  'Test detection rules execute successfully',
                  'Lab infrastructure deployed and operational',
                  'End-to-end data flow validated',
                  'Ready to proceed with detection rule development'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <Button 
                  onClick={() => onComplete({
                    completedSteps,
                    dataSourceRequirements,
                    infrastructureGuidance
                  })}
                  className="w-full"
                >
                  Complete XSIAM Onboarding
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};