import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Cloud, 
  Play, 
  Square, 
  Trash2, 
  Plus, 
  RefreshCw, 
  Terminal, 
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AzureVM {
  id: string;
  name: string;
  status: string;
  size: string;
  location: string;
  resourceGroup: string;
  publicIP?: string;
  privateIP?: string;
  osType: string;
  powerState: string;
}

interface AzureConnection {
  subscriptionId: string;
  resourceGroup: string;
  location: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string;
  connected: boolean;
}

export function AzureVMManager() {
  const [connection, setConnection] = useState<AzureConnection>({
    subscriptionId: 'EXAMPLE_CLUSTER_URI',
    resourceGroup: '',
    location: 'East US',
    connected: false
  });
  
  const [vms, setVms] = useState<AzureVM[]>([]);
  const [brokerVM, setBrokerVM] = useState<AzureVM | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [commandOutput, setCommandOutput] = useState<string>('');
  
  // VM Creation Form
  const [newVM, setNewVM] = useState({
    name: '',
    size: 'Standard_B2s',
    adminUsername: 'azureuser',
    osImage: 'Ubuntu2204',
    diskSize: '30',
    publicKey: ''
  });

  const { toast } = useToast();

  const connectToAzure = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/azure/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });

      const result = await response.json();
      
      if (result.success) {
        setConnection(prev => ({ ...prev, connected: true }));
        toast({
          title: "Connected to Azure",
          description: `Successfully connected to subscription ${connection.subscriptionId}`
        });
        await loadVMs();
      } else {
        toast({
          title: "Azure Connection Failed",
          description: result.error || "Unable to connect to Azure",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to Azure",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const loadVMs = async () => {
    if (!connection.connected) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/azure/vms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });

      const result = await response.json();
      
      if (result.success) {
        setVms(result.vms);
        
        // Look for broker VM
        const broker = result.vms.find((vm: AzureVM) => 
          vm.name.toLowerCase().includes('broker') || 
          vm.name.toLowerCase().includes('xsiam')
        );
        setBrokerVM(broker || null);
        
        setCommandOutput(result.output || 'VMs loaded successfully');
      } else {
        toast({
          title: "Failed to Load VMs",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error Loading VMs",
        description: "Failed to retrieve VM list",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const controlVM = async (vmName: string, action: 'start' | 'stop' | 'deallocate' | 'delete') => {
    try {
      const response = await fetch('/api/azure/vm-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...connection,
          vmName,
          action
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: `VM ${action.charAt(0).toUpperCase() + action.slice(1)}ed`,
          description: `VM ${vmName} ${action} command executed successfully`
        });
        await loadVMs(); // Refresh VM list
      } else {
        toast({
          title: `Failed to ${action} VM`,
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "VM Control Error",
        description: `Failed to ${action} VM ${vmName}`,
        variant: "destructive"
      });
    }
  };

  const createVM = async () => {
    if (!newVM.name) {
      toast({
        title: "Missing Information",
        description: "Please provide VM name",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/azure/create-vm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...connection,
          vm: newVM
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "VM Creation Started",
          description: `VM ${newVM.name} creation initiated. This may take 5-10 minutes.`
        });
        
        setCommandOutput(result.output);
        
        // Reset form
        setNewVM({
          name: '',
          size: 'Standard_B2s',
          adminUsername: 'azureuser',
          osImage: 'Ubuntu2204',
          diskSize: '30',
          publicKey: ''
        });
        
        // Refresh VM list after a delay
        setTimeout(() => loadVMs(), 10000);
      } else {
        toast({
          title: "VM Creation Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Creation Error",
        description: "Failed to create VM",
        variant: "destructive"
      });
    }
  };

  const setupBrokerVM = async () => {
    if (!brokerVM) {
      toast({
        title: "No Broker VM Found",
        description: "Please create a broker VM first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/azure/setup-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...connection,
          vmName: brokerVM.name
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Broker VM Setup Started",
          description: "XSIAM broker configuration in progress"
        });
        setCommandOutput(result.output);
      } else {
        toast({
          title: "Broker Setup Failed",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Setup Error",
        description: "Failed to setup broker VM",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
      case 'vm running': return 'bg-green-500';
      case 'stopped':
      case 'vm stopped':
      case 'vm deallocated': return 'bg-red-500';
      case 'starting':
      case 'vm starting': return 'bg-yellow-500';
      case 'stopping':
      case 'vm stopping': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Azure Connection
          </CardTitle>
          <CardDescription>
            Connect to your Azure subscription to manage VMs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="subscriptionId">Subscription ID</Label>
              <Input
                id="subscriptionId"
                value={connection.subscriptionId}
                onChange={(e) => setConnection(prev => ({ ...prev, subscriptionId: e.target.value }))}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </div>
            <div>
              <Label htmlFor="resourceGroup">Resource Group</Label>
              <Input
                id="resourceGroup"
                value={connection.resourceGroup}
                onChange={(e) => setConnection(prev => ({ ...prev, resourceGroup: e.target.value }))}
                placeholder="my-resource-group"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Select 
                value={connection.location} 
                onValueChange={(value) => setConnection(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="East US">East US</SelectItem>
                  <SelectItem value="West US 2">West US 2</SelectItem>
                  <SelectItem value="Central US">Central US</SelectItem>
                  <SelectItem value="West Europe">West Europe</SelectItem>
                  <SelectItem value="UK South">UK South</SelectItem>
                  <SelectItem value="Southeast Asia">Southeast Asia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={connectToAzure} 
              disabled={isConnecting || !connection.subscriptionId}
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  Connect
                </>
              )}
            </Button>
            
            {connection.connected && (
              <Badge variant="outline" className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Connected
              </Badge>
            )}
          </div>
          
          <Alert className="mt-4">
            <Key className="w-4 h-4" />
            <AlertDescription>
              Authentication uses Azure CLI or managed identity. Run 'az login' locally or configure service principal credentials.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {connection.connected && (
        <Tabs defaultValue="vms" className="space-y-4">
          <TabsList>
            <TabsTrigger value="vms">Virtual Machines</TabsTrigger>
            <TabsTrigger value="broker">Broker VM Setup</TabsTrigger>
            <TabsTrigger value="create">Create VM</TabsTrigger>
            <TabsTrigger value="console">Console Output</TabsTrigger>
          </TabsList>

          {/* VM List */}
          <TabsContent value="vms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Azure Virtual Machines</span>
                  <Button onClick={loadVMs} disabled={isLoading} variant="outline" size="sm">
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {vms.length === 0 ? (
                  <p className="text-muted-foreground">No VMs found. Click refresh or create a new VM.</p>
                ) : (
                  <div className="space-y-4">
                    {vms.map((vm) => (
                      <Card key={vm.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{vm.name}</h3>
                                <Badge className={`${getStatusColor(vm.powerState)} text-white`}>
                                  {vm.powerState}
                                </Badge>
                                <span className="text-sm text-muted-foreground">{vm.size}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Globe className="w-4 h-4" />
                                  {vm.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Network className="w-4 h-4" />
                                  {vm.publicIP || 'No public IP'}
                                </span>
                                <span>{vm.osType}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {vm.powerState.toLowerCase().includes('stopped') || vm.powerState.toLowerCase().includes('deallocated') ? (
                                <Button
                                  size="sm"
                                  onClick={() => controlVM(vm.name, 'start')}
                                  className="flex items-center gap-1"
                                >
                                  <Play className="w-4 h-4" />
                                  Start
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => controlVM(vm.name, 'deallocate')}
                                  className="flex items-center gap-1"
                                >
                                  <Square className="w-4 h-4" />
                                  Stop
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => controlVM(vm.name, 'delete')}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broker VM Setup */}
          <TabsContent value="broker" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Azure XSIAM Broker VM Setup</CardTitle>
                <CardDescription>
                  Configure and deploy XSIAM broker for log forwarding from Azure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brokerVM ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        Broker VM found: <strong>{brokerVM.name}</strong> ({brokerVM.size})
                        Status: <Badge className={getStatusColor(brokerVM.powerState)}>{brokerVM.powerState}</Badge>
                      </AlertDescription>
                    </Alert>
                    
                    <Button onClick={setupBrokerVM} className="flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      Configure XSIAM Broker
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>
                      No broker VM detected. Create a VM with "broker" or "xsiam" in the name.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create VM */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Create New Azure VM</CardTitle>
                <CardDescription>
                  Deploy new virtual machines in your Azure subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 space-y-4">
                  <div>
                    <Label htmlFor="vmName">VM Name</Label>
                    <Input
                      id="vmName"
                      value={newVM.name}
                      onChange={(e) => setNewVM(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="xsiam-broker-vm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="vmSize">VM Size</Label>
                    <Select 
                      value={newVM.size} 
                      onValueChange={(value) => setNewVM(prev => ({ ...prev, size: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Standard_B1s">Standard_B1s (1 vCPU, 1GB RAM)</SelectItem>
                        <SelectItem value="Standard_B2s">Standard_B2s (2 vCPU, 4GB RAM)</SelectItem>
                        <SelectItem value="Standard_D2s_v3">Standard_D2s_v3 (2 vCPU, 8GB RAM)</SelectItem>
                        <SelectItem value="Standard_D4s_v3">Standard_D4s_v3 (4 vCPU, 16GB RAM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="adminUser">Admin Username</Label>
                    <Input
                      id="adminUser"
                      value={newVM.adminUsername}
                      onChange={(e) => setNewVM(prev => ({ ...prev, adminUsername: e.target.value }))}
                      placeholder="azureuser"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="osImage">OS Image</Label>
                    <Select 
                      value={newVM.osImage} 
                      onValueChange={(value) => setNewVM(prev => ({ ...prev, osImage: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ubuntu2204">Ubuntu 22.04 LTS</SelectItem>
                        <SelectItem value="Ubuntu2004">Ubuntu 20.04 LTS</SelectItem>
                        <SelectItem value="CentOS85">CentOS 8.5</SelectItem>
                        <SelectItem value="Win2022Datacenter">Windows Server 2022</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="publicKey">SSH Public Key (optional)</Label>
                    <Textarea
                      id="publicKey"
                      value={newVM.publicKey}
                      onChange={(e) => setNewVM(prev => ({ ...prev, publicKey: e.target.value }))}
                      placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAA..."
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button onClick={createVM} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create VM
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Console Output */}
          <TabsContent value="console" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Azure CLI Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={commandOutput}
                  readOnly
                  className="font-mono text-sm h-96"
                  placeholder="Azure CLI command output will appear here..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}