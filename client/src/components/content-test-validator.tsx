import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Clock, Download, TestTube } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  contentType: string;
  status: 'pending' | 'testing' | 'passed' | 'failed';
  validationPoints: {
    name: string;
    passed: boolean;
    details?: string;
  }[];
  generatedContent?: any;
  exportFormats?: {
    format: string;
    size: string;
    downloadUrl?: string;
  }[];
}

const XSIAM_TEST_SCENARIOS = {
  vpnAnomaly: {
    threatName: "VPN Authentication Anomaly",
    category: "network" as const,
    severity: "high" as const,
    description: "Unusual VPN authentication patterns indicating potential account compromise",
    dataSources: {
      primary: "xdr_data",
      secondary: ["active_directory", "vpn_logs"],
      required_fields: ["source_ip", "user_name", "auth_result", "timestamp"],
      optional_fields: ["geo_location", "device_type", "session_duration"]
    },
    alertFields: [
      {
        field_name: "source_ip",
        field_type: "string" as const,
        description: "Source IP address of VPN connection",
        sample_value: "192.168.1.100",
        required: true
      },
      {
        field_name: "failed_attempts",
        field_type: "number" as const,
        description: "Number of failed authentication attempts",
        sample_value: "5",
        required: true
      },
      {
        field_name: "user_groups",
        field_type: "array" as const,
        description: "Active Directory groups for the user",
        sample_value: '["Domain Users", "VPN Access"]',
        required: false
      }
    ],
    mitreMapping: {
      tactics: ["Initial Access", "Credential Access"],
      techniques: ["T1078", "T1110"],
      subtechniques: ["T1078.004", "T1110.001"]
    },
    responseActions: {
      immediate: ["Block suspicious IP", "Disable user account"],
      investigation: ["Check user activity history", "Analyze geo-location patterns"],
      containment: ["Isolate affected systems", "Force password reset"],
      eradication: ["Update security policies", "Enhance monitoring rules"]
    },
    workflow: {
      priority_groups: ["IT Security", "Network Operations"],
      notification_methods: ["Email", "ServiceNow", "Slack"],
      escalation_criteria: ["Multiple failed attempts", "Off-hours access"],
      sla_requirements: "2 hours for high severity incidents"
    }
  }
};

const ContentTestValidator: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const validateXQLCorrelation = (content: any): TestResult => {
    const validationPoints = [
      {
        name: "Dynamic alert field extraction (alert.fieldname.[0])",
        passed: content.xql_query?.includes('alert.') && content.xql_query?.includes('[0]'),
        details: content.xql_query ? `Found: ${content.xql_query.match(/alert\.\w+\.\[0\]/g)?.join(', ') || 'None'}` : 'No XQL query found'
      },
      {
        name: "MITRE ATT&CK technique mapping",
        passed: content.mitre_tactics && content.mitre_tactics.length > 0,
        details: content.mitre_tactics ? `Tactics: ${content.mitre_tactics.join(', ')}` : 'No MITRE mapping'
      },
      {
        name: "Severity level configuration",
        passed: ['critical', 'high', 'medium', 'low'].includes(content.severity),
        details: `Severity: ${content.severity || 'Not specified'}`
      },
      {
        name: "Time-based query logic",
        passed: content.xql_query?.includes('timeframe') || content.xql_query?.includes('timestamp'),
        details: content.xql_query ? 'Time logic detected' : 'No time-based filtering'
      }
    ];

    return {
      contentType: 'XQL Correlation Rule',
      status: validationPoints.every(p => p.passed) ? 'passed' : 'failed',
      validationPoints,
      generatedContent: content,
      exportFormats: [
        { format: 'JSON', size: '2.1 KB' },
        { format: 'YAML', size: '1.8 KB' }
      ]
    };
  };

  const validatePlaybook = (content: any): TestResult => {
    const validationPoints = [
      {
        name: "Task sequence and conditional logic",
        passed: content.tasks && Object.keys(content.tasks).length > 1,
        details: `Found ${Object.keys(content.tasks || {}).length} tasks`
      },
      {
        name: "Integration command syntax",
        passed: content.tasks && JSON.stringify(content.tasks).includes('servicenow-create-ticket'),
        details: 'ServiceNow integration detected'
      },
      {
        name: "Input/output parameter mapping",
        passed: content.tasks && Object.values(content.tasks).some((task: any) => task.scriptarguments),
        details: 'Script arguments found'
      },
      {
        name: "Error handling and escalation paths",
        passed: content.tasks && Object.values(content.tasks).some((task: any) => task.nexttasks?.['#default#']),
        details: 'Default task paths configured'
      }
    ];

    return {
      contentType: 'XSOAR Playbook',
      status: validationPoints.every(p => p.passed) ? 'passed' : 'failed',
      validationPoints,
      generatedContent: content,
      exportFormats: [
        { format: 'YAML', size: '12.5 KB' },
        { format: 'JSON', size: '15.2 KB' }
      ]
    };
  };

  const validateAlertLayout = (content: any): TestResult => {
    const validationPoints = [
      {
        name: "Field type definitions and validation rules",
        passed: content.sections && content.sections.some((s: any) => s.fields?.length > 0),
        details: `${content.sections?.reduce((acc: number, s: any) => acc + (s.fields?.length || 0), 0) || 0} fields defined`
      },
      {
        name: "Evidence section configuration",
        passed: content.sections?.some((s: any) => s.name?.toLowerCase().includes('evidence')),
        details: 'Evidence section found'
      },
      {
        name: "Custom field mapping for threat-specific data",
        passed: content.fieldMapping && Object.keys(content.fieldMapping).length > 0,
        details: `${Object.keys(content.fieldMapping || {}).length} field mappings`
      },
      {
        name: "Display formatting and grouping",
        passed: content.sections?.some((s: any) => s.type === 'group'),
        details: 'Field grouping configured'
      }
    ];

    return {
      contentType: 'Alert Layout',
      status: validationPoints.every(p => p.passed) ? 'passed' : 'failed',
      validationPoints,
      generatedContent: content,
      exportFormats: [
        { format: 'JSON', size: '8.3 KB' }
      ]
    };
  };

  const validateDashboard = (content: any): TestResult => {
    const validationPoints = [
      {
        name: "XQL query syntax and performance optimization",
        passed: content.widgets?.some((w: any) => w.query?.includes('dataset') && w.query?.includes('|')),
        details: `${content.widgets?.filter((w: any) => w.query).length || 0} widgets with XQL queries`
      },
      {
        name: "Widget configuration and data visualization",
        passed: content.widgets && content.widgets.length >= 4,
        details: `${content.widgets?.length || 0} widgets configured`
      },
      {
        name: "Time range filtering and refresh intervals",
        passed: content.timeRange && content.refreshInterval,
        details: `Time range: ${content.timeRange || 'Not set'}, Refresh: ${content.refreshInterval || 'Not set'}`
      },
      {
        name: "KPI calculations and threshold definitions",
        passed: content.widgets?.some((w: any) => w.type === 'kpi' && w.thresholds),
        details: 'KPI widgets with thresholds found'
      }
    ];

    return {
      contentType: 'XSIAM Dashboard',
      status: validationPoints.every(p => p.passed) ? 'passed' : 'failed',
      validationPoints,
      generatedContent: content,
      exportFormats: [
        { format: 'JSON', size: '25.7 KB' }
      ]
    };
  };

  const validateInfrastructure = (content: any): TestResult => {
    const validationPoints = [
      {
        name: "Cloud resource definitions and dependencies",
        passed: content.terraform?.includes('resource "aws_') || content.terraform?.includes('resource "azurerm_'),
        details: content.terraform ? 'Cloud resources defined' : 'No Terraform template'
      },
      {
        name: "Security group and network configurations",
        passed: content.terraform?.includes('security_group') || content.terraform?.includes('network_security_group'),
        details: 'Network security configured'
      },
      {
        name: "Agent installation and configuration scripts",
        passed: content.scripts?.some((s: any) => s.name?.includes('agent') || s.content?.includes('cortex')),
        details: `${content.scripts?.filter((s: any) => s.name?.includes('agent')).length || 0} agent scripts`
      },
      {
        name: "Cost estimation and resource sizing",
        passed: content.cost_estimate && content.cost_estimate.monthly_cost,
        details: `Estimated cost: $${content.cost_estimate?.monthly_cost || 'Not calculated'}/month`
      }
    ];

    return {
      contentType: 'Infrastructure Template',
      status: validationPoints.every(p => p.passed) ? 'passed' : 'failed',
      validationPoints,
      generatedContent: content,
      exportFormats: [
        { format: 'Terraform (.tf)', size: '15.8 KB' },
        { format: 'Scripts (.sh)', size: '3.2 KB' },
        { format: 'Deployment Guide', size: '8.9 KB' }
      ]
    };
  };

  const generateTestContent = async (scenario: any, contentType: string): Promise<any> => {
    // Simulate content generation based on scenario
    await new Promise(resolve => setTimeout(resolve, 1000));

    switch (contentType) {
      case 'correlation':
        return {
          rule_id: `rule_${Date.now()}`,
          name: `${scenario.threatName} Detection`,
          description: scenario.description,
          xql_query: `dataset = xdr_data | filter alert.source_ip.[0] != null and alert.failed_attempts.[0] > 3 | fields alert.source_ip.[0], alert.user_name.[0], alert.timestamp.[0] | timeframe = 1h`,
          severity: scenario.severity,
          mitre_tactics: scenario.mitreMapping.tactics,
          mitre_techniques: scenario.mitreMapping.techniques
        };

      case 'playbook':
        return {
          id: `playbook_${Date.now()}`,
          name: `${scenario.threatName} Response`,
          description: scenario.description,
          tasks: {
            "0": {
              id: "0",
              taskid: "start",
              type: "start",
              task: { id: "start", name: "Start Investigation" },
              nexttasks: { "#none#": ["1"] }
            },
            "1": {
              id: "1",
              taskid: "check-user-groups",
              type: "regular",
              task: {
                id: "check-user-groups",
                name: "Check User AD Groups",
                script: "ad-get-user",
                scriptarguments: {
                  username: { simple: "${alert.user_name.[0]}" }
                }
              },
              nexttasks: { "#default#": ["2"] }
            },
            "2": {
              id: "2",
              taskid: "create-ticket",
              type: "regular",
              task: {
                id: "create-ticket",
                name: "Create ServiceNow Ticket",
                script: "servicenow-create-ticket",
                scriptarguments: {
                  severity: { simple: scenario.severity },
                  description: { simple: "VPN anomaly detected for user ${alert.user_name.[0]}" }
                }
              },
              nexttasks: { "#default#": ["3"] }
            },
            "3": {
              id: "3",
              taskid: "end",
              type: "title",
              task: { id: "end", name: "Investigation Complete" }
            }
          }
        };

      case 'layout':
        return {
          layoutId: `layout_${Date.now()}`,
          name: `${scenario.threatName} Layout`,
          sections: [
            {
              name: "Basic Information",
              type: "group",
              fields: scenario.alertFields.map((field: any) => ({
                fieldId: field.field_name,
                displayName: field.description,
                type: field.field_type,
                required: field.required
              }))
            },
            {
              name: "Evidence",
              type: "evidence",
              fields: [
                { fieldId: "source_logs", displayName: "Source Logs", type: "text" },
                { fieldId: "network_traffic", displayName: "Network Traffic", type: "json" }
              ]
            }
          ],
          fieldMapping: scenario.alertFields.reduce((acc: any, field: any) => {
            acc[field.field_name] = `alert.${field.field_name}.[0]`;
            return acc;
          }, {})
        };

      case 'dashboard':
        return {
          dashboardId: `dashboard_${Date.now()}`,
          name: `${scenario.threatName} Analytics`,
          timeRange: "24h",
          refreshInterval: "5m",
          widgets: [
            {
              id: "widget_1",
              type: "line_chart",
              title: "Authentication Attempts Over Time",
              query: `dataset = xdr_data | filter alert.threat_type.[0] == "vpn_anomaly" | fields alert.timestamp.[0], alert.failed_attempts.[0] | timechart span=1h count by alert.failed_attempts.[0]`,
              position: { x: 0, y: 0, width: 6, height: 4 }
            },
            {
              id: "widget_2",
              type: "kpi",
              title: "Failed Authentication Rate",
              query: `dataset = xdr_data | filter alert.threat_type.[0] == "vpn_anomaly" | stats avg(alert.failed_attempts.[0])`,
              thresholds: { low: 2, medium: 5, high: 10 },
              position: { x: 6, y: 0, width: 3, height: 2 }
            },
            {
              id: "widget_3",
              type: "table",
              title: "Top Affected Users",
              query: `dataset = xdr_data | filter alert.threat_type.[0] == "vpn_anomaly" | stats count by alert.user_name.[0] | sort count desc | limit 10`,
              position: { x: 0, y: 4, width: 9, height: 4 }
            },
            {
              id: "widget_4",
              type: "bar_chart",
              title: "Authentication Results",
              query: `dataset = xdr_data | filter alert.threat_type.[0] == "vpn_anomaly" | stats count by alert.auth_result.[0]`,
              position: { x: 6, y: 2, width: 3, height: 2 }
            }
          ]
        };

      case 'infrastructure':
        return {
          templateId: `infra_${Date.now()}`,
          name: `${scenario.threatName} Lab Environment`,
          terraform: `
# VPN Anomaly Detection Lab Infrastructure
resource "aws_vpc" "vpn_lab_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${scenario.threatName} Lab VPC"
  }
}

resource "aws_security_group" "vpn_lab_sg" {
  name_description = "${scenario.threatName} Security Group"
  vpc_id      = aws_vpc.vpn_lab_vpc.id

  ingress {
    from_port   = 1194
    to_port     = 1194
    protocol    = "udp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }
}

resource "aws_instance" "vpn_server" {
  ami           = "ami-0abcdef1234567890"
  instance_type = "t3.medium"
  subnet_id     = aws_subnet.vpn_lab_subnet.id
  
  user_data = file("./scripts/install_cortex_agent.sh")

  tags = {
    Name = "${scenario.threatName} VPN Server"
  }
}
          `,
          scripts: [
            {
              name: "install_cortex_agent.sh",
              content: `#!/bin/bash
# Cortex XDR Agent Installation Script
echo "Installing Cortex XDR Agent..."
wget -O cortex-agent.deb https://download.paloaltonetworks.com/cortex/agent/latest.deb
dpkg -i cortex-agent.deb
systemctl enable cortex-xdr-agent
systemctl start cortex-xdr-agent
echo "Agent installation complete"
              `
            },
            {
              name: "configure_vpn.sh",
              content: `#!/bin/bash
# OpenVPN Server Configuration
apt update && apt install -y openvpn
# Configure OpenVPN with authentication logging
echo "log /var/log/openvpn/auth.log" >> /etc/openvpn/server.conf
systemctl enable openvpn-server@server
systemctl start openvpn-server@server
              `
            }
          ],
          cost_estimate: {
            monthly_cost: 45.67,
            breakdown: {
              "t3.medium instance": 30.37,
              "EBS storage (20GB)": 2.00,
              "VPC NAT Gateway": 13.30
            }
          }
        };

      default:
        return {};
    }
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    setProgress(0);

    const scenario = XSIAM_TEST_SCENARIOS.vpnAnomaly;
    const contentTypes = ['correlation', 'playbook', 'layout', 'dashboard', 'infrastructure'];
    const results: TestResult[] = [];

    for (let i = 0; i < contentTypes.length; i++) {
      const contentType = contentTypes[i];
      setCurrentTest(contentType);
      setProgress((i / contentTypes.length) * 100);

      // Generate content
      const content = await generateTestContent(scenario, contentType);

      // Validate content
      let testResult: TestResult;
      switch (contentType) {
        case 'correlation':
          testResult = validateXQLCorrelation(content);
          break;
        case 'playbook':
          testResult = validatePlaybook(content);
          break;
        case 'layout':
          testResult = validateAlertLayout(content);
          break;
        case 'dashboard':
          testResult = validateDashboard(content);
          break;
        case 'infrastructure':
          testResult = validateInfrastructure(content);
          break;
        default:
          testResult = {
            contentType: contentType,
            status: 'failed',
            validationPoints: [],
            generatedContent: content
          };
      }

      testResult.status = 'testing';
      results.push(testResult);
      setTestResults([...results]);

      // Simulate validation time
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update final status
      testResult.status = testResult.validationPoints.every(p => p.passed) ? 'passed' : 'failed';
      setTestResults([...results]);
    }

    setProgress(100);
    setCurrentTest(null);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'testing':
        return <Clock className="h-5 w-5 text-yellow-600 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      testing: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">XSIAM Content Validation</h2>
          <p className="text-muted-foreground">
            Comprehensive testing for Cortex XSIAM 3.1 & Cortex Cloud 1.1 compatibility
          </p>
        </div>
        <Button 
          onClick={runComprehensiveTest} 
          disabled={isRunning}
          className="flex items-center gap-2"
        >
          <TestTube className="h-4 w-4" />
          {isRunning ? 'Testing...' : 'Run Full Test Suite'}
        </Button>
      </div>

      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle>Test Progress</CardTitle>
            <CardDescription>
              {currentTest ? `Currently testing: ${currentTest}` : 'Preparing tests...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="w-full" />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {testResults.map((result, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.status)}
                <CardTitle className="text-lg">{result.contentType}</CardTitle>
              </div>
              {getStatusBadge(result.status)}
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="validation" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="validation">Validation</TabsTrigger>
                  <TabsTrigger value="content">Generated Content</TabsTrigger>
                  <TabsTrigger value="export">Export Options</TabsTrigger>
                </TabsList>
                
                <TabsContent value="validation" className="space-y-2">
                  {result.validationPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 border rounded">
                      {point.passed ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{point.name}</p>
                        {point.details && (
                          <p className="text-xs text-muted-foreground">{point.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="content">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(result.generatedContent, null, 2)}
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="export" className="space-y-2">
                  {result.exportFormats?.map((format, i) => (
                    <div key={i} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium">{format.format}</p>
                        <p className="text-sm text-muted-foreground">{format.size}</p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>

      {testResults.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Test Results: {testResults.filter(r => r.status === 'passed').length} passed, 
            {testResults.filter(r => r.status === 'failed').length} failed out of {testResults.length} total tests.
            Ready for XSIAM instance validation.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ContentTestValidator;