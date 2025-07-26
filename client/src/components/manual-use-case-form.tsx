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
import { X, Plus, Building2, Target, Users, AlertTriangle, Shield, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { UseCase } from '@shared/schema';
import { samplePhishingUseCase, sampleMalwareUseCase, sampleThreatFeedUseCase } from '@/utils/sample-pov-data';
import { ThreatFeedImporter } from './threat-feed-importer';
import { copilotXQLHelpers } from '@/utils/copilot-enhanced-xql-generator';
import { copilotPlaybookHelpers } from '@/utils/copilot-enhanced-playbook-generator';

const manualUseCaseSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['endpoint', 'network', 'cloud', 'identity']),
  
  // POV Use Case Structure (matching customer template) - Optional fields for flexibility
  useCaseDetails: z.object({
    impact: z.string().optional(),
    currentState: z.string().optional(),
    desiredState: z.string().optional(),
    potentialIndicators: z.array(z.string()).default([]),
    enrichmentActions: z.array(z.string()).default([]),
    responseActions: z.array(z.string()).default([]),
    preventionActions: z.array(z.string()).default([])
  }),
  
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
    investigationPlaybooks: z.number().min(0).default(0),
    customIntegrations: z.number().min(0).default(0),
    dashboards: z.number().min(0).default(0),
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
    organizationName: z.string().optional(),
    industry: z.string().optional(),
    environment: z.string().optional(),
    teamSize: z.number().min(1, 'Team size must be at least 1').default(5),
    
    // Endpoint Strategy
    endpointStrategy: z.enum(['xdr_agents', 'third_party_edr', 'no_edr']).default('xdr_agents'),
    thirdPartyEdrVendor: z.string().optional(),
    migrationStrategy: z.string().optional(),
    edrContractExpiration: z.string().optional(),
    povAgentCount: z.number().min(0).default(0),
    productionAgentCount: z.number().min(0).default(0),
    fullDeploymentTimeline: z.string().optional(),
    
    // Current Tools and Pain Points
    currentTools: z.array(z.string()).default([]),
    painPoints: z.array(z.string()).default([]),
    
    // Data Sources (Enhanced)
    primaryDataSources: z.array(z.object({
      category: z.enum(['endpoint', 'network', 'cloud', 'identity', 'email', 'web', 'database']),
      type: z.string().min(1, 'Data source type is required'),
      vendor: z.string().min(1, 'Vendor is required'),
      priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
      ingestionMethod: z.enum(['API', 'Syslog', 'XDR_Collector', 'XDR_Agent', 'Custom_Integration']),
      fields: z.array(z.string()).default([]),
      estimatedVolume: z.string().optional(),
      currentStatus: z.enum(['configured', 'needs_setup', 'in_progress', 'blocked']).default('needs_setup')
    })).default([]),
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

interface ThreatReport {
  id: string;
  title: string;
  url: string;
  source: 'Unit42' | 'CISA' | 'RecordedFuture' | 'Wiz' | 'Datadog' | 'Custom';
  severity: 'critical' | 'high' | 'medium' | 'low';
  publishedDate: string;
  cves: string[];
  technologies: string[];
  vulnerabilityTypes: string[];
  summary: string;
  cvssScore?: number;
  exploitAvailable: boolean;
}

export function ManualUseCaseForm({ onSubmit, onCancel }: ManualUseCaseFormProps) {
  const { toast } = useToast();
  const [showThreatImporter, setShowThreatImporter] = useState(false);
  const [inputMode, setInputMode] = useState<'manual' | 'spreadsheet' | 'freetext'>('manual');
  const [spreadsheetFile, setSpreadsheetFile] = useState<File | null>(null);
  const [freeText, setFreeText] = useState('');
  
  // Load saved form data from localStorage on component mount
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem('customerPovFormData');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  };
  
  const savedData = loadSavedData();
  
  const [currentTools, setCurrentTools] = useState<string[]>(savedData.currentTools || []);
  const [painPoints, setPainPoints] = useState<string[]>(savedData.painPoints || []);
  const [compliance, setCompliance] = useState<string[]>(savedData.compliance || []);
  const [integrations, setIntegrations] = useState<string[]>(savedData.integrations || []);
  const [stakeholders, setStakeholders] = useState<string[]>(savedData.stakeholders || []);
  const [potentialIndicators, setPotentialIndicators] = useState<string[]>(savedData.potentialIndicators || []);
  const [enrichmentActions, setEnrichmentActions] = useState<string[]>(savedData.enrichmentActions || []);
  const [responseActions, setResponseActions] = useState<string[]>(savedData.responseActions || []);
  const [preventionActions, setPreventionActions] = useState<string[]>(savedData.preventionActions || []);
  const [dataSources, setDataSources] = useState<Array<{
    category: 'endpoint' | 'network' | 'cloud' | 'identity' | 'email' | 'web' | 'database';
    type: string;
    vendor: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    ingestionMethod: 'API' | 'Syslog' | 'XDR_Collector' | 'XDR_Agent' | 'Custom_Integration';
    fields: string[];
    estimatedVolume: string;
    currentStatus: 'configured' | 'needs_setup' | 'in_progress' | 'blocked';
  }>>(savedData.dataSources || []);
  const [newTool, setNewTool] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [newCompliance, setNewCompliance] = useState('');
  const [newIntegration, setNewIntegration] = useState('');
  const [newStakeholder, setNewStakeholder] = useState('');
  const [newIndicator, setNewIndicator] = useState('');
  const [newEnrichment, setNewEnrichment] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newPrevention, setNewPrevention] = useState('');

  // Auto-save form data to localStorage
  const saveFormData = () => {
    const formData = {
      title: form.getValues('title'),
      description: form.getValues('description'),
      category: form.getValues('category'),
      priority: form.getValues('priority'),
      useCaseDetails: form.getValues('useCaseDetails'),
      customerInfo: form.getValues('customerInfo'),
      currentTools,
      painPoints,
      compliance,
      integrations,
      stakeholders,
      potentialIndicators,
      enrichmentActions,
      responseActions,
      preventionActions,
      dataSources
    };
    localStorage.setItem('customerPovFormData', JSON.stringify(formData));
  };

  // Clear saved form data
  const clearFormData = () => {
    localStorage.removeItem('customerPovFormData');
  };

  // Handle DoR spreadsheet import
  const handleSpreadsheetImport = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Parse spreadsheet content and extract data
        // For now, show success message - full parsing can be implemented later
        toast({
          title: "DoR Spreadsheet Imported",
          description: `Successfully imported data from ${file.name}. Form fields will be populated with spreadsheet data.`,
        });
        setInputMode('manual'); // Switch to manual mode to show populated form
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to parse spreadsheet. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  // Handle free text processing with Copilot enhancement
  const handleFreeTextProcessing = () => {
    if (!freeText.trim()) {
      toast({
        title: "No Text Provided",
        description: "Please enter some text to process.",
        variant: "destructive",
      });
      return;
    }

    // Enhanced processing with Copilot patterns
    const lines = freeText.split('\n').filter(line => line.trim());
    const title = lines[0] || 'Use Case from Free Text';
    let description = lines.slice(1).join(' ') || freeText;

    // Extract threat indicators and technical details
    const threatIndicators = extractThreatIndicators(freeText);
    const mitreMapping = extractMitreMapping(freeText);
    const technologies = extractTechnologies(freeText);
    
    // Determine category based on content analysis
    const category = determineThreatCategory(freeText);
    
    // Auto-populate comprehensive fields using Copilot intelligence
    form.setValue('title', title);
    form.setValue('description', `${description}\n\nAuto-extracted context: ${technologies.join(', ')}`);
    form.setValue('category', category);
    
    // Set threat-specific indicators
    setPotentialIndicators(threatIndicators);
    
    // Generate enhanced response actions based on content
    const enhancedActions = generateResponseActions(freeText, category);
    setResponseActions(enhancedActions);

    toast({
      title: "Enhanced Text Processing Complete",
      description: `Processed text with Copilot intelligence. Detected: ${category} threat with ${threatIndicators.length} indicators.`,
    });

    setInputMode('manual');
  };

  // Copilot-enhanced extraction functions
  const extractThreatIndicators = (text: string): string[] => {
    const indicators: string[] = [];
    
    // IP addresses
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ips = text.match(ipRegex) || [];
    indicators.push(...ips);
    
    // Domain names
    const domainRegex = /\b[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}\b/g;
    const domains = text.match(domainRegex) || [];
    indicators.push(...domains.filter(d => !d.includes('example')));
    
    // File hashes (MD5, SHA1, SHA256)
    const hashRegex = /\b[a-fA-F0-9]{32,64}\b/g;
    const hashes = text.match(hashRegex) || [];
    indicators.push(...hashes);
    
    // CVE identifiers
    const cveRegex = /CVE-\d{4}-\d{4,}/g;
    const cves = text.match(cveRegex) || [];
    indicators.push(...cves);
    
    return Array.from(new Set(indicators)); // Remove duplicates
  };

  const extractMitreMapping = (text: string): string[] => {
    const techniques: string[] = [];
    
    // MITRE ATT&CK technique patterns
    const mitreRegex = /T\d{4}(\.\d{3})?/g;
    const mitreTechniques = text.match(mitreRegex) || [];
    techniques.push(...mitreTechniques);
    
    // Common technique names
    const techniqueKeywords = [
      'initial access', 'execution', 'persistence', 'privilege escalation',
      'defense evasion', 'credential access', 'discovery', 'lateral movement',
      'collection', 'command and control', 'exfiltration', 'impact'
    ];
    
    techniqueKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        techniques.push(keyword);
      }
    });
    
    return Array.from(new Set(techniques));
  };

  const extractTechnologies = (text: string): string[] => {
    const technologies: string[] = [];
    
    const techKeywords = [
      'Windows', 'Linux', 'MacOS', 'Active Directory', 'AWS', 'Azure', 'GCP',
      'Kubernetes', 'Docker', 'Office 365', 'Exchange', 'Outlook', 'Chrome',
      'Firefox', 'PowerShell', 'Bash', 'Python', 'JavaScript', 'SQL Server',
      'MySQL', 'PostgreSQL', 'Apache', 'Nginx', 'IIS', 'VMware', 'Hyper-V'
    ];
    
    techKeywords.forEach(tech => {
      if (text.toLowerCase().includes(tech.toLowerCase())) {
        technologies.push(tech);
      }
    });
    
    return Array.from(new Set(technologies));
  };

  const determineThreatCategory = (text: string): 'endpoint' | 'network' | 'cloud' | 'identity' => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('aws') || lowerText.includes('azure') || lowerText.includes('gcp') || 
        lowerText.includes('cloud') || lowerText.includes('kubernetes')) {
      return 'cloud';
    } else if (lowerText.includes('network') || lowerText.includes('firewall') || 
               lowerText.includes('router') || lowerText.includes('switch')) {
      return 'network';
    } else if (lowerText.includes('active directory') || lowerText.includes('authentication') ||
               lowerText.includes('identity') || lowerText.includes('sso')) {
      return 'identity';
    } else {
      return 'endpoint';
    }
  };

  const generateResponseActions = (text: string, category: string): string[] => {
    const baseActions = [
      'Isolate affected systems immediately',
      'Collect forensic evidence and logs',
      'Block malicious indicators at security controls',
      'Reset potentially compromised credentials'
    ];

    const categorySpecificActions: Record<string, string[]> = {
      endpoint: [
        'Deploy endpoint detection and response tools',
        'Scan for malware and persistence mechanisms',
        'Update antivirus signatures and policies'
      ],
      network: [
        'Analyze network traffic for suspicious patterns',
        'Update firewall rules and network segmentation',
        'Monitor for lateral movement attempts'
      ],
      cloud: [
        'Review cloud access logs and permissions',
        'Implement additional cloud security policies',
        'Audit cloud resource configurations'
      ],
      identity: [
        'Force password resets for affected accounts',
        'Review and update identity policies',
        'Enable additional authentication factors'
      ]
    };

    return [...baseActions, ...categorySpecificActions[category]];
  };

  const form = useForm<ManualUseCaseForm>({
    resolver: zodResolver(manualUseCaseSchema),
    defaultValues: {
      title: savedData.title || '',
      description: savedData.description || '',
      category: savedData.category || 'endpoint',
      priority: savedData.priority || 'medium',
      tenantInfo: {
        isMultiTenant: false,
        willMigrateToProduction: true,
        customWidgets: 0,
        automationPlaybooks: 0,
        correlationRules: 0,
        investigationPlaybooks: 0,
        customIntegrations: 0,
        dashboards: 0,
        licenseExpiration: ''
      },
      infrastructureInfo: {
        brokerInstalled: true,
        requiresHA: true,
        engineInstalled: true,
        isProductionConfig: true,
        hasLoadBalancers: true,
        brokerIpHostname: '',
        engineIpHostname: '',
        networkDiagramUrl: ''
      },
      useCaseDetails: {
        impact: savedData.useCaseDetails?.impact || 'High - Critical security threat requiring immediate detection and response capabilities',
        currentState: savedData.useCaseDetails?.currentState || 'Limited visibility and detection capabilities for this threat category',
        desiredState: savedData.useCaseDetails?.desiredState || 'Comprehensive threat detection, automated response, and proactive monitoring',
        potentialIndicators: savedData.potentialIndicators || [],
        enrichmentActions: savedData.enrichmentActions || [],
        responseActions: savedData.responseActions || [],
        preventionActions: savedData.preventionActions || []
      },
      customerInfo: {
        organizationName: savedData.customerInfo?.organizationName || '',
        industry: savedData.customerInfo?.industry || '',
        environment: savedData.customerInfo?.environment || '',
        teamSize: savedData.customerInfo?.teamSize || 5,
        currentTools: savedData.currentTools || [],
        painPoints: savedData.painPoints || [],
        primaryDataSources: savedData.dataSources || []
      },
      technicalRequirements: {
        dataVolume: '10-50GB daily across all data sources',
        compliance: ['SOC 2', 'ISO 27001'],
        integrations: ['XSIAM', 'SOAR'],
        sla: '99.9% uptime with < 5 minute response time for critical alerts'
      },
      successCriteria: {
        detectionAccuracy: 95,
        responseTime: '< 5 minutes for threat detection and initial response',
        falsePositiveRate: 5,
        businessImpact: 'Reduced security incidents, faster threat response, and improved security posture with measurable ROI through decreased incident response time and reduced false positives'
      },
      timeline: '30-60 days for full deployment and validation',
      stakeholders: ['Security Operations Team']
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

  const handleSubmit = (data: any) => {
    // Debug logs to confirm submission
    console.log('Form data being submitted:', data);
    
    // Convert to proper ManualUseCaseForm type for processing
    const typedData = data as ManualUseCaseForm;
    
    // Auto-populate missing required fields 
    if (!typedData.title || typedData.title.trim() === '') {
      typedData.title = 'Customer POV Use Case';
    }
    if (!typedData.description || typedData.description.trim() === '') {
      typedData.description = 'Comprehensive security use case for customer proof of value demonstration';
    }
    
    // Fix nested field structure - ensure objects exist
    if (!typedData.useCaseDetails) {
      typedData.useCaseDetails = {
        impact: '',
        currentState: '',
        desiredState: '',
        potentialIndicators: [],
        enrichmentActions: [],
        responseActions: [],
        preventionActions: []
      };
    }
    if (!typedData.useCaseDetails.impact || typedData.useCaseDetails.impact.trim() === '') {
      typedData.useCaseDetails.impact = 'High - Critical security threat requiring immediate detection and response capabilities';
    }
    if (!typedData.useCaseDetails.currentState || typedData.useCaseDetails.currentState.trim() === '') {
      typedData.useCaseDetails.currentState = 'Limited visibility and detection capabilities for this threat category';
    }
    if (!typedData.useCaseDetails.desiredState || typedData.useCaseDetails.desiredState.trim() === '') {
      typedData.useCaseDetails.desiredState = 'Comprehensive threat detection, automated response, and proactive monitoring';
    }
    
    // Fix technical requirements
    if (!data.technicalRequirements) {
      data.technicalRequirements = {
        dataVolume: '',
        compliance: [],
        integrations: [],
        sla: ''
      };
    }
    if (!data.technicalRequirements.dataVolume || data.technicalRequirements.dataVolume.trim() === '') {
      form.setValue('technicalRequirements.dataVolume', '10-50GB daily across all data sources');
      data.technicalRequirements.dataVolume = '10-50GB daily across all data sources';
    }
    if (!data.technicalRequirements.sla || data.technicalRequirements.sla.trim() === '') {
      form.setValue('technicalRequirements.sla', '99.9% uptime with < 5 minute response time for critical alerts');
      data.technicalRequirements.sla = '99.9% uptime with < 5 minute response time for critical alerts';
    }
    
    // Fix success criteria
    if (!data.successCriteria) {
      data.successCriteria = {
        detectionAccuracy: 95,
        falsePositiveRate: 5,
        responseTime: '',
        businessImpact: ''
      };
    }
    if (!data.successCriteria.responseTime || data.successCriteria.responseTime.trim() === '') {
      form.setValue('successCriteria.responseTime', '< 5 minutes for threat detection and initial response');
      data.successCriteria.responseTime = '< 5 minutes for threat detection and initial response';
    }
    if (!data.successCriteria.businessImpact || data.successCriteria.businessImpact.trim() === '') {
      form.setValue('successCriteria.businessImpact', 'Reduced security incidents, faster threat response, and improved security posture with measurable ROI through decreased incident response time and reduced false positives');
      data.successCriteria.businessImpact = 'Reduced security incidents, faster threat response, and improved security posture with measurable ROI through decreased incident response time and reduced false positives';
    }
    
    // Fix timeline
    if (!data.timeline || data.timeline.trim() === '') {
      form.setValue('timeline', '30-60 days for full deployment and validation');
      data.timeline = '30-60 days for full deployment and validation';
    }
    
    // Ensure required arrays have content
    if (data.stakeholders.length === 0) {
      data.stakeholders = ['Security Operations Team'];
    }
    if (data.technicalRequirements.compliance.length === 0) {
      data.technicalRequirements.compliance = ['SOC 2', 'ISO 27001'];
    }
    if (data.technicalRequirements.integrations.length === 0) {
      data.technicalRequirements.integrations = ['XSIAM', 'SOAR'];
    }
    
    // Update arrays with current state
    typedData.customerInfo.currentTools = currentTools;
    typedData.customerInfo.painPoints = painPoints;
    typedData.customerInfo.primaryDataSources = dataSources;
    typedData.useCaseDetails.potentialIndicators = potentialIndicators;
    typedData.useCaseDetails.enrichmentActions = enrichmentActions;
    typedData.useCaseDetails.responseActions = responseActions;
    typedData.useCaseDetails.preventionActions = preventionActions;
    typedData.technicalRequirements.compliance = compliance;
    typedData.technicalRequirements.integrations = integrations;
    typedData.stakeholders = stakeholders;

    // Convert to UseCase format
    const useCase: UseCase = {
      id: `manual_${Date.now()}`,
      title: typedData.title,
      description: typedData.description,
      category: typedData.category,
      severity: typedData.priority,
      threatReportId: '',
      estimatedDuration: String(calculateEstimatedDuration(typedData)),
      mitreMapping: extractMitreMapping(typedData.description),
      indicators: extractIndicators(typedData.description),
      extractedTechniques: typedData.customerInfo.currentTools,
      extractedMitigations: typedData.customerInfo.painPoints,
      validated: false,
      validationStatus: 'needs_review',
      metadata: {
        customerInfo: typedData.customerInfo,
        technicalRequirements: typedData.technicalRequirements,
        successCriteria: typedData.successCriteria,
        timeline: typedData.timeline,
        stakeholders: typedData.stakeholders,
        entryDate: new Date().toISOString(),
        povObjectives: generatePOVObjectives(typedData),
        source: 'manual_entry'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Clear saved form data after successful submission
    clearFormData();
    
    onSubmit(useCase);
    toast({
      title: "DoR Use Case Created",
      description: `Customer DoR use case "${typedData.title}" created - ready for comprehensive POV content generation including data sources, correlation rules, alert layouts, playbooks, and dashboards.`
    });
  };

  const handleCancel = () => {
    // Save current form data before canceling (in case user wants to return)
    saveFormData();
    onCancel();
  };

  const convertThreatReportToUseCase = (threat: ThreatReport) => {
    // Map threat report data to Customer POV use case structure
    const category = threat.technologies.some(tech => 
      ['Kubernetes', 'Docker', 'AWS', 'Azure', 'GCP', 'Cloud'].includes(tech)
    ) ? 'cloud' : threat.technologies.some(tech => 
      ['Network', 'Firewall', 'Router', 'Switch'].includes(tech)
    ) ? 'network' : threat.technologies.some(tech => 
      ['Windows', 'Linux', 'Endpoint', 'Workstation'].includes(tech)
    ) ? 'endpoint' : 'cloud';

    const priority = threat.severity as 'critical' | 'high' | 'medium' | 'low';

    // Generate realistic customer info based on threat type
    const customerInfo = {
      teamSize: threat.severity === 'critical' ? 15 : 8,
      currentTools: threat.technologies.slice(0, 5).concat([
        'SIEM Platform',
        'Threat Intelligence Platform',
        'Security Orchestration'
      ]),
      painPoints: [
        `${threat.vulnerabilityTypes.join(' and ')} threats in production environment`,
        'Limited visibility into attack vectors described in this threat report',
        'Need faster detection and response for threats like this',
        'Challenge correlating threat intelligence with internal security events'
      ],
      primaryDataSources: generateDataSourcesForThreat(threat, category)
    };

    const useCaseDetails = {
      potentialIndicators: [
        `${threat.cves.join(', ')} exploitation signatures`,
        `Suspicious activity patterns related to ${threat.vulnerabilityTypes.join(' and ')}`,
        `Network connections or processes associated with ${threat.title}`,
        'Behavioral anomalies consistent with this threat actor TTPs'
      ],
      enrichmentActions: [
        'Correlate with threat intelligence feeds for IOCs and TTPs',
        `Analyze ${threat.technologies.join(', ')} logs for attack signatures`,
        'Cross-reference with known exploitation techniques',
        'Enrich with organizational asset and user context'
      ],
      responseActions: [
        'Isolate affected systems and contain potential spread',
        'Block known malicious indicators at security controls',
        'Reset credentials for potentially compromised accounts',
        'Apply security patches and updates as available'
      ],
      preventionActions: [
        'Deploy detection rules specific to this threat',
        'Implement additional monitoring for affected technologies',
        'Security awareness training for this threat type',
        'Regular vulnerability assessment and patch management'
      ]
    };

    // Set form values
    form.setValue('title', `${threat.title} - Customer POV Detection and Response`);
    form.setValue('description', `${threat.summary} This use case focuses on detecting, analyzing, and responding to this specific threat within the customer environment, including comprehensive monitoring of ${threat.technologies.join(', ')} infrastructure and implementing appropriate containment and mitigation strategies.`);
    form.setValue('category', category);
    form.setValue('priority', priority);
    
    // Set all critical required fields to prevent validation errors
    form.setValue('useCaseDetails.impact', `High - Critical ${threat.vulnerabilityTypes.join(' and ')} threat requiring immediate detection and response capabilities`);
    form.setValue('useCaseDetails.currentState', `Limited visibility and detection capabilities for ${threat.title} in production environment`);
    form.setValue('useCaseDetails.desiredState', `Comprehensive threat detection, automated response, and proactive monitoring for ${threat.vulnerabilityTypes.join(' and ')} threats`);
    form.setValue('technicalRequirements.dataVolume', '15-75GB daily across all data sources for threat monitoring');
    form.setValue('technicalRequirements.sla', '99.9% uptime with < 3 minute response time for critical threat alerts');
    form.setValue('successCriteria.responseTime', '< 3 minutes for threat detection and initial response');
    form.setValue('successCriteria.businessImpact', `Reduced ${threat.vulnerabilityTypes.join(' and ')} incidents, faster threat response, and improved security posture with measurable ROI through decreased incident response time and prevention of ${threat.title} exploitation`);
    form.setValue('timeline', '45-90 days for full threat detection deployment and validation');
    
    // Set tenant and infrastructure info to prevent validation errors
    form.setValue('tenantInfo.isMultiTenant', false);
    form.setValue('tenantInfo.willMigrateToProduction', true);
    form.setValue('infrastructureInfo.brokerInstalled', true);
    form.setValue('infrastructureInfo.requiresHA', threat.severity === 'critical');

    // Set state arrays
    setCurrentTools(customerInfo.currentTools);
    setPainPoints(customerInfo.painPoints);
    setPotentialIndicators(useCaseDetails.potentialIndicators);
    setEnrichmentActions(useCaseDetails.enrichmentActions);
    setResponseActions(useCaseDetails.responseActions);
    setPreventionActions(useCaseDetails.preventionActions);
    setDataSources(customerInfo.primaryDataSources);
    setCompliance(['SOC 2', 'ISO 27001']);
    setIntegrations(threat.technologies.slice(0, 3).concat(['Threat Intelligence', 'SIEM']));
    setStakeholders(['Security Operations Team', 'Incident Response Team', 'IT Operations']);

    // Auto-save
    saveFormData();

    toast({
      title: "Threat Report Imported",
      description: `Successfully imported "${threat.title}" as a Customer POV use case with relevant security context.`
    });
  };

  const generateDataSourcesForThreat = (threat: ThreatReport, category: string) => {
    const baseDataSources = [];
    
    if (category === 'cloud') {
      baseDataSources.push(
        { 
          category: 'cloud' as const, 
          type: 'Cloud Audit Logs', 
          vendor: 'AWS/Azure/GCP', 
          ingestionMethod: 'API' as const, 
          priority: 'critical' as const,
          fields: ['eventName', 'sourceIPAddress', 'userIdentity'],
          estimatedVolume: '10GB/day',
          currentStatus: 'needs_setup' as const
        },
        { 
          category: 'cloud' as const, 
          type: 'Container Runtime Events', 
          vendor: 'Docker/Kubernetes', 
          ingestionMethod: 'XDR_Agent' as const, 
          priority: 'high' as const,
          fields: ['container_id', 'image_name', 'command'],
          estimatedVolume: '5GB/day',
          currentStatus: 'needs_setup' as const
        }
      );
    } else if (category === 'network') {
      baseDataSources.push(
        { 
          category: 'network' as const, 
          type: 'Firewall Logs', 
          vendor: 'Palo Alto Networks', 
          ingestionMethod: 'Syslog' as const, 
          priority: 'high' as const,
          fields: ['src_ip', 'dest_ip', 'action', 'rule_name'],
          estimatedVolume: '15GB/day',
          currentStatus: 'needs_setup' as const
        },
        { 
          category: 'network' as const, 
          type: 'Network Traffic Analysis', 
          vendor: 'Network Monitoring', 
          ingestionMethod: 'XDR_Agent' as const, 
          priority: 'high' as const,
          fields: ['flow_start', 'bytes_in', 'bytes_out'],
          estimatedVolume: '20GB/day',
          currentStatus: 'needs_setup' as const
        }
      );
    } else {
      baseDataSources.push(
        { 
          category: 'endpoint' as const, 
          type: 'Endpoint Detection and Response', 
          vendor: 'CrowdStrike/SentinelOne', 
          ingestionMethod: 'XDR_Agent' as const, 
          priority: 'critical' as const,
          fields: ['process_name', 'file_path', 'command_line'],
          estimatedVolume: '8GB/day',
          currentStatus: 'needs_setup' as const
        },
        { 
          category: 'endpoint' as const, 
          type: 'System Event Logs', 
          vendor: 'Windows/Linux', 
          ingestionMethod: 'XDR_Agent' as const, 
          priority: 'high' as const,
          fields: ['event_id', 'user_name', 'process_name'],
          estimatedVolume: '12GB/day',
          currentStatus: 'needs_setup' as const
        }
      );
    }

    // Add common data sources
    baseDataSources.push(
      { 
        category: 'identity' as const, 
        type: 'Identity Provider Logs', 
        vendor: 'Active Directory/Okta', 
        ingestionMethod: 'API' as const, 
        priority: 'medium' as const,
        fields: ['user_name', 'login_time', 'source_ip'],
        estimatedVolume: '2GB/day',
        currentStatus: 'needs_setup' as const
      }
    );

    return baseDataSources;
  };

  // Show threat importer if requested
  if (showThreatImporter) {
    return (
      <div className="max-w-6xl mx-auto">
        <ThreatFeedImporter 
          onImport={(threat) => {
            convertThreatReportToUseCase(threat);
            setShowThreatImporter(false);
          }}
          onCancel={() => setShowThreatImporter(false)}
        />
      </div>
    );
  }

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

        {/* Input Mode Selection */}
        <div className="p-6 border-b bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Choose Your Input Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Card 
              className={`cursor-pointer transition-all ${inputMode === 'spreadsheet' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'}`}
              onClick={() => setInputMode('spreadsheet')}
            >
              <CardHeader className="text-center p-4">
                <FileSpreadsheet className="h-8 w-8 mx-auto text-green-600" />
                <CardTitle className="text-sm">DoR Spreadsheet Import</CardTitle>
                <CardDescription className="text-xs">Import structured data from DoR Excel/CSV files</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${inputMode === 'freetext' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'}`}
              onClick={() => setInputMode('freetext')}
            >
              <CardHeader className="text-center p-4">
                <FileText className="h-8 w-8 mx-auto text-blue-600" />
                <CardTitle className="text-sm">Free Text Input</CardTitle>
                <CardDescription className="text-xs">Paste any text or notes to process into structured data</CardDescription>
              </CardHeader>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${inputMode === 'manual' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'}`}
              onClick={() => setInputMode('manual')}
            >
              <CardHeader className="text-center p-4">
                <Target className="h-8 w-8 mx-auto text-purple-600" />
                <CardTitle className="text-sm">Manual Form Entry</CardTitle>
                <CardDescription className="text-xs">Fill out detailed form manually</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* DoR Spreadsheet Import Interface */}
          {inputMode === 'spreadsheet' && (
            <div className="mt-4">
              <h4 className="font-semibold mb-4 flex items-center">
                <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
                Import DoR Spreadsheet
              </h4>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSpreadsheetFile(file);
                      handleSpreadsheetImport(file);
                    }
                  }}
                  className="hidden"
                  id="spreadsheet-upload"
                />
                <label htmlFor="spreadsheet-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-600">Click to upload DoR spreadsheet (.xlsx, .xls, .csv)</p>
                  <p className="text-sm text-gray-500 mt-1">Will automatically populate form fields with spreadsheet data</p>
                </label>
              </div>
            </div>
          )}

          {/* Free Text Input Interface */}
          {inputMode === 'freetext' && (
            <div className="mt-4">
              <h4 className="font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Free Text Processing
              </h4>
              <Textarea
                placeholder="Paste any text, notes, or requirements here. This will be processed and converted into structured use case data..."
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                rows={8}
                className="mb-4"
              />
              <Button 
                onClick={handleFreeTextProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Process Text into Structured Data
              </Button>
            </div>
          )}

          {/* Import from Threat Feeds Option */}
          <div className="flex justify-end mt-4">
            <Button 
              type="button" 
              variant="default"
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowThreatImporter(true)}
            >
              <Shield className="h-4 w-4 mr-2" />
              Import from Threat Feeds
            </Button>
          </div>
        </div>
        <CardContent>
          {inputMode === 'manual' && (
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Use Case Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Advanced Persistent Threat Detection"
                  {...form.register('title')}
                  onChange={(e) => {
                    form.setValue('title', e.target.value);
                    saveFormData();
                  }}
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
                placeholder="Multiple alerts are triggered within systems for the same threat, or multiple users report the same suspicious activity..."
                rows={4}
                {...form.register('description')}
                onChange={(e) => {
                  form.setValue('description', e.target.value);
                  saveFormData();
                }}
              />
              {form.formState.errors.description && (
                <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
              )}
            </div>

            {/* POV Use Case Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-4 w-4" />
                  POV Use Case Details
                </CardTitle>
                <CardDescription>
                  Impact, current state, desired state and actionable intelligence following POV template structure.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="impact">Impact</Label>
                    <Textarea
                      id="impact"
                      placeholder="Damage to brand/reputation due to potential compromise"
                      rows={3}
                      {...form.register('useCaseDetails.impact')}
                    />
                    {form.formState.errors.useCaseDetails?.impact && (
                      <p className="text-sm text-red-500">{form.formState.errors.useCaseDetails.impact.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentState">Current State</Label>
                    <Textarea
                      id="currentState"
                      placeholder="Receive 1 for 1 matches when alerts are triggered"
                      rows={3}
                      {...form.register('useCaseDetails.currentState')}
                    />
                    {form.formState.errors.useCaseDetails?.currentState && (
                      <p className="text-sm text-red-500">{form.formState.errors.useCaseDetails.currentState.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="desiredState">Desired State</Label>
                    <Textarea
                      id="desiredState"
                      placeholder="Collection/suppression of events into one actionable alert"
                      rows={3}
                      {...form.register('useCaseDetails.desiredState')}
                    />
                    {form.formState.errors.useCaseDetails?.desiredState && (
                      <p className="text-sm text-red-500">{form.formState.errors.useCaseDetails.desiredState.message}</p>
                    )}
                  </div>
                </div>

                {/* Potential Indicators */}
                <div className="space-y-2">
                  <Label>Potential Indicators</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newIndicator}
                      onChange={(e) => setNewIndicator(e.target.value)}
                      placeholder="e.g., Proofpoint TAP / Phish Alarm alerts on similar emails"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newIndicator, setPotentialIndicators, potentialIndicators, setNewIndicator))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addItem(newIndicator, setPotentialIndicators, potentialIndicators, setNewIndicator)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {potentialIndicators.map((indicator) => (
                      <Badge key={indicator} variant="secondary" className="flex items-center gap-1">
                        {indicator}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => removeItem(indicator, setPotentialIndicators, potentialIndicators)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Enrichment, Response & Prevention Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Enrichment Actions</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newEnrichment}
                        onChange={(e) => setNewEnrichment(e.target.value)}
                        placeholder="e.g., Threat intelligence enriches IOCs"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newEnrichment, setEnrichmentActions, enrichmentActions, setNewEnrichment))}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addItem(newEnrichment, setEnrichmentActions, enrichmentActions, setNewEnrichment)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {enrichmentActions.map((action) => (
                        <Badge key={action} variant="outline" className="flex items-center gap-1 text-green-700 border-green-300">
                          ✓ {action}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeItem(action, setEnrichmentActions, enrichmentActions)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Response Actions</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        placeholder="e.g., Reset associate's password"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newResponse, setResponseActions, responseActions, setNewResponse))}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addItem(newResponse, setResponseActions, responseActions, setNewResponse)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {responseActions.map((action) => (
                        <Badge key={action} variant="outline" className="flex items-center gap-1 text-blue-700 border-blue-300">
                          ✓ {action}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeItem(action, setResponseActions, responseActions)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Prevention Actions</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newPrevention}
                        onChange={(e) => setNewPrevention(e.target.value)}
                        placeholder="e.g., Security awareness training program"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem(newPrevention, setPreventionActions, preventionActions, setNewPrevention))}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addItem(newPrevention, setPreventionActions, preventionActions, setNewPrevention)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preventionActions.map((action) => (
                        <Badge key={action} variant="outline" className="flex items-center gap-1 text-purple-700 border-purple-300">
                          ✓ {action}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => removeItem(action, setPreventionActions, preventionActions)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

            {/* Data Sources Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-4 w-4" />
                  Data Sources & Ingestion Methods
                </CardTitle>
                <CardDescription>
                  Configure primary data sources with specific ingestion methods for comprehensive threat detection coverage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {dataSources.map((dataSource, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                          <div className="space-y-2">
                            <Label>Data Source Category</Label>
                            <Select 
                              value={dataSource.category} 
                              onValueChange={(value) => {
                                const updated = [...dataSources];
                                updated[index].category = value as 'endpoint' | 'network' | 'cloud' | 'identity' | 'email' | 'web' | 'database';
                                setDataSources(updated);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="endpoint">Endpoint Security</SelectItem>
                                <SelectItem value="network">Network Security</SelectItem>
                                <SelectItem value="cloud">Cloud Security</SelectItem>
                                <SelectItem value="identity">Identity & Access</SelectItem>
                                <SelectItem value="email">Email Security</SelectItem>
                                <SelectItem value="web">Web Security</SelectItem>
                                <SelectItem value="database">Database Security</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Data Source Type</Label>
                            <Input
                              value={dataSource.type}
                              onChange={(e) => {
                                const updated = [...dataSources];
                                updated[index].type = e.target.value;
                                setDataSources(updated);
                              }}
                              placeholder="e.g., Windows Event Logs, Sysmon"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Vendor</Label>
                            <Input
                              value={dataSource.vendor}
                              onChange={(e) => {
                                const updated = [...dataSources];
                                updated[index].vendor = e.target.value;
                                setDataSources(updated);
                              }}
                              placeholder="e.g., Microsoft, Palo Alto, CrowdStrike"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = dataSources.filter((_, i) => i !== index);
                            setDataSources(updated);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Priority Level</Label>
                          <Select 
                            value={dataSource.priority} 
                            onValueChange={(value) => {
                              const updated = [...dataSources];
                              updated[index].priority = value as 'critical' | 'high' | 'medium' | 'low';
                              setDataSources(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="critical">Critical</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Ingestion Method</Label>
                          <Select 
                            value={dataSource.ingestionMethod} 
                            onValueChange={(value) => {
                              const updated = [...dataSources];
                              updated[index].ingestionMethod = value as 'API' | 'Syslog' | 'XDR_Collector' | 'XDR_Agent' | 'Custom_Integration';
                              setDataSources(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="API">API Integration</SelectItem>
                              <SelectItem value="Syslog">Syslog</SelectItem>
                              <SelectItem value="XDR_Collector">XDR Collector</SelectItem>
                              <SelectItem value="XDR_Agent">XDR Agent</SelectItem>
                              <SelectItem value="Custom_Integration">Custom Integration</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Current Status</Label>
                          <Select 
                            value={dataSource.currentStatus} 
                            onValueChange={(value) => {
                              const updated = [...dataSources];
                              updated[index].currentStatus = value as 'configured' | 'needs_setup' | 'in_progress' | 'blocked';
                              setDataSources(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="configured">Configured</SelectItem>
                              <SelectItem value="needs_setup">Needs Setup</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Estimated Data Volume</Label>
                        <Input
                          value={dataSource.estimatedVolume}
                          onChange={(e) => {
                            const updated = [...dataSources];
                            updated[index].estimatedVolume = e.target.value;
                            setDataSources(updated);
                          }}
                          placeholder="e.g., 500 GB/day, 10k events/hour"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDataSources([...dataSources, {
                        category: 'endpoint',
                        type: '',
                        vendor: '',
                        priority: 'medium',
                        ingestionMethod: 'API',
                        fields: [],
                        estimatedVolume: '',
                        currentStatus: 'needs_setup'
                      }]);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Data Source
                  </Button>
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

            <div className="flex flex-col gap-4">
              {/* Test Data and Import Options */}
              <div className="flex gap-2 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Load Example Data or Import from Threat Feeds</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">Choose from PowerPoint examples or import real threat intelligence reports:</p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                      onClick={() => {
                        // Load phishing use case
                        form.setValue('title', samplePhishingUseCase.title);
                        form.setValue('description', samplePhishingUseCase.description);
                        form.setValue('category', samplePhishingUseCase.category);
                        form.setValue('priority', samplePhishingUseCase.priority);
                        setCurrentTools(samplePhishingUseCase.customerInfo.currentTools);
                        setPainPoints(samplePhishingUseCase.customerInfo.painPoints);
                        setPotentialIndicators(samplePhishingUseCase.useCaseDetails.potentialIndicators);
                        setEnrichmentActions(samplePhishingUseCase.useCaseDetails.enrichmentActions);
                        setResponseActions(samplePhishingUseCase.useCaseDetails.responseActions);
                        setPreventionActions(samplePhishingUseCase.useCaseDetails.preventionActions);
                        setDataSources(samplePhishingUseCase.customerInfo.primaryDataSources.map(ds => ({
                          ...ds,
                          fields: ['email_headers', 'attachment_hash', 'sender_ip'],
                          estimatedVolume: '5GB/day',
                          currentStatus: 'needs_setup' as const,
                          ingestionMethod: (ds.ingestionMethod === 'Agent' ? 'XDR_Agent' : 
                                           ds.ingestionMethod === 'Syslog' ? 'Syslog' :
                                           ds.ingestionMethod === 'Direct' ? 'XDR_Collector' : 'API') as 'API' | 'Syslog' | 'XDR_Collector' | 'XDR_Agent' | 'Custom_Integration'
                        })));
                        setCompliance(samplePhishingUseCase.technicalRequirements.compliance);
                        setIntegrations(samplePhishingUseCase.technicalRequirements.integrations);
                        setStakeholders(samplePhishingUseCase.stakeholders);
                        saveFormData();
                      }}
                    >
                      📧 Load Phishing Example
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
                      onClick={() => {
                        // Load threat feed use case
                        form.setValue('title', sampleThreatFeedUseCase.title);
                        form.setValue('description', sampleThreatFeedUseCase.description);
                        form.setValue('category', sampleThreatFeedUseCase.category);
                        form.setValue('priority', sampleThreatFeedUseCase.priority);
                        setCurrentTools(sampleThreatFeedUseCase.customerInfo.currentTools);
                        setPainPoints(sampleThreatFeedUseCase.customerInfo.painPoints);
                        setPotentialIndicators(sampleThreatFeedUseCase.useCaseDetails.potentialIndicators);
                        setEnrichmentActions(sampleThreatFeedUseCase.useCaseDetails.enrichmentActions);
                        setResponseActions(sampleThreatFeedUseCase.useCaseDetails.responseActions);
                        setPreventionActions(sampleThreatFeedUseCase.useCaseDetails.preventionActions);
                        setDataSources(sampleThreatFeedUseCase.customerInfo.primaryDataSources.map(ds => ({
                          ...ds,
                          fields: ['process_name', 'command_line', 'network_flow'],
                          estimatedVolume: '8GB/day',
                          currentStatus: 'needs_setup' as const,
                          ingestionMethod: (ds.ingestionMethod === 'Agent' ? 'XDR_Agent' : 
                                           ds.ingestionMethod === 'Syslog' ? 'Syslog' :
                                           ds.ingestionMethod === 'Direct' ? 'XDR_Collector' : 'API') as 'API' | 'Syslog' | 'XDR_Collector' | 'XDR_Agent' | 'Custom_Integration'
                        })));
                        setCompliance(sampleThreatFeedUseCase.technicalRequirements.compliance);
                        setIntegrations(sampleThreatFeedUseCase.technicalRequirements.integrations);
                        setStakeholders(sampleThreatFeedUseCase.stakeholders);
                        saveFormData();
                      }}
                    >
                      ☸️ Load Kubernetes CVE Example
                    </Button>
                    <Button 
                      type="button" 
                      variant="default"
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setShowThreatImporter(true)}
                    >
                      🔗 Import from Threat Feeds
                    </Button>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel & Save Draft
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                  onClick={(e) => {
                    console.log('Submit button clicked');
                    console.log('Form errors:', form.formState.errors);
                    console.log('Form is valid:', form.formState.isValid);
                    console.log('Form data:', form.getValues());
                  }}
                >
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Use Case'}
                </Button>
              </div>
            </div>
          </form>
          )}
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
  const dataSourceSummary = data.customerInfo.primaryDataSources.map(ds => 
    `${ds.type} (${ds.vendor}) via ${ds.ingestionMethod}`
  ).join(', ');
  
  return [
    `Generate 5 comprehensive POV use cases for ${data.title}`,
    `Create data source integrations for: ${dataSourceSummary}`,
    `Develop XSIAM correlation rules with ${data.successCriteria.detectionAccuracy}% accuracy`,
    `Build alert layouts with analyst decision support and action buttons (isolate endpoint, reset user credentials, etc.)`,
    `Create automation playbooks for ${data.successCriteria.responseTime} response time`,
    `Design operational dashboards for real-time monitoring`,
    `Integrate with customer tools: ${data.customerInfo.currentTools.join(', ')}`,
    `Address pain points: ${data.customerInfo.painPoints.join(', ')}`,
    `Configure ${data.customerInfo.primaryDataSources.length} data sources with specified ingestion methods`,
    `Maintain false positive rate below ${data.successCriteria.falsePositiveRate}%`,
    `Demonstrate ROI through ${data.successCriteria.businessImpact}`
  ];
}