import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Shield, 
  Settings, 
  CheckCircle, 
  AlertTriangle, 
  Copy,
  ExternalLink,
  FileText,
  Code,
  Activity
} from 'lucide-react';

interface XSIAMIntegrationGuideProps {
  useCase: any;
  onConfigurationComplete: (config: any) => void;
}

export default function XSIAMIntegrationGuide({ useCase, onConfigurationComplete }: XSIAMIntegrationGuideProps) {
  const [currentStep, setCurrentStep] = useState<'prerequisites' | 'datasources' | 'ingestion' | 'validation'>('prerequisites');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const integrationSteps = [
    {
      id: 'prerequisites',
      name: 'Prerequisites',
      description: 'XSIAM tenant setup and access verification',
      duration: '15 minutes'
    },
    {
      id: 'datasources',
      name: 'Data Sources',
      description: 'Configure log collection and forwarding',
      duration: '30 minutes'
    },
    {
      id: 'ingestion',
      name: 'Data Ingestion',
      description: 'Set up data parsing and normalization',
      duration: '20 minutes'
    },
    {
      id: 'validation',
      name: 'Validation',
      description: 'Verify data flow and quality',
      duration: '15 minutes'
    }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 'prerequisites':
        return <PrerequisitesStep useCase={useCase} />;
      case 'datasources':
        return <DataSourcesStep useCase={useCase} />;
      case 'ingestion':
        return <DataIngestionStep useCase={useCase} />;
      case 'validation':
        return <ValidationStep useCase={useCase} />;
      default:
        return null;
    }
  };

  const handleNextStep = () => {
    const currentIndex = integrationSteps.findIndex(step => step.id === currentStep);
    if (currentIndex < integrationSteps.length - 1) {
      setCompletedSteps(prev => [...prev, currentStep]);
      setCurrentStep(integrationSteps[currentIndex + 1].id as any);
    } else {
      setCompletedSteps(prev => [...prev, currentStep]);
      onConfigurationComplete({
        completedSteps: [...completedSteps, currentStep],
        useCase
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>XSIAM Data Source Integration</span>
          </CardTitle>
          <CardDescription>
            Configure data collection and processing for {useCase?.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {integrationSteps.map((step, index) => (
              <Button
                key={step.id}
                variant={currentStep === step.id ? 'default' : completedSteps.includes(step.id) ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setCurrentStep(step.id as any)}
                className="flex flex-col h-auto p-3"
              >
                <div className="flex items-center space-x-2 mb-1">
                  {completedSteps.includes(step.id) && <CheckCircle className="h-3 w-3" />}
                  <span className="text-xs font-medium">{step.name}</span>
                </div>
                <span className="text-xs text-gray-600">{step.duration}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent()}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = integrationSteps.findIndex(s => s.id === currentStep);
            if (currentIndex > 0) {
              setCurrentStep(integrationSteps[currentIndex - 1].id as any);
            }
          }}
          disabled={currentStep === 'prerequisites'}
        >
          Previous Step
        </Button>
        
        <Button onClick={handleNextStep}>
          {currentStep === 'validation' ? 'Complete Integration' : 'Next Step'}
        </Button>
      </div>
    </div>
  );
}

function PrerequisitesStep({ useCase }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>XSIAM Prerequisites</CardTitle>
        <CardDescription>Verify access and tenant configuration</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Ensure you have administrative access to your Cortex XSIAM tenant
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-3">Required Access Permissions:</h4>
            <div className="space-y-2">
              {[
                'Cortex Data Lake Administrator',
                'XSIAM Incident Responder',
                'XSIAM Rule Editor',
                'Playbook Designer'
              ].map((permission, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{permission}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Tenant Configuration:</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <code className="text-sm">
                Tenant URL: https://[tenant-name].xdr.us.paloaltonetworks.com<br/>
                Data Lake: [your-data-lake-id]<br/>
                Region: [us/eu/asia]
              </code>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">API Key Generation:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Navigate to Settings → API Keys in XSIAM</li>
              <li>Create new API key with Data Lake permissions</li>
              <li>Securely store the generated key and ID</li>
              <li>Test API connectivity using the provided scripts</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataSourcesStep({ useCase }: any) {
  const getDataSourcesForCategory = (category: string) => {
    switch (category) {
      case 'cloud':
        return [
          { name: 'Kubernetes Audit Logs', type: 'JSON', port: '443', protocol: 'HTTPS' },
          { name: 'Container Runtime Logs', type: 'Syslog', port: '514', protocol: 'TCP/UDP' },
          { name: 'Cloud Provider Logs', type: 'API', port: '443', protocol: 'HTTPS' },
          { name: 'Service Mesh Logs', type: 'JSON', port: '15090', protocol: 'HTTP' }
        ];
      case 'network':
        return [
          { name: 'Firewall Logs', type: 'CEF', port: '514', protocol: 'UDP' },
          { name: 'DNS Logs', type: 'Syslog', port: '514', protocol: 'UDP' },
          { name: 'Network Flow Logs', type: 'NetFlow', port: '2055', protocol: 'UDP' },
          { name: 'IDS/IPS Alerts', type: 'SNORT', port: '514', protocol: 'TCP' }
        ];
      case 'endpoint':
        return [
          { name: 'Windows Event Logs', type: 'WinEvent', port: '5985', protocol: 'WinRM' },
          { name: 'Sysmon Logs', type: 'XML', port: '5985', protocol: 'WinRM' },
          { name: 'Antivirus Logs', type: 'CEF', port: '514', protocol: 'TCP' },
          { name: 'Process Monitoring', type: 'JSON', port: '443', protocol: 'HTTPS' }
        ];
      case 'identity':
        return [
          { name: 'Active Directory Logs', type: 'WinEvent', port: '5985', protocol: 'WinRM' },
          { name: 'LDAP Audit Logs', type: 'Syslog', port: '514', protocol: 'TCP' },
          { name: 'SSO Provider Logs', type: 'JSON', port: '443', protocol: 'HTTPS' },
          { name: 'Authentication Events', type: 'CEF', port: '514', protocol: 'TCP' }
        ];
      default:
        return [];
    }
  };

  const dataSources = getDataSourcesForCategory(useCase?.category || 'endpoint');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Source Configuration</CardTitle>
        <CardDescription>Configure log collection for {useCase?.category} monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Database className="h-4 w-4" />
          <AlertDescription>
            Configure these data sources based on your {useCase?.category} infrastructure
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {dataSources.map((source, i) => (
            <Card key={i} className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{source.name}</h4>
                  <Badge variant="outline">{source.type}</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Protocol:</span>
                    <p className="font-medium">{source.protocol}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Port:</span>
                    <p className="font-medium">{source.port}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Format:</span>
                    <p className="font-medium">{source.type}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <Button size="sm" variant="outline" className="mr-2">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button size="sm" variant="ghost">
                    <FileText className="h-3 w-3 mr-1" />
                    View Config
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Collection Agent Setup:</h4>
          <div className="space-y-2 text-sm">
            <p>1. Deploy Cortex XDR agent or configure log forwarding</p>
            <p>2. Configure agent policies for data collection</p>
            <p>3. Set up log parsing and normalization rules</p>
            <p>4. Test connectivity and data flow</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataIngestionStep({ useCase }: any) {
  const [selectedParser, setSelectedParser] = useState('custom');

  const parsingConfigs = {
    'cloud': {
      parser: 'JSON Parser',
      fields: ['timestamp', 'kubernetes.namespace', 'kubernetes.pod', 'container.name', 'log.level', 'message'],
      sample: `{
  "timestamp": "2025-07-20T19:52:00Z",
  "kubernetes": {
    "namespace": "production",
    "pod": "nginx-deployment-7d6b8f4",
    "container": "nginx"
  },
  "level": "error",
  "message": "Configuration injection detected"
}`
    },
    'network': {
      parser: 'CEF Parser',
      fields: ['timestamp', 'src_ip', 'dst_ip', 'src_port', 'dst_port', 'protocol', 'action'],
      sample: `CEF:0|Palo Alto Networks|PAN-OS|10.1.0|THREAT|url|3|rt=Jul 20 2025 19:52:00 src=192.168.1.100 dst=203.0.113.50 spt=49152 dpt=443 proto=TCP act=blocked`
    },
    'endpoint': {
      parser: 'Windows Event Parser',
      fields: ['timestamp', 'event_id', 'computer_name', 'user', 'process_name', 'command_line'],
      sample: `<Event xmlns="http://schemas.microsoft.com/win/2004/08/events/event">
  <System>
    <EventID>4688</EventID>
    <Computer>WIN-SERVER01</Computer>
    <TimeCreated SystemTime="2025-07-20T19:52:00Z"/>
  </System>
  <EventData>
    <Data Name="ProcessName">C:\\Windows\\System32\\cmd.exe</Data>
    <Data Name="CommandLine">cmd.exe /c powershell.exe -enc UGF5bG9hZA==</Data>
  </EventData>
</Event>`
    },
    'identity': {
      parser: 'Authentication Parser',
      fields: ['timestamp', 'user', 'auth_method', 'result', 'source_ip', 'user_agent'],
      sample: `{
  "timestamp": "2025-07-20T19:52:00Z",
  "user": "john.doe@company.com",
  "auth_method": "saml",
  "result": "success",
  "source_ip": "192.168.1.100",
  "risk_score": 85
}`
    }
  };

  const config = parsingConfigs[useCase?.category as keyof typeof parsingConfigs] || parsingConfigs.endpoint;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Ingestion Configuration</CardTitle>
        <CardDescription>Set up log parsing and field mapping</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={selectedParser} onValueChange={setSelectedParser}>
          <TabsList>
            <TabsTrigger value="custom">Custom Parser</TabsTrigger>
            <TabsTrigger value="builtin">Built-in Parser</TabsTrigger>
            <TabsTrigger value="regex">Regex Parser</TabsTrigger>
          </TabsList>

          <TabsContent value="custom" className="space-y-4">
            <div>
              <h4 className="font-medium mb-3">Recommended Parser: {config.parser}</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Sample Log Format:</h5>
                <pre className="text-xs overflow-x-auto">{config.sample}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Field Mapping:</h4>
              <div className="grid grid-cols-2 gap-4">
                {config.fields.map((field, i) => (
                  <div key={i} className="flex items-center space-x-2 p-2 bg-white border rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-mono">{field}</span>
                  </div>
                ))}
              </div>
            </div>

            <Alert>
              <Code className="h-4 w-4" />
              <AlertDescription>
                Use the XQL Query Builder to create custom parsing rules for your specific log format
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="builtin">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                XSIAM includes built-in parsers for common log formats. Select the appropriate parser for your data source.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {['Syslog RFC3164', 'CEF (Common Event Format)', 'LEEF (Log Event Extended Format)', 'Windows Event XML'].map((parser, i) => (
                  <Card key={i} className="p-3 cursor-pointer hover:bg-gray-50">
                    <div className="font-medium text-sm">{parser}</div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="regex">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Create custom regex patterns for complex log formats that don't match standard parsers.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Example Regex Pattern:</h5>
                <code className="text-xs">
                  {`(?P<timestamp>\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z)\\s+(?P<level>\\w+)\\s+(?P<message>.*)`}
                </code>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            <Copy className="h-3 w-3 mr-1" />
            Copy Configuration
          </Button>
          <Button size="sm" variant="outline">
            <ExternalLink className="h-3 w-3 mr-1" />
            Open in XSIAM
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ValidationStep({ useCase }: any) {
  const [validationResults] = useState([
    { check: 'Data source connectivity', status: 'success', message: 'All sources connected' },
    { check: 'Log ingestion rate', status: 'success', message: '1,250 events/minute' },
    { check: 'Field mapping accuracy', status: 'warning', message: '2 unmapped fields detected' },
    { check: 'Data quality', status: 'success', message: '98.5% parse success rate' }
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Validation</CardTitle>
        <CardDescription>Verify data flow and quality for {useCase?.category} monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {validationResults.map((result, i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {result.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                <div>
                  <p className="font-medium">{result.check}</p>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>
              <Badge variant={result.status === 'success' ? 'default' : 'secondary'}>
                {result.status}
              </Badge>
            </div>
          ))}
        </div>

        <Alert>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            Data ingestion is active. You can now proceed with content creation and testing.
          </AlertDescription>
        </Alert>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Next Steps:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Create correlation rules for threat detection</li>
            <li>• Design alert layouts for analyst workflow</li>
            <li>• Build response playbooks</li>
            <li>• Configure monitoring dashboards</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}