import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, Database, Eye, Code, FileText, Info, 
  AlertTriangle, CheckCircle, Play, Settings, Download, Layout
} from 'lucide-react';

interface DataSourceLayoutProps {
  dataSource: string;
}

export default function DataSourceAlertLayouts({ dataSource }: DataSourceLayoutProps) {
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>(['automation_scripts', 'alert_layout', 'correlation_rule']);

  const toggleItemSelection = (itemType: string) => {
    setSelectedItems(prev => 
      prev.includes(itemType) 
        ? prev.filter(item => item !== itemType)
        : [...prev, itemType]
    );
  };

  const selectAllItems = (checked: boolean) => {
    if (checked) {
      setSelectedItems(['automation_scripts', 'alert_layout', 'correlation_rule']);
    } else {
      setSelectedItems([]);
    }
  };

  const downloadXSIAMContent = (contentType: string) => {
    const config = dataSourceConfigs[dataSource as keyof typeof dataSourceConfigs];
    let content: any = {};
    let filename = '';

    switch (contentType) {
      case 'automation_scripts':
        content = generateAutomationScripts(config);
        filename = `${dataSource}_automation_scripts.yml`;
        break;
      case 'alert_layout':
        content = generateAlertLayout(config);
        filename = `${dataSource}_alert_layout.json`;
        break;
      case 'correlation_rule':
        content = generateCorrelationRule(config);
        filename = `${dataSource}_correlation_rule.json`;
        break;
      case 'complete_package':
        content = generateCompletePackage(config);
        filename = `${dataSource}_xsiam_package.zip`;
        break;
    }

    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded Successfully",
      description: `${filename} ready for XSIAM/Cortex Cloud import`,
    });
  };

  const downloadSelectedAsZip = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select at least one item to download",
        variant: "destructive"
      });
      return;
    }

    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const config = dataSourceConfigs[dataSource as keyof typeof dataSourceConfigs];

    // Add selected items to zip
    selectedItems.forEach(itemType => {
      let content: any = {};
      let filename = '';

      switch (itemType) {
        case 'automation_scripts':
          content = generateAutomationScripts(config);
          filename = `${dataSource}_automation_scripts.yml`;
          break;
        case 'alert_layout':
          content = generateAlertLayout(config);
          filename = `${dataSource}_alert_layout.json`;
          break;
        case 'correlation_rule':
          content = generateCorrelationRule(config);
          filename = `${dataSource}_correlation_rule.json`;
          break;
      }

      zip.file(filename, JSON.stringify(content, null, 2));
    });

    // Add installation guide
    const installationGuide = {
      title: `${config.title} - Installation Guide`,
      selected_components: selectedItems,
      installation_steps: [
        "1. Extract all files from this ZIP package",
        selectedItems.includes('automation_scripts') ? "2. Import automation scripts to XSIAM Automation section" : null,
        selectedItems.includes('alert_layout') ? "3. Import alert layout to Settings > Advanced > Layouts" : null,
        selectedItems.includes('correlation_rule') ? "4. Import correlation rule to Analytics > Correlation Rules" : null,
        "5. Configure data source integration for " + config.title,
        "6. Test with sample alert to verify proper functionality"
      ].filter(Boolean),
      requirements: [
        "XSIAM 8.0+ or Cortex Cloud",
        config.title + " integration configured",
        "Appropriate API permissions for " + config.title
      ],
      data_source: dataSource,
      generated_date: new Date().toISOString()
    };

    zip.file('INSTALLATION_GUIDE.json', JSON.stringify(installationGuide, null, 2));

    // Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataSource}_xsiam_package_${selectedItems.length}items.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "ZIP Package Downloaded",
      description: `${selectedItems.length} items packaged for XSIAM/Cortex Cloud import`,
    });
  };

  const generateAutomationScripts = (config: any) => {
    return config.scripts.map((script: any, index: number) => ({
      commonfields: {
        id: `${script.name.toLowerCase().replace(/\s+/g, '_')}_${dataSource}`,
        version: 1
      },
      vcShouldKeepItemLegacyProdMachine: false,
      name: `${script.name}_${dataSource}`,
      script: generatePythonScript(script, config),
      type: "python",
      tags: ["dynamic-section", dataSource],
      enabled: true,
      scripttarget: 0,
      subtype: "python3",
      pswd: "",
      runonce: false,
      dockerimage: "demisto/python3:3.12.8.1983910",
      runas: "DBotWeakRole",
      engineinfo: {},
      mainengineinfo: {}
    }));
  };

  const generatePythonScript = (script: any, config: any) => {
    return `# This is a helper script designed for ${config.title} alert investigations. 
# This populates a dynamic section of the layout with ${script.description.toLowerCase()}

def json_to_html_table(json_string):
    import json

    def format_value(value):
        if isinstance(value, str):
            try:
                value_dict = json.loads(value)
                if isinstance(value_dict, dict):
                    return "<br>".join(["<b>{}</b>: {}".format(k, v) for k, v in value_dict.items()])
            except ValueError:
                pass
        elif isinstance(value, dict):
            return "<br>".join(["<b>{}</b>: {}".format(k, v) for k, v in value.items()])
        return value

    # Convert the JSON string to a dictionary
    data = json.loads(json_string)

    # Initialize the HTML table with header row
    html_table = "<table style='border-collapse: collapse; width: 100%;'><tr style='background-color: #01cc66;'><td style='text-align: center; vertical-align: top; width: 20%;'>Field</td><td style='text-align: center; width: 80%;'>Value</td></tr>"

    # Populate table rows with data from the dictionary
    for key, value in data.items():
        key_html = "<span style='text-align: right; display: inline-block; font-weight: bold; vertical-align: top;'>{key}</span>".format(key=key + ":  ") if key != "Field" else "<span style='text-align: center; display: inline-block;'>{key}</span>".format(key=key)
        value_html = "<span style='display: inline-block;'>{}</span>".format(format_value(value))
        html_table += "<tr><td style='text-align: right; vertical-align: top;'>{}</td><td>{}</td></tr>".format(key_html, value_html)

    # Close the table tag
    html_table += "</table>"

    # Return the HTML table
    return html_table

def main():
    try:
        context_data = demisto.alert()
        ${script.fields.map((field: string) => `${field.toLowerCase()}_value = context_data['CustomFields'].get('${field.toLowerCase()}', 'N/A')`).join('\n        ')}
        
        # Execute ${script.commands[0]} command for ${script.description}
        ${script.commands[0].replace(/-/g, '_')}_result = execute_command('${script.commands[0]}', {
            'machine_id': context_data['CustomFields'].get('agentid', ''),
            'alert_id': context_data.get('id', '')
        })
        
        # Format results for XSIAM display
        result_record = ${script.commands[0].replace(/-/g, '_')}_result[0] if ${script.commands[0].replace(/-/g, '_')}_result else {}
        result_string = json.dumps(result_record)
        html_record = json_to_html_table(result_string)
        
        return_results({
            'ContentsFormat': EntryFormat.HTML,
            'Type': EntryType.NOTE,
            'Contents': html_record,
        })

    except Exception as e:
        error_statement = "🔴 There has been an issue gathering ${script.description.toLowerCase()}. Please ensure the ${config.title} integration is enabled, and verify that this automation script has been properly configured.\\n"
        error_statement += "\\n\\n\\nException thrown: " + str(e)
        return_results(error_statement)

if __name__ in ("builtins", "__builtin__", "__main__"):
    main()`;
  };

  const generateAlertLayout = (config: any) => {
    return {
      cacheVersn: 0,
      close: null,
      definitionId: "",
      description: `${config.title} - Data source specific layout for XSIAM alerts`,
      detached: false,
      details: null,
      detailsV2: {
        TypeName: "",
        tabs: [
          {
            id: "investigation",
            name: "Investigation",
            type: "investigation",
            sections: [{
              displayType: "ROW",
              h: 2,
              isVisible: true,
              items: config.scripts.map((script: any, index: number) => ({
                endCol: 2,
                fieldId: script.name,
                height: 44,
                id: `${script.name}-script`,
                index: index,
                sectionItemType: "button",
                startCol: 0
              }))
            }]
          },
          {
            id: "evidence",
            name: "Evidence",
            type: "evidence",
            sections: [{
              displayType: "ROW",
              h: 2,
              isVisible: true,
              items: config.scripts[0].fields.map((field: string, index: number) => ({
                endCol: 2,
                fieldId: field.toLowerCase(),
                height: 26,
                id: `${field}-field`,
                index: index,
                sectionItemType: "field",
                startCol: 0
              }))
            }]
          }
        ]
      },
      fromServerVersion: "8.0.0",
      group: "incident",
      id: `${dataSource}_alert_layout`,
      itemVersion: "1.0.0",
      kind: "",
      locked: false,
      name: `${config.title}`,
      packID: dataSource.toUpperCase(),
      packName: config.title,
      system: false,
      toServerVersion: "",
      version: -1
    };
  };

  const generateCorrelationRule = (config: any) => {
    return {
      rule_id: Math.floor(Math.random() * 1000) + 1000,
      name: `${config.title.replace(/Alert Layout/g, 'Detection Rule')}`,
      severity: "SEV_030_MEDIUM",
      xql_query: generateXQLQuery(config),
      is_enabled: true,
      description: `Detection rule for ${config.title} - identifies suspicious activity patterns and indicators of compromise.`,
      alert_name: `${config.title.replace(/Alert Layout/g, 'Alert')}`,
      alert_category: "SECURITY",
      alert_type: null,
      alert_description: `Automated detection for ${config.title} based on behavioral analysis and threat intelligence indicators.`,
      alert_domain: "DOMAIN_DETECTION",
      alert_fields: {},
      execution_mode: "SCHEDULED",
      search_window: "1 hours",
      simple_schedule: "1 hour",
      timezone: "UTC",
      crontab: "0 * * * *",
      suppression_enabled: true,
      suppression_duration: "1 hours",
      suppression_fields: ["agent_hostname"],
      dataset: "alerts",
      user_defined_severity: null,
      user_defined_category: null,
      mitre_defs: {},
      investigation_query_link: generateXQLQuery(config),
      drilldown_query_timeframe: "ALERT",
      mapping_strategy: "AUTO",
      action: "ALERTS",
      lookup_mapping: []
    };
  };

  const generateXQLQuery = (config: any) => {
    const fields = config.scripts[0].fields.map((f: string) => f.toLowerCase()).join(', ');
    
    const queries = {
      'windows_defender': `//MITRE ATT&CK TTP ID: T1059.001 – Command and Scripting Interpreter: PowerShell
config case_sensitive = false | dataset = xdr_data | filter event_type = ENUM.PROCESS and agent_os_type = ENUM.AGENT_OS_WINDOWS 
| filter action_process_image_name contains "powershell" or action_process_image_name contains "cmd" or action_process_image_name contains "wscript"
| fields _time, agent_hostname, ${fields}, actor_process_command_line, causality_actor_process_command_line, action_process_image_path
| sort desc _time | limit 1000`,

      'aws_cloudtrail': `//MITRE ATT&CK TTP ID: T1098 – Account Manipulation
config case_sensitive = false | dataset = cloud_audit_logs | filter cloud_provider = "AWS" 
| filter event_name in ("AttachUserPolicy", "PutUserPolicy", "CreateRole", "AddUserToGroup", "CreateUser")
| fields _time, ${fields}, event_name, user_name, source_ip_address, user_agent, resources
| sort desc _time | limit 1000`,

      'crowdstrike': `//MITRE ATT&CK TTP ID: T1055 – Process Injection  
config case_sensitive = false | dataset = endpoint_events | filter data_source_product_name = "CrowdStrike"
| filter event_type = ENUM.DETECTION and (severity = "high" or severity = "critical")
| fields _time, agent_hostname, ${fields}, detection_name, technique, tactic, confidence_level
| sort desc _time | limit 1000`,

      'kubernetes': `//MITRE ATT&CK TTP ID: T1610 – Deploy Container
config case_sensitive = false | dataset = k8s_audit_logs 
| filter verb in ("create", "update", "delete") and objectRef_resource in ("pods", "deployments", "services")
| filter user_username != "system:serviceaccount:kube-system:*"
| fields _time, ${fields}, verb, objectRef_resource, objectRef_name, objectRef_namespace, user_username
| sort desc _time | limit 1000`
    };

    return queries[dataSource as keyof typeof queries] || queries['windows_defender'];
  };

  const generateCompletePackage = (config: any) => {
    return {
      metadata: {
        name: `${config.title} Complete Package`,
        version: "1.0.0",
        description: `Complete XSIAM package for ${config.title}`,
        author: "ThreatResearchHub",
        created: new Date().toISOString(),
        dataSource: dataSource
      },
      automation_scripts: generateAutomationScripts(config),
      alert_layout: generateAlertLayout(config),
      correlation_rule: generateCorrelationRule(config),
      installation_guide: {
        steps: [
          "1. Import automation scripts to XSIAM Automation section",
          "2. Import alert layout to Settings > Advanced > Layouts",
          "3. Import correlation rule to Analytics > Correlation Rules",
          "4. Configure data source integration for " + config.title,
          "5. Test with sample alert to verify proper functionality"
        ],
        requirements: [
          "XSIAM 8.0+ or Cortex Cloud",
          config.title + " integration configured",
          "Appropriate API permissions for " + config.title
        ]
      }
    };
  };
  const dataSourceConfigs = {
    windows_defender: {
      title: "Microsoft Defender for Endpoint Alert Layout",
      icon: Shield,
      color: "bg-blue-500",
      scripts: [
        {
          name: "displayDefenderHostRecord_xsiam",
          description: "Pulls current machine details from MDE API",
          commands: ["microsoft-atp-get-machine-details", "microsoft-atp-get-machine-actions"],
          fields: ["riskScore", "healthStatus", "lastSeen", "computerDnsName", "osPlatform"]
        },
        {
          name: "displayDefenderEvidence_xsiam", 
          description: "Displays Microsoft Graph security alert evidence",
          commands: ["parse-json-evidence", "json-array-to-html-table"],
          fields: ["@odata.type", "fileName", "filePath", "sha1", "ipAddress"]
        },
        {
          name: "defenderResponseActions_xsiam",
          description: "One-click MDE response actions from XSIAM",
          commands: ["microsoft-atp-isolate-machine", "microsoft-atp-collect-investigation-package", "microsoft-atp-run-antivirus-scan"],
          fields: ["machine_id", "isolation_type", "comment"]
        }
      ],
      investigation: [
        "1. Extract agentid and microsoftgraphsecurityalertevidence from alert context",
        "2. Use microsoft-atp-get-machine-details for current host state and risk score",
        "3. Parse evidence artifacts with json_array_to_html_table() for analyst review",
        "4. Check @odata.type fields and correlate file hashes with threat intelligence",
        "5. Execute response actions: isolate endpoint, collect forensics, run AV scan"
      ]
    },
    aws_cloudtrail: {
      title: "AWS CloudTrail Alert Layout",
      icon: Database,
      color: "bg-orange-500",
      scripts: [
        {
          name: "displayCloudTrailContext_xsiam",
          description: "Extracts AWS API call context and user identity",
          commands: ["aws-iam-get-user", "aws-sts-get-caller-identity", "aws-cloudtrail-lookup-events"],
          fields: ["eventName", "sourceIPAddress", "userIdentity", "awsRegion", "errorCode"]
        },
        {
          name: "displayIAMPolicyChanges_xsiam",
          description: "Shows IAM policy modifications and privilege escalation indicators",
          commands: ["aws-iam-list-attached-user-policies", "aws-iam-get-policy-version"],
          fields: ["policyArn", "policyName", "attachmentDate", "permissions", "riskLevel"]
        },
        {
          name: "cloudTrailResponseActions_xsiam",
          description: "AWS-specific response actions for policy violations",
          commands: ["aws-iam-detach-user-policy", "aws-iam-delete-access-key", "aws-guardduty-create-threat-intel-set"],
          fields: ["userName", "policyArn", "accessKeyId", "blockAction"]
        }
      ],
      investigation: [
        "1. Extract eventName, sourceIPAddress, and userIdentity from CloudTrail event",
        "2. Use aws-iam-get-user to check current user permissions and group memberships",
        "3. Analyze policy changes with aws-iam-get-policy-version for privilege escalation",
        "4. Check sourceIPAddress against known VPN/corporate ranges for anomalous access",
        "5. Execute containment: detach risky policies, disable access keys, create GuardDuty intel"
      ]
    },
    crowdstrike: {
      title: "CrowdStrike Falcon Alert Layout",
      icon: Eye,
      color: "bg-green-500",
      scripts: [
        {
          name: "displayFalconDetection_xsiam",
          description: "Shows CrowdStrike detection details and behavior analysis",
          commands: ["crowdstrike-get-detections", "crowdstrike-get-device-details", "crowdstrike-get-behavior-info"],
          fields: ["detection_id", "device_id", "max_severity", "behaviors", "status"]
        },
        {
          name: "displayFalconIOCs_xsiam",
          description: "Extracts IOCs and behavioral indicators from Falcon data",
          commands: ["crowdstrike-get-intel-indicator-entities", "crowdstrike-search-iocs"],
          fields: ["indicator", "type", "malware_family", "kill_chain", "last_updated"]
        },
        {
          name: "falconResponseActions_xsiam",
          description: "CrowdStrike Real Time Response actions via XSIAM",
          commands: ["crowdstrike-contain-host", "crowdstrike-rtr-execute-command", "crowdstrike-upload-sample"],
          fields: ["host_id", "command_line", "session_id", "containment_status"]
        }
      ],
      investigation: [
        "1. Extract detection_id and device_id from Falcon alert for context enrichment",
        "2. Use crowdstrike-get-device-details for host information and last activity",
        "3. Analyze behaviors array for specific TTPs and living-off-the-land techniques",
        "4. Cross-reference IOCs with crowdstrike-get-intel-indicator-entities for attribution",
        "5. Execute RTR actions: contain host, run forensic commands, collect samples"
      ]
    },
    kubernetes: {
      title: "Kubernetes Security Alert Layout",
      icon: Code,
      color: "bg-purple-500",
      scripts: [
        {
          name: "displayK8sAuditContext_xsiam",
          description: "Extracts Kubernetes audit log context and resource details",
          commands: ["kubectl-get-pod", "kubectl-describe-events", "kubectl-get-node"],
          fields: ["namespace", "pod_name", "container_name", "node_name", "user_agent"]
        },
        {
          name: "displayContainerSecurity_xsiam",
          description: "Shows container security posture and runtime violations",
          commands: ["falco-get-events", "kubectl-get-security-context", "trivy-scan-image"],
          fields: ["rule_name", "priority", "security_context", "vulnerabilities", "privileges"]
        },
        {
          name: "k8sResponseActions_xsiam",
          description: "Kubernetes-specific containment and remediation actions",
          commands: ["kubectl-delete-pod", "kubectl-patch-deployment", "kubectl-create-network-policy"],
          fields: ["resource_type", "resource_name", "action_type", "policy_spec"]
        }
      ],
      investigation: [
        "1. Extract namespace, pod_name, and user from Kubernetes audit log event",
        "2. Use kubectl-get-pod and kubectl-describe-events for container context",
        "3. Analyze Falco events for runtime security policy violations and anomalies",
        "4. Check container security context for privileged access and host mounts",
        "5. Execute containment: delete malicious pods, apply network policies, patch deployments"
      ]
    }
  };

  const config = dataSourceConfigs[dataSource as keyof typeof dataSourceConfigs];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 text-white ${config.color} rounded p-1`} />
            {config.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Data source-specific alert layout with targeted investigation workflows and API integrations for staying within XSIAM platform.
            </AlertDescription>
          </Alert>

          {/* Required Python Scripts */}
          <div className="space-y-4 mb-6">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Required Python Automation Scripts
            </h4>
            {config.scripts.map((script, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {script.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{script.description}</p>
                  <div className="bg-gray-50 rounded p-3 text-xs">
                    <div className="text-gray-600 mb-2"># Key fields extracted:</div>
                    <div className="flex flex-wrap gap-1">
                      {script.fields.map(field => (
                        <Badge key={field} variant="secondary" className="text-xs">{field}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500">
                    <strong>Commands:</strong> {script.commands.join(', ')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Investigation Workflow */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4" />
              XSIAM Investigation Workflow
            </h4>
            <div className="space-y-2">
              {config.investigation.map((step, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </div>
                  <div className="text-gray-700">{step}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Download XSIAM Content */}
          <div className="mt-6 space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download for XSIAM/Cortex Cloud
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => downloadXSIAMContent('automation_scripts')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Python Scripts
              </Button>
              <Button
                onClick={() => downloadXSIAMContent('alert_layout')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Layout className="w-4 h-4" />
                Alert Layout
              </Button>
              <Button
                onClick={() => downloadXSIAMContent('correlation_rule')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Correlation Rule
              </Button>
              <Button
                onClick={() => downloadXSIAMContent('complete_package')}
                variant="default"
                size="sm"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                Complete Package
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Downloads authentic XSIAM/Cortex Cloud formats ready for direct import and testing
            </div>
          </div>

          {/* Key Investigation Points */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Data Source-Specific Triage</span>
            </div>
            <div className="text-sm text-yellow-700">
              This layout is specifically designed for {dataSource.replace('_', ' ')} alerts. 
              Scripts use appropriate API commands, extract relevant context fields, and provide 
              investigation procedures tailored to this data source's unique characteristics and response capabilities.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}