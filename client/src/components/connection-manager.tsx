import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Server, Cloud, Container, Settings, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Connection {
  id: string;
  type: string;
  host?: string;
  port?: number;
  status: string;
  connectedAt?: string;
  version?: string;
  containers?: number;
  images?: number;
  username?: string;
  resourceGroups?: number;
  subscriptionId?: string;
}

export function ConnectionManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states
  const [dockerForm, setDockerForm] = useState({
    host: '',
    port: '2376',
    protocol: 'http'
  });

  const [proxmoxForm, setProxmoxForm] = useState({
    host: '',
    port: '8006',
    username: '',
    password: '',
    realm: 'pam'
  });

  const [azureForm, setAzureForm] = useState({
    subscriptionId: '',
    tenantId: '',
    clientId: '',
    clientSecret: '',
    resourceGroup: ''
  });

  // Get connection status
  const { data: connections, isLoading } = useQuery({
    queryKey: ['/api/connections/status'],
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Connection test mutations
  const dockerTestMutation = useMutation({
    mutationFn: async (data: typeof dockerForm) => {
      const response = await fetch('/api/connections/docker/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Docker connection failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Docker Connected",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Docker Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const proxmoxTestMutation = useMutation({
    mutationFn: async (data: typeof proxmoxForm) => {
      const response = await fetch('/api/connections/proxmox/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Proxmox connection failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Proxmox Connected",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Proxmox Connection Failed", 
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const azureTestMutation = useMutation({
    mutationFn: async (data: typeof azureForm) => {
      const response = await fetch('/api/connections/azure/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Azure connection failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Azure Connected",
        description: data.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/connections/status'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Azure Connection Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Infrastructure deployment mutation
  const deployMutation = useMutation({
    mutationFn: async ({ platform, threatType }: { platform: string; threatType: string }) => {
      const response = await fetch('/api/connections/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, threatType })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Infrastructure deployment failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Infrastructure Deployed",
        description: data.message
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Deployment Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const getConnectionStatus = (type: string): Connection | undefined => {
    return connections?.connections?.find((conn: Connection) => conn.type === type);
  };

  const StatusBadge = ({ connection }: { connection?: Connection }) => {
    if (!connection) {
      return <Badge variant="secondary">Not Connected</Badge>;
    }
    
    if (connection.status === 'connected') {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connected</Badge>;
    }
    
    return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Error</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Infrastructure Connection Management</h1>
      </div>
      
      <div className="text-sm text-gray-600">
        Establish connections to your actual infrastructure environments for lab deployment and XSIAM integration.
      </div>

      {/* Connection Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Container className="w-4 h-4 mr-2" />
            <CardTitle className="text-sm font-medium">Docker Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge connection={getConnectionStatus('docker')} />
            {getConnectionStatus('docker') && (
              <div className="mt-2 text-xs text-gray-500">
                Version: {getConnectionStatus('docker')?.version}<br/>
                Containers: {getConnectionStatus('docker')?.containers}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Server className="w-4 h-4 mr-2" />
            <CardTitle className="text-sm font-medium">Proxmox Server</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge connection={getConnectionStatus('proxmox')} />
            {getConnectionStatus('proxmox') && (
              <div className="mt-2 text-xs text-gray-500">
                Host: {getConnectionStatus('proxmox')?.host}<br/>
                User: {getConnectionStatus('proxmox')?.username}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <Cloud className="w-4 h-4 mr-2" />
            <CardTitle className="text-sm font-medium">Azure Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge connection={getConnectionStatus('azure')} />
            {getConnectionStatus('azure') && (
              <div className="mt-2 text-xs text-gray-500">
                Subscription: {getConnectionStatus('azure')?.subscriptionId?.substring(0, 8)}...<br/>
                Resource Groups: {getConnectionStatus('azure')?.resourceGroups}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Connection Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configure Infrastructure Connections</CardTitle>
          <CardDescription>
            Set up connections to your actual infrastructure for real lab environments and XSIAM log integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="docker" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="docker">Docker</TabsTrigger>
              <TabsTrigger value="proxmox">Proxmox VE</TabsTrigger>
              <TabsTrigger value="azure">Azure</TabsTrigger>
            </TabsList>

            <TabsContent value="docker" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="docker-host">Docker Host (optional)</Label>
                  <Input
                    id="docker-host"
                    placeholder="Leave empty for local Docker"
                    value={dockerForm.host}
                    onChange={(e) => setDockerForm(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="docker-port">Port</Label>
                  <Input
                    id="docker-port"
                    placeholder="2376"
                    value={dockerForm.port}
                    onChange={(e) => setDockerForm(prev => ({ ...prev, port: e.target.value }))}
                  />
                </div>
              </div>
              <Button 
                onClick={() => dockerTestMutation.mutate(dockerForm)}
                disabled={dockerTestMutation.isPending}
                className="w-full"
              >
                {dockerTestMutation.isPending ? 'Testing Connection...' : 'Test Docker Connection'}
              </Button>
            </TabsContent>

            <TabsContent value="proxmox" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="proxmox-host">Proxmox Host/IP</Label>
                  <Input
                    id="proxmox-host"
                    placeholder="192.168.1.100"
                    value={proxmoxForm.host}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, host: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="proxmox-port">Port</Label>
                  <Input
                    id="proxmox-port"
                    placeholder="8006"
                    value={proxmoxForm.port}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, port: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="proxmox-username">Username</Label>
                  <Input
                    id="proxmox-username"
                    placeholder="root"
                    value={proxmoxForm.username}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="proxmox-password">Password</Label>
                  <Input
                    id="proxmox-password"
                    type="password"
                    placeholder="Proxmox password"
                    value={proxmoxForm.password}
                    onChange={(e) => setProxmoxForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>
              </div>
              <Button 
                onClick={() => proxmoxTestMutation.mutate(proxmoxForm)}
                disabled={proxmoxTestMutation.isPending || !proxmoxForm.host || !proxmoxForm.username || !proxmoxForm.password}
                className="w-full"
              >
                {proxmoxTestMutation.isPending ? 'Testing Connection...' : 'Test Proxmox Connection'}
              </Button>
            </TabsContent>

            <TabsContent value="azure" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="azure-subscription">Subscription ID</Label>
                  <Input
                    id="azure-subscription"
                    placeholder="12345678-1234-1234-1234-123456789012"
                    value={azureForm.subscriptionId}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, subscriptionId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="azure-tenant">Tenant ID</Label>
                  <Input
                    id="azure-tenant"
                    placeholder="87654321-4321-4321-4321-210987654321"
                    value={azureForm.tenantId}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, tenantId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="azure-client">Client ID</Label>
                  <Input
                    id="azure-client"
                    placeholder="Application (client) ID"
                    value={azureForm.clientId}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, clientId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="azure-secret">Client Secret</Label>
                  <Input
                    id="azure-secret"
                    type="password"
                    placeholder="Client secret value"
                    value={azureForm.clientSecret}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="azure-resource-group">Resource Group (optional)</Label>
                  <Input
                    id="azure-resource-group"
                    placeholder="Leave empty for default"
                    value={azureForm.resourceGroup}
                    onChange={(e) => setAzureForm(prev => ({ ...prev, resourceGroup: e.target.value }))}
                  />
                </div>
              </div>
              <Button 
                onClick={() => azureTestMutation.mutate(azureForm)}
                disabled={azureTestMutation.isPending || !azureForm.subscriptionId || !azureForm.tenantId || !azureForm.clientId || !azureForm.clientSecret}
                className="w-full"
              >
                {azureTestMutation.isPending ? 'Testing Connection...' : 'Test Azure Connection'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Deploy Actions */}
      {connections?.connections && connections.connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Deploy Lab Infrastructure</CardTitle>
            <CardDescription>
              Deploy lab environments to connected infrastructure with automatic XSIAM integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {['endpoint', 'network', 'cloud'].map((threatType) => (
                <div key={threatType} className="space-y-2">
                  <h4 className="font-medium capitalize">{threatType} Lab</h4>
                  {connections.connections.map((conn: Connection) => (
                    <Button
                      key={`${conn.type}-${threatType}`}
                      variant="outline"
                      size="sm"
                      onClick={() => deployMutation.mutate({ platform: conn.type, threatType })}
                      disabled={deployMutation.isPending}
                      className="w-full"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Deploy to {conn.type}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}