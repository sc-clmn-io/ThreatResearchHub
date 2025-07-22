import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Cloud, 
  Database, 
  Shield, 
  Terminal, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  Play,
  Eye,
  Settings,
  FileText,
  Network,
  Lock
} from 'lucide-react';

interface LabEnvironmentSetupProps {
  useCase: any;
  onComplete: (labConfig: any) => void;
}

export default function LabEnvironmentSetup({ useCase, onComplete }: LabEnvironmentSetupProps) {
  const [selectedInfrastructure, setSelectedInfrastructure] = useState<'vmware' | 'cloud' | 'hybrid'>('vmware');
  const [setupPhase, setSetupPhase] = useState<'planning' | 'infrastructure' | 'replication' | 'attacks' | 'validation' | 'documentation'>('planning');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const infrastructureOptions = [
    {
      id: 'vmware',
      name: 'VMware vSphere',
      description: 'Cost-effective using existing VMware infrastructure',
      cost: '$0 - Using existing server',
      pros: ['No cloud costs', 'Full control', 'Isolated environment'],
      cons: ['Limited scalability', 'Manual setup required'],
      requirements: ['vSphere 7.0+', '32GB RAM minimum', '500GB storage']
    },
    {
      id: 'cloud',
      name: 'Cloud Infrastructure',
      description: 'Azure/AWS for scalable testing environment',
      cost: '$200-500/month for lab environment',
      pros: ['Highly scalable', 'Quick deployment', 'Multiple regions'],
      cons: ['Ongoing costs', 'Internet dependency'],
      requirements: ['Azure/AWS subscription', 'Network configuration', 'Cost management']
    },
    {
      id: 'hybrid',
      name: 'Hybrid Setup',
      description: 'VMware + Cloud for optimal flexibility',
      cost: '$50-150/month for cloud components',
      pros: ['Best of both worlds', 'Cost optimization', 'Realistic environment'],
      cons: ['Complex networking', 'Multiple management points'],
      requirements: ['VMware infrastructure', 'Cloud subscription', 'VPN connectivity']
    }
  ];

  // Extract key components from threat report for replication
  const extractThreatComponents = () => {
    const components = [];
    
    if (useCase.technologies?.includes('Kubernetes') || useCase.technologies?.includes('containers')) {
      components.push({
        type: 'container',
        name: 'Kubernetes Cluster',
        description: 'Multi-node cluster to replicate container vulnerabilities',
        vulnTargets: ['Pod security', 'RBAC misconfigurations', 'Network policies']
      });
    }
    
    if (useCase.technologies?.includes('Windows') || useCase.technologies?.includes('Active Directory')) {
      components.push({
        type: 'windows',
        name: 'Windows Domain Environment',
        description: 'Domain controller and member systems',
        vulnTargets: ['Privilege escalation', 'Lateral movement', 'Credential theft']
      });
    }
    
    if (useCase.technologies?.includes('web') || useCase.technologies?.includes('application')) {
      components.push({
        type: 'web',
        name: 'Vulnerable Web Application',
        description: 'Application stack matching threat report components',
        vulnTargets: ['SQL injection', 'XSS', 'Authentication bypass']
      });
    }
    
    // Always include network components for realistic attack paths
    components.push({
      type: 'network',
      name: 'Network Infrastructure',
      description: 'Firewalls, switches, and monitoring to replicate real environment',
      vulnTargets: ['Network segmentation bypass', 'Traffic analysis', 'Lateral movement']
    });
    
    return components;
  };

  const setupPhases = [
    {
      id: 'planning',
      name: 'Threat Replication Planning',
      duration: '45 minutes',
      tasks: [
        'Analyze threat report for technical components',
        'Identify vulnerable systems to replicate',
        'Plan attack vectors and exploitation paths',
        'Design realistic environment topology'
      ]
    },
    {
      id: 'infrastructure',
      name: 'Vulnerable Infrastructure Setup',
      duration: '2.5 hours',
      tasks: [
        'Deploy systems matching threat report components',
        'Configure vulnerable services and applications',
        'Set up realistic network topology',
        'Install intentional misconfigurations for exploitation'
      ]
    },
    {
      id: 'replication',
      name: 'Threat Environment Replication',
      duration: '2 hours',
      tasks: [
        'Recreate exact vulnerable components from report',
        'Deploy specific software versions with known CVEs',
        'Configure attack surface matching threat scenario',
        'Validate exploitable conditions exist'
      ]
    },
    {
      id: 'attacks',
      name: 'Attack Execution & Validation',
      duration: '1.5 hours',
      tasks: [
        'Execute attack chain from threat report',
        'Validate exploitation success',
        'Document attack artifacts and indicators',
        'Capture forensic evidence of compromise'
      ]
    },
    {
      id: 'validation',
      name: 'Detection & Response Validation',
      duration: '1 hour',
      tasks: [
        'Test detection rules against live attack',
        'Validate alert generation and correlation',
        'Verify incident response procedures',
        'Measure detection accuracy and timing'
      ]
    },
    {
      id: 'documentation',
      name: 'Lab Documentation & Handoff',
      duration: '30 minutes',
      tasks: [
        'Generate comprehensive lab documentation',
        'Create attack playbook for future use',
        'Document lessons learned and improvements',
        'Package lab for sharing or training'
      ]
    }
  ];

  const getInfrastructureForUseCase = () => {
    const category = useCase?.category || 'endpoint';
    
    switch (category) {
      case 'cloud':
        return {
          recommended: 'cloud',
          components: ['Kubernetes cluster', 'Container registry', 'Cloud logging', 'Identity provider'],
          estimatedCost: '$300-600/month'
        };
      case 'network':
        return {
          recommended: 'hybrid',
          components: ['Firewall VM', 'Network monitoring', 'DNS server', 'DHCP server'],
          estimatedCost: '$100-250/month'
        };
      case 'endpoint':
        return {
          recommended: 'vmware',
          components: ['Windows workstations', 'Domain controller', 'File server', 'Endpoint agent'],
          estimatedCost: '$50-100/month'
        };
      case 'identity':
        return {
          recommended: 'hybrid',
          components: ['Active Directory', 'LDAP server', 'SSO provider', 'Identity store'],
          estimatedCost: '$150-300/month'
        };
      default:
        return {
          recommended: 'vmware',
          components: ['Basic lab environment', 'Monitoring tools'],
          estimatedCost: '$50-150/month'
        };
    }
  };

  const renderPhaseContent = () => {
    switch (setupPhase) {
      case 'planning':
        return <ThreatReplicationPlanningPhase 
          useCase={useCase} 
          infrastructureOptions={infrastructureOptions}
          selectedInfrastructure={selectedInfrastructure}
          onInfrastructureSelect={setSelectedInfrastructure}
          recommendations={getInfrastructureForUseCase()}
          threatComponents={extractThreatComponents()}
        />;
      case 'infrastructure':
        return <VulnerableInfrastructurePhase 
          useCase={useCase} 
          infrastructure={selectedInfrastructure}
          threatComponents={extractThreatComponents()}
        />;
      case 'replication':
        return <ThreatEnvironmentReplicationPhase 
          useCase={useCase} 
          infrastructure={selectedInfrastructure}
        />;
      case 'attacks':
        return <AttackExecutionPhase 
          useCase={useCase} 
        />;
      case 'validation':
        return <DetectionValidationPhase 
          useCase={useCase} 
        />;
      case 'documentation':
        return <LabDocumentationPhase 
          useCase={useCase} 
        />;
      default:
        return null;
    }
  };

  const currentPhaseIndex = setupPhases.findIndex(phase => phase.id === setupPhase);
  const progress = ((currentPhaseIndex + 1) / setupPhases.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Threat Replication Lab - {useCase?.title}</span>
          </CardTitle>
          <CardDescription>
            Build realistic environment to reenact vulnerabilities and attacks from threat report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Setup Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="w-full" />
            
            <div className="grid grid-cols-6 gap-2">
              {setupPhases.map((phase, index) => (
                <Button
                  key={phase.id}
                  variant={setupPhase === phase.id ? 'default' : completedSteps.includes(phase.id) ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => setSetupPhase(phase.id as any)}
                  className="text-xs"
                >
                  {completedSteps.includes(phase.id) && <CheckCircle className="h-3 w-3 mr-1" />}
                  {phase.name.split(' ')[0]}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Content */}
      {renderPhaseContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = setupPhases.findIndex(p => p.id === setupPhase);
            if (currentIndex > 0) {
              setSetupPhase(setupPhases[currentIndex - 1].id as any);
            }
          }}
          disabled={currentPhaseIndex === 0}
        >
          Previous Phase
        </Button>
        
        <Button
          onClick={() => {
            const currentIndex = setupPhases.findIndex(p => p.id === setupPhase);
            if (currentIndex < setupPhases.length - 1) {
              setSetupPhase(setupPhases[currentIndex + 1].id as any);
              setCompletedSteps(prev => [...prev, setupPhase]);
            } else {
              onComplete({
                infrastructure: selectedInfrastructure,
                completedPhases: [...completedSteps, setupPhase],
                useCase
              });
            }
          }}
        >
          {currentPhaseIndex === setupPhases.length - 1 ? 'Complete Setup' : 'Next Phase'}
        </Button>
      </div>
    </div>
  );
}

function ThreatReplicationPlanningPhase({ 
  useCase, 
  infrastructureOptions, 
  selectedInfrastructure, 
  onInfrastructureSelect,
  recommendations,
  threatComponents
}: any) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Selection</CardTitle>
          <CardDescription>
            Choose the optimal infrastructure approach for {useCase?.category} testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Recommended for {useCase?.category}:</strong> {recommendations.recommended} infrastructure
              <br />
              <strong>Estimated Cost:</strong> {recommendations.estimatedCost}
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {infrastructureOptions.map((option: any) => (
              <Card 
                key={option.id}
                className={`cursor-pointer transition-all ${
                  selectedInfrastructure === option.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => onInfrastructureSelect(option.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    {option.id === 'vmware' && <Server className="h-5 w-5 mr-2" />}
                    {option.id === 'cloud' && <Cloud className="h-5 w-5 mr-2" />}
                    {option.id === 'hybrid' && <Network className="h-5 w-5 mr-2" />}
                    {option.name}
                  </CardTitle>
                  <CardDescription>{option.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                      {option.cost}
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-1">Pros:</p>
                      <ul className="text-xs text-green-600 space-y-1">
                        {option.pros.map((pro: string, i: number) => (
                          <li key={i}>• {pro}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-amber-700 mb-1">Considerations:</p>
                      <ul className="text-xs text-amber-600 space-y-1">
                        {option.cons.map((con: string, i: number) => (
                          <li key={i}>• {con}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Threat Components to Replicate</CardTitle>
          <CardDescription>Systems and vulnerabilities from threat report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {threatComponents.map((component: any, i: number) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{component.name}</h3>
                  <Badge variant="outline">{component.type}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                <div>
                  <p className="text-sm font-medium mb-1">Vulnerability Targets:</p>
                  <div className="flex flex-wrap gap-1">
                    {component.vulnTargets.map((target: string, j: number) => (
                      <Badge key={j} variant="secondary" className="text-xs">
                        {target}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Infrastructure Components</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recommendations.components.map((component: string, i: number) => (
              <Badge key={i} variant="outline" className="p-2 justify-center">
                {component}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VulnerableInfrastructurePhase({ useCase, infrastructure, threatComponents }: any) {
  const [deploymentSteps] = useState([
    { id: 'vulnerable-systems', name: 'Deploy Vulnerable Systems', status: 'pending', duration: '60 min' },
    { id: 'network-topology', name: 'Configure Attack Topology', status: 'pending', duration: '45 min' },
    { id: 'intentional-misconfig', name: 'Install Misconfigurations', status: 'pending', duration: '30 min' },
    { id: 'attack-surface', name: 'Validate Attack Surface', status: 'pending', duration: '15 min' }
  ]);

  const getVulnerableSystemConfig = () => {
    const configs = [];
    
    if (useCase.cves?.length > 0) {
      configs.push({
        title: 'CVE-Specific Vulnerable Systems',
        systems: useCase.cves.map((cve: string) => ({
          cve,
          description: `System configured with ${cve} vulnerability`,
          software: 'Matching vulnerable software version',
          exploitable: true
        }))
      });
    }
    
    if (useCase.technologies?.includes('Kubernetes')) {
      configs.push({
        title: 'Kubernetes Vulnerable Cluster',
        systems: [{
          component: 'K8s Cluster',
          description: 'Multi-node cluster with RBAC misconfigurations',
          vulnerabilities: ['Privileged pods', 'Network policy gaps', 'Insecure ingress'],
          exploitable: true
        }]
      });
    }
    
    if (useCase.technologies?.includes('Windows')) {
      configs.push({
        title: 'Windows Domain Environment',
        systems: [{
          component: 'Domain Controller',
          description: 'Windows AD with privilege escalation paths',
          vulnerabilities: ['Weak GPO', 'Service account exposure', 'Kerberoasting'],
          exploitable: true
        }]
      });
    }
    
    return configs;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vulnerable Infrastructure Deployment</CardTitle>
          <CardDescription>
            Create exploitable environment matching threat report components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deploymentSteps.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-gray-600">Estimated: {step.duration}</p>
                  </div>
                </div>
                <Badge variant="outline">{step.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {getVulnerableSystemConfig().map((config, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-lg">{config.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {config.systems.map((system: any, j: number) => (
                <div key={j} className="border rounded-lg p-4 bg-red-50 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-red-800">
                      {system.component || system.cve || system.description}
                    </h3>
                    <Badge variant="destructive" className="text-xs">Exploitable</Badge>
                  </div>
                  <p className="text-sm text-red-700 mb-2">{system.description}</p>
                  {system.vulnerabilities && (
                    <div className="flex flex-wrap gap-1">
                      {system.vulnerabilities.map((vuln: string, k: number) => (
                        <Badge key={k} variant="outline" className="text-xs border-red-300 text-red-600">
                          {vuln}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {system.software && (
                    <p className="text-xs text-red-600 mt-1">{system.software}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {infrastructure === 'vmware' && <VMwareDeploymentGuide useCase={useCase} />}
      {infrastructure === 'cloud' && <CloudDeploymentGuide useCase={useCase} />}
      {infrastructure === 'hybrid' && <HybridDeploymentGuide useCase={useCase} />}
    </div>
  );
}

function ThreatEnvironmentReplicationPhase({ useCase, infrastructure }: any) {
  const [replicationSteps] = useState([
    { id: 'extract-cves', name: 'Extract CVE Components', status: 'pending', duration: '30 min' },
    { id: 'version-matching', name: 'Deploy Vulnerable Versions', status: 'pending', duration: '45 min' },
    { id: 'config-weaknesses', name: 'Configure Security Weaknesses', status: 'pending', duration: '30 min' },
    { id: 'validate-exploitable', name: 'Validate Exploitable Conditions', status: 'pending', duration: '15 min' }
  ]);

  const getCVESpecificDeployment = () => {
    if (!useCase.cves || useCase.cves.length === 0) {
      return [{
        cve: 'CVE-PATTERN',
        software: 'Component from threat report',
        version: 'Vulnerable version',
        exploit_method: 'Attack vector from report',
        validation: 'Confirm exploitability'
      }];
    }
    
    return useCase.cves.map((cve: string) => ({
      cve,
      software: `Software affected by ${cve}`,
      version: 'Specific vulnerable version',
      exploit_method: 'RCE/Privilege Escalation/Data Exposure',
      validation: 'Proof-of-concept execution'
    }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Threat Environment Replication</CardTitle>
          <CardDescription>
            Recreate exact vulnerable components from threat report for realistic attack reenactment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {replicationSteps.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-gray-600">Estimated: {step.duration}</p>
                  </div>
                </div>
                <Badge variant="outline">{step.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CVE-Specific Deployment Plan</CardTitle>
          <CardDescription>Exact replication of vulnerabilities from threat report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getCVESpecificDeployment().map((deployment: any, i: number) => (
              <div key={i} className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-amber-800">{deployment.cve}</h3>
                  <Badge variant="outline" className="border-amber-300 text-amber-600">Replication Target</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-amber-700">Software Component:</p>
                    <p className="text-amber-600">{deployment.software}</p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Vulnerable Version:</p>
                    <p className="text-amber-600">{deployment.version}</p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Exploit Method:</p>
                    <p className="text-amber-600">{deployment.exploit_method}</p>
                  </div>
                  <div>
                    <p className="font-medium text-amber-700">Validation Step:</p>
                    <p className="text-amber-600">{deployment.validation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AttackExecutionPhase({ useCase }: any) {
  const [executionSteps] = useState([
    { id: 'attack-preparation', name: 'Attack Preparation', status: 'pending', duration: '20 min' },
    { id: 'exploit-execution', name: 'Execute Attack Chain', status: 'pending', duration: '30 min' },
    { id: 'impact-validation', name: 'Validate Attack Success', status: 'pending', duration: '25 min' },
    { id: 'evidence-collection', name: 'Collect Forensic Evidence', status: 'pending', duration: '15 min' }
  ]);

  const getAttackChain = () => {
    const chain = [];
    
    if (useCase.attackVectors?.includes('Remote Code Execution')) {
      chain.push({
        step: '1. Initial Access',
        method: 'Remote Code Execution',
        target: 'Vulnerable service endpoint',
        evidence: 'Command execution logs, process creation events'
      });
    }
    
    if (useCase.attackVectors?.includes('Privilege Escalation')) {
      chain.push({
        step: '2. Privilege Escalation',
        method: 'Local privilege escalation',
        target: 'System-level access',
        evidence: 'User privilege changes, administrative access logs'
      });
    }
    
    if (useCase.attackVectors?.includes('Lateral Movement')) {
      chain.push({
        step: '3. Lateral Movement',
        method: 'Network traversal',
        target: 'Additional systems',
        evidence: 'Network connections, authentication attempts'
      });
    }
    
    // Default generic attack chain if no specific vectors
    if (chain.length === 0) {
      chain.push({
        step: '1. Exploitation',
        method: 'Vulnerability exploitation',
        target: 'Primary vulnerable component',
        evidence: 'System logs, security events, network traffic'
      });
    }
    
    return chain;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Attack Execution & Validation</CardTitle>
          <CardDescription>
            Execute attack chain from threat report and capture forensic evidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {executionSteps.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Play className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-gray-600">Estimated: {step.duration}</p>
                  </div>
                </div>
                <Badge variant="outline">{step.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attack Chain Execution Plan</CardTitle>
          <CardDescription>Step-by-step attack replication from threat report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getAttackChain().map((step, i) => (
              <div key={i} className="border rounded-lg p-4 bg-red-50 border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-red-800">{step.step}</h3>
                  <Badge variant="destructive" className="text-xs">Execute</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="font-medium text-red-700">Method:</p>
                    <p className="text-red-600">{step.method}</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-700">Target:</p>
                    <p className="text-red-600">{step.target}</p>
                  </div>
                  <div>
                    <p className="font-medium text-red-700">Evidence to Collect:</p>
                    <p className="text-red-600">{step.evidence}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DetectionValidationPhase({ useCase }: any) {
  const [validationSteps] = useState([
    { id: 'test-detection', name: 'Test Detection Rules', status: 'pending', duration: '20 min' },
    { id: 'validate-alerts', name: 'Validate Alert Generation', status: 'pending', duration: '15 min' },
    { id: 'verify-response', name: 'Verify Response Procedures', status: 'pending', duration: '15 min' },
    { id: 'measure-accuracy', name: 'Measure Detection Accuracy', status: 'pending', duration: '10 min' }
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detection & Response Validation</CardTitle>
          <CardDescription>
            Test detection capabilities against live attack execution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validationSteps.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-gray-600">Estimated: {step.duration}</p>
                  </div>
                </div>
                <Badge variant="outline">{step.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detection Validation Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-green-600">95%</p>
              <p className="text-sm text-gray-600">Detection Rate</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-blue-600">2.5s</p>
              <p className="text-sm text-gray-600">Alert Latency</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-purple-600">3</p>
              <p className="text-sm text-gray-600">False Positives</p>
            </div>
            <div className="text-center p-3 border rounded-lg">
              <p className="text-2xl font-bold text-orange-600">8.5</p>
              <p className="text-sm text-gray-600">MITRE Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LabDocumentationPhase({ useCase }: any) {
  const [documentationSteps] = useState([
    { id: 'lab-summary', name: 'Generate Lab Summary', status: 'pending', duration: '10 min' },
    { id: 'attack-playbook', name: 'Create Attack Playbook', status: 'pending', duration: '15 min' },
    { id: 'lessons-learned', name: 'Document Lessons Learned', status: 'pending', duration: '10 min' },
    { id: 'package-sharing', name: 'Package for Sharing', status: 'pending', duration: '5 min' }
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lab Documentation & Handoff</CardTitle>
          <CardDescription>
            Generate comprehensive documentation and package lab for future use
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {documentationSteps.map((step) => (
              <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <div>
                    <p className="font-medium">{step.name}</p>
                    <p className="text-sm text-gray-600">Estimated: {step.duration}</p>
                  </div>
                </div>
                <Badge variant="outline">{step.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Lab Environment Report</h3>
              <p className="text-sm text-gray-600 mb-2">Complete infrastructure and attack documentation</p>
              <Button size="sm" variant="outline">Download PDF</Button>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Attack Execution Playbook</h3>
              <p className="text-sm text-gray-600 mb-2">Step-by-step attack replication guide</p>
              <Button size="sm" variant="outline">Download YAML</Button>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Detection Rules Package</h3>
              <p className="text-sm text-gray-600 mb-2">XQL correlation rules and alert layouts</p>
              <Button size="sm" variant="outline">Download JSON</Button>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Training Module</h3>
              <p className="text-sm text-gray-600 mb-2">Complete training scenario for team education</p>
              <Button size="sm" variant="outline">Export Module</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Placeholder components for detailed guides
function VMwareDeploymentGuide({ useCase }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>VMware vSphere Deployment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <Server className="h-4 w-4" />
            <AlertDescription>
              Using existing VMware infrastructure to minimize costs
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <h4 className="font-medium">Deployment Steps:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Create resource pool for lab environment</li>
              <li>Deploy VM templates based on use case requirements</li>
              <li>Configure network isolation and monitoring</li>
              <li>Install and configure monitoring agents</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CloudDeploymentGuide({ useCase }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cloud Infrastructure Deployment</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <DollarSign className="h-4 w-4" />
          <AlertDescription>
            Monitor costs carefully - use auto-shutdown policies
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

function HybridDeploymentGuide({ useCase }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hybrid Infrastructure Deployment</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <Network className="h-4 w-4" />
          <AlertDescription>
            Combine VMware and cloud for optimal cost-effectiveness
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3 mt-4">
          <h4 className="font-medium">Hybrid Architecture Benefits:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Use existing VMware for stable, persistent services</li>
            <li>Scale with cloud for dynamic or resource-intensive components</li>
            <li>Maintain cost control with selective cloud usage</li>
            <li>Achieve realistic network segmentation</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function XSIAMOnboardingGuide({ useCase, infrastructure }: any) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">XSIAM Data Source Configuration:</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>Access Cortex Data Lake configuration</li>
        <li>Configure log collection agents</li>
        <li>Set up data forwarding rules</li>
        <li>Validate data ingestion</li>
      </ol>
    </div>
  );
}

function AttackExecutionGuide({ useCase }: any) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Attack Execution Steps:</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>Deploy attack tools and payloads</li>
        <li>Execute exploitation techniques</li>
        <li>Validate attack success</li>
        <li>Collect evidence and logs</li>
      </ol>
    </div>
  );
}

function XSIAMContentGuide({ useCase }: any) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Content Development Process:</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>Create correlation rules based on attack patterns</li>
        <li>Design alert layouts for analyst workflow</li>
        <li>Build response playbooks</li>
        <li>Configure monitoring dashboards</li>
      </ol>
    </div>
  );
}

function ResponseWorkflowGuide({ useCase }: any) {
  return (
    <div className="space-y-4">
      <h4 className="font-medium">Analyst Workflow Definition:</h4>
      <ol className="list-decimal list-inside space-y-2 text-sm">
        <li>Document investigation procedures</li>
        <li>Define response actions and escalation</li>
        <li>Create knowledge base entries</li>
        <li>Establish success metrics</li>
      </ol>
    </div>
  );
}