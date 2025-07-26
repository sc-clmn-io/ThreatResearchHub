import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, Shield, Play, Eye, Layout, Code, Database, Download, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import XQLPreviewModal from './xql-preview-modal';
import PlaybookPreviewModal from './playbook-preview-modal';
import AlertLayoutPreviewModal from './alert-layout-preview-modal';

// Sample data that doesn't require API keys
const SAMPLE_THREAT_REPORT = {
  title: "APT29 Cozy Bear: Advanced Persistent Threat Campaign",
  cves: ["CVE-2023-23397", "CVE-2023-36884"],
  techniques: ["T1566.001", "T1055.012", "T1027.010"],
  technologies: ["Microsoft Outlook", "Windows", "PowerShell", "WMI"],
  threat_actors: ["APT29", "Cozy Bear", "The Dukes"],
  severity: "critical"
};

const threatExamples = {
  windows_defender: {
    name: "APT29 Cozy Bear Malware Detection",
    category: "endpoint",
    severity: "critical",
    description: "Advanced persistent threat using process injection and email exploitation",
    dataSources: ["Microsoft Defender for Endpoint", "Windows Event Logs", "Microsoft Graph Security"],
    mitreAttack: ["T1566.001", "T1055.012", "T1027.010"],
    indicators: ["Process injection patterns", "Email-based exploitation", "PowerShell obfuscation"]
  },
  aws_cloudtrail: {
    name: "Privilege Escalation via IAM Policy Manipulation", 
    category: "cloud",
    severity: "high",
    description: "Detect unauthorized modifications to IAM policies that could lead to privilege escalation",
    dataSources: ["AWS CloudTrail", "AWS Config", "AWS IAM"],
    mitreAttack: ["T1098.001", "T1484.002"],
    indicators: ["Policy attachment to user/role", "Unusual API calls", "Cross-account access"]
  },
  crowdstrike: {
    name: "Falcon Detection: Living-off-the-Land Attack",
    category: "endpoint", 
    severity: "high",
    description: "Advanced threat actor using legitimate tools for malicious activities",
    dataSources: ["CrowdStrike Falcon", "Process Telemetry", "Network Behavior"],
    mitreAttack: ["T1218", "T1105", "T1027"],
    indicators: ["Legitimate binary abuse", "Network anomalies", "Process hollowing"]
  },
  kubernetes: {
    name: "Container Breakout Attempt",
    category: "cloud",
    severity: "critical", 
    description: "Detect attempts to escape container boundaries and access host system",
    dataSources: ["Kubernetes Audit Logs", "Container Runtime", "Falco Events"],
    mitreAttack: ["T1611", "T1610", "T1055"],
    indicators: ["Privileged container creation", "Host filesystem access", "Kernel exploitation"]
  }
};

const SAMPLE_XQL_RULES = [
  {
    id: "apt29-email-exploit",
    name: "APT29 Email Exploitation Detection",
    severity: "critical",
    xql_query: `dataset = xdr_data
| filter agent_hostname != null and action_file_path != null
| filter action_process_image_name ~= ".*outlook.*"
| filter action_file_extension in ("msg", "eml", "pst")
| filter action_file_create_time > current_time() - interval 1 hour
| filter action_file_size < 1000000 and action_file_size > 100
| filter action_process_command_line contains "-Embedding"
| fields _time, agent_hostname, actor_primary_username, action_process_image_name, action_file_path, action_file_md5
| sort _time desc`,
    description: "Detects APT29 email exploitation attempts through suspicious Outlook file operations and process spawning patterns",
    mitre_techniques: ["T1566.001", "T1203"],
    data_sources: ["Windows Event Logs", "Email Logs", "Process Monitoring", "File System Monitoring"],
    false_positive_rate: "Low (< 5%)",
    test_status: "passed" as const
  },
  {
    id: "apt29-powershell-injection",
    name: "APT29 PowerShell Process Injection",
    severity: "high",
    xql_query: `dataset = xdr_data
| filter agent_hostname != null and action_process_image_name != null
| filter action_process_image_name ~= ".*powershell.*"
| filter action_process_command_line contains "-EncodedCommand"
| filter action_process_command_line contains "Invoke-Expression"
| filter actor_process_image_name != action_process_image_name
| fields _time, agent_hostname, actor_primary_username, action_process_command_line
| sort _time desc`,
    description: "Identifies APT29 PowerShell-based process injection techniques",
    mitre_techniques: ["T1055.012", "T1059.001"],
    data_sources: ["Windows Event Logs", "PowerShell Logs", "Sysmon"],
    false_positive_rate: "Medium (10-15%)",
    test_status: "passed" as const
  },
  {
    id: "apt29-cve-exploitation",
    name: "APT29 CVE-2023-23397 Exploitation Indicators",
    severity: "critical",
    xql_query: `dataset = xdr_data
| filter agent_hostname != null and action_process_image_name != null
| filter action_process_image_name ~= ".*outlook.*"
| filter action_network_connection_direction = "outbound"
| filter action_remote_port in (25, 587, 993, 995)
| filter action_file_write = true and action_file_extension = "msg"
| filter action_process_signature_status != "signed"
| fields _time, agent_hostname, actor_primary_username, action_remote_ip, action_file_path, action_process_signature_vendor
| sort _time desc`,
    description: "Detects exploitation patterns consistent with CVE-2023-23397 through network behavior and file operations",
    mitre_techniques: ["T1203", "T1566.001", "T1041"],
    data_sources: ["Network Traffic", "File System Monitoring", "Process Monitoring", "Digital Signatures"],
    false_positive_rate: "Medium (8-12%)",
    test_status: "passed" as const
  },
  {
    id: "apt29-wmi-persistence",
    name: "APT29 WMI Persistence Mechanism",
    severity: "high",
    xql_query: `dataset = xdr_data
| filter agent_hostname != null and action_registry_key_name != null
| filter action_registry_key_name contains "SOFTWARE\\\\Classes\\\\WMI"
| filter action_registry_value_name in ("EventConsumer", "FilterToConsumerBinding")
| filter action_process_image_name ~= ".*(wmic|powershell).*"
| fields _time, agent_hostname, action_registry_key_name, action_registry_value_name
| sort _time desc`,
    description: "Detects APT29 WMI-based persistence establishment",
    mitre_techniques: ["T1546.003", "T1047"],
    data_sources: ["Windows Registry", "WMI Logs", "Process Monitoring"],
    false_positive_rate: "Low (< 8%)",
    test_status: "untested" as const
  }
];

const SAMPLE_PLAYBOOK = {
  name: "APT29 Incident Response Playbook",
  description: "Automated response workflow for APT29 threat detection based on phishing and process injection indicators",
  version: "1.0",
  tasks: [
    {
      id: "0",
      name: "Start Investigation",
      type: "start",
      description: "Initialize APT29 incident response workflow",
      nexttasks: { "#none#": ["1"] }
    },
    {
      id: "1", 
      name: "Acknowledge Alert",
      type: "regular",
      description: "Send acknowledgment email to reporting user",
      scriptarguments: {
        body: "Thank you for reporting the suspicious activity. We are actively investigating this potential APT29 incident.",
        subject: "Security Alert - Investigation in Progress"
      },
      nexttasks: { "#none#": ["2"] }
    },
    {
      id: "2",
      name: "Isolate Affected Endpoints", 
      type: "regular",
      description: "Immediately isolate endpoints showing APT29 indicators",
      scriptarguments: {
        hostname: "${incident.agentHostname}",
        isolation_type: "full"
      },
      nexttasks: { "#none#": ["3"] }
    },
    {
      id: "3",
      name: "Collect Memory Dumps",
      type: "regular", 
      description: "Collect forensic artifacts from compromised systems",
      scriptarguments: {
        dump_type: "full_memory",
        preserve_evidence: "true"
      },
      nexttasks: { "#none#": ["4"] }
    },
    {
      id: "4",
      name: "Reset Credentials",
      type: "condition",
      description: "Determine if user credentials need reset based on attack vectors",
      nexttasks: { 
        "yes": ["5"],
        "no": ["6"] 
      }
    },
    {
      id: "5",
      name: "Force Password Reset",
      type: "regular",
      description: "Reset compromised user credentials immediately", 
      scriptarguments: {
        username: "${incident.actorPrimaryUsername}",
        force_logout: "true"
      },
      nexttasks: { "#none#": ["6"] }
    },
    {
      id: "6",
      name: "Block IOCs",
      type: "regular",
      description: "Block identified APT29 indicators at network level",
      scriptarguments: {
        ioc_list: "${incident.indicators}",
        block_duration: "permanent"
      },
      nexttasks: { "#none#": ["7"] }
    },
    {
      id: "7",
      name: "Generate Incident Report",
      type: "regular", 
      description: "Create comprehensive incident report with timeline and evidence",
      scriptarguments: {
        template: "apt29_incident_template",
        include_forensics: "true"
      },
      nexttasks: { "#none#": [] }
    }
  ],
  inputs: [
    {
      key: "incident.agentHostname",
      value: "",
      required: true,
      description: "Hostname of affected endpoint"
    },
    {
      key: "incident.actorPrimaryUsername", 
      value: "",
      required: true,
      description: "Primary username involved in incident"
    },
    {
      key: "incident.indicators",
      value: "",
      required: true,
      description: "List of IOCs to block"
    }
  ],
  outputs: [
    {
      key: "incident_id",
      description: "Generated incident identifier",
      type: "string"
    },
    {
      key: "remediation_status",
      description: "Status of remediation actions",
      type: "string"
    },
    {
      key: "forensic_artifacts",
      description: "Collected forensic evidence", 
      type: "array"
    }
  ]
};

const SAMPLE_ALERT_LAYOUT = {
  name: "APT29 Alert Investigation Layout", 
  description: "Specialized alert layout for APT29 threat investigations with process, email, and network context. Includes custom Python scripts for dynamic content and automated threat response actions.",
  tabs: [
    {
      id: "summary",
      name: "Legacy Summary", 
      type: "summary"
    },
    {
      id: "apt29-overview",
      name: "APT29 Alert Details",
      type: "custom",
      sections: [
        {
          displayType: "ROW",
          items: [
            { fieldId: "timestamp", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" },
            { fieldId: "alertid", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" },
            { fieldId: "severity", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" },
            { fieldId: "agentHostname", height: 26, startCol: 0, endCol: 4, sectionItemType: "field" }
          ]
        }
      ]
    },
    {
      id: "process-analysis",
      name: "Process Analysis",
      type: "custom", 
      sections: [
        {
          displayType: "ROW",
          items: [
            { fieldId: "actionProcessImageName", height: 26, startCol: 0, endCol: 4, sectionItemType: "field" },
            { fieldId: "actionProcessCommandLine", height: 52, startCol: 0, endCol: 4, sectionItemType: "field" },
            { fieldId: "actorProcessImageName", height: 26, startCol: 0, endCol: 4, sectionItemType: "field" },
            { fieldId: "actionProcessSignatureStatus", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" },
            { fieldId: "actionProcessMd5", height: 26, startCol: 0, endCol: 4, sectionItemType: "field" }
          ]
        }
      ]
    },
    {
      id: "network-context",
      name: "Network Context",
      type: "custom",
      sections: [
        {
          displayType: "ROW", 
          items: [
            { fieldId: "actionRemoteIp", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" },
            { fieldId: "actionRemotePort", height: 26, startCol: 2, endCol: 4, sectionItemType: "field" },
            { fieldId: "actionNetworkConnectionDirection", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" },
            { fieldId: "actionLocalIp", height: 26, startCol: 2, endCol: 4, sectionItemType: "field" }
          ]
        }
      ]
    },
    {
      id: "file-operations",
      name: "File Operations", 
      type: "custom",
      sections: [
        {
          displayType: "ROW",
          items: [
            { fieldId: "actionFilePath", height: 26, startCol: 0, endCol: 4, sectionItemType: "field" },
            { fieldId: "actionFileExtension", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" },
            { fieldId: "actionFileSize", height: 26, startCol: 2, endCol: 4, sectionItemType: "field" },
            { fieldId: "actionFileMd5", height: 26, startCol: 0, endCol: 4, sectionItemType: "field" },
            { fieldId: "actionFileCreateTime", height: 26, startCol: 0, endCol: 2, sectionItemType: "field" }
          ]
        }
      ]
    }
  ],
  fields: [
    { fieldId: "timestamp", displayName: "Alert Timestamp", type: "date", description: "When the alert was generated" },
    { fieldId: "alertid", displayName: "Alert ID", type: "string", description: "Unique alert identifier" },
    { fieldId: "severity", displayName: "Severity", type: "string", description: "Alert severity level" },
    { fieldId: "agentHostname", displayName: "Affected Hostname", type: "string", description: "Hostname where the alert occurred" },
    { fieldId: "actionProcessImageName", displayName: "Process Name", type: "string", description: "Name of the process that triggered the alert" },
    { fieldId: "actionProcessCommandLine", displayName: "Command Line", type: "string", description: "Full command line arguments" },
    { fieldId: "actorProcessImageName", displayName: "Parent Process", type: "string", description: "Parent process that spawned the action" },
    { fieldId: "actionProcessSignatureStatus", displayName: "Signature Status", type: "string", description: "Digital signature verification status" },
    { fieldId: "actionProcessMd5", displayName: "Process MD5", type: "string", description: "MD5 hash of the process executable" },
    { fieldId: "actionRemoteIp", displayName: "Remote IP", type: "string", description: "Remote IP address in network connection" },
    { fieldId: "actionRemotePort", displayName: "Remote Port", type: "number", description: "Remote port number" },
    { fieldId: "actionNetworkConnectionDirection", displayName: "Connection Direction", type: "string", description: "Direction of network connection (inbound/outbound)" },
    { fieldId: "actionLocalIp", displayName: "Local IP", type: "string", description: "Local IP address" },
    { fieldId: "actionFilePath", displayName: "File Path", type: "string", description: "Full path to the file" },
    { fieldId: "actionFileExtension", displayName: "File Extension", type: "string", description: "File extension" },
    { fieldId: "actionFileSize", displayName: "File Size", type: "number", description: "File size in bytes" },
    { fieldId: "actionFileMd5", displayName: "File MD5", type: "string", description: "MD5 hash of the file" },
    { fieldId: "actionFileCreateTime", displayName: "File Create Time", type: "date", description: "When the file was created" }
  ]
};

const SAMPLE_DASHBOARD = {
  name: "APT29 Threat Monitoring Dashboard",
  widgets: [
    "Real-time alert volume by severity",
    "Affected systems geographic distribution", 
    "Attack progression timeline",
    "IOC detection rate trends",
    "Response time metrics"
  ]
};

export default function FallbackContentDemo() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showXQLPreview, setShowXQLPreview] = useState(false);
  const [showPlaybookPreview, setShowPlaybookPreview] = useState(false);
  const [showLayoutPreview, setShowLayoutPreview] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState('windows_defender');
  const { toast } = useToast();

  const currentThreat = threatExamples[selectedDataSource as keyof typeof threatExamples];

  const downloadCompletePackage = async () => {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Sample content for each type
      const sampleContent = {
        correlation: JSON.stringify(SAMPLE_XQL_RULES[0], null, 2),
        playbook: `name: ${SAMPLE_PLAYBOOK.name}
description: ${SAMPLE_PLAYBOOK.description}
version: "1.0"
id: ${SAMPLE_PLAYBOOK.id}
tasks: ${JSON.stringify(SAMPLE_PLAYBOOK.tasks.slice(0, 3), null, 2)}`,
        layout: JSON.stringify(SAMPLE_ALERT_LAYOUT, null, 2),
        dashboard: JSON.stringify(SAMPLE_DASHBOARD, null, 2)
      };

      // Add files to zip
      zip.file(`${selectedDataSource}-correlation.json`, sampleContent.correlation);
      zip.file(`${selectedDataSource}-playbook.yml`, sampleContent.playbook);
      zip.file(`${selectedDataSource}-layout.json`, sampleContent.layout);
      zip.file(`${selectedDataSource}-dashboard.json`, sampleContent.dashboard);

      // Add README
      const readmeContent = `# ${currentThreat.name} - XSIAM Detection Package

## Overview
${currentThreat.description}

## Data Sources Required
${currentThreat.dataSources.join(', ')}

## MITRE ATT&CK Techniques
${currentThreat.mitreAttack.join(', ')}

## Package Contents
- XQL Correlation Rule (${selectedDataSource}-correlation.json)
- Automation Playbook (${selectedDataSource}-playbook.yml)
- Alert Layout (${selectedDataSource}-layout.json)
- Dashboard Configuration (${selectedDataSource}-dashboard.json)

## Installation
Import each file into your XSIAM/Cortex Cloud environment through the respective management interfaces.
`;
      
      zip.file('README.md', readmeContent);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedDataSource}-detection-package.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Package Downloaded",
        description: "Complete XSIAM detection package downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Error creating package. Please try again.",
        variant: "destructive",
      });
    }
  };

  const downloadSingleContent = (contentType: string, content: string, extension: string) => {
    const filename = `${selectedDataSource}-${contentType}.${extension}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Content Downloaded",
      description: `${contentType} content downloaded successfully`,
    });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Demo Mode:</strong> This shows sample XSIAM content generation without requiring API keys. 
          Real content generation uses your threat reports and AI analysis.
        </AlertDescription>
      </Alert>

      {/* Data Source Selector */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Data Source & Threat Scenario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedDataSource === 'windows_defender' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDataSource('windows_defender')}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Windows Defender
            </Button>
            <Button
              variant={selectedDataSource === 'aws_cloudtrail' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDataSource('aws_cloudtrail')}
              className="flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              AWS CloudTrail
            </Button>
            <Button
              variant={selectedDataSource === 'crowdstrike' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDataSource('crowdstrike')}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              CrowdStrike Falcon
            </Button>
            <Button
              variant={selectedDataSource === 'kubernetes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDataSource('kubernetes')}
              className="flex items-center gap-2"
            >
              <Code className="w-4 h-4" />
              Kubernetes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Threat Context */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900">
              <Target className="w-5 h-5" />
              Current Threat Scenario
            </div>
            <Button
              onClick={() => downloadCompletePackage()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Complete Package
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-blue-900">Threat Name</div>
              <div className="text-sm text-blue-800">{currentThreat.name}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-900">Category</div>
              <Badge variant="secondary">{currentThreat.category}</Badge>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-900">Severity</div>
              <Badge variant={currentThreat.severity === 'critical' ? 'destructive' : 'default'}>
                {currentThreat.severity}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="text-sm font-medium text-blue-900 mb-2">Description</div>
            <p className="text-sm text-blue-800">{currentThreat.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-sm font-medium text-blue-900 mb-2">Data Sources</div>
              <div className="flex flex-wrap gap-1">
                {currentThreat.dataSources.map(source => (
                  <Badge key={source} variant="outline" className="text-xs">{source}</Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-blue-900 mb-2">MITRE ATT&CK</div>
              <div className="flex flex-wrap gap-1">
                {currentThreat.mitreAttack.map(technique => (
                  <Badge key={technique} variant="secondary" className="text-xs">{technique}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="xql">XQL Rules</TabsTrigger>
          <TabsTrigger value="playbook">Playbook</TabsTrigger>
          <TabsTrigger value="layout">Alert Layout</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Generated XSIAM Content Package</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">4</div>
                  <div className="text-sm text-gray-600">XQL Correlation Rules</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">1</div>
                  <div className="text-sm text-gray-600">Response Playbook</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">1</div>
                  <div className="text-sm text-gray-600">Alert Layout</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">1</div>
                  <div className="text-sm text-gray-600">Monitoring Dashboard</div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <h4 className="font-medium">Key Features of Generated Content:</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Threat-specific XQL queries with proper field mappings</li>
                  <li>• MITRE ATT&CK technique coverage and validation</li>
                  <li>• Data source requirements clearly identified</li>
                  <li>• False positive rate estimation included</li>
                  <li>• Ready-to-deploy XSIAM format compatibility</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xql">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated XQL Correlation Rules</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowXQLPreview(true)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview & Validate
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadSingleContent('correlation', JSON.stringify(SAMPLE_XQL_RULES[0], null, 2), 'json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <div className="grid gap-4">
              {SAMPLE_XQL_RULES.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge 
                        className={
                          rule.severity === 'critical' ? 'bg-red-500 text-white' :
                          rule.severity === 'high' ? 'bg-orange-500 text-white' :
                          'bg-yellow-500 text-white'
                        }
                      >
                        {rule.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{rule.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {rule.mitre_techniques.map(technique => (
                        <Badge key={technique} variant="outline" className="text-xs">
                          {technique}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="playbook">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Response Playbook</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPlaybookPreview(true)}>
                  <Play className="h-4 w-4 mr-2" />
                  Preview Workflow
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadSingleContent('playbook', 
                    `name: ${SAMPLE_PLAYBOOK.name}\ndescription: ${SAMPLE_PLAYBOOK.description}\nversion: "1.0"\nid: ${SAMPLE_PLAYBOOK.id}\ntasks: ${JSON.stringify(SAMPLE_PLAYBOOK.tasks.slice(0, 3), null, 2)}`, 'yml')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {SAMPLE_PLAYBOOK.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{SAMPLE_PLAYBOOK.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Key Workflow Features:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>• Automated endpoint isolation</div>
                    <div>• Forensic evidence collection</div>
                    <div>• Credential reset workflows</div>
                    <div>• IOC blocking at network level</div>
                    <div>• Stakeholder notifications</div>
                    <div>• Comprehensive incident reporting</div>
                  </div>
                </div>

                <h4 className="font-medium mb-3">Automated Response Tasks:</h4>
                <div className="space-y-2">
                  {SAMPLE_PLAYBOOK.tasks.slice(0, 5).map((task, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{task.name}</div>
                        <div className="text-xs text-gray-500">{task.description}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {task.type}
                      </Badge>
                    </div>
                  ))}
                  <div className="text-center py-2">
                    <Badge variant="secondary" className="text-xs">
                      +{SAMPLE_PLAYBOOK.tasks.length - 5} more tasks in full workflow
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="layout">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Alert Layout</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLayoutPreview(true)}>
                  <Layout className="h-4 w-4 mr-2" />
                  Preview Layout
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadSingleContent('layout', JSON.stringify(SAMPLE_ALERT_LAYOUT, null, 2), 'json')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  {SAMPLE_ALERT_LAYOUT.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{SAMPLE_ALERT_LAYOUT.description}</p>
                
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Layout Features & Python Scripts:</h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                    <div>• APT29-specific field organization</div>
                    <div>• Dynamic content with Python scripts</div>
                    <div>• Process analysis with enrichment</div>
                    <div>• Network context visualization</div>
                    <div>• File operation tracking</div>
                    <div>• Automated threat intelligence lookup</div>
                  </div>
                  
                  <Alert className="mb-4">
                    <Code className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Required Python Scripts:</strong> Layout includes custom automation scripts for 
                      dynamic content fetching using <code>demisto.alert()</code>, <code>execute_command()</code>, 
                      and HTML table formatting for threat-specific data enrichment.
                    </AlertDescription>
                  </Alert>
                </div>

                <h4 className="font-medium mb-3">Alert Layout Tabs:</h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {SAMPLE_ALERT_LAYOUT.tabs.map((tab, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-gradient-to-r from-purple-50 to-blue-50">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {tab.type}
                        </Badge>
                        <span className="text-sm font-medium">{tab.name}</span>
                      </div>
                      {tab.sections && (
                        <div className="text-xs text-gray-500">
                          {tab.sections.length} sections, {tab.sections.reduce((acc, section) => acc + section.items.length, 0)} fields
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Alert layouts provide structured investigation interfaces with threat-specific field organization 
                    and analyst workflow optimization for efficient incident response.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="dashboard">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Generated Dashboard</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => downloadSingleContent('dashboard', JSON.stringify(SAMPLE_DASHBOARD, null, 2), 'json')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{SAMPLE_DASHBOARD.name}</CardTitle>
              </CardHeader>
            <CardContent>
              <h4 className="font-medium mb-3">Dashboard Widgets:</h4>
              <div className="grid md:grid-cols-2 gap-3">
                {SAMPLE_DASHBOARD.widgets.map((widget, index) => (
                  <div key={index} className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
                    <span className="text-sm font-medium">{widget}</span>
                  </div>
                ))}
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Dashboard widgets are automatically configured based on the detected threat patterns 
                  and include real-time monitoring capabilities for production deployment.
                </AlertDescription>
              </Alert>
            </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Controlled Modal Components */}
      <XQLPreviewModal 
        rules={SAMPLE_XQL_RULES}
        isOpen={showXQLPreview}
        onClose={() => setShowXQLPreview(false)}
      />
      
      <PlaybookPreviewModal
        isOpen={showPlaybookPreview}
        onClose={() => setShowPlaybookPreview(false)}
        playbookData={SAMPLE_PLAYBOOK}
      />

      <AlertLayoutPreviewModal
        isOpen={showLayoutPreview}
        onClose={() => setShowLayoutPreview(false)}
        selectedDataSource="windows_defender"
        layoutData={SAMPLE_ALERT_LAYOUT}
      />
    </div>
  );
}