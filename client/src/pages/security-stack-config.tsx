import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Settings, Zap, Shield, Activity, Eye, Target } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SecurityToolConfig {
  enabled: boolean;
  platform: string;
  apiUrl: string;
  apiKey: string;
  customFields: Record<string, string>;
}

interface SecurityStackState {
  name: string;
  description: string;
  siem: SecurityToolConfig;
  edr: SecurityToolConfig;
  firewall: SecurityToolConfig;
  soar: SecurityToolConfig;
  asm: SecurityToolConfig;
  attackSim: SecurityToolConfig;
}

const initialState: SecurityStackState = {
  name: '',
  description: '',
  siem: { enabled: false, platform: '', apiUrl: '', apiKey: '', customFields: {} },
  edr: { enabled: false, platform: '', apiUrl: '', apiKey: '', customFields: {} },
  firewall: { enabled: false, platform: '', apiUrl: '', apiKey: '', customFields: {} },
  soar: { enabled: false, platform: '', apiUrl: '', apiKey: '', customFields: {} },
  asm: { enabled: false, platform: '', apiUrl: '', apiKey: '', customFields: {} },
  attackSim: { enabled: false, platform: '', apiUrl: '', apiKey: '', customFields: {} }
};

const platformOptions = {
  siem: [
    { value: 'xsiam', label: 'Cortex XSIAM', vendor: 'Palo Alto Networks', queryLang: 'XQL' },
    { value: 'splunk', label: 'Splunk Enterprise', vendor: 'Splunk', queryLang: 'SPL' },
    { value: 'sentinel', label: 'Microsoft Sentinel', vendor: 'Microsoft', queryLang: 'KQL' },
    { value: 'qradar', label: 'IBM QRadar', vendor: 'IBM', queryLang: 'AQL' },
    { value: 'elastic', label: 'Elastic Security', vendor: 'Elastic', queryLang: 'Lucene' },
    { value: 'chronicle', label: 'Google Chronicle', vendor: 'Google', queryLang: 'YARA-L' }
  ],
  edr: [
    { value: 'cortex_xdr', label: 'Cortex XDR', vendor: 'Palo Alto Networks' },
    { value: 'crowdstrike', label: 'CrowdStrike Falcon', vendor: 'CrowdStrike' },
    { value: 'sentinelone', label: 'SentinelOne', vendor: 'SentinelOne' },
    { value: 'defender', label: 'Microsoft Defender', vendor: 'Microsoft' },
    { value: 'carbon_black', label: 'Carbon Black', vendor: 'VMware' }
  ],
  firewall: [
    { value: 'palo_alto', label: 'PAN-OS', vendor: 'Palo Alto Networks' },
    { value: 'checkpoint', label: 'Check Point', vendor: 'Check Point' },
    { value: 'fortinet', label: 'FortiGate', vendor: 'Fortinet' },
    { value: 'cisco_asa', label: 'Cisco ASA', vendor: 'Cisco' },
    { value: 'juniper', label: 'Juniper SRX', vendor: 'Juniper' },
    { value: 'sophos', label: 'Sophos XG', vendor: 'Sophos' }
  ],
  soar: [
    { value: 'xsoar', label: 'Cortex XSOAR', vendor: 'Palo Alto Networks' },
    { value: 'phantom', label: 'Splunk Phantom', vendor: 'Splunk' },
    { value: 'resilient', label: 'IBM Resilient', vendor: 'IBM' },
    { value: 'swimlane', label: 'Swimlane', vendor: 'Swimlane' },
    { value: 'siemplify', label: 'Google Siemplify', vendor: 'Google' },
    { value: 'insightconnect', label: 'InsightConnect', vendor: 'Rapid7' }
  ],
  asm: [
    { value: 'cortex_xpanse', label: 'Cortex Xpanse', vendor: 'Palo Alto Networks' },
    { value: 'censys', label: 'Censys', vendor: 'Censys' },
    { value: 'shodan', label: 'Shodan', vendor: 'Shodan' },
    { value: 'bitsight', label: 'BitSight', vendor: 'BitSight' },
    { value: 'riskrecon', label: 'RiskRecon', vendor: 'Mastercard' },
    { value: 'cycognito', label: 'CyCognito', vendor: 'CyCognito' }
  ],
  attackSim: [
    { value: 'breach_attack_sim', label: 'Breach & Attack Simulation', vendor: 'XM Cyber' },
    { value: 'safebreach', label: 'SafeBreach', vendor: 'SafeBreach' },
    { value: 'cymulate', label: 'Cymulate', vendor: 'Cymulate' },
    { value: 'attackiq', label: 'AttackIQ', vendor: 'AttackIQ' },
    { value: 'verodin', label: 'Verodin', vendor: 'Mandiant' },
    { value: 'scythe', label: 'SCYTHE', vendor: 'SCYTHE' }
  ]
};

const categoryIcons = {
  siem: Shield,
  edr: Activity,
  firewall: Zap,
  soar: Settings,
  asm: Eye,
  attackSim: Target
};

const categoryLabels = {
  siem: 'SIEM Platform',
  edr: 'Endpoint Detection',
  firewall: 'Firewall/Network',
  soar: 'SOAR Platform',
  asm: 'Attack Surface',
  attackSim: 'Attack Simulation'
};

interface Props {
  useCase?: any;
  onSecurityStackComplete?: (stack: any) => void;
}

export default function SecurityStackConfig({ useCase, onSecurityStackComplete }: Props) {
  const [config, setConfig] = useState<SecurityStackState>(initialState);
  const [activeTab, setActiveTab] = useState('siem');
  const [testResults, setTestResults] = useState<Record<string, 'success' | 'error' | 'testing'>>({});

  const updateToolConfig = (category: keyof Omit<SecurityStackState, 'name' | 'description'>, field: keyof SecurityToolConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const testConnection = async (category: string) => {
    setTestResults(prev => ({ ...prev, [category]: 'testing' }));
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Random success/fail for demo
    const success = Math.random() > 0.3;
    setTestResults(prev => ({ ...prev, [category]: success ? 'success' : 'error' }));
  };

  const saveSecurityStack = async () => {
    const stackConfig = {
      name: config.name,
      description: config.description,
      siem: config.siem.enabled ? config.siem : undefined,
      edr: config.edr.enabled ? config.edr : undefined,
      firewall: config.firewall.enabled ? config.firewall : undefined,
      soar: config.soar.enabled ? config.soar : undefined,
      asm: config.asm.enabled ? config.asm : undefined,
      attackSim: config.attackSim.enabled ? config.attackSim : undefined
    };

    console.log('Security Stack Configuration:', stackConfig);
    // Would send to backend SecurityStackManager
  };

  const getConnectionStatusIcon = (category: string) => {
    const status = testResults[category];
    if (status === 'testing') return <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />;
    if (status === 'success') return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-500" />;
    return null;
  };

  const renderToolConfig = (category: keyof Omit<SecurityStackState, 'name' | 'description'>) => {
    const toolConfig = config[category];
    const options = platformOptions[category];
    const Icon = categoryIcons[category];

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              <CardTitle>{categoryLabels[category]}</CardTitle>
            </div>
            <Switch
              checked={toolConfig.enabled}
              onCheckedChange={(enabled) => updateToolConfig(category, 'enabled', enabled)}
            />
          </div>
          <CardDescription>
            Configure your {categoryLabels[category].toLowerCase()} integration
          </CardDescription>
        </CardHeader>
        
        {toolConfig.enabled && (
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor={`${category}-platform`}>Platform</Label>
              <Select
                value={toolConfig.platform}
                onValueChange={(value) => updateToolConfig(category, 'platform', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.vendor}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {toolConfig.platform && (
              <>
                <div>
                  <Label htmlFor={`${category}-url`}>API URL</Label>
                  <Input
                    id={`${category}-url`}
                    placeholder="https://api.example.com"
                    value={toolConfig.apiUrl}
                    onChange={(e) => updateToolConfig(category, 'apiUrl', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`${category}-key`}>API Key</Label>
                  <Input
                    id={`${category}-key`}
                    type="password"
                    placeholder="Enter API key..."
                    value={toolConfig.apiKey}
                    onChange={(e) => updateToolConfig(category, 'apiKey', e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => testConnection(category)}
                    disabled={!toolConfig.apiUrl || !toolConfig.apiKey}
                    className="flex items-center gap-2"
                  >
                    {getConnectionStatusIcon(category)}
                    Test Connection
                  </Button>
                  
                  {testResults[category] === 'success' && (
                    <Badge variant="secondary" className="text-green-700 bg-green-100">
                      Connected
                    </Badge>
                  )}
                  
                  {testResults[category] === 'error' && (
                    <Badge variant="destructive">
                      Connection Failed
                    </Badge>
                  )}
                </div>

                {category === 'siem' && toolConfig.platform && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Query Language: {(options.find(o => o.value === toolConfig.platform) as any)?.queryLang || 'N/A'}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  const enabledTools = Object.entries(config).filter(([key, value]) => 
    key !== 'name' && key !== 'description' && (value as SecurityToolConfig).enabled
  ).length;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Security Stack Configuration</h1>
        <p className="text-muted-foreground">
          Configure your modular security platform - swap tools like Lego blocks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stack Details</CardTitle>
          <CardDescription>
            Define your security stack name and description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stack-name">Stack Name</Label>
            <Input
              id="stack-name"
              placeholder="e.g., Production Security Stack"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="stack-description">Description</Label>
            <Input
              id="stack-description"
              placeholder="e.g., Primary security infrastructure for threat detection and response"
              value={config.description}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{enabledTools}</div>
            <div className="text-sm text-muted-foreground">Tools Enabled</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {Object.values(testResults).filter(r => r === 'success').length}
            </div>
            <div className="text-sm text-muted-foreground">Connected</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">6</div>
            <div className="text-sm text-muted-foreground">Available Categories</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="siem">SIEM</TabsTrigger>
          <TabsTrigger value="edr">EDR</TabsTrigger>
          <TabsTrigger value="firewall">Firewall</TabsTrigger>
          <TabsTrigger value="soar">SOAR</TabsTrigger>
          <TabsTrigger value="asm">ASM</TabsTrigger>
          <TabsTrigger value="attackSim">Attack Sim</TabsTrigger>
        </TabsList>

        <TabsContent value="siem" className="space-y-4">
          {renderToolConfig('siem')}
        </TabsContent>

        <TabsContent value="edr" className="space-y-4">
          {renderToolConfig('edr')}
        </TabsContent>

        <TabsContent value="firewall" className="space-y-4">
          {renderToolConfig('firewall')}
        </TabsContent>

        <TabsContent value="soar" className="space-y-4">
          {renderToolConfig('soar')}
        </TabsContent>

        <TabsContent value="asm" className="space-y-4">
          {renderToolConfig('asm')}
        </TabsContent>

        <TabsContent value="attackSim" className="space-y-4">
          {renderToolConfig('attackSim')}
        </TabsContent>
      </Tabs>

      <Separator />

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Configure your security tools to build a comprehensive defense platform
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={saveSecurityStack}
            disabled={!config.name || enabledTools === 0}
            size="lg"
            variant="outline"
          >
            Save Configuration
          </Button>
          {onSecurityStackComplete && (
            <Button 
              onClick={() => onSecurityStackComplete(config)}
              disabled={!config.name || enabledTools === 0}
              size="lg"
            >
              Complete & Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}