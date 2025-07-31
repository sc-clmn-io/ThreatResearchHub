import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Play, 
  Settings, 
  CheckCircle, 
  AlertTriangle,
  Network,
  Database,
  Shield,
  Terminal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProxmoxBrokerManager() {
  const [proxmoxHost, setProxmoxHost] = useState('100.64.0.1');
  const [sshUser, setSshUser] = useState('root');
  const [isDeploying, setIsDeploying] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState<any>(null);
  const [deploymentResult, setDeploymentResult] = useState<any>(null);
  const [connectivityStatus, setConnectivityStatus] = useState<any>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const { toast } = useToast();

  const deployBroker = async () => {
    setIsDeploying(true);
    try {
      const response = await fetch('/api/proxmox/deploy-broker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxmoxHost,
          sshUser
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setDeploymentResult(result);
        toast({
          title: "Broker Deployed",
          description: "XSIAM broker successfully installed on Proxmox host"
        });
      } else {
        toast({
          title: "Deployment Failed",
          description: result.message || "Failed to deploy XSIAM broker",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Deployment Error",
        description: "Failed to communicate with Proxmox host",
        variant: "destructive"
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const checkBrokerStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`/api/proxmox/broker-status?proxmoxHost=${proxmoxHost}&sshUser=${sshUser}`);
      const result = await response.json();
      
      if (result.success) {
        setBrokerStatus(result);
        toast({
          title: "Status Retrieved",
          description: "Proxmox broker status updated"
        });
      } else {
        toast({
          title: "Status Check Failed",
          description: result.message || "Unable to check broker status",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to connect to Proxmox host",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const testConnectivity = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/proxmox/test-connectivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxmoxHost,
          sshUser
        })
      });

      const result = await response.json();
      setConnectivityStatus(result);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: "Replit can reach your Proxmox server"
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message || "Unable to connect to Proxmox server",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to test connection to Proxmox host",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const configureVMForwarding = async (vmId: string) => {
    try {
      const response = await fetch('/api/proxmox/configure-vm-forwarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxmoxHost,
          vmId,
          sshUser
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "VM Configured",
          description: `Log forwarding configured for VM ${vmId}`
        });
      } else {
        toast({
          title: "Configuration Failed",
          description: result.message || "Failed to configure VM log forwarding",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Configuration Error",
        description: "Failed to configure VM log forwarding",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Proxmox XSIAM Broker Management</h2>
        <p className="text-muted-foreground">
          Deploy and manage XSIAM broker on your Proxmox server for local VM log collection
        </p>
      </div>

      <Tabs defaultValue="deploy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="connectivity">Connection Test</TabsTrigger>
          <TabsTrigger value="vm-issues">VM Boot Issues</TabsTrigger>
          <TabsTrigger value="deploy">Deploy Broker</TabsTrigger>
          <TabsTrigger value="status">Broker Status</TabsTrigger>
          <TabsTrigger value="vm-config">VM Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="connectivity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Replit → Proxmox Connectivity Test
              </CardTitle>
              <CardDescription>
                Test network connectivity from Replit to your local Proxmox server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="connectivity-host">Proxmox Host</Label>
                  <Input
                    id="connectivity-host"
                    value={proxmoxHost}
                    onChange={(e) => setProxmoxHost(e.target.value)}
                    placeholder="Get from: tailscale ip -4"
                  />
                  <div className="text-xs text-muted-foreground">
                    Run "tailscale up" on Proxmox, complete browser login, then use "tailscale ip -4"
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="connectivity-user">SSH User</Label>
                  <Input
                    id="connectivity-user"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    placeholder="root"
                  />
                </div>
              </div>

              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>XSIAM Broker VM XXX: Running Successfully</strong>
                  <br />
                  Status: Operational | Memory: 4096MB | Ready for tenant configuration
                  <br />
                  <strong>Next:</strong> Configure broker with XSIAM tenant details for log forwarding
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Button 
                  onClick={testConnectivity} 
                  disabled={isTestingConnection}
                  className="w-full"
                >
                  {isTestingConnection ? 'Testing Connection...' : 'Test Tailscale IP (100.64.0.1)'}
                </Button>
                
                <Button 
                  onClick={() => {
                    setProxmoxHost('192.168.100.188');
                    setTimeout(testConnectivity, 100);
                  }} 
                  disabled={isTestingConnection}
                  variant="outline"
                  className="w-full"
                >
                  <Network className="w-4 h-4 mr-2" />
                  Test Local IP (192.168.100.188)
                </Button>
              </div>

              {connectivityStatus && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {connectivityStatus.success ? (
                      <Badge variant="default" className="bg-green-500">Connected</Badge>
                    ) : (
                      <Badge variant="destructive">Connection Failed</Badge>
                    )}
                    <Badge variant="outline">{connectivityStatus.proxmoxHost}</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <strong>Test Results:</strong>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                      {connectivityStatus.testResults || connectivityStatus.message}
                    </pre>
                  </div>

                  {connectivityStatus.troubleshooting && (
                    <div className="space-y-2">
                      <strong>Connection Setup Options:</strong>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {connectivityStatus.troubleshooting.map((item: string, index: number) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!connectivityStatus.success && (
                    <Alert>
                      <Terminal className="w-4 h-4" />
                      <AlertDescription>
                        <strong>Configure XSIAM Broker (VM XXX Running):</strong>
                        <br />
                        1. Access broker console: <code>qm monitor 200</code> or VNC console
                        <br />
                        2. Configure tenant URL: Edit broker config with your XSIAM tenant details
                        <br />
                        3. Set API credentials: Add XSIAM API key for log forwarding
                        <br />
                        4. Start log collection: Enable VM and host log forwarding to XSIAM
                        <br />
                        5. Verify connection: Test broker connectivity to XSIAM cloud
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vm-issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Proxmox VM Boot Loop Troubleshooting
              </CardTitle>
              <CardDescription>
                Diagnose and fix VM boot issues before setting up XSIAM broker
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Settings className="w-4 h-4" />
                <AlertDescription>
                  <strong>Common Boot Loop Causes:</strong>
                  <br />
                  • Corrupted ISO files or incomplete downloads
                  <br />
                  • Insufficient RAM (need 2GB+ for modern OS)
                  <br />
                  • Wrong BIOS mode (UEFI vs SeaBIOS)
                  <br />
                  • Storage pool full or corrupted
                  <br />
                  • Machine type incompatibility
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <strong>First: Fix Repository Issues:</strong>
                <div className="grid grid-cols-1 gap-2 text-sm font-mono bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200">
                  <div># Disable enterprise repos (you need subscription)</div>
                  <div>mv /etc/apt/sources.list.d/pve-enterprise.list /etc/apt/sources.list.d/pve-enterprise.list.bak</div>
                  <div>mv /etc/apt/sources.list.d/ceph.list /etc/apt/sources.list.d/ceph.list.bak</div>
                  <div className="mt-2"># Add community repo</div>
                  <div>echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" {'>'} /etc/apt/sources.list.d/pve-no-subscription.list</div>
                  <div>apt update</div>
                </div>
                
                <strong>Then: VM Diagnostic Commands:</strong>
                <div className="grid grid-cols-1 gap-2 text-sm font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                  <div># Check storage space</div>
                  <div>pvesm status</div>
                  <div className="mt-2"># Check VM logs (replace 100 with your VM ID)</div>
                  <div>tail -f /var/log/pve/qemu-server/100.log</div>
                  <div className="mt-2"># View VM configuration</div>
                  <div>cat /etc/pve/qemu-server/100.conf</div>
                </div>
              </div>

              <div className="space-y-3">
                <strong>Recommended VM Settings:</strong>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 border rounded">
                    <strong>Windows VMs:</strong>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Machine: q35</li>
                      <li>• BIOS: UEFI</li>
                      <li>• RAM: 4GB minimum</li>
                      <li>• CPU: host type</li>
                      <li>• Disk: VirtIO SCSI</li>
                    </ul>
                  </div>
                  <div className="p-3 border rounded">
                    <strong>Linux VMs:</strong>
                    <ul className="text-sm mt-2 space-y-1">
                      <li>• Machine: q35</li>
                      <li>• BIOS: SeaBIOS</li>
                      <li>• RAM: 2GB minimum</li>
                      <li>• CPU: host type</li>
                      <li>• Disk: VirtIO SCSI</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <strong>Step-by-Step Fix:</strong>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Delete problematic VM and start fresh</li>
                  <li>Download fresh ISO from official source</li>
                  <li>Create VM with recommended settings above</li>
                  <li>Start with minimal resources, expand later</li>
                  <li>Monitor logs during first boot</li>
                  <li>Once stable, install XSIAM log forwarding</li>
                </ol>
              </div>

              <Alert>
                <Terminal className="w-4 h-4" />
                <AlertDescription>
                  <strong>Once VMs are stable:</strong> Return to "Deploy Broker" tab to install 
                  XSIAM broker for log collection. VMs need to boot successfully before they 
                  can forward logs to the broker.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5" />
                XSIAM Broker Deployment
              </CardTitle>
              <CardDescription>
                Install XSIAM broker on your Proxmox host to collect logs from local VMs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proxmox-host">Proxmox Host</Label>
                  <Input
                    id="proxmox-host"
                    value={proxmoxHost}
                    onChange={(e) => setProxmoxHost(e.target.value)}
                    placeholder="192.168.100.188"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ssh-user">SSH User</Label>
                  <Input
                    id="ssh-user"
                    value={sshUser}
                    onChange={(e) => setSshUser(e.target.value)}
                    placeholder="root"
                  />
                </div>
              </div>

              <Alert>
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  <strong>Broker Architecture:</strong> Local XSIAM broker will be installed on your Proxmox host 
                  to collect logs from all VMs and forward them to XSIAM cloud instance.
                  <br />
                  <strong>Ports:</strong> Broker (9999), Syslog (514)
                </AlertDescription>
              </Alert>

              <Button 
                onClick={deployBroker} 
                disabled={isDeploying}
                className="w-full"
              >
                {isDeploying ? 'Deploying Broker...' : 'Deploy XSIAM Broker'}
              </Button>
            </CardContent>
          </Card>

          {deploymentResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Deployment Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Proxmox Host:</strong> {deploymentResult.proxmoxHost}
                </div>
                <div>
                  <strong>Broker Port:</strong> {deploymentResult.installation?.brokerPort}
                </div>
                <div>
                  <strong>Syslog Port:</strong> {deploymentResult.installation?.syslogPort}
                </div>
                
                <div className="space-y-2">
                  <strong>Configuration Steps:</strong>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {deploymentResult.nextSteps?.map((step: string, index: number) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <strong>Management Commands:</strong>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <div>Start: {deploymentResult.configuration?.serviceCommand}</div>
                    <div>Status: {deploymentResult.configuration?.statusCommand}</div>
                    <div>Config: {deploymentResult.configuration?.configFile}</div>
                    <div>Logs: {deploymentResult.configuration?.logsCommand}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="w-5 h-5" />
                Broker Status Check
              </CardTitle>
              <CardDescription>
                Monitor XSIAM broker status and configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={checkBrokerStatus} 
                disabled={isChecking}
                variant="outline"
              >
                {isChecking ? 'Checking Status...' : 'Check Broker Status'}
              </Button>

              {brokerStatus && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{brokerStatus.proxmoxHost}</Badge>
                    <Badge variant="outline">Port: 9999</Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <strong>Broker Status:</strong>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                      {brokerStatus.status}
                    </pre>
                  </div>

                  <div className="space-y-2">
                    <strong>Management Commands:</strong>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {Object.entries(brokerStatus.managementCommands || {}).map(([action, command]) => (
                        <div key={action} className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <strong>{action}:</strong> {command as string}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <strong>Endpoints:</strong>
                    <div className="flex gap-4 text-sm">
                      <Badge variant="secondary">Broker: {brokerStatus.brokerEndpoint}</Badge>
                      <Badge variant="secondary">Syslog: {brokerStatus.syslogEndpoint}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vm-config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                VM Log Forwarding
              </CardTitle>
              <CardDescription>
                Configure Proxmox VMs to forward logs to the local XSIAM broker
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vm-id">VM ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="vm-id"
                    placeholder="100"
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => {
                      const vmId = (document.getElementById('vm-id') as HTMLInputElement)?.value;
                      if (vmId) configureVMForwarding(vmId);
                    }}
                    variant="outline"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>

              <Alert>
                <Terminal className="w-4 h-4" />
                <AlertDescription>
                  <strong>Manual Configuration:</strong> For each Proxmox VM, add the following to 
                  <code className="mx-1 px-1 bg-gray-200 dark:bg-gray-700 rounded">/etc/rsyslog.d/99-xsiam-forward.conf</code>:
                  <br />
                  <code className="block mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    *.* @@192.168.100.188:514
                  </code>
                  Then restart rsyslog: <code>systemctl restart rsyslog</code>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <strong>VM Configuration Checklist:</strong>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Install rsyslog on VM (usually pre-installed)</li>
                  <li>Add log forwarding configuration</li>
                  <li>Restart rsyslog service</li>
                  <li>Verify logs reaching broker (check broker logs)</li>
                  <li>Test XSIAM data ingestion</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}