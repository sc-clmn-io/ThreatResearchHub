import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, ArrowLeft, CheckCircle, Download, ExternalLink, Package, PlayCircle, Settings, Upload } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from '@/hooks/use-toast';

interface DeploymentConnection {
  id: string;
  name: string;
  fqdn: string;
  apiKeyId: string;
  apiKey: string;
  keyType: 'standard' | 'advanced';
  version: 'v2.x' | 'v3.x' | 'cortex-cloud';
  status: 'connected' | 'disconnected' | 'testing';
  lastTested: string;
}

interface ContentPack {
  id: string;
  name: string;
  version: string;
  description: string;
  category: 'integration' | 'playbook' | 'correlation' | 'dashboard' | 'layout';
  dependencies: string[];
  installStatus: 'pending' | 'installing' | 'installed' | 'failed';
  size: string;
  author: string;
}

export default function XSIAMDeployment() {
  const [connections, setConnections] = useState<DeploymentConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [contentPacks, setContentPacks] = useState<ContentPack[]>([]);
  const [deploymentLog, setDeploymentLog] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('connections');

  const sampleConnections: DeploymentConnection[] = [
    {
      id: 'conn1',
      name: 'Production XSIAM',
      fqdn: 'customer-prod.xsiam.paloaltonetworks.com',
      apiKeyId: 'prod_key_123',
      apiKey: '***hidden***',
      keyType: 'advanced',
      version: 'v3.x',
      status: 'connected',
      lastTested: '2025-07-22T22:30:00Z'
    },
    {
      id: 'conn2',
      name: 'Development XSIAM',
      fqdn: 'customer-dev.cortex.paloaltonetworks.com',
      apiKeyId: 'dev_key_456',
      apiKey: '***hidden***',
      keyType: 'standard',
      version: 'cortex-cloud',
      status: 'connected',
      lastTested: '2025-07-22T22:25:00Z'
    }
  ];

  const sampleContentPacks: ContentPack[] = [
    {
      id: 'pack1',
      name: 'Core REST API',
      version: '2.1.8',
      description: 'Essential API automation for XSIAM content deployment',
      category: 'integration',
      dependencies: [],
      installStatus: 'installed',
      size: '2.3 MB',
      author: 'Palo Alto Networks'
    },
    {
      id: 'pack2',
      name: 'Threat Intelligence Feeds',
      version: '1.4.2',
      description: 'Automated threat intelligence ingestion and correlation',
      category: 'integration',
      dependencies: ['Core REST API'],
      installStatus: 'pending',
      size: '5.7 MB',
      author: 'ThreatResearchHub'
    },
    {
      id: 'pack3',
      name: 'Findings Report Automation',
      version: '1.2.0',
      description: 'Automated findings report generation and distribution',
      category: 'playbook',
      dependencies: ['Core REST API'],
      installStatus: 'pending',
      size: '3.1 MB',
      author: 'ThreatResearchHub'
    }
  ];

  useEffect(() => {
    setConnections(sampleConnections);
    setContentPacks(sampleContentPacks);
    loadDeploymentHistory();
  }, []);

  const loadDeploymentHistory = () => {
    const history = [
      '2025-07-22 22:30:15 - Connected to Production XSIAM',
      '2025-07-22 22:30:16 - Testing connection health...',
      '2025-07-22 22:30:17 - Connection test successful',
      '2025-07-22 22:30:18 - Marketplace connectivity verified',
      '2025-07-22 22:30:19 - Ready for content pack deployment'
    ];
    setDeploymentLog(history);
  };

  const testConnection = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    // Update status to testing
    setConnections(prev => 
      prev.map(c => c.id === connectionId ? { ...c, status: 'testing' } : c)
    );

    // Add test log
    setDeploymentLog(prev => [...prev, 
      `${new Date().toLocaleString()} - Testing connection to ${connection.name}...`
    ]);

    // Simulate API test
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      setConnections(prev => 
        prev.map(c => c.id === connectionId ? { 
          ...c, 
          status: success ? 'connected' : 'disconnected',
          lastTested: new Date().toISOString()
        } : c)
      );

      setDeploymentLog(prev => [...prev, 
        `${new Date().toLocaleString()} - ${success ? 'Connection successful' : 'Connection failed'}`
      ]);

      toast({
        title: success ? "Connection Successful" : "Connection Failed",
        description: `Test ${success ? 'passed' : 'failed'} for ${connection.name}`,
        variant: success ? "default" : "destructive"
      });
    }, 2000);
  };

  const deployContentPack = async (packId: string) => {
    if (!selectedConnection) {
      toast({
        title: "No Connection Selected",
        description: "Please select an XSIAM connection first",
        variant: "destructive"
      });
      return;
    }

    const pack = contentPacks.find(p => p.id === packId);
    const connection = connections.find(c => c.id === selectedConnection);
    if (!pack || !connection) return;

    // Update pack status
    setContentPacks(prev => 
      prev.map(p => p.id === packId ? { ...p, installStatus: 'installing' } : p)
    );

    setDeploymentLog(prev => [...prev, 
      `${new Date().toLocaleString()} - Starting deployment of ${pack.name} to ${connection.name}`,
      `${new Date().toLocaleString()} - Using core-api-install-packs command...`,
      `${new Date().toLocaleString()} - Checking dependencies: ${pack.dependencies.join(', ') || 'None'}`,
      `${new Date().toLocaleString()} - Uploading content pack (${pack.size})...`
    ]);

    // Simulate deployment
    setTimeout(() => {
      const success = Math.random() > 0.15; // 85% success rate
      
      setContentPacks(prev => 
        prev.map(p => p.id === packId ? { 
          ...p, 
          installStatus: success ? 'installed' : 'failed' 
        } : p)
      );

      setDeploymentLog(prev => [...prev, 
        `${new Date().toLocaleString()} - ${success ? 'Deployment successful!' : 'Deployment failed - check API permissions'}`,
        success ? `${new Date().toLocaleString()} - Content pack ${pack.name} is now active` : ''
      ].filter(Boolean));

      toast({
        title: success ? "Deployment Successful" : "Deployment Failed",
        description: `${pack.name} ${success ? 'installed successfully' : 'failed to install'}`,
        variant: success ? "default" : "destructive"
      });
    }, 4000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'disconnected': return 'text-red-600';
      case 'testing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed': return <Badge className="bg-green-100 text-green-800">Installed</Badge>;
      case 'installing': return <Badge className="bg-yellow-100 text-yellow-800">Installing</Badge>;
      case 'failed': return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending': return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">XSIAM Content Deployment</h1>
          <p className="text-gray-600">Automated deployment using Core REST API and XSIAM 3.0 features</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="content">Content Packs</TabsTrigger>
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="logs">Deployment Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                XSIAM Connections
              </CardTitle>
              <CardDescription>
                Manage XSIAM instance connections for automated content deployment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connections.map((connection) => (
                  <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{connection.name}</h3>
                        <Badge variant="outline">{connection.version}</Badge>
                        <Badge variant="outline" className={getStatusColor(connection.status)}>
                          {connection.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{connection.fqdn}</p>
                      <p className="text-xs text-gray-500">
                        Last tested: {new Date(connection.lastTested).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => testConnection(connection.id)}
                        disabled={connection.status === 'testing'}
                        size="sm"
                      >
                        {connection.status === 'testing' ? 'Testing...' : 'Test'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedConnection(connection.id)}
                        size="sm"
                      >
                        {selectedConnection === connection.id ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Available Content Packs
              </CardTitle>
              <CardDescription>
                Content packs ready for deployment to XSIAM instances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentPacks.map((pack) => (
                  <div key={pack.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{pack.name}</h3>
                        <Badge variant="outline">v{pack.version}</Badge>
                        {getStatusBadge(pack.installStatus)}
                      </div>
                      <p className="text-sm text-gray-600">{pack.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Size: {pack.size}</span>
                        <span>Author: {pack.author}</span>
                        {pack.dependencies.length > 0 && (
                          <span>Dependencies: {pack.dependencies.join(', ')}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => deployContentPack(pack.id)}
                        disabled={pack.installStatus === 'installing' || pack.installStatus === 'installed'}
                        size="sm"
                      >
                        {pack.installStatus === 'installing' ? 'Installing...' : 
                         pack.installStatus === 'installed' ? 'Installed' : 'Deploy'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Deployment Control
              </CardTitle>
              <CardDescription>
                Deploy content packs to selected XSIAM instance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Selected Connection</h3>
                  {selectedConnection ? (
                    <p className="text-blue-800">
                      {connections.find(c => c.id === selectedConnection)?.name} - {connections.find(c => c.id === selectedConnection)?.fqdn}
                    </p>
                  ) : (
                    <p className="text-blue-600">No connection selected. Please select a connection from the Connections tab.</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold">Quick Deploy Options</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={() => deployContentPack('pack2')}
                      disabled={!selectedConnection}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Package className="w-6 h-6 mb-1" />
                      Deploy Threat Intelligence
                    </Button>
                    <Button 
                      onClick={() => deployContentPack('pack3')}
                      disabled={!selectedConnection}
                      className="h-20 flex flex-col items-center justify-center"
                    >
                      <Upload className="w-6 h-6 mb-1" />
                      Deploy Findings Automation
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Deployment Logs
              </CardTitle>
              <CardDescription>
                Real-time deployment progress and status updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
                <div className="font-mono text-sm space-y-1">
                  {deploymentLog.map((log, index) => (
                    <div key={index} className="text-gray-700">
                      {log}
                    </div>
                  ))}
                  {deploymentLog.length === 0 && (
                    <div className="text-gray-500 italic">No deployment activities yet...</div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={loadDeploymentHistory}
                  size="sm"
                >
                  Refresh Logs
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDeploymentLog([])}
                  size="sm"
                >
                  Clear Logs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}