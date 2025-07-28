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
  Server, 
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
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VM {
  vmid: string;
  name: string;
  status: string;
  cpu: string;
  mem: string;
  disk: string;
  uptime: string;
  node: string;
}

interface ProxmoxConnection {
  host: string;
  username: string;
  port: number;
  connected: boolean;
}

export function ProxmoxVMManager() {
  const [connection, setConnection] = useState<ProxmoxConnection>({
    host: '192.168.1.188',
    username: 'root',
    port: 22,
    connected: false
  });
  
  const [vms, setVms] = useState<VM[]>([]);
  const [brokerVM, setBrokerVM] = useState<VM | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [commandOutput, setCommandOutput] = useState<string>('');
  
  // VM Creation Form
  const [newVM, setNewVM] = useState({
    vmid: '',
    name: '',
    memory: '4096',
    cores: '2',
    disk: '32',
    template: 'ubuntu-20.04',
    network: 'vmbr0'
  });

  const { toast } = useToast();

  const connectToProxmox = async () => {
    setIsConnecting(true);
    try {
      const response = await fetch('/api/proxmox/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });

      const result = await response.json();
      
      if (result.success) {
        setConnection(prev => ({ ...prev, connected: true }));
        toast({
          title: "Connected to Proxmox",
          description: `Successfully connected to ${connection.host}`
        });
        await loadVMs();
      } else {
        toast({
          title: "Connection Failed",
          description: result.error || "Unable to connect to Proxmox",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to Proxmox server",
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
      const response = await fetch('/api/proxmox/vms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connection)
      });

      const result = await response.json();
      
      if (result.success) {
        setVms(result.vms);
        
        // Look for broker VM
        const broker = result.vms.find((vm: VM) => 
          vm.name.toLowerCase().includes('broker') || 
          vm.name.toLowerCase().includes('xsiam')
        );
        setBrokerVM(broker || null);
        
        setCommandOutput(result.rawOutput);
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

  const controlVM = async (vmid: string, action: 'start' | 'stop' | 'destroy') => {
    try {
      const response = await fetch('/api/proxmox/vm-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...connection,
          vmid,
          action
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: `VM ${action.charAt(0).toUpperCase() + action.slice(1)}ed`,
          description: `VM ${vmid} ${action} command executed successfully`
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
        description: `Failed to ${action} VM ${vmid}`,
        variant: "destructive"
      });
    }
  };

  const createVM = async () => {
    if (!newVM.vmid || !newVM.name) {
      toast({
        title: "Missing Information",
        description: "Please provide VM ID and name",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/proxmox/create-vm', {
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
          title: "VM Created",
          description: `VM ${newVM.name} (${newVM.vmid}) created successfully`
        });
        
        // Reset form
        setNewVM({
          vmid: '',
          name: '',
          memory: '4096',
          cores: '2',
          disk: '32',
          template: 'ubuntu-20.04',
          network: 'vmbr0'
        });
        
        await loadVMs(); // Refresh VM list
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
      const response = await fetch('/api/proxmox/setup-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...connection,
          vmid: brokerVM.vmid
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
      case 'running': return 'bg-green-500';
      case 'stopped': return 'bg-red-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Proxmox Connection
          </CardTitle>
          <CardDescription>
            Connect to your Proxmox server to manage VMs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={connection.host}
                onChange={(e) => setConnection(prev => ({ ...prev, host: e.target.value }))}
                placeholder="192.168.1.188"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={connection.username}
                onChange={(e) => setConnection(prev => ({ ...prev, username: e.target.value }))}
                placeholder="root"
              />
            </div>
            <div>
              <Label htmlFor="port">SSH Port</Label>
              <Input
                id="port"
                type="number"
                value={connection.port}
                onChange={(e) => setConnection(prev => ({ ...prev, port: parseInt(e.target.value) }))}
                placeholder="22"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={connectToProxmox} 
              disabled={isConnecting}
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Server className="w-4 h-4" />
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
                  <span>Virtual Machines</span>
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
                      <Card key={vm.vmid} className="border-l-4 border-l-blue-500">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{vm.name}</h3>
                                <Badge className={`${getStatusColor(vm.status)} text-white`}>
                                  {vm.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">ID: {vm.vmid}</span>
                              </div>
                              
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Cpu className="w-4 h-4" />
                                  {vm.cpu}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MemoryStick className="w-4 h-4" />
                                  {vm.mem}
                                </span>
                                <span className="flex items-center gap-1">
                                  <HardDrive className="w-4 h-4" />
                                  {vm.disk}
                                </span>
                                {vm.uptime && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {vm.uptime}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {vm.status.toLowerCase() === 'stopped' ? (
                                <Button
                                  size="sm"
                                  onClick={() => controlVM(vm.vmid, 'start')}
                                  className="flex items-center gap-1"
                                >
                                  <Play className="w-4 h-4" />
                                  Start
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => controlVM(vm.vmid, 'stop')}
                                  className="flex items-center gap-1"
                                >
                                  <Square className="w-4 h-4" />
                                  Stop
                                </Button>
                              )}
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => controlVM(vm.vmid, 'destroy')}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="w-4 h-4" />
                                Destroy
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
                <CardTitle>XSIAM Broker VM Setup</CardTitle>
                <CardDescription>
                  Configure and deploy XSIAM broker for log forwarding
                </CardDescription>
              </CardHeader>
              <CardContent>
                {brokerVM ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="w-4 h-4" />
                      <AlertDescription>
                        Broker VM found: <strong>{brokerVM.name}</strong> (ID: {brokerVM.vmid})
                        Status: <Badge className={getStatusColor(brokerVM.status)}>{brokerVM.status}</Badge>
                      </AlertDescription>
                    </Alert>
                    
                    <Button onClick={setupBrokerVM} className="flex items-center gap-2">
                      <Server className="w-4 h-4" />
                      Configure XSIAM Broker
                    </Button>
                  </div>
                ) : (
                  <Alert>
                    <XCircle className="w-4 h-4" />
                    <AlertDescription>
                      No broker VM detected. Create a VM with "broker" or "xsiam" in the name, or upload the broker qcow2 image.
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
                <CardTitle>Create New VM</CardTitle>
                <CardDescription>
                  Deploy new virtual machines for your lab environment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 space-y-4">
                  <div>
                    <Label htmlFor="vmid">VM ID</Label>
                    <Input
                      id="vmid"
                      value={newVM.vmid}
                      onChange={(e) => setNewVM(prev => ({ ...prev, vmid: e.target.value }))}
                      placeholder="100"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="name">VM Name</Label>
                    <Input
                      id="name"
                      value={newVM.name}
                      onChange={(e) => setNewVM(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="xsiam-broker"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="memory">Memory (MB)</Label>
                    <Input
                      id="memory"
                      value={newVM.memory}
                      onChange={(e) => setNewVM(prev => ({ ...prev, memory: e.target.value }))}
                      placeholder="4096"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cores">CPU Cores</Label>
                    <Input
                      id="cores"
                      value={newVM.cores}
                      onChange={(e) => setNewVM(prev => ({ ...prev, cores: e.target.value }))}
                      placeholder="2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="disk">Disk Size (GB)</Label>
                    <Input
                      id="disk"
                      value={newVM.disk}
                      onChange={(e) => setNewVM(prev => ({ ...prev, disk: e.target.value }))}
                      placeholder="32"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="template">Template/OS</Label>
                    <Select 
                      value={newVM.template} 
                      onValueChange={(value) => setNewVM(prev => ({ ...prev, template: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ubuntu-20.04">Ubuntu 20.04</SelectItem>
                        <SelectItem value="ubuntu-22.04">Ubuntu 22.04</SelectItem>
                        <SelectItem value="debian-11">Debian 11</SelectItem>
                        <SelectItem value="centos-8">CentOS 8</SelectItem>
                        <SelectItem value="windows-server-2019">Windows Server 2019</SelectItem>
                        <SelectItem value="xsiam-broker">XSIAM Broker</SelectItem>
                      </SelectContent>
                    </Select>
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
                  Console Output
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={commandOutput}
                  readOnly
                  className="font-mono text-sm h-96"
                  placeholder="Command output will appear here..."
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}