import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  Server, 
  Play, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Activity,
  Shield,
  Database,
  Network
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UseCaseConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  infrastructure: string[];
  estimatedCost: string;
  deploymentTime: string;
}

const USE_CASES: UseCaseConfig[] = [
  {
    id: 'docker-runtime-escape',
    title: 'Docker Runtime Escape Detection',
    category: 'cloud',
    description: 'Deploy container environment to test and detect Docker runtime escape attempts with XSIAM monitoring',
    infrastructure: ['Azure Docker Host VM', 'XSIAM API Integration', 'Monitoring Dashboard'],
    estimatedCost: '$2-4/hour',
    deploymentTime: '8-12 minutes'
  },
  {
    id: 'lateral-movement',
    title: 'Lateral Movement Detection',
    category: 'endpoint',
    description: 'Create Active Directory environment to simulate and detect lateral movement attacks',
    infrastructure: ['Azure Domain Controller', 'Azure Workstation VMs', 'XSIAM API Integration'],
    estimatedCost: '$3-6/hour',
    deploymentTime: '12-18 minutes'
  },
  {
    id: 'cloud-privilege-escalation',
    title: 'Cloud Privilege Escalation',
    category: 'cloud',
    description: 'Azure IAM environment for testing privilege escalation detection and response',
    infrastructure: ['Azure Target VMs', 'Azure Monitoring VM', 'XSIAM API Integration'],
    estimatedCost: '$2-5/hour',
    deploymentTime: '10-15 minutes'
  },
  {
    id: 'phishing-response',
    title: 'Phishing Attack Response',
    category: 'identity',
    description: 'Email security testing environment with user behavior analytics',
    infrastructure: ['Azure Email Server', 'Azure User Endpoints', 'XSIAM API Integration'],
    estimatedCost: '$3-5/hour',
    deploymentTime: '15-20 minutes'
  }
];

export function AzureUseCaseManager() {
  const [selectedUseCase, setSelectedUseCase] = useState<string>('');
  const [resourceGroup, setResourceGroup] = useState('threat-research-lab');
  const [location, setLocation] = useState('East US');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null);
  const [existingResources, setExistingResources] = useState<any[]>([]);

  const { toast } = useToast();

  const cleanupResources = async () => {
    try {
      toast({
        title: "Cleanup Initiated",
        description: "Removing all Azure resources to make room for new deployments..."
      });

      const response = await fetch('/api/azure/cleanup-resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Resources Cleaned",
          description: `${result.deletions?.length || 0} resource groups scheduled for deletion. This may take several minutes.`
        });
        setExistingResources([]);
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.message || "Unable to clean up existing resources",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Cleanup Error",
        description: "Failed to communicate with Azure cleanup service",
        variant: "destructive"
      });
    }
  };

  const deployUseCase = async () => {
    if (!selectedUseCase) {
      toast({
        title: "No Use Case Selected",
        description: "Please select a use case to deploy",
        variant: "destructive"
      });
      return;
    }

    setIsDeploying(true);
    try {
      const response = await fetch('/api/azure/deploy-use-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId: selectedUseCase,
          resourceGroup,
          location
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDeploymentStatus(result);
        toast({
          title: "Deployment Started",
          description: `Infrastructure deployment initiated for ${result.useCase.title}`
        });
      } else {
        toast({
          title: "Deployment Failed",
          description: result.message || "Failed to start deployment",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Deployment Error",
        description: "Failed to communicate with Azure services",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const executeScenario = async (scenarioType: string) => {
    try {
      const response = await fetch('/api/azure/execute-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          useCaseId: selectedUseCase,
          scenarioType,
          resourceGroup
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Scenario Executed",
          description: `${scenarioType} scenario completed successfully`
        });
      }
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: "Failed to execute threat scenario",
        variant: "destructive"
      });
    }
  };

  const selectedUseCaseConfig = USE_CASES.find(uc => uc.id === selectedUseCase);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Azure Use Case Automation</h2>
        <p className="text-muted-foreground">
          Deploy complete threat detection environments with automated XSIAM integration
        </p>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="deploy">Deploy Use Case</TabsTrigger>
          <TabsTrigger value="manage">Manage Infrastructure</TabsTrigger>
          <TabsTrigger value="scenarios">Execute Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5" />
                Infrastructure Deployment
              </CardTitle>
              <CardDescription>
                Select and deploy complete threat testing environments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resource-group">Resource Group</Label>
                  <Input
                    id="resource-group"
                    value={resourceGroup}
                    onChange={(e) => setResourceGroup(e.target.value)}
                    placeholder="threat-research-lab"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Azure Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="East US">East US</SelectItem>
                      <SelectItem value="West US 2">West US 2</SelectItem>
                      <SelectItem value="Central US">Central US</SelectItem>
                      <SelectItem value="West Europe">West Europe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Use Case</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {USE_CASES.map((useCase) => (
                    <Card 
                      key={useCase.id}
                      className={`cursor-pointer transition-colors ${
                        selectedUseCase === useCase.id 
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedUseCase(useCase.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-sm">{useCase.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {useCase.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">
                          {useCase.description}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3" />
                            {useCase.deploymentTime}
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Database className="w-3 h-3" />
                            {useCase.estimatedCost}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {selectedUseCaseConfig && (
                <Alert>
                  <Shield className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Infrastructure:</strong> {selectedUseCaseConfig.infrastructure.join(', ')}
                    <br />
                    <strong>Estimated Cost:</strong> {selectedUseCaseConfig.estimatedCost} during testing
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button 
                  onClick={deployUseCase} 
                  disabled={!selectedUseCase || isDeploying}
                  className="flex-1"
                >
                  {isDeploying ? 'Deploying...' : 'Deploy Infrastructure'}
                </Button>
                <Button variant="outline" onClick={cleanupResources}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clean Resources
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          {deploymentStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Deployment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <strong>Use Case:</strong> {deploymentStatus.useCase.title}
                  </div>
                  <div>
                    <strong>Resource Group:</strong> {deploymentStatus.deployment.resourceGroup}
                  </div>
                  
                  <div className="space-y-2">
                    <strong>Deployed Azure VMs:</strong>
                    {deploymentStatus.deployment.vms.map((vm: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{vm.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Role: {vm.role} | Azure VM
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            XSIAM API Integration configured
                          </div>
                        </div>
                        <div className="text-right">
                          {vm.publicIp && (
                            <div className="text-sm font-mono">{vm.publicIp}</div>
                          )}
                          <Badge variant={vm.status === 'created' ? 'default' : 'destructive'}>
                            {vm.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {deploymentStatus.deployment.xsiamIntegration && (
                    <div className="space-y-2">
                      <strong>XSIAM API Integration:</strong>
                      {deploymentStatus.deployment.xsiamIntegration.map((integration: any, index: number) => (
                        <div key={index} className="p-2 border rounded bg-blue-50 dark:bg-blue-950">
                          <div className="font-medium">{integration.vm}</div>
                          <div className="text-sm text-muted-foreground">{integration.message}</div>
                          <div className="text-xs mt-1">
                            <strong>Method:</strong> {integration.integrationMethod}
                          </div>
                          {integration.dataCollection && (
                            <div className="mt-1 text-xs">
                              <strong>Data Collection:</strong> {integration.dataCollection.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <strong>Next Steps:</strong>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {deploymentStatus.nextSteps.map((step: string, index: number) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Threat Scenario Execution
              </CardTitle>
              <CardDescription>
                Execute realistic attack scenarios for detection testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedUseCaseConfig ? (
                <div className="grid gap-3">
                  {selectedUseCaseConfig.id === 'docker-runtime-escape' && (
                    <Button onClick={() => executeScenario('docker-escape')} variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Execute Container Escape
                    </Button>
                  )}
                  {selectedUseCaseConfig.id === 'lateral-movement' && (
                    <Button onClick={() => executeScenario('lateral-movement')} variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Simulate Lateral Movement
                    </Button>
                  )}
                  {selectedUseCaseConfig.id === 'cloud-privilege-escalation' && (
                    <Button onClick={() => executeScenario('privilege-escalation')} variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Test Privilege Escalation
                    </Button>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Select and deploy a use case first to execute threat scenarios
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}