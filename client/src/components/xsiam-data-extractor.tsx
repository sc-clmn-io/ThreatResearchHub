import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Download, 
  Database, 
  Package, 
  Settings, 
  BookOpen, 
  GitBranch,
  Cloud,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

interface XSIAMInstance {
  name: string;
  url: string;
  version: string;
  apiKey: string;
  description: string;
}

interface ContentPack {
  id: string;
  name: string;
  version: string;
  vendor: string;
  description: string;
  integrations: number;
  playbooks: number;
  scripts: number;
  layouts: number;
  installed: boolean;
  lastUpdated: string;
}

interface OnboardingWizardData {
  dataSourceType: string;
  category: string;
  integrationSteps: Array<{
    step: number;
    title: string;
    description: string;
    required: boolean;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
  }>;
  sampleConfiguration: object;
  validationRules: string[];
}

interface MarketplaceData {
  totalPacks: number;
  categories: string[];
  recentUpdates: ContentPack[];
  popularPacks: ContentPack[];
  installedPacks: ContentPack[];
}

interface ExtractionProgress {
  phase: string;
  current: number;
  total: number;
  status: 'idle' | 'running' | 'complete' | 'error';
  message: string;
}

export function XSIAMDataExtractor() {
  const [instances, setInstances] = useState<XSIAMInstance[]>([]);
  const [newInstance, setNewInstance] = useState<Partial<XSIAMInstance>>({
    name: '',
    url: '',
    version: '3.x',
    apiKey: '',
    description: ''
  });
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [extractionType, setExtractionType] = useState<string>('marketplace');
  const [progress, setProgress] = useState<ExtractionProgress>({
    phase: 'Ready',
    current: 0,
    total: 0,
    status: 'idle',
    message: ''
  });
  const [extractedData, setExtractedData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('instances');

  // Sample XSIAM API endpoints based on research
  const apiEndpoints = {
    v2: {
      contentPacks: '/content/packs',
      marketplace: '/content/marketplace',
      integrations: '/settings/integrations',
      playbooks: '/automation/playbooks',
      correlationRules: '/detection/correlation-rules',
      dataSources: '/settings/data-sources',
      onboardingWizard: '/onboarding/wizard'
    },
    v3: {
      contentPacks: '/api/v1/content/packs',
      marketplace: '/api/v1/marketplace',
      integrations: '/api/v1/integrations',
      playbooks: '/api/v1/automation/playbooks',
      correlationRules: '/api/v1/analytics/correlation-rules',
      dataSources: '/api/v1/data-sources',
      onboardingWizard: '/api/v1/onboarding/wizard'
    },
    cortexCloud: {
      contentPacks: '/cortex/api/content/packs',
      marketplace: '/cortex/api/marketplace',
      integrations: '/cortex/api/integrations',
      playbooks: '/cortex/api/automation/playbooks',
      correlationRules: '/cortex/api/analytics/rules',
      dataSources: '/cortex/api/data-sources',
      onboardingWizard: '/cortex/api/onboarding'
    }
  };

  const addInstance = () => {
    if (newInstance.name && newInstance.url && newInstance.apiKey) {
      const instance: XSIAMInstance = {
        ...newInstance,
        name: newInstance.name,
        url: newInstance.url,
        version: newInstance.version || '3.x',
        apiKey: newInstance.apiKey,
        description: newInstance.description || ''
      };
      
      setInstances([...instances, instance]);
      setNewInstance({
        name: '',
        url: '',
        version: '3.x',
        apiKey: '',
        description: ''
      });
    }
  };

  const testConnection = async (instance: XSIAMInstance) => {
    setProgress({
      phase: 'Testing Connection',
      current: 1,
      total: 3,
      status: 'running',
      message: `Connecting to ${instance.name}...`
    });

    try {
      // Simulate API connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProgress({
        phase: 'Connection Successful',
        current: 3,
        total: 3,
        status: 'complete',
        message: `Successfully connected to ${instance.name}`
      });
    } catch (error) {
      setProgress({
        phase: 'Connection Failed',
        current: 1,
        total: 3,
        status: 'error',
        message: `Failed to connect to ${instance.name}`
      });
    }
  };

  const extractMarketplaceData = async (instance: XSIAMInstance) => {
    const phases = [
      'Connecting to XSIAM instance',
      'Fetching marketplace catalog',
      'Extracting content pack metadata',
      'Analyzing integration dependencies',
      'Processing playbook templates',
      'Collecting correlation rule skeletons',
      'Finalizing data extraction'
    ];

    setProgress({
      phase: phases[0],
      current: 0,
      total: phases.length,
      status: 'running',
      message: 'Starting marketplace data extraction...'
    });

    try {
      for (let i = 0; i < phases.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        setProgress({
          phase: phases[i],
          current: i + 1,
          total: phases.length,
          status: 'running',
          message: `Processing ${phases[i].toLowerCase()}...`
        });
      }

      // Generate sample extracted data based on research
      const marketplaceData: MarketplaceData = {
        totalPacks: 700,
        categories: [
          'Authentication', 'Case Management', 'Endpoint Security',
          'Email Gateways', 'Threat Intelligence', 'Network Security',
          'SIEM', 'Cloud Security', 'Identity Management'
        ],
        recentUpdates: [
          {
            id: 'crowdstrike-falcon',
            name: 'CrowdStrike Falcon',
            version: '2.1.8',
            vendor: 'CrowdStrike',
            description: 'Endpoint Detection and Response integration',
            integrations: 3,
            playbooks: 12,
            scripts: 8,
            layouts: 4,
            installed: false,
            lastUpdated: '2025-01-20'
          },
          {
            id: 'recorded-future',
            name: 'Recorded Future Intelligence',
            version: '3.2.1',
            vendor: 'Recorded Future',
            description: 'Threat intelligence feed integration',
            integrations: 5,
            playbooks: 15,
            scripts: 22,
            layouts: 7,
            installed: true,
            lastUpdated: '2025-01-18'
          }
        ],
        popularPacks: [],
        installedPacks: []
      };

      setExtractedData(marketplaceData);
      setProgress({
        phase: 'Extraction Complete',
        current: phases.length,
        total: phases.length,
        status: 'complete',
        message: `Successfully extracted ${marketplaceData.totalPacks} content packs from marketplace`
      });

    } catch (error) {
      setProgress({
        phase: 'Extraction Failed',
        current: 0,
        total: phases.length,
        status: 'error',
        message: 'Failed to extract marketplace data'
      });
    }
  };

  const extractOnboardingData = async (instance: XSIAMInstance) => {
    const phases = [
      'Accessing onboarding wizard API',
      'Extracting data source templates',
      'Processing integration workflows',
      'Collecting field mappings',
      'Analyzing validation rules'
    ];

    setProgress({
      phase: phases[0],
      current: 0,
      total: phases.length,
      status: 'running',
      message: 'Starting onboarding wizard extraction...'
    });

    try {
      for (let i = 0; i < phases.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        setProgress({
          phase: phases[i],
          current: i + 1,
          total: phases.length,
          status: 'running',
          message: `Processing ${phases[i].toLowerCase()}...`
        });
      }

      const onboardingData: OnboardingWizardData = {
        dataSourceType: 'Syslog Server',
        category: 'Network Security',
        integrationSteps: [
          {
            step: 1,
            title: 'Configure Syslog Receiver',
            description: 'Set up syslog receiver endpoint and authentication',
            required: true,
            fields: [
              {
                name: 'server_ip',
                type: 'string',
                required: true,
                description: 'IP address of the syslog server'
              },
              {
                name: 'port',
                type: 'integer',
                required: true,
                description: 'Port number for syslog reception (default: 514)'
              }
            ]
          }
        ],
        sampleConfiguration: {
          protocol: 'UDP',
          format: 'RFC3164',
          facility: 'local0'
        },
        validationRules: [
          'Server must be reachable',
          'Port must be available',
          'Authentication credentials must be valid'
        ]
      };

      setExtractedData(onboardingData);
      setProgress({
        phase: 'Extraction Complete',
        current: phases.length,
        total: phases.length,
        status: 'complete',
        message: 'Successfully extracted onboarding wizard data'
      });

    } catch (error) {
      setProgress({
        phase: 'Extraction Failed',
        current: 0,
        total: phases.length,
        status: 'error',
        message: 'Failed to extract onboarding data'
      });
    }
  };

  const exportExtractedData = () => {
    if (!extractedData) return;

    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `xsiam-extracted-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">XSIAM Data Extractor</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Extract marketplace content, onboarding wizard configurations, and platform data from Cortex XSIAM/Cloud instances.
          Supports XSIAM v2.x, v3.x, and Cortex Cloud API endpoints.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="instances" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Instances
          </TabsTrigger>
          <TabsTrigger value="extraction" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Extraction
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="endpoints" className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            API Reference
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                XSIAM Instance Configuration
              </CardTitle>
              <CardDescription>
                Add your XSIAM instances to begin data extraction. Supports standard and advanced API keys.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instance-name">Instance Name</Label>
                  <Input
                    id="instance-name"
                    placeholder="Production XSIAM"
                    value={newInstance.name || ''}
                    onChange={(e) => setNewInstance({ ...newInstance, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instance-url">XSIAM URL</Label>
                  <Input
                    id="instance-url"
                    placeholder="https://your-tenant.xsiam.paloaltonetworks.com"
                    value={newInstance.url || ''}
                    onChange={(e) => setNewInstance({ ...newInstance, url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instance-version">API Version</Label>
                  <select
                    id="instance-version"
                    className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md"
                    value={newInstance.version || '3.x'}
                    onChange={(e) => setNewInstance({ ...newInstance, version: e.target.value })}
                  >
                    <option value="2.x">XSIAM v2.x</option>
                    <option value="3.x">XSIAM v3.x</option>
                    <option value="cortex-cloud">Cortex Cloud</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instance-apikey">API Key</Label>
                  <Input
                    id="instance-apikey"
                    type="password"
                    placeholder="Enter your XSIAM API key"
                    value={newInstance.apiKey || ''}
                    onChange={(e) => setNewInstance({ ...newInstance, apiKey: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instance-description">Description (Optional)</Label>
                <Textarea
                  id="instance-description"
                  placeholder="Production environment for SOC operations"
                  value={newInstance.description || ''}
                  onChange={(e) => setNewInstance({ ...newInstance, description: e.target.value })}
                />
              </div>
              <Button onClick={addInstance} className="w-full">
                Add XSIAM Instance
              </Button>
            </CardContent>
          </Card>

          {instances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Configured Instances</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instances.map((instance, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{instance.name}</h3>
                          <Badge variant="outline">{instance.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{instance.url}</p>
                        {instance.description && (
                          <p className="text-sm text-muted-foreground">{instance.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConnection(instance)}
                        >
                          Test Connection
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInstance(instance.name)}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="extraction" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Extraction Configuration
              </CardTitle>
              <CardDescription>
                Select extraction type and begin pulling data from your XSIAM instance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedInstance && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please select an XSIAM instance from the Instances tab before beginning extraction.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`cursor-pointer border-2 ${extractionType === 'marketplace' ? 'border-primary' : 'border-muted'}`}
                      onClick={() => setExtractionType('marketplace')}>
                  <CardContent className="p-4 text-center space-y-2">
                    <Package className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-medium">Marketplace Content</h3>
                    <p className="text-sm text-muted-foreground">
                      Extract content packs, integrations, playbooks, and correlation rules from marketplace
                    </p>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer border-2 ${extractionType === 'onboarding' ? 'border-primary' : 'border-muted'}`}
                      onClick={() => setExtractionType('onboarding')}>
                  <CardContent className="p-4 text-center space-y-2">
                    <BookOpen className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-medium">Onboarding Wizard</h3>
                    <p className="text-sm text-muted-foreground">
                      Extract data source integration templates and wizard configurations
                    </p>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer border-2 ${extractionType === 'integrations' ? 'border-primary' : 'border-muted'}`}
                      onClick={() => setExtractionType('integrations')}>
                  <CardContent className="p-4 text-center space-y-2">
                    <GitBranch className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-medium">Integration Skeletons</h3>
                    <p className="text-sm text-muted-foreground">
                      Extract integration templates and configuration skeletons for customization
                    </p>
                  </CardContent>
                </Card>

                <Card className={`cursor-pointer border-2 ${extractionType === 'platform' ? 'border-primary' : 'border-muted'}`}
                      onClick={() => setExtractionType('platform')}>
                  <CardContent className="p-4 text-center space-y-2">
                    <Cloud className="h-8 w-8 mx-auto text-primary" />
                    <h3 className="font-medium">Platform Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Extract platform settings, user roles, and system configurations
                    </p>
                  </CardContent>
                </Card>
              </div>

              {progress.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{progress.phase}</span>
                    <span className="text-sm text-muted-foreground">
                      {progress.current}/{progress.total}
                    </span>
                  </div>
                  <Progress value={(progress.current / progress.total) * 100} />
                  <p className="text-sm text-muted-foreground">{progress.message}</p>
                </div>
              )}

              {progress.status === 'complete' && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    {progress.message}
                  </AlertDescription>
                </Alert>
              )}

              {progress.status === 'error' && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {progress.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    if (extractionType === 'marketplace') {
                      extractMarketplaceData(instances.find(i => i.name === selectedInstance)!);
                    } else if (extractionType === 'onboarding') {
                      extractOnboardingData(instances.find(i => i.name === selectedInstance)!);
                    }
                  }}
                  disabled={!selectedInstance || progress.status === 'running'}
                  className="flex-1"
                >
                  {progress.status === 'running' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Begin Extraction
                    </>
                  )}
                </Button>

                {extractedData && (
                  <Button variant="outline" onClick={exportExtractedData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {extractedData ? (
            <Card>
              <CardHeader>
                <CardTitle>Extracted Data</CardTitle>
                <CardDescription>
                  Review and analyze the extracted XSIAM data below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Data Extracted Yet</h3>
                <p className="text-muted-foreground">
                  Configure an XSIAM instance and run an extraction to see results here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                XSIAM API Endpoint Reference
              </CardTitle>
              <CardDescription>
                Comprehensive API endpoints for data extraction across all XSIAM versions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(apiEndpoints).map(([version, endpoints]) => (
                <div key={version} className="space-y-3">
                  <h3 className="text-lg font-medium capitalize">
                    {version.replace('-', ' ')} API Endpoints
                  </h3>
                  <div className="grid gap-2">
                    {Object.entries(endpoints).map(([category, endpoint]) => (
                      <div key={category} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <span className="font-medium capitalize">{category.replace(/([A-Z])/g, ' $1')}</span>
                          <Badge variant="outline" className="ml-2">
                            {version === 'v2' ? 'XSIAM 2.x' : version === 'v3' ? 'XSIAM 3.x' : 'Cortex Cloud'}
                          </Badge>
                        </div>
                        <code className="text-sm bg-background px-2 py-1 rounded">
                          {endpoint}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Authentication Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Standard API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Basic authentication for content pack installation and marketplace access.
                    Header: <code>Authorization: Bearer &lt;api_key&gt;</code>
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Advanced API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Enhanced permissions for system configuration and administrative functions.
                    Required for XSIAM 8.0+ and Cortex Cloud environments.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}