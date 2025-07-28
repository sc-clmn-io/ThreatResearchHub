import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Server, Cloud, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface Connection {
  id: string;
  type: string;
  host?: string;
  port?: number;
  username?: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  lastConnected?: string;
  error?: string;
  message?: string;
}

interface ConnectionStatus {
  success: boolean;
  connections: Connection[];
  totalConnections: number;
}

export function InfrastructureConnectionStatus() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    success: true,
    connections: [],
    totalConnections: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const { toast } = useToast();

  // Connection form states
  const [proxmoxForm, setProxmoxForm] = useState({
    host: '',
    username: '',
    password: '',
    realm: 'pam',
    port: 8006
  });

  const [azureForm, setAzureForm] = useState({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    resourceGroup: ''
  });

  // Fetch connection status
  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch('/api/connections/status');
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error('Failed to fetch connection status:', error);
      toast({
        title: "Connection Error",
        description: "Failed to fetch connection status",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Test Proxmox connection
  const testProxmoxConnection = async () => {
    setTestingConnection('proxmox');
    try {
      const response = await fetch('/api/connections/proxmox/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proxmoxForm)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Proxmox Connection Successful",
          description: result.message || "Connected to Proxmox server",
        });
        fetchConnectionStatus();
      } else {
        toast({
          title: "Proxmox Connection Failed",
          description: result.error || "Failed to connect to Proxmox",
          variant: "destructive"
        });
        
        // Show troubleshooting information if available
        if (result.troubleshooting) {
          console.log('Troubleshooting steps:', result.troubleshooting);
        }
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to test Proxmox connection",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(null);
    }
  };

  // Test Azure connection
  const testAzureConnection = async () => {
    setTestingConnection('azure');
    try {
      const response = await fetch('/api/connections/azure/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(azureForm)
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Azure Connection Successful",
          description: result.message || "Connected to Azure",
        });
        fetchConnectionStatus();
      } else {
        toast({
          title: "Azure Connection Failed",
          description: result.error || "Failed to connect to Azure",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to test Azure connection",
        variant: "destructive"
      });
    } finally {
      setTestingConnection(null);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchConnectionStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'testing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-500">Connected</Badge>;
      case 'testing':
        return <Badge variant="secondary">Testing...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Infrastructure Connections
          </CardTitle>
          <CardDescription>Loading connection status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Infrastructure Connection Status
          </CardTitle>
          <CardDescription>
            Manage connections to your infrastructure platforms for threat detection lab deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connectionStatus.connections.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No infrastructure connections configured. Set up connections to Proxmox and Azure below.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {connectionStatus.connections.map((connection) => (
                <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(connection.status)}
                    <div>
                      <div className="font-medium capitalize">{connection.type}</div>
                      {connection.host && (
                        <div className="text-sm text-muted-foreground">
                          {connection.host}:{connection.port}
                        </div>
                      )}
                      {connection.lastConnected && (
                        <div className="text-xs text-muted-foreground">
                          Last connected: {new Date(connection.lastConnected).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(connection.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Infrastructure Connection Setup
          </CardTitle>
          <CardDescription>
            Configure connections to your infrastructure platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="proxmox" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="proxmox">Proxmox VE</TabsTrigger>
              <TabsTrigger value="azure">Azure</TabsTrigger>
            </TabsList>
            
            <TabsContent value="proxmox" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proxmox-host">Host/IP Address</Label>
                  <Input
                    id="proxmox-host"
                    placeholder="192.168.1.100"
                    value={proxmoxForm.host}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxmox-port">Port</Label>
                  <Input
                    id="proxmox-port"
                    type="number"
                    placeholder="8006"
                    value={proxmoxForm.port}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, port: parseInt(e.target.value) || 8006 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxmox-username">Username</Label>
                  <Input
                    id="proxmox-username"
                    placeholder="root"
                    value={proxmoxForm.username}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proxmox-realm">Realm</Label>
                  <Input
                    id="proxmox-realm"
                    placeholder="pam"
                    value={proxmoxForm.realm}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, realm: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="proxmox-password">Password</Label>
                  <Input
                    id="proxmox-password"
                    type="password"
                    placeholder="Enter password"
                    value={proxmoxForm.password}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
              <Button 
                onClick={testProxmoxConnection}
                disabled={testingConnection === 'proxmox' || !proxmoxForm.host || !proxmoxForm.username || !proxmoxForm.password}
                className="w-full"
              >
                {testingConnection === 'proxmox' ? 'Testing Connection...' : 'Test Proxmox Connection'}
              </Button>
            </TabsContent>
            
            <TabsContent value="azure" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="azure-subscription">Subscription ID</Label>
                  <Input
                    id="azure-subscription"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={azureForm.subscriptionId}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, subscriptionId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azure-tenant">Tenant ID</Label>
                  <Input
                    id="azure-tenant"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={azureForm.tenantId}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, tenantId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azure-client">Client ID</Label>
                  <Input
                    id="azure-client"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={azureForm.clientId}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, clientId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="azure-secret">Client Secret</Label>
                  <Input
                    id="azure-secret"
                    type="password"
                    placeholder="Enter client secret"
                    value={azureForm.clientSecret}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="azure-resource-group">Resource Group (Optional)</Label>
                  <Input
                    id="azure-resource-group"
                    placeholder="my-resource-group"
                    value={azureForm.resourceGroup}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, resourceGroup: e.target.value }))}
                  />
                </div>
              </div>
              <Button 
                onClick={testAzureConnection}
                disabled={testingConnection === 'azure' || !azureForm.subscriptionId || !azureForm.tenantId || !azureForm.clientId || !azureForm.clientSecret}
                className="w-full"
              >
                {testingConnection === 'azure' ? 'Testing Connection...' : 'Test Azure Connection'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}