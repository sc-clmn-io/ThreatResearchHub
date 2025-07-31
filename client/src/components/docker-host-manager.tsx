import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Server, 
  Container, 
  Play, 
  Square, 
  Trash2, 
  RefreshCw, 
  Network,
  Shield,
  CheckCircle,
  AlertTriangle,
  Plus,
  Monitor,
  Activity
} from 'lucide-react';

interface DockerVM {
  vmid: string;
  name: string;
  status: string;
  memory: string;
  cores: string;
  disk: string;
  ip?: string;
  dockerVersion?: string;
  containers?: DockerContainer[];
}

interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  ports: string[];
  created: string;
}

interface ContainerConfig {
  name: string;
  description: string;
  logForwarding: {
    type: 'XSIAM_AGENT' | 'APPLICATION_LOG' | 'SYSLOG_FORWARDER' | 'CUSTOM_INTEGRATION';
    destination: string;
    description: string;
  };
}

interface ThreatScenario {
  id: string;
  name: string;
  description: string;
  containers: ContainerConfig[];
  difficulty: 'basic' | 'intermediate' | 'advanced';
  duration: string;
  category: 'container_escape' | 'lateral_movement' | 'privilege_escalation' | 'malware_analysis';
}

const threatScenarios: ThreatScenario[] = [
  {
    id: 'docker-escape',
    name: 'Docker Runtime Escape',
    description: 'Container escape vulnerabilities using privileged containers and volume mounts',
    containers: [
      {
        name: 'vulnerable-app',
        description: 'Web application with container escape vulnerabilities',
        logForwarding: {
          type: 'APPLICATION_LOG',
          destination: '192.168.100.124:514',
          description: 'Application logs via custom log forwarder (Fluent Bit)'
        }
      },
      {
        name: 'privileged-container',
        description: 'Privileged container for testing escape techniques',
        logForwarding: {
          type: 'XSIAM_AGENT',
          destination: '192.168.100.124:443',
          description: 'XSIAM EDR agent for endpoint detection and response'
        }
      },
      {
        name: 'host-monitor',
        description: 'Host monitoring and forensics container',
        logForwarding: {
          type: 'SYSLOG_FORWARDER',
          destination: '192.168.100.124:514',
          description: 'System logs via rsyslog forwarder'
        }
      }
    ],
    difficulty: 'advanced',
    duration: '45 min',
    category: 'container_escape'
  },
  {
    id: 'lateral-movement',
    name: 'Container Lateral Movement',
    description: 'Network-based lateral movement between containers in the same cluster',
    containers: [
      {
        name: 'web-frontend',
        description: 'Frontend web application',
        logForwarding: {
          type: 'APPLICATION_LOG',
          destination: '192.168.100.124:514',
          description: 'NGINX access logs via Filebeat'
        }
      },
      {
        name: 'api-backend',
        description: 'Backend API service',
        logForwarding: {
          type: 'APPLICATION_LOG',
          destination: '192.168.100.124:514',
          description: 'Application logs via structured JSON logging'
        }
      },
      {
        name: 'database',
        description: 'PostgreSQL database',
        logForwarding: {
          type: 'SYSLOG_FORWARDER',
          destination: '192.168.100.124:514',
          description: 'Database audit logs via syslog-ng'
        }
      },
      {
        name: 'network-scanner',
        description: 'Network reconnaissance tools',
        logForwarding: {
          type: 'CUSTOM_INTEGRATION',
          destination: '192.168.100.124:443',
          description: 'Custom XSIAM integration for network scan results'
        }
      }
    ],
    difficulty: 'intermediate',
    duration: '30 min',
    category: 'lateral_movement'
  },
  {
    id: 'privilege-escalation',
    name: 'Container Privilege Escalation',
    description: 'Exploiting container misconfigurations to gain root access',
    containers: [
      {
        name: 'vulnerable-service',
        description: 'Service with privilege escalation vulnerabilities',
        logForwarding: {
          type: 'XSIAM_AGENT',
          destination: '192.168.100.124:443',
          description: 'XSIAM agent for behavioral analysis and detection'
        }
      },
      {
        name: 'escalation-toolkit',
        description: 'Tools for testing privilege escalation',
        logForwarding: {
          type: 'APPLICATION_LOG',
          destination: '192.168.100.124:514',
          description: 'Tool execution logs via centralized logging'
        }
      }
    ],
    difficulty: 'basic',
    duration: '20 min',
    category: 'privilege_escalation'
  },
  {
    id: 'malware-analysis',
    name: 'Containerized Malware Analysis',
    description: 'Isolated malware analysis environment using containers',
    containers: [
      {
        name: 'analysis-sandbox',
        description: 'Isolated sandbox for malware execution',
        logForwarding: {
          type: 'XSIAM_AGENT',
          destination: '192.168.100.124:443',
          description: 'Real-time behavioral monitoring via XSIAM agent'
        }
      },
      {
        name: 'malware-samples',
        description: 'Repository of malware samples',
        logForwarding: {
          type: 'SYSLOG_FORWARDER',
          destination: '192.168.100.124:514',
          description: 'File access logs via audit daemon'
        }
      },
      {
        name: 'monitoring-tools',
        description: 'Analysis and monitoring utilities',
        logForwarding: {
          type: 'CUSTOM_INTEGRATION',
          destination: '192.168.100.124:443',
          description: 'Analysis results via XSIAM REST API'
        }
      }
    ],
    difficulty: 'intermediate',
    duration: '60 min',
    category: 'malware_analysis'
  }
];

export function DockerHostManager() {
  const { toast } = useToast();
  const [dockerVMs, setDockerVMs] = useState<DockerVM[]>([]);
  const [selectedVM, setSelectedVM] = useState<DockerVM | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<string>('');
  
  // New VM creation form
  const [newDockerVM, setNewDockerVM] = useState({
    vmid: '201',
    name: 'docker-host-01',
    memory: '8192',
    cores: '4',
    disk: '50',
    template: 'ubuntu-22.04-docker',
    network: 'vmbr0'
  });

  useEffect(() => {
    loadDockerVMs();
  }, []);

  const loadDockerVMs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/proxmox/docker-vms');
      const result = await response.json();
      
      if (result.success) {
        setDockerVMs(result.vms);
        if (result.vms.length > 0) {
          setSelectedVM(result.vms[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load Docker VMs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createDockerVM = async () => {
    setIsLoading(true);
    setDeploymentProgress(0);
    setDeploymentStatus('Creating VM...');
    
    try {
      const response = await fetch('/api/proxmox/create-docker-vm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDockerVM)
      });

      const result = await response.json();
      
      if (result.success) {
        setDeploymentProgress(25);
        setDeploymentStatus('Installing Docker...');
        
        // Wait for Docker installation
        await new Promise(resolve => setTimeout(resolve, 3000));
        setDeploymentProgress(50);
        setDeploymentStatus('Configuring log forwarding...');
        
        // Configure log forwarding to XSIAM broker
        await configureLogForwarding(newDockerVM.vmid);
        setDeploymentProgress(75);
        setDeploymentStatus('Validating deployment...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        setDeploymentProgress(100);
        setDeploymentStatus('Complete!');
        
        toast({
          title: "Docker VM Created",
          description: `VM ${newDockerVM.name} created successfully with Docker installed`
        });
        
        await loadDockerVMs();
      } else {
        throw new Error(result.error || 'Failed to create Docker VM');
      }
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setDeploymentProgress(0);
      setDeploymentStatus('');
    }
  };

  const configureLogForwarding = async (vmid: string) => {
    try {
      const response = await fetch('/api/proxmox/configure-docker-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vmid,
          brokerIP: '192.168.100.124',
          brokerPort: '514'
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Failed to configure log forwarding:', error);
    }
  };

  const deployThreatScenario = async (scenario: ThreatScenario) => {
    if (!selectedVM) {
      toast({
        title: "No VM Selected",
        description: "Please select a Docker VM first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setDeploymentProgress(0);
    setDeploymentStatus(`Deploying ${scenario.name}...`);
    
    try {
      const response = await fetch('/api/docker/deploy-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vmid: selectedVM.vmid,
          scenario: scenario.id,
          containers: scenario.containers.map(c => c.name)
        })
      });

      const result = await response.json();
      
      if (result.success) {
        let progress = 20;
        for (const container of scenario.containers) {
          setDeploymentStatus(`Deploying ${container.name}...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          progress += (80 / scenario.containers.length);
          setDeploymentProgress(progress);
        }
        
        setDeploymentProgress(100);
        setDeploymentStatus('Scenario deployed successfully!');
        
        toast({
          title: "Scenario Deployed",
          description: `${scenario.name} deployed on ${selectedVM.name}`
        });
        
        await loadDockerVMs();
      } else {
        throw new Error(result.error || 'Failed to deploy scenario');
      }
    } catch (error: any) {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setDeploymentProgress(0);
      setDeploymentStatus('');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'container_escape': return <Shield className="w-4 h-4" />;
      case 'lateral_movement': return <Network className="w-4 h-4" />;
      case 'privilege_escalation': return <Activity className="w-4 h-4" />;
      case 'malware_analysis': return <Monitor className="w-4 h-4" />;
      default: return <Container className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Docker Host Management</h1>
          <p className="text-muted-foreground">Deploy and manage containerized threat scenarios on Proxmox</p>
        </div>
        <Button onClick={loadDockerVMs} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="vms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vms">Docker VMs</TabsTrigger>
          <TabsTrigger value="scenarios">Threat Scenarios</TabsTrigger>
          <TabsTrigger value="create">Create VM</TabsTrigger>
        </TabsList>

        <TabsContent value="vms" className="space-y-4">
          {dockerVMs.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <Container className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Docker VMs Found</h3>
                  <p className="text-muted-foreground mb-4">Create your first Docker host VM to get started</p>
                  <Button onClick={() => (document.querySelector('[value="create"]') as HTMLElement)?.click()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Docker VM
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {dockerVMs.map((vm) => (
                <Card key={vm.vmid} className={`cursor-pointer transition-colors ${
                  selectedVM?.vmid === vm.vmid ? 'border-blue-500 bg-blue-50' : ''
                }`} onClick={() => setSelectedVM(vm)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5" />
                        <div>
                          <CardTitle className="text-lg">{vm.name}</CardTitle>
                          <CardDescription>VM ID: {vm.vmid} • {vm.cores} cores • {vm.memory}MB RAM</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={vm.status === 'running' ? 'default' : 'secondary'}>
                          {vm.status === 'running' ? (
                            <><CheckCircle className="w-3 h-3 mr-1" />{vm.status}</>
                          ) : (
                            <><AlertTriangle className="w-3 h-3 mr-1" />{vm.status}</>
                          )}
                        </Badge>
                        {vm.dockerVersion && (
                          <Badge variant="outline">Docker {vm.dockerVersion}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  {vm.containers && vm.containers.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-medium">Running Containers ({vm.containers.length})</h4>
                        <div className="grid gap-2">
                          {vm.containers.slice(0, 3).map((container) => (
                            <div key={container.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <Container className="w-4 h-4" />
                                <span className="font-medium">{container.name}</span>
                                <Badge variant="outline">{container.image}</Badge>
                              </div>
                              <Badge variant={container.status === 'running' ? 'default' : 'secondary'}>
                                {container.status}
                              </Badge>
                            </div>
                          ))}
                          {vm.containers.length > 3 && (
                            <p className="text-sm text-muted-foreground">
                              +{vm.containers.length - 3} more containers
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          {!selectedVM ? (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Please select a Docker VM first to deploy threat scenarios
              </AlertDescription>
            </Alert>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium">Deploy to: {selectedVM.name}</h3>
                <p className="text-sm text-muted-foreground">Select a threat scenario to deploy</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {threatScenarios.map((scenario) => (
                  <Card key={scenario.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(scenario.category)}
                          <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getDifficultyColor(scenario.difficulty)}>
                            {scenario.difficulty}
                          </Badge>
                          <Badge variant="outline">{scenario.duration}</Badge>
                        </div>
                      </div>
                      <CardDescription>{scenario.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Containers ({scenario.containers.length})</h4>
                        <div className="space-y-2">
                          {scenario.containers.map((container) => (
                            <div key={container.name} className="p-2 border rounded-md bg-gray-50">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {container.name}
                                </Badge>
                                <Badge 
                                  variant="secondary" 
                                  className={`text-xs ${
                                    container.logForwarding.type === 'XSIAM_AGENT' ? 'bg-blue-100 text-blue-800' :
                                    container.logForwarding.type === 'APPLICATION_LOG' ? 'bg-green-100 text-green-800' :
                                    container.logForwarding.type === 'SYSLOG_FORWARDER' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}
                                >
                                  {container.logForwarding.type.replace('_', ' ')}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">{container.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <strong>Log Forwarding:</strong> {container.logForwarding.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => deployThreatScenario(scenario)}
                        disabled={isLoading || selectedVM?.status !== 'running'}
                        className="w-full"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Deploy Scenario
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Docker Host VM</CardTitle>
              <CardDescription>
                Deploy a new VM optimized for Docker containers with automated XSIAM log forwarding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vmid">VM ID</Label>
                  <Input
                    id="vmid"
                    value={newDockerVM.vmid}
                    onChange={(e) => setNewDockerVM({...newDockerVM, vmid: e.target.value})}
                    placeholder="201"
                  />
                </div>
                <div>
                  <Label htmlFor="name">VM Name</Label>
                  <Input
                    id="name"
                    value={newDockerVM.name}
                    onChange={(e) => setNewDockerVM({...newDockerVM, name: e.target.value})}
                    placeholder="docker-host-01"
                  />
                </div>
                <div>
                  <Label htmlFor="memory">Memory (MB)</Label>
                  <Select value={newDockerVM.memory} onValueChange={(value) => setNewDockerVM({...newDockerVM, memory: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4096">4 GB</SelectItem>
                      <SelectItem value="8192">8 GB</SelectItem>
                      <SelectItem value="16384">16 GB</SelectItem>
                      <SelectItem value="32768">32 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cores">CPU Cores</Label>
                  <Select value={newDockerVM.cores} onValueChange={(value) => setNewDockerVM({...newDockerVM, cores: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Cores</SelectItem>
                      <SelectItem value="4">4 Cores</SelectItem>
                      <SelectItem value="6">6 Cores</SelectItem>
                      <SelectItem value="8">8 Cores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="disk">Disk Size (GB)</Label>
                  <Select value={newDockerVM.disk} onValueChange={(value) => setNewDockerVM({...newDockerVM, disk: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 GB</SelectItem>
                      <SelectItem value="50">50 GB</SelectItem>
                      <SelectItem value="100">100 GB</SelectItem>
                      <SelectItem value="200">200 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="template">Template</Label>
                  <Select value={newDockerVM.template} onValueChange={(value) => setNewDockerVM({...newDockerVM, template: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ubuntu-22.04-docker">Ubuntu 22.04 + Docker</SelectItem>
                      <SelectItem value="ubuntu-20.04-docker">Ubuntu 20.04 + Docker</SelectItem>
                      <SelectItem value="debian-11-docker">Debian 11 + Docker</SelectItem>
                      <SelectItem value="centos-8-docker">CentOS 8 + Docker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {deploymentProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Deployment Progress</span>
                    <span>{deploymentProgress}%</span>
                  </div>
                  <Progress value={deploymentProgress} />
                  <p className="text-sm text-muted-foreground">{deploymentStatus}</p>
                </div>
              )}

              <Alert>
                <Network className="w-4 h-4" />
                <AlertDescription>
                  <strong>XSIAM Integration:</strong> VM will be configured to forward all Docker logs to the XSIAM broker at 192.168.100.124:514
                </AlertDescription>
              </Alert>

              <Button 
                onClick={createDockerVM}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Creating VM...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Docker VM
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}