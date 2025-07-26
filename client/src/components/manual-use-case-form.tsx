import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Building2, Target, Users, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UseCase } from '@shared/schema';

const manualUseCaseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['endpoint', 'network', 'cloud', 'identity']),
  
  // Tenant Information (from POV form)
  tenantInfo: z.object({
    tenantUrl: z.string().optional(),
    isMultiTenant: z.boolean().default(false),
    serialNumber: z.string().optional(),
    tenantId: z.string().optional(),
    licenseExpiration: z.string().optional(),
    willMigrateToProduction: z.boolean().default(false),
    customWidgets: z.number().min(0).default(0),
    automationPlaybooks: z.number().min(0).default(0),
    correlationRules: z.number().min(0).default(0),
    hasChildTenants: z.boolean().default(false)
  }),

  // Infrastructure Information
  infrastructureInfo: z.object({
    brokerInstalled: z.boolean().default(false),
    brokerIpHostname: z.string().optional(),
    requiresHA: z.boolean().default(false),
    engineInstalled: z.boolean().default(false),
    engineIpHostname: z.string().optional(),
    isProductionConfig: z.boolean().default(false),
    hasLoadBalancers: z.boolean().default(false),
    networkDiagramUrl: z.string().optional()
  }),

  // Customer Information (enhanced from POV data)
  customerInfo: z.object({
    organizationName: z.string().min(1, 'Organization name is required'),
    industry: z.string().min(1, 'Industry is required'),
    environment: z.string().min(1, 'Environment details are required'),
    teamSize: z.number().min(1, 'Team size must be at least 1'),
    
    // Endpoint Strategy
    endpointStrategy: z.enum(['xdr_agents', 'third_party_edr', 'no_edr']).default('xdr_agents'),
    thirdPartyEdrVendor: z.string().optional(),
    migrationStrategy: z.string().optional(),
    edrContractExpiration: z.string().optional(),
    povAgentCount: z.number().min(0).default(0),
    productionAgentCount: z.number().min(0).default(0),
    fullDeploymentTimeline: z.string().optional(),
    
    // Current Tools and Pain Points
    currentTools: z.array(z.string()).min(1, 'At least one current tool is required'),
    painPoints: z.array(z.string()).min(1, 'At least one pain point is required'),
    
    // Data Sources
    primaryDataSources: z.array(z.string()).default([]),
    desiredDataSources: z.array(z.string()).default([]),
    totalDataSources: z.number().min(0).default(0),
    usingCRIBL: z.boolean().default(false),
    estimatedDataVolume: z.string().optional(),
    
    // Detection Rules
    currentDetectionRules: z.number().min(0).default(0),
    detectionRulesList: z.string().optional(),
    
    // Additional Modules
    interestedInASM: z.boolean().default(false),
    asmLicenses: z.number().min(0).default(0),
    interestedInTIM: z.boolean().default(false),
    timTasks: z.number().min(0).default(0),
    asmSeedUrl: z.string().optional()
  }),

  // Data Sources (from worksheet)
  dataSources: z.array(z.object({
    product: z.string(),
    usedInPOV: z.boolean().default(false),
    onboardStatus: z.string().optional(),
    ingestMethod: z.string().optional(),
    ingestionType: z.string().optional(),
    estimatedVolume: z.string().optional(),
    notes: z.string().optional()
  })).default([]),

  // Use Cases (from worksheet)  
  useCases: z.array(z.object({
    useCase: z.string(),
    description: z.string().optional(),
    dataSourcesUsed: z.array(z.string()).default([]),
    successCriteria: z.string().optional(),
    povScope: z.enum(['in_pov_scope', 'not_in_pov_scope', 'production_only']).default('not_in_pov_scope'),
    testStatus: z.enum(['not_completed', 'in_progress', 'completed', 'failed']).default('not_completed'),
    status: z.string().optional(),
    notes: z.string().optional()
  })).default([]),

  // Technical Requirements
  technicalRequirements: z.object({
    dataVolume: z.string().min(1, 'Data volume is required'),
    compliance: z.array(z.string()),
    integrations: z.array(z.string()),
    sla: z.string().min(1, 'SLA requirements are required')
  }),

  // Success Criteria
  successCriteria: z.object({
    detectionAccuracy: z.number().min(0).max(100),
    responseTime: z.string().min(1, 'Response time target is required'),
    falsePositiveRate: z.number().min(0).max(100),
    businessImpact: z.string().min(10, 'Business impact description is required')
  }),

  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timeline: z.string().min(1, 'Timeline is required'),
  stakeholders: z.array(z.string()).min(1, 'At least one stakeholder is required')
});

type ManualUseCaseForm = z.infer<typeof manualUseCaseSchema>;

interface ManualUseCaseFormProps {
  onSubmit: (useCase: UseCase) => void;
  onCancel: () => void;
}

export function ManualUseCaseForm({ onSubmit, onCancel }: ManualUseCaseFormProps) {
  const { toast } = useToast();
  const [currentTools, setCurrentTools] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [compliance, setCompliance] = useState<string[]>([]);
  const [integrations, setIntegrations] = useState<string[]>([]);
  const [stakeholders, setStakeholders] = useState<string[]>([]);
  const [newTool, setNewTool] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newCompliance, setNewCompliance] = useState('');
  const [newIntegration, setNewIntegration] = useState('');
  const [newStakeholder, setNewStakeholder] = useState('');

  const form = useForm<ManualUseCaseForm>({
    resolver: zodResolver(manualUseCaseSchema),
    defaultValues: {
      category: 'endpoint',
      priority: 'medium',
      customerInfo: {
        teamSize: 5,
        currentTools: [],
        painPoints: []
      },
      technicalRequirements: {
        compliance: [],
        integrations: []
      },
      successCriteria: {
        detectionAccuracy: 95,
        falsePositiveRate: 5
      },
      stakeholders: []
    }
  });

  const addItem = (item: string, setter: (items: string[]) => void, items: string[], inputSetter: (value: string) => void) => {
    if (item.trim() && !items.includes(item.trim())) {
      const newItems = [...items, item.trim()];
      setter(newItems);
      inputSetter('');
    }
  };

  const removeItem = (item: string, setter: (items: string[]) => void, items: string[]) => {
    setter(items.filter(i => i !== item));
  };

  const handleSubmit = (data: ManualUseCaseForm) => {
    // Update arrays with current state
    data.customerInfo.currentTools = currentTools;
    data.customerInfo.painPoints = painPoints;
    data.technicalRequirements.compliance = compliance;
    data.technicalRequirements.integrations = integrations;
    data.stakeholders = stakeholders;

    // Convert to UseCase format
    const useCase: UseCase = {
      id: `manual_${Date.now()}`,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: data.priority,
      threatReportId: '',
      estimatedDuration: String(calculateEstimatedDuration(data)),
      mitreMapping: extractMitreMapping(data.description),
      indicators: extractIndicators(data.description),
      extractedTechniques: data.customerInfo.currentTools,
      extractedMitigations: data.customerInfo.painPoints,
      validated: false,
      validationStatus: 'needs_review',
      metadata: {
        customerInfo: data.customerInfo,
        technicalRequirements: data.technicalRequirements,
        successCriteria: data.successCriteria,
        timeline: data.timeline,
        stakeholders: data.stakeholders,
        entryDate: new Date().toISOString(),
        povObjectives: generatePOVObjectives(data),
        source: 'manual_entry'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    onSubmit(useCase);
    toast({
      title: "DoR Use Case Created",
      description: `Customer DoR use case "${data.title}" created - ready for comprehensive POV content generation including data sources, correlation rules, alert layouts, playbooks, and dashboards.`
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Customer Design of Record (DoR) Entry
          </CardTitle>
          <CardDescription>
            Enter customer-specific requirements to generate comprehensive POV content: 5 use cases each with data source integrations, XSIAM correlation rules, alert layouts with analyst decision support, automation playbooks, and operational dashboards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Use Case Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Advanced Persistent Threat Detection"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={(value) => form.setValue('category', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="endpoint">Endpoint Security</SelectItem>
                    <SelectItem value="network">Network Security</SelectItem>
                    <SelectItem value="cloud">Cloud Security</SelectItem>
                    <SelectItem value="identity">Identity & Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the threat scenario, attack vectors, and detection challenges..."
                rows={4}
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-4 w-4" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">Organization Name</Label>
                    <Input
                      id="organizationName"
                      placeholder="Customer organization"
                      {...form.register('customerInfo.organizationName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Financial Services, Healthcare"
                      {...form.register('customerInfo.industry')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment Details</Label>
                  <Textarea
                    id="environment"
                    placeholder="Describe the customer's current environment, architecture, and infrastructure..."
                    {...form.register('customerInfo.environment')}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teamSize">Security Team Size</Label>
                    <Input
                      id="teamSize"
                      type="number"
                      min="1"
                      {...form.register('customerInfo.teamSize', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select onValueChange={(value) => form.setValue('priority', value as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Current Tools */}
                <div className="space-y-2">
                  <Label>Current Security Tools</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTool}
                      onChange={(e) => setNewTool(e.target.value)}
                      placeholder="Add security tool"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newTool, setCurrentTools, currentTools, setNewTool))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem(newTool, setCurrentTools, currentTools, setNewTool)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentTools.map((tool) => (
                      <Badge key={tool} variant="secondary" className="flex items-center gap-1">
                        {tool}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem(tool, setCurrentTools, currentTools)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Pain Points */}
                <div className="space-y-2">
                  <Label>Current Pain Points</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newPainPoint}
                      onChange={(e) => setNewPainPoint(e.target.value)}
                      placeholder="Add pain point"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newPainPoint, setPainPoints, painPoints, setNewPainPoint))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem(newPainPoint, setPainPoints, painPoints, setNewPainPoint)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {painPoints.map((point) => (
                      <Badge key={point} variant="destructive" className="flex items-center gap-1">
                        {point}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem(point, setPainPoints, painPoints)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Success Criteria */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-4 w-4" />
                  Success Criteria & Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="detectionAccuracy">Target Detection Accuracy (%)</Label>
                    <Input
                      id="detectionAccuracy"
                      type="number"
                      min="0"
                      max="100"
                      {...form.register('successCriteria.detectionAccuracy', { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="falsePositiveRate">Max False Positive Rate (%)</Label>
                    <Input
                      id="falsePositiveRate"
                      type="number"
                      min="0"
                      max="100"
                      {...form.register('successCriteria.falsePositiveRate', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responseTime">Target Response Time</Label>
                    <Input
                      id="responseTime"
                      placeholder="e.g., 15 minutes, 1 hour"
                      {...form.register('successCriteria.responseTime')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Project Timeline</Label>
                    <Input
                      id="timeline"
                      placeholder="e.g., 30 days, 3 months"
                      {...form.register('timeline')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessImpact">Expected Business Impact</Label>
                  <Textarea
                    id="businessImpact"
                    placeholder="Describe the expected business impact and ROI..."
                    {...form.register('successCriteria.businessImpact')}
                  />
                </div>

                {/* Stakeholders */}
                <div className="space-y-2">
                  <Label>Key Stakeholders</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newStakeholder}
                      onChange={(e) => setNewStakeholder(e.target.value)}
                      placeholder="Add stakeholder"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newStakeholder, setStakeholders, stakeholders, setNewStakeholder))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem(newStakeholder, setStakeholders, stakeholders, setNewStakeholder)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stakeholders.map((stakeholder) => (
                      <Badge key={stakeholder} variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {stakeholder}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem(stakeholder, setStakeholders, stakeholders)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">
                Create Use Case
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function calculateEstimatedDuration(data: ManualUseCaseForm): number {
  let baseDuration = 120; // 2 hours base
  
  // Adjust based on complexity factors
  if (data.priority === 'critical') baseDuration += 60;
  if (data.priority === 'high') baseDuration += 30;
  if (data.customerInfo.currentTools.length > 5) baseDuration += 30;
  if (data.technicalRequirements.compliance.length > 2) baseDuration += 45;
  if (data.successCriteria.detectionAccuracy > 95) baseDuration += 30;
  if (data.successCriteria.falsePositiveRate < 3) baseDuration += 45;
  
  return baseDuration;
}

function extractMitreMapping(description: string): string[] {
  const mitrePatterns = [
    'T1055', 'T1059', 'T1105', 'T1203', 'T1566', 'T1078', 'T1083', 'T1027',
    'T1003', 'T1021', 'T1033', 'T1057', 'T1082', 'T1087', 'T1136', 'T1547'
  ];
  
  return mitrePatterns.filter(pattern => 
    description.toUpperCase().includes(pattern)
  );
}

function extractIndicators(description: string): string[] {
  const indicators: string[] = [];
  
  // Extract potential file hashes, IPs, domains
  const hashPattern = /\b[a-f0-9]{32,64}\b/gi;
  const ipPattern = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const domainPattern = /\b[a-z0-9-]+\.[a-z]{2,}\b/gi;
  
  const hashes = description.match(hashPattern) || [];
  const ips = description.match(ipPattern) || [];
  const domains = description.match(domainPattern) || [];
  
  indicators.push(...hashes, ...ips, ...domains);
  
  return Array.from(new Set(indicators));
}

function generatePOVObjectives(data: ManualUseCaseForm): string[] {
  return [
    `Generate 5 comprehensive POV use cases for ${data.title}`,
    `Create data source integrations for: ${data.customerInfo.primaryDataSources.join(', ')}`,
    `Develop XSIAM correlation rules with ${data.successCriteria.detectionAccuracy}% accuracy`,
    `Build alert layouts with analyst decision support and action buttons (isolate endpoint, reset user credentials, etc.)`,
    `Create automation playbooks for ${data.successCriteria.responseTime} response time`,
    `Design operational dashboards for real-time monitoring`,
    `Integrate with customer tools: ${data.customerInfo.currentTools.join(', ')}`,
    `Address pain points: ${data.customerInfo.painPoints.join(', ')}`,
    `Maintain false positive rate below ${data.successCriteria.falsePositiveRate}%`,
    `Demonstrate ROI through ${data.successCriteria.businessImpact}`
  ];
}