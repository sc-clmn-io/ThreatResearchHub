import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  Network, 
  Shield, 
  Database, 
  Cloud, 
  Terminal,
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Download,
  Play,
  DollarSign
} from "lucide-react";
import InfrastructureProcurement from "./infrastructure-procurement";

interface ThreatContext {
  threat: string;
  cves: string;
  technologies: string;
  severity: string;
  source: string;
  description: string;
}

interface LabComponent {
  id: string;
  name: string;
  type: 'vm' | 'container' | 'service' | 'network' | 'sensor';
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
  status: 'pending' | 'deploying' | 'ready' | 'error';
  config: any;
  cost: {
    setup: number;
    hourly: number;
    monthly: number;
  };
}

interface LabEnvironment {
  id: string;
  name: string;
  threat: string;
  components: LabComponent[];
  totalCost: {
    setup: number;
    hourly: number;
    monthly: number;
  };
  deploymentSteps: string[];
  testingProcedures: string[];
  xsiamIntegration: {
    dataSources: string[];
    correlationRules: string[];
    playbooks: string[];
    dashboards: string[];
  };
}

export default function LabEnvironmentGenerator() {
  const [threatContext, setThreatContext] = useState<ThreatContext | null>(null);
  const [labEnvironment, setLabEnvironment] = useState<LabEnvironment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');

  // Load threat context from localStorage on component mount
  useEffect(() => {
    const storedContext = localStorage.getItem('xsiamTestContext');
    if (storedContext) {
      setThreatContext(JSON.parse(storedContext));
    }
  }, []);

  const generateLabEnvironment = async () => {
    if (!threatContext) return;
    
    setIsGenerating(true);
    setDeploymentProgress(0);

    // Simulate lab generation process
    const progressSteps = [
      'Analyzing threat characteristics...',
      'Determining required infrastructure...',
      'Planning data source integration...',
      'Generating XSIAM configurations...',
      'Calculating deployment costs...',
      'Creating deployment scripts...'
    ];

    for (let i = 0; i < progressSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setDeploymentProgress(((i + 1) / progressSteps.length) * 100);
    }

    // Generate lab environment based on threat context
    const lab = generateLabForThreat(threatContext);
    setLabEnvironment(lab);
    setIsGenerating(false);
  };

  const generateLabForThreat = (context: ThreatContext): LabEnvironment => {
    const components: LabComponent[] = [];
    const technologies = context.technologies.toLowerCase();
    const description = context.description.toLowerCase();

    // Determine lab components based on threat characteristics
    if (technologies.includes('windows') || description.includes('endpoint')) {
      components.push({
        id: 'windows-endpoint',
        name: 'Windows 11 Endpoint',
        type: 'vm',
        category: 'endpoint',
        status: 'pending',
        config: {
          os: 'Windows 11 Enterprise',
          cpu: 4,
          ram: '8GB',
          disk: '128GB',
          software: ['Microsoft Office', 'Chrome', 'Firefox', 'Cortex XDR Agent']
        },
        cost: { setup: 0, hourly: 0.25, monthly: 180 }
      });
    }

    if (technologies.includes('linux') || description.includes('server')) {
      components.push({
        id: 'linux-server',
        name: 'Ubuntu Server',
        type: 'vm',
        category: 'endpoint',
        status: 'pending',
        config: {
          os: 'Ubuntu 22.04 LTS',
          cpu: 2,
          ram: '4GB',
          disk: '64GB',
          software: ['Docker', 'Nginx', 'MySQL', 'Cortex XDR Agent']
        },
        cost: { setup: 0, hourly: 0.15, monthly: 108 }
      });
    }

    if (technologies.includes('network') || description.includes('firewall')) {
      components.push({
        id: 'palo-alto-firewall',
        name: 'Palo Alto VM-Series Firewall',
        type: 'vm',
        category: 'network',
        status: 'pending',
        config: {
          model: 'VM-300',
          interfaces: 4,
          throughput: '2 Gbps',
          features: ['Threat Prevention', 'URL Filtering', 'DNS Security']
        },
        cost: { setup: 0, hourly: 0.50, monthly: 360 }
      });
    }

    if (technologies.includes('cloud') || technologies.includes('aws') || technologies.includes('azure')) {
      components.push({
        id: 'cloud-workload',
        name: 'Cloud Infrastructure',
        type: 'service',
        category: 'cloud',
        status: 'pending',
        config: {
          provider: technologies.includes('aws') ? 'AWS' : 'Azure',
          services: ['EC2/VM', 'S3/Storage', 'Lambda/Functions', 'CloudTrail/Monitor'],
          regions: ['us-east-1', 'us-west-2']
        },
        cost: { setup: 0, hourly: 0.30, monthly: 216 }
      });
    }

    // Always include XSIAM integration
    components.push({
      id: 'xsiam-tenant',
      name: 'XSIAM Data Integration',
      type: 'service',
      category: 'identity',
      status: 'pending',
      config: {
        tenant: 'demo-tenant.xdr.us.paloaltonetworks.com',
        brokers: 2,
        dataSources: ['Windows Events', 'Linux Syslog', 'Firewall Logs', 'Cloud Audit'],
        storage: '1TB/month'
      },
      cost: { setup: 0, hourly: 0.20, monthly: 144 }
    });

    // Calculate total costs
    const totalCost = components.reduce((acc, comp) => ({
      setup: acc.setup + comp.cost.setup,
      hourly: acc.hourly + comp.cost.hourly,
      monthly: acc.monthly + comp.cost.monthly
    }), { setup: 0, hourly: 0, monthly: 0 });

    return {
      id: `lab-${Date.now()}`,
      name: `Lab: ${context.threat}`,
      threat: context.threat,
      components,
      totalCost,
      deploymentSteps: [
        'Deploy base infrastructure (VMware/Cloud)',
        'Configure network topology and security groups',
        'Install and configure Cortex XDR agents',
        'Set up XSIAM data source integration',
        'Deploy threat simulation tools',
        'Validate data ingestion and parsing',
        'Create detection rules and correlation',
        'Test incident response workflows'
      ],
      testingProcedures: [
        'Execute threat simulation scenarios',
        'Validate XSIAM detection coverage',
        'Test automated response playbooks',
        'Generate findings report',
        'Document lessons learned'
      ],
      xsiamIntegration: {
        dataSources: ['Windows Security Events', 'Sysmon', 'Firewall Logs', 'Cloud Audit Logs'],
        correlationRules: [`${context.threat} Detection Rule`, 'Suspicious Activity Correlation'],
        playbooks: [`${context.threat} Response Playbook`, 'Incident Investigation Workflow'],
        dashboards: [`${context.threat} Monitoring Dashboard`, 'Attack Timeline Visualization']
      }
    };
  };

  const deployLab = async () => {
    if (!labEnvironment) return;
    
    // Update component statuses to simulate deployment
    let updatedComponents = labEnvironment.components.map(comp => ({
      ...comp,
      status: 'deploying' as const
    }));
    
    setLabEnvironment({
      ...labEnvironment,
      components: updatedComponents
    });

    // Simulate deployment process
    for (let i = 0; i < updatedComponents.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      updatedComponents = updatedComponents.map((comp, index) => 
        index === i ? { ...comp, status: 'ready' as const } : comp
      );
      
      setLabEnvironment(prev => prev ? {
        ...prev,
        components: [...updatedComponents]
      } : null);
    }
  };

  const exportDeploymentScript = () => {
    if (!labEnvironment) return;

    const script = `#!/bin/bash
# Lab Environment Deployment Script
# Generated for: ${labEnvironment.threat}
# Generated on: ${new Date().toISOString()}

echo "Deploying lab environment for threat: ${labEnvironment.threat}"

${labEnvironment.deploymentSteps.map((step, index) => 
  `echo "Step ${index + 1}: ${step}"`
).join('\n')}

echo "Lab deployment completed!"
echo "Total monthly cost: $${labEnvironment.totalCost.monthly}"
echo "Connect to XSIAM tenant: demo-tenant.xdr.us.paloaltonetworks.com"
`;

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab-deployment-${Date.now()}.sh`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!threatContext) {
    return (
      <div className="p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Threat Context</h3>
        <p className="text-gray-600 mb-4">
          Select a threat from the Active Threat Feed to generate a lab environment.
        </p>
        <Button onClick={() => window.location.href = '/threat-monitoring'}>
          Go to Active Threat Feed
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Threat Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Threat Context
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Threat</label>
              <p className="font-semibold">{threatContext.threat}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Severity</label>
              <Badge className={
                threatContext.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                'bg-orange-100 text-orange-800'
              }>
                {threatContext.severity.toUpperCase()}
              </Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">CVEs</label>
              <p className="font-mono text-sm">{threatContext.cves || 'None'}</p>
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-gray-500">Technologies</label>
              <p>{threatContext.technologies}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lab Generation */}
      {!labEnvironment && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Lab Environment</CardTitle>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="space-y-4">
                <Progress value={deploymentProgress} className="w-full" />
                <p className="text-sm text-gray-600">
                  Generating lab environment for {threatContext.threat}...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Generate a complete lab environment to test and validate detection capabilities for this threat.
                </p>
                <Button onClick={generateLabEnvironment} className="bg-blue-600 hover:bg-blue-700">
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Lab Environment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lab Environment Details */}
      {labEnvironment && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="procurement">Procurement</TabsTrigger>
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Lab Environment: {labEnvironment.name}</span>
                  <div className="flex gap-2">
                    <Button onClick={() => setActiveTab('procurement')} className="bg-green-600 hover:bg-green-700">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Plan Procurement
                    </Button>
                    <Button onClick={deployLab} variant="outline">
                      <Play className="h-4 w-4 mr-2" />
                      Deploy Lab
                    </Button>
                    <Button onClick={exportDeploymentScript} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export Script
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Cost Estimate</h4>
                    <div className="space-y-1">
                      <p className="text-sm">Setup: ${labEnvironment.totalCost.setup}</p>
                      <p className="text-sm">Hourly: ${labEnvironment.totalCost.hourly}/hr</p>
                      <p className="text-lg font-semibold">Monthly: ${labEnvironment.totalCost.monthly}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Components</h4>
                    <p className="text-2xl font-bold">{labEnvironment.components.length}</p>
                    <p className="text-sm text-gray-600">Infrastructure components</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">XSIAM Integration</h4>
                    <p className="text-2xl font-bold">{labEnvironment.xsiamIntegration.dataSources.length}</p>
                    <p className="text-sm text-gray-600">Data sources configured</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="procurement" className="space-y-4">
            {threatContext && (
              <InfrastructureProcurement 
                threatContext={threatContext}
              />
            )}
          </TabsContent>

          <TabsContent value="infrastructure" className="space-y-4">
            <div className="grid gap-4">
              {labEnvironment.components.map((component) => (
                <Card key={component.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {component.type === 'vm' && <Server className="h-5 w-5 text-blue-500" />}
                        {component.type === 'service' && <Cloud className="h-5 w-5 text-green-500" />}
                        {component.type === 'network' && <Network className="h-5 w-5 text-purple-500" />}
                        <div>
                          <h4 className="font-semibold">{component.name}</h4>
                          <p className="text-sm text-gray-600">{component.type} • {component.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium">${component.cost.monthly}/month</p>
                          <p className="text-xs text-gray-500">${component.cost.hourly}/hr</p>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${
                          component.status === 'ready' ? 'bg-green-500' :
                          component.status === 'deploying' ? 'bg-yellow-500' :
                          component.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                        }`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {labEnvironment.deploymentSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center">
                        {index + 1}
                      </div>
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>XSIAM Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Data Sources</h4>
                    <ul className="space-y-1">
                      {labEnvironment.xsiamIntegration.dataSources.map((ds, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          {ds}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Security Content</h4>
                    <ul className="space-y-1">
                      {labEnvironment.xsiamIntegration.correlationRules.map((rule, index) => (
                        <li key={index} className="text-sm flex items-center gap-2">
                          <Shield className="h-3 w-3" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Testing Procedures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {labEnvironment.testingProcedures.map((procedure, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm">{procedure}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertDescription>
                <strong>Next Steps:</strong> Deploy the lab environment, configure XSIAM data ingestion, 
                and execute threat simulation scenarios. Use your {threatContext.source} tenant at 
                demo-tenant.xdr.us.paloaltonetworks.com for live testing.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}