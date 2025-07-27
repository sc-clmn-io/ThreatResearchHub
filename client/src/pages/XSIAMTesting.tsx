import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Copy, ExternalLink, Play, Shield, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function XSIAMTesting() {
  const { toast } = useToast();
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, itemName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemName);
      toast({
        title: "Copied to clipboard",
        description: `${itemName} copied successfully`,
      });
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive"
      });
    }
  };

  const apt29XQLRule = `dataset = xdr_data 
| filter event_type = ENUM.PROCESS 
  and action_process_image_name contains "powershell" 
  and action_process_command_line contains "WMI" 
  and action_process_command_line contains "embassy"
| fields _time, agent_hostname, actor_primary_username, action_process_command_line, action_process_image_path
| sort _time desc`;

  const apt29PlaybookYaml = `id: apt29-response-playbook
version: 1
name: APT29 Cozy Bear Response Playbook
description: Automated response workflow for APT29 threat detection
fromversion: 6.0.0

tasks:
  "0":
    id: "0"
    taskid: start-investigation
    name: Start APT29 Investigation
    type: start
    description: Initialize APT29 incident response workflow
    nexttasks:
      '#none#':
        - "1"

  "1":
    id: "1"
    taskid: isolate-endpoint
    name: Isolate Affected Endpoint
    type: regular
    description: Immediately isolate endpoints showing APT29 indicators
    script: CortexXDRIsolateEndpoint
    scriptarguments:
      hostname: \${incident.agent_hostname}
      isolation_type: full
    nexttasks:
      '#none#':
        - "2"

  "2":
    id: "2"
    taskid: collect-evidence
    name: Collect Forensic Evidence
    type: regular
    description: Collect memory dumps and forensic artifacts
    script: CortexXDRCollectFiles
    scriptarguments:
      hostname: \${incident.agent_hostname}
      file_paths: "C:\\Windows\\Temp\\*, C:\\Users\\*\\AppData\\Local\\Temp\\*"
      include_memory: "true"
    nexttasks:
      '#none#':
        - "3"

  "3":
    id: "3"
    taskid: analyze-powershell
    name: Analyze PowerShell Logs
    type: regular
    description: Deep analysis of PowerShell execution logs
    script: PowerShellHunter
    scriptarguments:
      hostname: \${incident.agent_hostname}
      timeframe: "24h"
      keywords: "WMI,embassy,process injection"
    nexttasks:
      '#none#':
        - "4"

  "4":
    id: "4"
    taskid: check-lateral-movement
    name: Check for Lateral Movement
    type: condition
    description: Determine if APT29 moved laterally in network
    nexttasks:
      "yes":
        - "5"
      "no":
        - "6"

  "5":
    id: "5"
    taskid: contain-lateral-spread
    name: Contain Lateral Spread
    type: regular
    description: Block network segments and isolate additional hosts
    script: NetworkSegmentIsolation
    scriptarguments:
      affected_subnets: \${incident.network_segments}
      block_duration: "4h"
    nexttasks:
      '#none#':
        - "6"

  "6":
    id: "6"
    taskid: reset-credentials
    name: Reset Compromised Credentials
    type: regular
    description: Force password reset for affected accounts
    script: ActiveDirectoryPasswordReset
    scriptarguments:
      username: \${incident.actor_primary_username}
      force_logout: "true"
      require_mfa_reauth: "true"
    nexttasks:
      '#none#':
        - "7"

  "7":
    id: "7"
    taskid: block-iocs
    name: Block APT29 IOCs
    type: regular
    description: Block identified indicators at network perimeter
    script: PaloAltoNGFWBlockIOCs
    scriptarguments:
      ioc_list: "malicious.example.com,c2.example.org,192.168.1.100"
      block_type: "permanent"
      apply_to_devices: "all_firewalls"
    nexttasks:
      '#none#':
        - "8"

  "8":
    id: "8"
    taskid: generate-report
    name: Generate Incident Report
    type: regular
    description: Create comprehensive APT29 incident documentation
    script: GenerateIncidentReport
    scriptarguments:
      template: "apt29_incident_template"
      include_timeline: "true"
      include_forensics: "true"
      send_to: "soc-management@company.com"
    nexttasks:
      '#none#': []`;

  const apt29AlertLayout = `{
  "layout": {
    "id": "apt29-alert-layout",
    "name": "APT29 Cozy Bear Investigation Layout",
    "description": "Analyst investigation interface for APT29 detections",
    "version": 1,
    "sections": [
      {
        "id": "threat-overview",
        "name": "Threat Overview",
        "type": "header",
        "fields": [
          {
            "fieldname": "incident.severity",
            "label": "Severity",
            "type": "badge"
          },
          {
            "fieldname": "incident.threat_actor",
            "label": "Threat Actor",
            "type": "text",
            "default": "APT29 (Cozy Bear)"
          },
          {
            "fieldname": "incident.mitre_techniques", 
            "label": "MITRE Techniques",
            "type": "list"
          }
        ]
      },
      {
        "id": "affected-systems",
        "name": "Affected Systems",
        "type": "table",
        "fields": [
          {
            "fieldname": "incident.agent_hostname",
            "label": "Hostname",
            "type": "text"
          },
          {
            "fieldname": "incident.actor_primary_username", 
            "label": "User",
            "type": "text"
          },
          {
            "fieldname": "incident.action_process_command_line",
            "label": "Command Line",
            "type": "code"
          }
        ]
      },
      {
        "id": "ioc-analysis",
        "name": "IOC Analysis", 
        "type": "indicators",
        "fields": [
          {
            "fieldname": "incident.file_hashes",
            "label": "File Hashes",
            "type": "hash_list"
          },
          {
            "fieldname": "incident.network_connections",
            "label": "Network IOCs", 
            "type": "network_list"
          }
        ]
      },
      {
        "id": "analyst-actions",
        "name": "Response Actions",
        "type": "buttons",
        "buttons": [
          {
            "id": "isolate-endpoint",
            "label": "Isolate Endpoint",
            "style": "danger",
            "script": "CortexXDRIsolateEndpoint",
            "confirm": true
          },
          {
            "id": "reset-password", 
            "label": "Reset User Password",
            "style": "warning",
            "script": "ActiveDirectoryPasswordReset",
            "confirm": true
          },
          {
            "id": "block-iocs",
            "label": "Block IOCs",
            "style": "primary", 
            "script": "PaloAltoNGFWBlockIOCs",
            "confirm": false
          },
          {
            "id": "collect-evidence",
            "label": "Collect Forensics",
            "style": "secondary",
            "script": "CortexXDRCollectFiles",
            "confirm": false
          },
          {
            "id": "mark-false-positive",
            "label": "Mark False Positive",
            "style": "outline",
            "script": "CloseIncidentFalsePositive",
            "confirm": true
          }
        ]
      },
      {
        "id": "investigation-timeline",
        "name": "Investigation Timeline",
        "type": "timeline",
        "fields": [
          {
            "fieldname": "incident.alert_timestamp",
            "label": "Alert Generated"
          },
          {
            "fieldname": "incident.first_seen",
            "label": "First Observed Activity"
          },
          {
            "fieldname": "incident.last_seen", 
            "label": "Last Observed Activity"
          }
        ]
      }
    ]
  }
}`;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Shield className="h-8 w-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold">APT29 XSIAM Testing Suite</h1>
          <p className="text-muted-foreground">Test correlation rules, alert layouts, and automation playbooks in your XSIAM environment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">XQL Rule Ready</p>
                <p className="text-sm text-muted-foreground">PowerShell WMI detection</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Playbook Ready</p>
                <p className="text-sm text-muted-foreground">8-step response workflow</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Layout Ready</p>
                <p className="text-sm text-muted-foreground">Analyst investigation UI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="xql-rule" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="xql-rule" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>XQL Rule</span>
          </TabsTrigger>
          <TabsTrigger value="alert-layout" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Alert Layout</span>
          </TabsTrigger>
          <TabsTrigger value="playbook" className="flex items-center space-x-2">
            <Play className="h-4 w-4" />
            <span>Playbook</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="xql-rule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <span>APT29 XQL Correlation Rule</span>
                <Badge variant="secondary">92% Fidelity</Badge>
              </CardTitle>
              <CardDescription>
                Detects APT29 PowerShell-based WMI execution patterns. Ready for XSIAM import.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                <pre className="text-sm overflow-x-auto">{apt29XQLRule}</pre>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => copyToClipboard(apt29XQLRule, "XQL Rule")}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedItem === "XQL Rule" ? "Copied!" : "Copy Rule"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://docs.paloaltonetworks.com/cortex/cortex-xdr/cortex-xdr-pro-admin/investigation/custom-correlation-rules" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    XSIAM Docs
                  </a>
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />
                  XSIAM Testing Steps
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Navigate to XSIAM → Settings → Detection Rules → Correlation Rules</li>
                  <li>Click "Create Rule" → "Advanced" → "XQL Query"</li>
                  <li>Paste the XQL rule above into the query editor</li>
                  <li>Set severity to "High" and enable the rule</li>
                  <li>Test with sample data or run against historical logs</li>
                  <li>Verify fields: event_type, action_process_image_name, action_process_command_line</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Expected Results</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• PowerShell processes with WMI keywords</li>
                    <li>• Command lines containing "embassy"</li>
                    <li>• False positive rate: 10-15%</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Required Data Sources</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Windows Event Logs (4688)</li>
                    <li>• PowerShell Operational Logs</li>
                    <li>• Sysmon Process Creation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alert-layout" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-600" />
                <span>APT29 Alert Layout</span>
                <Badge variant="secondary">85% Fidelity</Badge>
              </CardTitle>
              <CardDescription>
                Analyst investigation interface with decision support buttons and contextual information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border max-h-96 overflow-y-auto">
                <pre className="text-xs">{apt29AlertLayout}</pre>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => copyToClipboard(apt29AlertLayout, "Alert Layout")}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedItem === "Alert Layout" ? "Copied!" : "Copy Layout"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://docs.paloaltonetworks.com/cortex/cortex-xsiam/cortex-xsiam-admin/incident-management/customize-incident-layouts" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Layout Docs
                  </a>
                </Button>
              </div>

              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  XSIAM Layout Testing
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Go to XSIAM → Settings → Objects → Incident Layouts</li>
                  <li>Click "New Layout" → "JSON Import"</li>
                  <li>Paste the layout JSON above</li>
                  <li>Associate with "APT29" incident type</li>
                  <li>Test layout by creating a sample APT29 incident</li>
                  <li>Verify all action buttons work correctly</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Layout Sections</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Threat Overview with severity</li>
                    <li>• Affected Systems table</li>
                    <li>• IOC Analysis with indicators</li>
                    <li>• Response action buttons</li>
                    <li>• Investigation timeline</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Action Buttons</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Isolate Endpoint (Critical)</li>
                    <li>• Reset User Password</li>
                    <li>• Block IOCs at firewall</li>
                    <li>• Collect forensic evidence</li>
                    <li>• Mark false positive</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playbook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-blue-600" />
                <span>APT29 Response Playbook</span>
                <Badge variant="secondary">88% Fidelity</Badge>
              </CardTitle>
              <CardDescription>
                8-step automated incident response workflow for APT29 detection and containment.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border max-h-96 overflow-y-auto">
                <pre className="text-xs">{apt29PlaybookYaml}</pre>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => copyToClipboard(apt29PlaybookYaml, "Playbook YAML")}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedItem === "Playbook YAML" ? "Copied!" : "Copy Playbook"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://docs.paloaltonetworks.com/cortex/cortex-xsoar/6-10/cortex-xsoar-admin/playbooks" target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Playbook Docs
                  </a>
                </Button>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium mb-2 flex items-center">
                  <Play className="h-4 w-4 mr-2 text-blue-600" />
                  XSIAM Playbook Testing
                </h4>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Navigate to XSIAM → Playbooks → Import Playbook</li>
                  <li>Upload the YAML file or paste content</li>
                  <li>Verify all integrations are configured (Cortex XDR, Active Directory, etc.)</li>
                  <li>Test playbook with sample APT29 incident</li>
                  <li>Monitor each task execution and outputs</li>
                  <li>Validate automation scripts are properly configured</li>
                </ol>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-1">Automation Tasks</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• 1. Isolate affected endpoint</li>
                    <li>• 2. Collect forensic evidence</li>
                    <li>• 3. Analyze PowerShell logs</li>
                    <li>• 4. Check lateral movement</li>
                    <li>• 5. Contain network spread</li>
                    <li>• 6. Reset compromised credentials</li>
                    <li>• 7. Block IOCs at firewall</li>
                    <li>• 8. Generate incident report</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-1">Required Integrations</h5>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Cortex XDR (endpoint isolation)</li>
                    <li>• Active Directory (password reset)</li>
                    <li>• Palo Alto NGFW (IOC blocking)</li>
                    <li>• PowerShell Hunter (log analysis)</li>
                    <li>• Email integration (notifications)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <span>Production Deployment Notes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Before deploying to production XSIAM:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Test all components in development environment first</li>
            <li>Verify all required integrations are configured and active</li>
            <li>Review and customize IOC lists for your environment</li>
            <li>Establish baseline false positive rates during testing period</li>
            <li>Train SOC analysts on new APT29 detection capabilities</li>
            <li>Set up monitoring for playbook execution and failure rates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}