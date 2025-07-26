import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, AlertCircle, Database, Search, Layout, BarChart3, FileText, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'wouter';

interface ContentRequirements {
  // Basic Information
  threatName: string;
  category: 'endpoint' | 'network' | 'cloud' | 'identity' | 'web' | 'email';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  
  // Data Sources
  dataSources: {
    primary: string;
    secondary: string[];
    required_fields: string[];
    optional_fields: string[];
  };
  
  // Alert Context Fields
  alertFields: {
    field_name: string;
    field_type: 'string' | 'number' | 'array' | 'object' | 'boolean';
    description: string;
    sample_value: string;
    required: boolean;
  }[];
  
  // MITRE ATT&CK Mapping
  mitreMapping: {
    tactics: string[];
    techniques: string[];
    subtechniques: string[];
  };
  
  // Response Actions
  responseActions: {
    immediate: string[];
    investigation: string[];
    containment: string[];
    eradication: string[];
  };
  
  // Workflow Requirements
  workflow: {
    priority_groups: string[];
    notification_methods: string[];
    escalation_criteria: string[];
    sla_requirements: string;
  };
  
  // Content Generation Flags
  generateContent: {
    correlation: boolean;
    playbook: boolean;
    alertLayout: boolean;
    dashboard: boolean;
  };
}

const ContentBuilderWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [requirements, setRequirements] = useState<ContentRequirements>({
    threatName: '',
    category: 'endpoint',
    severity: 'medium',
    description: '',
    dataSources: {
      primary: '',
      secondary: [],
      required_fields: [],
      optional_fields: []
    },
    alertFields: [],
    mitreMapping: {
      tactics: [],
      techniques: [],
      subtechniques: []
    },
    responseActions: {
      immediate: [],
      investigation: [],
      containment: [],
      eradication: []
    },
    workflow: {
      priority_groups: [],
      notification_methods: [],
      escalation_criteria: [],
      sla_requirements: ''
    },
    generateContent: {
      correlation: true,
      playbook: true,
      alertLayout: true,
      dashboard: true
    }
  });

  const [errors, setErrors] = useState<string[]>([]);

  const steps = [
    { id: 'basic', title: 'Basic Information', icon: FileText },
    { id: 'data', title: 'Data Sources', icon: Database },
    { id: 'fields', title: 'Alert Fields', icon: Search },
    { id: 'mitre', title: 'MITRE Mapping', icon: AlertCircle },
    { id: 'response', title: 'Response Actions', icon: Layout },
    { id: 'workflow', title: 'Workflow Config', icon: BarChart3 },
    { id: 'generation', title: 'Content Generation', icon: Plus }
  ];

  const commonDataSources = [
    'xdr_data',
    'amazon_aws_raw',
    'msft_azure_ad_raw',
    'pan_ngfw_raw',
    'pan_dss_raw',
    'microsoft_365_raw',
    'okta_raw',
    'crowdstrike_raw',
    'sentinelone_raw',
    'carbon_black_raw',
    'windows_events',
    'linux_syslog',
    'network_flows'
  ];

  const commonAlertFields = [
    { name: 'agent_hostname', type: 'string', description: 'Host where the event occurred' },
    { name: 'username', type: 'array', description: 'Username associated with the event' },
    { name: 'localip', type: 'array', description: 'Local IP address' },
    { name: 'remoteip', type: 'array', description: 'Remote IP address' },
    { name: 'country', type: 'array', description: 'Geographic country' },
    { name: 'agentossubtype', type: 'string', description: 'Operating system details' },
    { name: 'action_process_image_name', type: 'string', description: 'Process name' },
    { name: 'action_file_path', type: 'string', description: 'File path' },
    { name: 'action_registry_key_name', type: 'string', description: 'Registry key' },
    { name: 'dns_query_name', type: 'string', description: 'DNS query' },
    { name: 'action_external_hostname', type: 'string', description: 'External hostname' }
  ];

  const mitreTactics = [
    'Initial Access', 'Execution', 'Persistence', 'Privilege Escalation',
    'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement',
    'Collection', 'Command and Control', 'Exfiltration', 'Impact'
  ];

  const addAlertField = () => {
    setRequirements(prev => ({
      ...prev,
      alertFields: [...prev.alertFields, {
        field_name: '',
        field_type: 'string',
        description: '',
        sample_value: '',
        required: false
      }]
    }));
  };

  const removeAlertField = (index: number) => {
    setRequirements(prev => ({
      ...prev,
      alertFields: prev.alertFields.filter((_, i) => i !== index)
    }));
  };

  const updateAlertField = (index: number, field: string, value: any) => {
    setRequirements(prev => ({
      ...prev,
      alertFields: prev.alertFields.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (path: string, value: string) => {
    if (!value.trim()) return;
    
    setRequirements(prev => {
      const newReq = { ...prev };
      const pathParts = path.split('.');
      let current: any = newReq;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      
      const finalKey = pathParts[pathParts.length - 1];
      current[finalKey] = [...current[finalKey], value];
      
      return newReq;
    });
  };

  const removeArrayItem = (path: string, index: number) => {
    setRequirements(prev => {
      const newReq = { ...prev };
      const pathParts = path.split('.');
      let current: any = newReq;
      
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      
      const finalKey = pathParts[pathParts.length - 1];
      current[finalKey] = current[finalKey].filter((_: any, i: number) => i !== index);
      
      return newReq;
    });
  };

  const validateStep = (step: number) => {
    const newErrors: string[] = [];
    
    switch (step) {
      case 0:
        if (!requirements.threatName.trim()) newErrors.push('Threat name is required');
        if (!requirements.description.trim()) newErrors.push('Description is required');
        break;
      case 1:
        if (!requirements.dataSources.primary) newErrors.push('Primary data source is required');
        if (requirements.dataSources.required_fields.length === 0) newErrors.push('At least one required field is needed');
        break;
      case 2:
        if (requirements.alertFields.length === 0) newErrors.push('At least one alert field is required');
        requirements.alertFields.forEach((field, index) => {
          if (!field.field_name.trim()) newErrors.push(`Alert field ${index + 1} name is required`);
          if (!field.description.trim()) newErrors.push(`Alert field ${index + 1} description is required`);
        });
        break;
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const generateContent = async () => {
    if (!validateStep(currentStep)) return;
    
    try {
      console.log('Generating content with requirements:', requirements);
      // Here we would call the content generation API
      alert('Content generation started! This will create all selected components based on your requirements.');
    } catch (error) {
      console.error('Content generation failed:', error);
      alert('Content generation failed. Please try again.');
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">POV Content Generation from Customer DoR</h3>
        <p className="text-blue-800 dark:text-blue-200 text-sm">
          Generate comprehensive POV content: 5 use cases each with data source integrations, XSIAM correlation rules, 
          alert layouts with analyst decision support (isolate endpoint, reset credentials, etc.), automation playbooks, and operational dashboards.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="threatName">Threat/Use Case Name</Label>
        <Input
          id="threatName"
          value={requirements.threatName}
          onChange={(e) => setRequirements(prev => ({ ...prev, threatName: e.target.value }))}
          placeholder="e.g., VPN Access from Abnormal OS"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category</Label>
          <Select 
            value={requirements.category} 
            onValueChange={(value: any) => setRequirements(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="endpoint">Endpoint Security</SelectItem>
              <SelectItem value="network">Network Security</SelectItem>
              <SelectItem value="cloud">Cloud Security</SelectItem>
              <SelectItem value="identity">Identity & Access</SelectItem>
              <SelectItem value="web">Web Security</SelectItem>
              <SelectItem value="email">Email Security</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Severity</Label>
          <Select 
            value={requirements.severity} 
            onValueChange={(value: any) => setRequirements(prev => ({ ...prev, severity: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="info">Informational</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={requirements.description}
          onChange={(e) => setRequirements(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the threat scenario and detection logic..."
          rows={4}
        />
      </div>
    </div>
  );

  const renderDataSources = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Primary Data Source</Label>
        <Select 
          value={requirements.dataSources.primary} 
          onValueChange={(value) => setRequirements(prev => ({
            ...prev,
            dataSources: { ...prev.dataSources, primary: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select primary data source" />
          </SelectTrigger>
          <SelectContent>
            {commonDataSources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Secondary Data Sources</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {requirements.dataSources.secondary.map((source, index) => (
            <Badge key={index} variant="secondary">
              {source}
              <button
                onClick={() => removeArrayItem('dataSources.secondary', index)}
                className="ml-1 text-xs"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <Select onValueChange={(value) => addArrayItem('dataSources.secondary', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Add secondary data source" />
          </SelectTrigger>
          <SelectContent>
            {commonDataSources.filter(source => 
              source !== requirements.dataSources.primary &&
              !requirements.dataSources.secondary.includes(source)
            ).map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Required Fields</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {requirements.dataSources.required_fields.map((field, index) => (
              <Badge key={index} variant="destructive">
                {field}
                <button
                  onClick={() => removeArrayItem('dataSources.required_fields', index)}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Field name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('dataSources.required_fields', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Optional Fields</Label>
          <div className="flex flex-wrap gap-1 mb-2">
            {requirements.dataSources.optional_fields.map((field, index) => (
              <Badge key={index} variant="outline">
                {field}
                <button
                  onClick={() => removeArrayItem('dataSources.optional_fields', index)}
                  className="ml-1 text-xs"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Field name"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addArrayItem('dataSources.optional_fields', e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertFields = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Alert Context Fields</h3>
        <Button onClick={addAlertField} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>
      
      <div className="space-y-4">
        {requirements.alertFields.map((field, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-medium">Field {index + 1}</h4>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeAlertField(index)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Field Name</Label>
                  <Input
                    value={field.field_name}
                    onChange={(e) => updateAlertField(index, 'field_name', e.target.value)}
                    placeholder="e.g., alert.username.[0]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select 
                    value={field.field_type} 
                    onValueChange={(value) => updateAlertField(index, 'field_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="array">Array</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label>Description</Label>
                <Input
                  value={field.description}
                  onChange={(e) => updateAlertField(index, 'description', e.target.value)}
                  placeholder="What this field represents..."
                />
              </div>
              
              <div className="space-y-2 mt-4">
                <Label>Sample Value</Label>
                <Input
                  value={field.sample_value}
                  onChange={(e) => updateAlertField(index, 'sample_value', e.target.value)}
                  placeholder="Example value for this field..."
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox 
                  id={`required-${index}`}
                  checked={field.required}
                  onCheckedChange={(checked) => updateAlertField(index, 'required', checked)}
                />
                <Label htmlFor={`required-${index}`}>Required field</Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {requirements.alertFields.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No alert fields defined. Add at least one field to continue.
        </div>
      )}
      
      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-sm">Common XSIAM Alert Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {commonAlertFields.map(field => (
              <div key={field.name} className="flex justify-between">
                <code>{field.name}</code>
                <span className="text-muted-foreground">{field.type}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContentGeneration = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Select Content to Generate</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Card className={requirements.generateContent.correlation ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="correlation"
                checked={requirements.generateContent.correlation}
                onCheckedChange={(checked) => setRequirements(prev => ({
                  ...prev,
                  generateContent: { ...prev.generateContent, correlation: !!checked }
                }))}
              />
              <div>
                <Label htmlFor="correlation" className="font-medium">XQL Correlation Rule</Label>
                <p className="text-sm text-muted-foreground">Detection rule with XQL query logic</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={requirements.generateContent.playbook ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="playbook"
                checked={requirements.generateContent.playbook}
                onCheckedChange={(checked) => setRequirements(prev => ({
                  ...prev,
                  generateContent: { ...prev.generateContent, playbook: !!checked }
                }))}
              />
              <div>
                <Label htmlFor="playbook" className="font-medium">XSIAM Playbook</Label>
                <p className="text-sm text-muted-foreground">Automated response workflow</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={requirements.generateContent.alertLayout ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="alertLayout"
                checked={requirements.generateContent.alertLayout}
                onCheckedChange={(checked) => setRequirements(prev => ({
                  ...prev,
                  generateContent: { ...prev.generateContent, alertLayout: !!checked }
                }))}
              />
              <div>
                <Label htmlFor="alertLayout" className="font-medium">Alert Layout</Label>
                <p className="text-sm text-muted-foreground">Custom incident layout with fields</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={requirements.generateContent.dashboard ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="dashboard"
                checked={requirements.generateContent.dashboard}
                onCheckedChange={(checked) => setRequirements(prev => ({
                  ...prev,
                  generateContent: { ...prev.generateContent, dashboard: !!checked }
                }))}
              />
              <div>
                <Label htmlFor="dashboard" className="font-medium">XSIAM Dashboard</Label>
                <p className="text-sm text-muted-foreground">Analytics dashboard with widgets</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          All content will be generated based on your configuration above. You can modify and refine the generated content after creation.
        </AlertDescription>
      </Alert>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">XSIAM Content Builder</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Comprehensive wizard for generating correlations, playbooks, alert layouts, and dashboards
          </p>
        </div>
      
      <div className="mb-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={`flex-1 flex items-center justify-center p-2 rounded-md text-sm font-medium transition-colors ${
                  currentStep === index
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {step.title}
              </button>
            );
          })}
        </div>
      </div>
      
      {errors.length > 0 && (
        <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>
            Step {currentStep + 1} of {steps.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && renderBasicInfo()}
          {currentStep === 1 && renderDataSources()}
          {currentStep === 2 && renderAlertFields()}
          {currentStep === 6 && renderContentGeneration()}
          
          {/* Placeholder for other steps */}
          {currentStep === 3 && (
            <div className="text-center py-8 text-muted-foreground">
              MITRE ATT&CK mapping interface coming soon...
            </div>
          )}
          {currentStep === 4 && (
            <div className="text-center py-8 text-muted-foreground">
              Response actions configuration coming soon...
            </div>
          )}
          {currentStep === 5 && (
            <div className="text-center py-8 text-muted-foreground">
              Workflow configuration coming soon...
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            if (currentStep === steps.length - 1) {
              console.log('Generating content with requirements:', requirements);
              // TODO: Implement content generation
            } else {
              setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
            }
          }}
        >
          {currentStep === steps.length - 1 ? 'Generate Content' : 'Next'}
        </Button>
      </div>
      </div>
    </div>
  );
};

export default ContentBuilderWizard;