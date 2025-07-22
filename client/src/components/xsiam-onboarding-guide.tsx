import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Database, 
  Server, 
  Cloud, 
  Shield, 
  Settings,
  AlertTriangle,
  Info,
  Copy,
  ExternalLink,
  Download
} from "lucide-react";

interface XSIAMOnboardingGuideProps {
  useCase: any;
  onComplete: (config: any) => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  category: 'prerequisite' | 'datasource' | 'validation' | 'testing';
  estimatedTime: string;
  completed: boolean;
  required: boolean;
}

export default function XSIAMOnboardingGuide({ useCase, onComplete }: XSIAMOnboardingGuideProps) {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [selectedDataSources, setSelectedDataSources] = useState<string[]>([]);

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

  const onboardingPhases = [
    {
      id: 'prerequisites',
      name: 'Prerequisites',
      description: 'XSIAM tenant setup and access verification',
      steps: [
        {
          id: 'tenant_access',
          title: 'Verify XSIAM Tenant Access',
          description: 'Confirm you have administrative access to your Cortex XSIAM tenant',
          instructions: [
            'Navigate to your XSIAM tenant URL (e.g., https://yourcompany.xdr.paloaltonetworks.com)',
            'Log in with your administrator credentials',
            'Verify you can access Settings → Data Sources',
            'Confirm you have "Data Source Administrator" role'
          ],
          validation: 'You should see the XSIAM dashboard and data source management options'
        },
        {
          id: 'api_keys',
          title: 'Generate API Keys (If Required)',
          description: 'Create API keys for programmatic configuration',
          instructions: [
            'Navigate to Settings → API Keys',
            'Click "Generate New Key"',
            'Select appropriate permissions for data source management',
            'Save the key securely for configuration scripts'
          ],
          validation: 'API key successfully generated and permissions verified'
        }
      ]
    },
    {
      id: 'datasource_planning',
      name: 'Data Source Planning',
      description: 'Plan and configure required data sources',
      steps: [
        {
          id: 'source_identification',
          title: 'Identify Required Data Sources',
          description: `Map threat requirements to data sources for ${useCase.title}`,
          instructions: [
            `Review threat analysis: ${useCase.description?.substring(0, 100)}...`,
            `Required data sources: ${dataSourceRequirements.join(', ')}`,
            'Verify data sources are available in your environment',
            'Document any missing data sources for infrastructure planning'
          ],
          validation: 'All required data sources identified and availability confirmed'
        },
        {
          id: 'broker_setup',
          title: 'Configure XSIAM Broker',
          description: 'Set up data collection infrastructure',
          instructions: [
            'Navigate to Settings → Data Sources → Broker',
            'Download XSIAM Broker installer for your environment',
            'Install broker on designated collection server',
            'Configure network connectivity to XSIAM tenant',
            'Verify broker registration in XSIAM console'
          ],
          validation: 'Broker shows "Connected" status in XSIAM Data Sources page'
        }
      ]
    },
    {
      id: 'data_ingestion',
      name: 'Data Ingestion Setup',
      description: 'Configure log collection and parsing',
      steps: dataSourceRequirements.map((source, index) => ({
        id: `datasource_${index}`,
        title: `Configure ${source}`,
        description: `Set up ${source} integration for threat detection`,
        instructions: generateDataSourceInstructions(source, useCase),
        validation: `${source} logs appearing in XSIAM with proper parsing`
      }))
    },
    {
      id: 'validation',
      name: 'Validation & Testing',
      description: 'Verify data flow and quality',
      steps: [
        {
          id: 'data_flow_test',
          title: 'Test Data Flow',
          description: 'Verify logs are flowing correctly into XSIAM',
          instructions: [
            'Navigate to Investigation → Query Builder',
            'Run test queries for each configured data source',
            'Verify field parsing and normalization',
            'Check data freshness and volume'
          ],
          validation: 'All data sources showing recent data with proper field mapping'
        },
        {
          id: 'detection_test',
          title: 'Test Detection Rules',
          description: 'Validate detection rules can access required data',
          instructions: [
            'Navigate to Analytics → Correlation Rules',
            'Import or create test detection rule',
            'Verify XQL queries execute successfully',
            'Test alert generation with sample data'
          ],
          validation: 'Detection rules execute without errors and generate test alerts'
        }
      ]
    }
  ];

  function generateDataSourceInstructions(source: string, useCase: any): string[] {
    const instructionMap: Record<string, string[]> = {
      'Windows Event Logs': [
        'Navigate to Settings → Data Sources → Add Data Source',
        'Select "Windows Event Logs" integration',
        'Configure Windows Event Forwarding (WEF) or agent deployment',
        'Select relevant event channels: Security, System, Application',
        'Configure parsing rules for Windows Event Log format',
        'Test connectivity and verify log ingestion'
      ],
      'Sysmon': [
        'Install Sysmon on Windows endpoints with recommended configuration',
        'Configure Sysmon to forward logs to XSIAM Broker',
        'Set up Sysmon parsing rules in XSIAM',
        'Map Sysmon event IDs to XSIAM fields',
        'Verify process, network, and file activity logging'
      ],
      'AWS CloudTrail': [
        'Navigate to Settings → Data Sources → Cloud → AWS',
        'Configure AWS IAM role with CloudTrail read permissions',
        'Set up CloudTrail S3 bucket access',
        'Configure API call logging and data events',
        'Map CloudTrail fields to XSIAM schema',
        'Test API activity detection'
      ],
      'Kubernetes Audit Logs': [
        'Configure Kubernetes API server audit logging',
        'Set up log forwarding to XSIAM Broker',
        'Configure Kubernetes audit log parsing rules',
        'Map pod, namespace, and resource fields',
        'Verify container and orchestration activity logging'
      ],
      'Firewall Logs': [
        'Configure firewall to send logs to XSIAM Broker',
        'Set up syslog forwarding with appropriate facility/severity',
        'Configure firewall log parsing rules',
        'Map source/destination IPs, ports, and actions',
        'Verify network traffic and policy enforcement logging'
      ]
    };

    return instructionMap[source] || [
      `Navigate to Settings → Data Sources and search for "${source}"`,
      'Follow the integration-specific setup wizard',
      'Configure authentication and connectivity',
      'Set up log parsing and field mapping',
      'Test data ingestion and verify field extraction'
    ];
  }

  const handleStepComplete = (stepId: string) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const generateInfrastructureGuidance = () => {
    const guidance = {
      category: useCase.category,
      severity: useCase.severity,
      technologies: useCase.technologies || [],
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

    return guidance;
  };

  const infrastructureGuidance = generateInfrastructureGuidance();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">XSIAM Onboarding Guide</h1>
        <p className="text-muted-foreground">
          Complete step-by-step guide for integrating data sources and setting up lab environment for: <strong>{useCase.title}</strong>
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="onboarding">XSIAM Setup</TabsTrigger>
          <TabsTrigger value="infrastructure">Lab Environment</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Threat Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <div className="text-sm text-muted-foreground">Category</div>
                  <Badge variant="outline">{useCase.category}</Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Severity</div>
                  <Badge variant={useCase.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {useCase.severity?.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Technologies</div>
                  <div className="text-sm">{useCase.technologies?.join(', ') || 'General'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CVEs</div>
                  <div className="text-sm">{useCase.cves?.join(', ') || 'None'}</div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Required Data Sources:</strong> {dataSourceRequirements.join(', ')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Onboarding Process Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {onboardingPhases.map((phase, index) => (
                  <div key={phase.id} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <span className="text-blue-600 font-semibold">{index + 1}</span>
                    </div>
                    <h3 className="font-medium mb-1">{phase.name}</h3>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="onboarding" className="space-y-6">
          {onboardingPhases.map((phase, phaseIndex) => (
            <Card key={phase.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    completedSteps.filter(step => step.startsWith(phase.id)).length === phase.steps.length
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {completedSteps.filter(step => step.startsWith(phase.id)).length === phase.steps.length 
                      ? <CheckCircle className="h-4 w-4" />
                      : <span className="text-sm font-semibold">{phaseIndex + 1}</span>
                    }
                  </div>
                  {phase.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {phase.steps.map((step, stepIndex) => (
                    <Card key={step.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {completedSteps.includes(step.id) ? (
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
                              <ol className="list-decimal list-inside space-y-1 text-sm">
                                {step.instructions.map((instruction, i) => (
                                  <li key={i} className="text-muted-foreground">{instruction}</li>
                                ))}
                              </ol>
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
                              disabled={completedSteps.includes(step.id)}
                            >
                              {completedSteps.includes(step.id) ? 'Completed' : 'Mark Complete'}
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
}