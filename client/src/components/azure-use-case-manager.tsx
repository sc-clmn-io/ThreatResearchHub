import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  Settings, 
  PlayCircle, 
  StopCircle, 
  CheckCircle, 
  AlertTriangle, 
  Server, 
  Network, 
  Shield, 
  Timer,
  DollarSign,
  Users,
  Lock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ThreatInfrastructureMapping {
  threatCategory: string;
  attackVectors: string[];
  requiredInfrastructure: {
    azure: {
      vms: {
        count: number;
        sizes: string[];
        operatingSystems: string[];
        networkConfig: string;
      };
      services: string[];
      estimatedCost: {
        setup: string;
        hourly: string;
      };
    };
    proxmox: any;
  };
  dataSourceRequirements: string[];
  estimatedDeployTime: string;
  complexityLevel: 'simple' | 'medium' | 'advanced';
}

interface AzureConnection {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  subscriptionId: string;
  resourceGroup: string;
}

export default function AzureUseCaseManager() {
  const { toast } = useToast();
  const [azureConnection, setAzureConnection] = useState<AzureConnection>({
    tenantId: '',
    clientId: '',
    clientSecret: '',
    subscriptionId: '',
    resourceGroup: ''
  });
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [connectionError, setConnectionError] = useState<string>('');
  const [threatMappings, setThreatMappings] = useState<Record<string, ThreatInfrastructureMapping>>({});
  const [selectedThreat, setSelectedThreat] = useState<string>('');
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'deployed' | 'error'>('idle');
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deployedResources, setDeployedResources] = useState<any[]>([]);

  useEffect(() => {
    // Load saved Azure connection details
    const savedConnection = localStorage.getItem('azureConnection');
    if (savedConnection) {
      setAzureConnection(JSON.parse(savedConnection));
    }

    // Load threat infrastructure mappings
    loadThreatMappings();
  }, []);

  const loadThreatMappings = async () => {
    try {
      const response = await fetch('/api/threat-infrastructure/mappings');
      if (response.ok) {
        const mappings = await response.json();
        setThreatMappings(mappings);
      }
    } catch (error) {
      console.error('Failed to load threat mappings:', error);
    }
  };

  const testAzureConnection = async () => {
    setConnectionStatus('connecting');
    setConnectionError('');
    
    try {
      const response = await fetch('/api/azure/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureConnection)
      });

      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus('connected');
        localStorage.setItem('azureConnection', JSON.stringify(azureConnection));
        toast({
          title: "Azure Connected",
          description: "Successfully connected to Azure subscription",
        });
      } else {
        setConnectionStatus('error');
        setConnectionError(result.error || 'Connection failed');
        toast({
          title: "Connection Failed",
          description: result.error || 'Failed to connect to Azure',
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError('Network error');
      toast({
        title: "Connection Error",
        description: "Network error connecting to Azure",
        variant: "destructive",
      });
    }
  };

  const deployThreatInfrastructure = async () => {
    if (!selectedThreat) {
      toast({
        title: "No Threat Selected",
        description: "Please select a threat scenario to deploy",
        variant: "destructive",
      });
      return;
    }

    setDeploymentStatus('deploying');
    setDeploymentProgress(0);
    
    try {
      const mapping = threatMappings[selectedThreat];
      const deploymentData = {
        threatScenario: selectedThreat,
        azureConnection,
        mapping: mapping.requiredInfrastructure.azure
      };

      const response = await fetch('/api/azure/deploy-use-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentData)
      });

      const result = await response.json();
      
      if (result.success) {
        setDeploymentStatus('deployed');
        setDeploymentProgress(100);
        setDeployedResources(result.resources || []);
        toast({
          title: "Infrastructure Deployed",
          description: `Successfully deployed ${mapping.threatCategory} infrastructure`,
        });
      } else {
        setDeploymentStatus('error');
        toast({
          title: "Deployment Failed",
          description: result.error || 'Failed to deploy infrastructure',
          variant: "destructive",
        });
      }
    } catch (error) {
      setDeploymentStatus('error');
      toast({
        title: "Deployment Error",
        description: "Error deploying infrastructure",
        variant: "destructive",
      });
    }
  };

  const getComplexityColor = (level: string) => {
    switch (level) {
      case 'simple': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4" />;
      case 'connecting': return <Timer className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Cloud className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Azure Use Case Infrastructure</h1>
          <p className="text-muted-foreground">Deploy threat-specific infrastructure in Azure for XSIAM testing</p>
        </div>
        <div className={`flex items-center gap-2 ${getConnectionStatusColor()}`}>
          {getConnectionStatusIcon()}
          <span className="font-medium capitalize">{connectionStatus}</span>
        </div>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Azure Connection</TabsTrigger>
          <TabsTrigger value="threats">Threat Scenarios</TabsTrigger>
          <TabsTrigger value="deployment">Infrastructure Deployment</TabsTrigger>
        </TabsList>

        <TabsContent value="connection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Azure Service Principal Configuration
              </CardTitle>
              <CardDescription>
                Configure Azure credentials for automated infrastructure deployment and XSIAM integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantId">Tenant ID</Label>
                  <Input
                    id="tenantId"
                    value={azureConnection.tenantId}
                    onChange={(e) => setAzureConnection({ ...azureConnection, tenantId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID (Application ID)</Label>
                  <Input
                    id="clientId"
                    value={azureConnection.clientId}
                    onChange={(e) => setAzureConnection({ ...azureConnection, clientId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={azureConnection.clientSecret}
                    onChange={(e) => setAzureConnection({ ...azureConnection, clientSecret: e.target.value })}
                    placeholder="Client secret value"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subscriptionId">Subscription ID</Label>
                  <Input
                    id="subscriptionId"
                    value={azureConnection.subscriptionId}
                    onChange={(e) => setAzureConnection({ ...azureConnection, subscriptionId: e.target.value })}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resourceGroup">Resource Group</Label>
                  <Input
                    id="resourceGroup"
                    value={azureConnection.resourceGroup}
                    onChange={(e) => setAzureConnection({ ...azureConnection, resourceGroup: e.target.value })}
                    placeholder="threat-lab-rg"
                  />
                </div>
              </div>
              
              {connectionError && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>{connectionError}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={testAzureConnection}
                disabled={connectionStatus === 'connecting' || !azureConnection.tenantId}
                className="w-full"
              >
                {connectionStatus === 'connecting' ? 'Testing Connection...' : 'Test Azure Connection'}
              </Button>

              {connectionStatus === 'connected' && (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    Successfully connected to Azure. Ready to deploy threat infrastructure.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Available Threat Scenarios
                </CardTitle>
                <CardDescription>
                  Select a threat scenario to view infrastructure requirements and deploy to Azure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {Object.entries(threatMappings).map(([key, mapping]) => (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all ${selectedThreat === key ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
                      onClick={() => setSelectedThreat(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{mapping.threatCategory}</h3>
                              <Badge className={getComplexityColor(mapping.complexityLevel)}>
                                {mapping.complexityLevel}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              Attack Vectors: {mapping.attackVectors.join(', ')}
                            </p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <Server className="w-4 h-4" />
                                <span>{mapping.requiredInfrastructure.azure.vms.count} VMs</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Timer className="w-4 h-4" />
                                <span>{mapping.estimatedDeployTime}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                <span>{mapping.requiredInfrastructure.azure.estimatedCost.setup} setup</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Network className="w-4 h-4" />
                                <span>{mapping.requiredInfrastructure.azure.estimatedCost.hourly}/hr</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedThreat && threatMappings[selectedThreat] && (
              <Card>
                <CardHeader>
                  <CardTitle>Infrastructure Details: {threatMappings[selectedThreat].threatCategory}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Azure VMs</h4>
                      <ul className="text-sm space-y-1">
                        {threatMappings[selectedThreat].requiredInfrastructure.azure.vms.sizes.map((size, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Server className="w-3 h-3" />
                            {size} - {threatMappings[selectedThreat].requiredInfrastructure.azure.vms.operatingSystems[index] || 'OS TBD'}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Azure Services</h4>
                      <ul className="text-sm space-y-1">
                        {threatMappings[selectedThreat].requiredInfrastructure.azure.services.map((service, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <Cloud className="w-3 h-3" />
                            {service}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">Data Source Requirements</h4>
                    <div className="flex flex-wrap gap-2">
                      {threatMappings[selectedThreat].dataSourceRequirements.map((source, index) => (
                        <Badge key={index} variant="outline">{source}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Infrastructure Deployment
              </CardTitle>
              <CardDescription>
                Deploy selected threat scenario infrastructure to Azure with XSIAM integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedThreat ? (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Please select a threat scenario from the Threat Scenarios tab before deploying.
                  </AlertDescription>
                </Alert>
              ) : connectionStatus !== 'connected' ? (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Please configure and test Azure connection before deploying infrastructure.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Ready to Deploy: {threatMappings[selectedThreat]?.threatCategory}</h4>
                    <p className="text-sm text-muted-foreground">
                      This will create {threatMappings[selectedThreat]?.requiredInfrastructure.azure.vms.count} VMs and required services in your Azure subscription.
                    </p>
                  </div>

                  {deploymentStatus === 'deploying' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Deployment Progress</span>
                        <span>{deploymentProgress}%</span>
                      </div>
                      <Progress value={deploymentProgress} />
                    </div>
                  )}

                  {deploymentStatus === 'deployed' && (
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        Infrastructure deployed successfully! Resources are ready for threat testing with XSIAM integration.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={deployThreatInfrastructure}
                      disabled={deploymentStatus === 'deploying' || deploymentStatus === 'deployed'}
                      className="flex-1"
                    >
                      {deploymentStatus === 'deploying' ? 'Deploying...' : 'Deploy Infrastructure'}
                    </Button>
                    {deploymentStatus === 'deployed' && (
                      <Button variant="outline">
                        View Resources
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}